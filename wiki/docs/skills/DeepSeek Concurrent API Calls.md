---
title: DeepSeek API 多线程调用实践指南
tags:
  - skills/python
  - skills/nlp
description: 基于 ThreadPoolExecutor 的 DeepSeek API 并发调用设计，涵盖限流处理、指数退避重试、线程安全写回与参数调优，适用于批量文本处理场景。
---

在批量处理学术文本时，逐条调用 DeepSeek API 是最直接的方案，但也是最慢的。100 条摘要，每次 API 调用耗时约 1–3 秒，单线程跑完需要 3–5 分钟；如果是标题+摘要双字段，时间直接翻倍。

多线程并发可以把这个时间压缩到原来的 1/5 到 1/10。但并发调用 API 有两个核心风险：**触发限流**和**结果写回乱序**。本文以一个完整的翻译脚本为例，拆解如何稳定地做到这两点。

---

## 一、为什么选线程而不是进程

Python 有两种并发方式：`ThreadPoolExecutor`（线程池）和 `ProcessPoolExecutor`（进程池）。

调用 DeepSeek API 是典型的 **IO 密集型任务**——程序大部分时间在等网络响应，CPU 几乎不干活。这种场景下线程池是正确选择：

- 线程共享内存，可以直接读写同一个 DataFrame，不需要序列化数据
- 进程池的启动开销和进程间通信成本在这里完全是浪费
- Python 的 GIL 对 IO 等待没有影响，线程在等待网络时会自动释放 GIL

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
```

---

## 二、三层结构设计

稳定的并发调用需要把逻辑分成三层，每层职责单一。

### 第一层：单次 API 调用（含重试）

这一层只做一件事：给定一段文本，返回翻译结果。所有的重试、限流等待都在这里处理。

```python
def translate_text(self, text: str) -> Optional[str]:
    if not text or pd.isna(text):
        return None

    # 翻译指令全部放在 system prompt 中
    # user 只传原文，保持职责分离
    system_prompt = """You are a professional translator specializing in economics and academic literature..."""

    for attempt in range(self.translation_max_retries):
        try:
            response = self.translation_client.chat.completions.create(
                model=self.translation_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=self.translation_temperature,
                max_tokens=self.translation_max_tokens
            )
            return response.choices[0].message.content.strip()

        except Exception as e:
            if "RateLimitError" in str(type(e).__name__):
                wait_time = (attempt + 1) * 2  # 指数退避：2s, 4s, 6s
                logger.warning(f"触发限流，等待 {wait_time} 秒...")
                time.sleep(wait_time)
            elif attempt < self.translation_max_retries - 1:
                time.sleep(1)
            else:
                logger.error(f"翻译失败: {str(e)[:100]}")
                return None

    return None
```

**关键设计点：**

**System/User 分离**：翻译指令放 system，原文放 user。这不只是风格问题——DeepSeek 对 system prompt 的处理权重更高，指令遵循更稳定。如果把指令和原文混在 user 里，模型有时会把指令本身也翻译出来。

**`RateLimitError` 单独处理**：限流错误和网络超时是两种不同性质的失败。限流说明请求太密集，需要等待后重试；网络超时可能是偶发的，短暂等待后重试即可。把两者分开处理，避免限流时等待时间不够、网络错误时等待时间过长。

**指数退避**：`wait_time = (attempt + 1) * 2` 让每次重试的等待时间递增（2s → 4s → 6s），给 API 服务端足够的恢复时间。

---

### 第二层：任务封装

并发执行时，每个线程需要知道自己处理的是哪条数据、哪个字段，结果才能写回正确的位置。把这些信息打包成 tuple 传入，返回时原样带回。

```python
def translate_single_item(self, args: Tuple[int, str, str]) -> Tuple[int, Optional[str], str]:
    idx, text, text_type = args

    if not text or pd.isna(text):
        return (idx, None, text_type)

    translated = self.translate_text(text)
    return (idx, translated, text_type)
```

`(idx, text, text_type)` 这个设计的意义在于：`ThreadPoolExecutor` 的任务是并发执行的，完成顺序不确定。如果只返回翻译结果，你不知道这个结果对应原始数据的哪一行。把 `idx`（DataFrame 的行索引）和 `text_type`（`'Title'` 或 `'Abstract'`）一起返回，就能在任意顺序下正确写回。

---

### 第三层：并发调度与结果收集

```python
def translate_papers(self, df: pd.DataFrame) -> pd.DataFrame:
    df_translated = df.copy()
    df_translated['Title_CN'] = None
    df_translated['Abstract_CN'] = None

    # 把所有任务打平成一个列表
    tasks = []
    for actual_idx in df.index:
        row = df.loc[actual_idx]
        if pd.notna(row.get('Title')):
            tasks.append((actual_idx, row['Title'], 'Title'))
        if pd.notna(row.get('Abstract')):
            tasks.append((actual_idx, row['Abstract'], 'Abstract'))

    failed_count = 0

    with ThreadPoolExecutor(max_workers=self.translation_max_concurrent) as executor:
        future_to_task = {
            executor.submit(self.translate_single_item, task): task
            for task in tasks
        }

        with tqdm(total=len(tasks), desc="翻译进度") as pbar:
            for future in as_completed(future_to_task):
                try:
                    idx, translated_text, text_type = future.result()
                    col = 'Title_CN' if text_type == 'Title' else 'Abstract_CN'
                    # 翻译失败时回退到原文，保证列不为空
                    df_translated.at[idx, col] = translated_text or df.at[idx, text_type.replace('_CN', '')]
                except Exception as e:
                    failed_count += 1
                    if failed_count <= 5:  # 只打印前5条，避免日志爆炸
                        task = future_to_task[future]
                        logger.error(f"任务失败 (idx={task[0]}, type={task[2]}): {e}")
                finally:
                    pbar.update(1)

    return df_translated
```

**`as_completed` vs `executor.map`**：`executor.map` 按提交顺序返回结果，如果第一个任务卡住，后面的结果也拿不到，进度条会假死。`as_completed` 哪个先完成就先处理哪个，进度条实时更新，单个任务失败也不影响其他任务。

**线程安全**：`df.at[idx, col] = value` 在这里是安全的，原因有两个：Python 的 GIL 保证了对象属性赋值的原子性；每个任务写入的 `idx` 是唯一的，不同线程不会同时写同一行，不存在竞争条件。

---

## 三、限流处理详解

DeepSeek API 的限流分两个维度：

- **RPM（Requests Per Minute）**：每分钟请求次数上限
- **TPM（Tokens Per Minute）**：每分钟处理 token 数上限

免费层和付费层的限制差异较大。触发限流时 API 会返回 `RateLimitError`，HTTP 状态码为 429。

**`max_workers` 与限流的关系**：并发数越高，单位时间内的请求越多，越容易触发 RPM 限制。合理的做法是从低并发开始测试，观察是否频繁出现限流警告，再逐步调高。

```python
# 判断是否触发限流的方式
if "RateLimitError" in str(type(e).__name__):
    # 也可以检查 HTTP 状态码
    # if hasattr(e, 'status_code') and e.status_code == 429:
    wait_time = (attempt + 1) * 2
    time.sleep(wait_time)
```

注意这里用 `str(type(e).__name__)` 而不是 `isinstance(e, RateLimitError)`，是因为不同版本的 `openai` 库异常类的导入路径不同，字符串匹配更稳健。

---

## 四、参数调优速查

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `max_workers` | 5（免费层）/ 15-20（付费层） | 并发线程数，过高触发限流 |
| `max_retries` | 3 | 超过3次通常是账户或网络问题，继续重试意义不大 |
| `temperature` | 0.1–0.3 | 翻译任务需要确定性输出，低温度减少随机性 |
| `max_tokens` | 原文 token 数的 2–3 倍 | 中文比英文字符数多，留足空间 |

---

## 五、完整最小示例

以下是一个可直接运行的最小化版本，去掉了类封装，方便快速理解核心逻辑：

```python
import time
import pandas as pd
from openai import OpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from typing import Optional, Tuple

# 初始化客户端（DeepSeek 兼容 OpenAI SDK）
client = OpenAI(
    api_key="your-deepseek-api-key",
    base_url="https://api.deepseek.com"
)

MAX_WORKERS = 5
MAX_RETRIES = 3

def call_api(text: str) -> Optional[str]:
    """单次 API 调用，含重试"""
    system_prompt = "你是一名专业翻译，请将英文学术文本翻译成中文，只返回译文。"

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.2,
                max_tokens=1000
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            if "RateLimitError" in str(type(e).__name__):
                time.sleep((attempt + 1) * 2)
            elif attempt < MAX_RETRIES - 1:
                time.sleep(1)
            else:
                return None
    return None


def process_item(args: Tuple[int, str]) -> Tuple[int, Optional[str]]:
    """封装单个任务，携带索引"""
    idx, text = args
    return (idx, call_api(text))


def batch_translate(texts: list[str]) -> list[Optional[str]]:
    """并发翻译文本列表"""
    tasks = [(i, text) for i, text in enumerate(texts)]
    results = [None] * len(texts)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_item, task): task for task in tasks}

        with tqdm(total=len(tasks), desc="翻译进度") as pbar:
            for future in as_completed(futures):
                try:
                    idx, translated = future.result()
                    results[idx] = translated
                except Exception as e:
                    print(f"任务失败: {e}")
                finally:
                    pbar.update(1)

    return results


# 使用示例
if __name__ == "__main__":
    df = pd.read_csv("papers.csv")
    titles = df["Title"].tolist()

    translated = batch_translate(titles)
    df["Title_CN"] = translated
    df.to_csv("papers_translated.csv", index=False, encoding="utf-8-sig")
```

---

## 六、常见问题

### 翻译结果出现 "None" 字符串

API 偶尔会把 Python 的 `None` 序列化成字符串 `"None"` 写入 DataFrame。写回后做一次清洗：

```python
for col in ['Title_CN', 'Abstract_CN']:
    df[col] = df[col].replace({'None': None, '': None})
```

### 进度条卡住不动

通常是某个任务触发了限流，正在等待重试。可以在 `tqdm` 的 `desc` 里加上当前失败计数，方便判断：

```python
pbar.set_description(f"翻译进度 (失败: {failed_count})")
```

### 部分结果为空

检查两个地方：一是 `max_tokens` 是否设置过小导致输出被截断；二是原始文本是否包含特殊字符导致 API 拒绝处理。可以在 `call_api` 里打印被截断的响应：

```python
if response.choices[0].finish_reason == "length":
    logger.warning(f"输出被截断，考虑增大 max_tokens")
```
