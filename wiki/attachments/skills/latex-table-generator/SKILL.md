---
name: latex-table-generator
description: 将回归结果转换为学术论文级别的 LaTeX 表格。
disable-model-invocation: true
---

读取回归结果文件 $ARGUMENTS，生成 LaTeX 表格。

表格格式要求：
- 系数保留 3 位小数
- 标准误放在系数下方的括号中
- 显著性星号：* p<0.1, ** p<0.05, *** p<0.01
- 底部注释包含：观测数、R²、固定效应、聚类层级
- 使用 booktabs 包的三线表格式（\toprule, \midrule, \bottomrule）
- 列标题为模型编号 (1) (2) (3) ...

输出：
- .tex 文件到 output/tables/
- 同时在终端展示预览
