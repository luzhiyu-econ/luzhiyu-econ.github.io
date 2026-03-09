---
title: "#5：数据科学处理实战"
tags:
  - skills/ai-cli
order: 5
description: 掌握 Claude Code 在数据清洗、因果推断（DID/IV/RDD）、可视化、跨语言互操作和验证循环中的实战技巧。
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> 工具的价值在于使用。前四章讲"怎么配"，这一章讲"怎么用"——用 Claude Code 完成从数据清洗到论文图表的全流程。

一个经济学实证研究项目的典型流程：拿到原始数据 → 清洗 → 描述统计 → 回归分析 → 稳健性检验 → 画图 → 输出 LaTeX 表格。Claude Code 可以接管其中每一步，但前提是你知道**如何用正确的 prompt 驱动它**。本章给出每个环节的生产级 prompt 模板。

---

## 一、数据清洗工作流

### 1.1 五步清洗法

与 Claude Code 协作清洗数据的标准流程：

```
Step 1: 数据探索
  "读取 data/raw/census.csv 的前 20 行，报告：
   变量名、数据类型、缺失值比例、编码格式"

    ▼
Step 2: 质量评估
  "对这个数据集做全面质量评估：
   缺失值模式、异常值分布、重复行、编码一致性"

    ▼
Step 3: 清洗方案
  "制定清洗方案：列出每个步骤、处理规则、预期影响。
   不要执行，只列方案让我确认"

    ▼
Step 4: 执行清洗
  "按方案执行清洗，每步输出处理前后的行数和缺失值变化"

    ▼
Step 5: 验证
  "验证清洗后数据：重新检查缺失值、检查 entity-time 唯一性、
   输出描述统计表。与原始数据对比行数变化"
```

### 1.2 中文编码处理

经济学数据经常遇到中文编码问题，特别是来自政府统计部门的数据：

```python
# Claude Code 会自动尝试的编码检测流程
encodings = ['utf-8', 'gbk', 'gb18030', 'gb2312', 'big5']
for enc in encodings:
    try:
        df = pd.read_csv(file, encoding=enc)
        break
    except UnicodeDecodeError:
        continue
```

**Prompt 模板**：
```
读取 data/raw/city_stats.csv，这个文件可能是 GBK 或 GB18030 编码。
自动检测编码，正确读取后输出前 5 行确认中文显示正常。
如果检测到编码问题，转换为 UTF-8 后保存到 data/processed/。
```

### 1.3 面板数据清洗

```
清洗 data/raw/firm_panel.dta 为面板数据分析做准备：
1. 检查 firm_id + year 的唯一性，报告重复数量
2. 检查面板是否平衡（每个 firm 是否有所有年份）
3. 如果不平衡，报告各年份的观测数分布
4. 对数值变量在 1% 和 99% 分位数做 winsorize
5. 生成 log 变换变量（对正数变量）
6. 输出到 data/processed/firm_panel_clean.csv
```

### 1.4 大文件分块处理

当数据文件过大，无法一次性读入上下文时：

```
data/raw/transaction_records.csv 有 500 万行，直接读取会超出内存。
请使用分块处理策略：
1. 先读取前 100 行了解结构
2. 用 pandas chunksize=100000 分块处理
3. 每个 chunk 执行清洗操作
4. 合并输出到 data/processed/
不要尝试一次性读取整个文件。
```

### 动手练习

对你项目中的一个原始数据文件，按五步清洗法逐步执行。关键是**每步确认后再进入下一步**，不要一次性要求完成所有清洗。

---

## 二、统计分析工作流

### 2.1 参考框架：通用 DID 实证 Workflow

在设计 Claude Code 的统计分析工作流时，强烈推荐参考许文立教授的[通用 DID 实证 Workflow](https://github.com/wenddymacro/A-General-Empirical-Workflow-for-DID)。该框架覆盖了从数据准备到政策建议的完整 11 步流程：

```
§1  数据准备（样本构建 + 描述统计 + 协变量构造）
§2  识别策略（三大假设陈述与论证）
§3  基准回归（逐步扩展 FE + Oster δ*）
§4  平行趋势（事件研究图，只用图不用表）
§5  HonestDiD 敏感性（SD + RM 约束 breakdown 图）
§6  排除备择解释（同期政策 / Triple DID / 群体安慰剂）
§7  稳健性检验（时间/空间/随机化安慰剂 + 样本/变量/SE）
§8  异质性估计量（TWFE/CS/SA/BJS/dCDH/JWDID 并排比较）
§9  机制分析（中介效应 + 渠道排除）
§10 异质性分析（分样本 + 交互项 + JWDID CATT）
§11 福利与政策含义
```

这个框架与 Claude Code 配合使用极为高效——你可以把每个步骤作为一个独立的 prompt 发送给 Claude。

### 2.2 DID（双重差分）完整 Prompt 序列

```
# Step 1: 数据探索与变量构造
"读取 data/processed/panel.csv，理解面板结构。
 - 识别处理变量（policy_year）和结果变量（y）
 - 构造 DID 交互项：treat × post
 - 构造相对时间变量 rel_year = year - policy_year
 - 按 §1.3 的原则构造协变量（处理前时间不变形式）"

# Step 2: 描述统计
"生成描述统计表：
 - 全样本统计（均值、标准差、Min、Max、N）
 - 处理组 vs 控制组分组均值 + t 检验
 - 基期平衡性检验
 - Cohort 分布表"

# Step 3: 基准回归（逐步扩展）
"运行 DID 基准回归，按以下规格逐步扩展：
 M1: 无固定效应
 M2: + 个体 FE
 M3: + 时间 FE
 M4: + 控制变量
 M5: + 区域×年份 FE
 M6: + 个体线性趋势
 所有模型聚类标准误在地级市层级。
 输出到 LaTeX 表格 output/tables/baseline.tex"

# Step 4: 事件研究
"对 M6 规格运行事件研究回归：
 - 基准期 k=-1 归零
 - 前期 k∈{-4,-3,-2}，后期 k∈{0,+1,+2,+3,+4}
 - 画 event study 图（95% CI，零线，政策分割线）
 - 检查前期系数是否联合不显著"

# Step 5: 稳健估计量比较
"用 CS、SA、JWDID 三种稳健估计量重新估计，
 与 TWFE 结果并排比较（3×2 布局的 event study 图）。
 确认 TWFE 结论不因负权重问题失效。"

# Step 6: 稳健性检验
"运行完整稳健性检验套件：
 - 时间安慰剂（伪政策年份提前 2-3 年）
 - 随机化安慰剂（500 次随机处理分配）
 - 样本稳健性（剔除特殊样本/首年/平衡面板）
 - 标准误稳健性（bootstrap / 双向聚类 / Driscoll-Kraay）
 所有结果输出到附录图表"
```

### 2.3 IV（工具变量）Prompt 序列

```
# 完整 IV 工作流
"实现工具变量回归：
 1. 第一阶段回归：instrument → endogenous variable
    - 报告 F 统计量（需要 > 10，理想 > 104）
    - 绘制第一阶段散点图
 2. 2SLS 估计：使用工具变量
 3. 过度识别检验：Hansen J 统计量（如果有多个工具变量）
 4. 弱工具变量检验：Anderson-Rubin 检验
 5. 输出完整结果表（OLS vs 2SLS 对比）
 使用 linearmodels 或 statsmodels IV 模块。"
```

### 2.4 RDD（断点回归）Prompt 序列

```
# 完整 RDD 工作流
"实现断点回归分析：
 1. McCrary 密度检验：断点处 running variable 密度是否连续
 2. 协变量平衡性：断点两侧控制变量是否跳跃
 3. 局部多项式估计（rdrobust）：
    - MSE-optimal bandwidth
    - 三角核函数
 4. 带宽敏感性：在 0.5x 到 2x 最优带宽范围内的估计
 5. Placebo cutoff：在非断点处检验是否有效应
 6. RD 图：散点 + 拟合多项式 + 断点标记
 使用 rdrobust Python 包。"
```

### 动手练习

用上面的 DID Prompt 序列，对你项目中的面板数据完成从描述统计到事件研究图的全流程。关键要点：

1. 每个 Step 用一个独立的 prompt
2. 确认每步结果后再进入下一步
3. 如果上下文快满了，用 `/compact focus on regression results` 压缩

---

## 三、可视化工作流

### 3.1 学术图表标准

经济学顶刊对图表有严格的格式要求：

| 要素 | 标准 |
|---|---|
| 分辨率 | 300 DPI（印刷质量） |
| 字号 | 轴标签 12pt，标题 14pt，图例 10pt |
| 字体 | Times New Roman 或 Computer Modern |
| 颜色 | 灰度友好（考虑黑白打印） |
| 格式 | PDF（矢量）+ PNG（位图）双格式 |
| 尺寸 | 单栏 3.5"×3"，双栏 7"×5" |

### 3.2 常用图表 Prompt 模板

**Event Study 图**：

```
基于 output/tables/event_study_coefs.csv 画 event study 图：
- X 轴：Years relative to policy（-4 到 +4）
- Y 轴：Coefficient (ATT)
- 基准期 k=-1 归零
- 95% 置信区间用浅蓝色阴影
- 零线黑色虚线，政策分割线红色点线
- 300 DPI，Times New Roman 12pt
- 同时保存 PDF 和 PNG 到 output/figures/
```

**Coefficient Plot**：

```
基于 output/tables/robustness_results.csv 画 coefficient plot：
- Y 轴：不同模型规格名称（M1-M6）
- X 轴：系数估计值 + 95% CI
- 零线垂直虚线
- 按系数大小排序
- 基准模型用不同颜色标记
```

**分布图**：

```
对 data/processed/panel.csv 的结果变量画分布图：
- 处理组 vs 控制组的核密度对比
- 处理前 vs 处理后的分布变化
- 使用半透明填充区分
- 添加均值标记线
```

### 3.3 Chrome 集成预览

如果你开发了 Web 可视化或需要检查图表效果：

```bash
# 启用 Chrome 集成
claude --chrome

# 然后可以让 Claude 在浏览器中预览图表
"在 Chrome 中打开生成的图表，检查是否符合学术标准"
```

> 参考：[Chrome 集成](https://code.claude.com/docs/en/chrome)

### 动手练习

生成一张你项目的 event study 图，使用上面的标准：

```
读取我的回归结果，生成学术论文级别的 event study 图。
使用 Times New Roman 字体，300 DPI，PDF + PNG 双格式。
```

---

## 四、Stata/R/Python 互操作

### 4.1 读写 .dta 文件

```python
import pandas as pd

# 读取 Stata .dta 文件
df = pd.read_stata("data/raw/firm_panel.dta")

# 如果需要 value labels
df = pd.read_stata("data/raw/firm_panel.dta", convert_categoricals=True)

# 写入 .dta 文件
df.to_stata("data/processed/clean_panel.dta", write_index=False)
```

### 4.2 Stata → Python 常用命令映射

| Stata 命令 | Python 等效 | 说明 |
|---|---|---|
| `use "data.dta"` | `pd.read_stata("data.dta")` | 读取数据 |
| `gen x = expr` | `df["x"] = expr` | 生成新变量 |
| `replace x = v if cond` | `df.loc[cond, "x"] = v` | 条件替换 |
| `bysort id: gen x = _n` | `df.groupby("id").cumcount() + 1` | 组内序号 |
| `bysort id: egen x = mean(y)` | `df.groupby("id")["y"].transform("mean")` | 组均值 |
| `merge 1:1 id using` | `pd.merge(df1, df2, on="id")` | 合并 |
| `collapse (mean) x, by(g)` | `df.groupby("g")["x"].agg("mean")` | 聚合 |
| `reghdfe y x, absorb(id t)` | `PanelOLS.from_formula(...)` | 高维 FE 回归 |
| `keep if cond` | `df = df[cond]` | 保留子样本 |
| `drop if cond` | `df = df[~cond]` | 删除子样本 |
| `tab x` | `df["x"].value_counts()` | 频率表 |
| `sum x, detail` | `df["x"].describe()` | 描述统计 |
| `preserve/restore` | `df_backup = df.copy()` | 数据快照 |
| `xtset id year` | `df = df.set_index(["id","year"])` | 设置面板 |
| `winsor2 x, cut(1 99)` | `scipy.stats.mstats.winsorize` | Winsorize |

### 4.3 整文件翻译 Prompt

```
把 code/analysis.do 翻译成等效的 Python 脚本：
- 使用 pandas + linearmodels + statsmodels
- 保留原 Stata 注释（翻译为中文）
- 路径使用 pathlib
- 添加完整的 import 语句
- 确保输出结果数值一致
输出到 code/analysis.py
```

### 动手练习

找一个简单的 Stata .do 文件（10-30 行），让 Claude Code 翻译为 Python，然后对比两者的输出是否一致。

---

## 五、Verification Loops 与 Evals

### 5.1 两种验证模式

```
Checkpoint-Based（基于检查点）            Continuous（持续验证）
─────────────────────────                ────────────────────

  [Task 1]                                 [工作中]
     │                                        │
     ▼                                        ▼
  ┌─────────┐                            ┌──────────┐
  │检查点 #1 │← 验证标准                  │ 定时器/   │
  └────┬────┘                            │ 变更触发  │
       │ 通过?                            └────┬─────┘
   ┌───┴───┐                                  ▼
  是      否 → 修复 ──┐                 ┌──────────┐
   │              │   │                │ 运行测试  │
   ▼              └───┘                │ + Lint   │
  [Task 2]                             └────┬─────┘
     │                                 ┌────┴────┐
     ▼                                通过     失败
  ┌─────────┐                          │         │
  │检查点 #2 │                          ▼         ▼
  └─────────┘                       [继续]    [停下修复]

适合：有明确里程碑的线性工作流         适合：长时间探索性工作
```

### 5.2 pass@k vs pass^k

| 指标 | 含义 | k=1 | k=3 | k=5 |
|---|---|---|---|---|
| pass@k | k 次中**至少 1 次**成功 | 70% | 91% | 97% |
| pass^k | k 次**全部**成功 | 70% | 34% | 17% |

- 用 **pass@k** 当你只需要一个正确结果（发送多次取最好的）
- 用 **pass^k** 当你需要稳定一致的输出（如自动化流水线）

### 5.3 经济学验证策略

```
# 数值结果验证
"运行回归后，将系数和标准误与 output/expected_results.csv 对比。
 允许的数值容差：系数 ±0.001，标准误 ±0.0001。
 报告超出容差的条目。"

# 系数稳健性验证
"检查主要系数在所有规格（M1-M6）中的稳定性：
 - 符号是否一致
 - 量级变化是否超过 50%
 - 显著性是否在 M3 之后保持"

# 图表一致性验证
"对比新生成的 event study 图和 output/figures/expected_es.png：
 - 系数点是否在相同位置
 - 置信区间是否相似
 - 前期系数是否仍然不显著"
```

### 动手练习

在你的回归分析完成后，设计一个验证 prompt：

```
对比 output/tables/main_results.tex 中的系数与我预期的结果：
处理效应约 -0.15（负向显著），标准误约 0.04。
如果差异超过 20%，诊断可能的原因。
```

---

## 六、大规模数据处理

### 6.1 Fan-out 模式

当你需要对大量文件执行相同操作时：

```bash
# 列出所有需要处理的文件
ls data/raw/*.csv > files_to_process.txt

# 对每个文件并行调用 Claude Code（非交互模式）
for file in $(cat files_to_process.txt); do
  claude -p "清洗 $file：检测编码、处理缺失值、输出到 data/processed/" \
    --allowedTools "Read,Write,Bash(python *)" &
done
wait
```

### 6.2 非交互模式与管道化

```bash
# 输出 JSON 格式，方便程序解析
claude -p "分析 data/raw/census.csv 的变量结构" --output-format json

# 串联管道
claude -p "列出所有需要 winsorize 的变量" --output-format json | \
  jq -r '.result[]' | \
  while read var; do
    claude -p "对变量 $var 在 1% 和 99% 做 winsorize"
  done

# 流式输出（实时查看进度）
claude -p "运行完整的回归分析流程" --output-format stream-json
```

### 6.3 HPC/服务器集成

```bash
# 在远程服务器上运行 Claude Code
ssh server "cd /data/project && claude -p 'run analysis' --dangerously-skip-permissions"

# 使用 Remote Control 从本地控制远程会话
claude remote-control  # 在服务器上运行
# 然后在手机或浏览器上通过 claude.ai/code 访问
```

> 参考：[CLI Reference](https://code.claude.com/docs/en/cli-reference)，[Remote Control](https://code.claude.com/docs/en/remote-control)

### 动手练习

用非交互模式批处理 3 个 CSV 文件的描述统计：

```bash
for f in data/raw/file1.csv data/raw/file2.csv data/raw/file3.csv; do
  claude -p "输出 $f 的描述统计表" --output-format json > "output/stats_$(basename $f .csv).json"
done
```

---

## 七、端到端实证研究案例

### 7.1 案例：从零完成一个 DID 分析

以下是一个完整的 prompt 序列，展示如何用 Claude Code 从头到尾完成一个 DID 实证分析。

**第一阶段：数据准备（建议用独立会话）**

```
Prompt 1: "读取 data/raw/city_panel.csv，了解数据结构和变量含义"
Prompt 2: "按照 DID 框架构造变量：treat、post、did 交互项、rel_year"
Prompt 3: "构造协变量：使用处理前均值的时间不变形式（§1.3 方式 3）"
Prompt 4: "生成描述统计表和基期平衡性检验"
→ /compact focus on variable definitions and data structure
```

**第二阶段：回归分析（新会话或 /clear 后）**

```
Prompt 5: "运行 M1-M6 基准回归，输出 LaTeX 表格"
Prompt 6: "计算 Oster δ*，报告稳健性"
Prompt 7: "运行 M6 的 event study，画图"
Prompt 8: "用 CS 和 JWDID 重新估计，并排比较"
→ /compact focus on regression coefficients
```

**第三阶段：稳健性（新会话或 /clear 后）**

```
Prompt 9: "运行 500 次随机化安慰剂，画密度图"
Prompt 10: "运行时间安慰剂和样本稳健性"
Prompt 11: "运行标准误稳健性（bootstrap、双向聚类）"
```

**第四阶段：输出（新会话或 /clear 后）**

```
Prompt 12: "把所有表格整理为论文格式的 LaTeX"
Prompt 13: "把所有图表统一风格，输出 PDF"
Prompt 14: "生成复制包目录结构"
```

### 7.2 关键技巧

| 技巧 | 说明 |
|---|---|
| **分阶段、分会话** | 每个阶段用独立会话或 `/clear`，避免上下文污染 |
| **每步确认** | 不要一次性要求完成全部分析 |
| **文件传递** | 用输出文件（而非对话记忆）在阶段间传递结果 |
| **验证驱动** | 每个回归后要求对比预期结果 |
| **命名一切** | 用 `/rename` 给会话命名，如 "DID-data-prep" |

---

## 八、小结

| 概念 | 要记住的 |
|---|---|
| 五步清洗法 | 探索→评估→方案→执行→验证，每步确认 |
| DID 工作流 | 参考许文立的 11 步通用框架，每步一个 prompt |
| Prompt 设计 | 越具体越好：指定方法、变量名、输出路径、验证标准 |
| Stata→Python | 用映射表 + /stata-to-python Skill 自动翻译 |
| 验证循环 | Checkpoint-Based 用于线性流程，Continuous 用于探索 |
| 大规模处理 | `claude -p` 非交互模式 + `--output-format json` 管道化 |
| 端到端 | 分阶段分会话，文件传递，验证驱动 |

### 进阶阅读

- [通用 DID 实证 Workflow（许文立）](https://github.com/wenddymacro/A-General-Empirical-Workflow-for-DID)
- [Common Workflows 官方文档](https://code.claude.com/docs/en/common-workflows)
- [Best Practices](https://code.claude.com/docs/en/best-practices)
- [Chrome 集成（可视化调试）](https://code.claude.com/docs/en/chrome)
- [CLI Reference](https://code.claude.com/docs/en/cli-reference)

---

> **上一篇**：[[4 - Skills for Economics|#4：Skills 设计——经济学研究技能包]]
> **下一篇**：[[6 - Project Architecture|#6：项目架构设计方法论]]
