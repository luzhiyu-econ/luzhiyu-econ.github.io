---
name: paper-structure
description: 生成学术论文的标准结构框架和 LaTeX 模板。
disable-model-invocation: true
---

为主题 $ARGUMENTS 创建论文结构脚手架。

## 标准经济学论文结构

生成以下文件：

### paper/main.tex
LaTeX 主文件，包含：
- 文档类设置（12pt, a4paper）
- 常用宏包（amsmath, booktabs, graphicx, natbib, hyperref）
- 标题页（标题、作者、摘要、JEL 分类、关键词）
- \input 各章节文件

### paper/sections/
按标准结构创建各节文件：
1. `01_introduction.tex` — 引言（研究问题、贡献、结构）
2. `02_background.tex` — 制度背景与文献综述
3. `03_data.tex` — 数据描述与变量定义
4. `04_identification.tex` — 识别策略
5. `05_results.tex` — 主要结果
6. `06_robustness.tex` — 稳健性检验
7. `07_mechanism.tex` — 机制分析
8. `08_conclusion.tex` — 结论与政策建议
9. `09_appendix.tex` — 附录

### 每节模板内容
每个 .tex 文件包含：
- 节标题
- 子节结构（占位标题）
- 表格/图表引用占位符（\ref{tab:xxx}, \ref{fig:xxx}）
- 关键写作提示（以 LaTeX 注释形式）

### paper/references.bib
空的 BibTeX 文件，含格式示例。

### 写作规范提示
在每节文件开头以注释形式提供：
- 该节的标准长度（页数）
- 核心要素清单
- 顶刊范例写法建议
