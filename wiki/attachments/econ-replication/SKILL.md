---
name: econ-replication
description: 经济学论文复制工作流。下载复制包、运行分析、比对结果、生成报告。
disable-model-invocation: true
---

# 经济学论文复制工作流

对论文 $ARGUMENTS 执行完整的复制流程。

## 工作流程

### Step 1: 搜索与下载
1. 搜索该论文的复制包来源（AEA Data Editor, ICPSR, Zenodo, 作者主页）
2. 下载数据和代码到 `replication/<paper-name>/`
3. 阅读 README，理解数据说明和运行顺序
4. 输出：复制包概况报告

### Step 2: 环境搭建
1. 识别依赖（Stata packages / R packages / Python packages）
2. 安装缺失依赖
3. 如果是 Stata 代码，参考 @references/stata_to_python.md 评估翻译可行性
4. 确认环境就绪

### Step 3: 运行与复制
1. 按 README 指定的顺序运行每个脚本
2. 记录每个步骤的输出和运行时间
3. 捕获并尝试解决运行错误
4. 如遇到平台差异（如 Stata → Python），参考 @references/stata_to_python.md

### Step 4: 结果比对
1. 对每个表格的系数和标准误进行数值比对
2. 允许容差：系数 ±0.01，标准误 ±0.005
3. 标记：完全一致 / 容差内 / 超出容差
4. 对每张图进行视觉比对
5. 使用 @scripts/result_comparator.py 自动化比对（如适用）

### Step 5: 报告生成
1. 按 @references/replication_report_template.md 格式生成报告
2. 包含：原始结果 vs 复制结果对照
3. 分析差异原因（版本/随机种子/平台/数据更新）
4. 给出复制评级：A（完全复制）/ B（核心结果一致）/ C（部分差异）/ D（无法复制）
5. 可选：按 @references/wechat_post_template.md 生成推文草稿

## 输出
- `replication/<paper-name>/report.md` — 复制报告
- `replication/<paper-name>/comparison/` — 结果对比文件
- `replication/<paper-name>/post_draft.md` — 推文草稿（可选）
