# 优质复制包的结构标准

## 必要组成

一个优质的经济学论文复制包（Replication Package）应包含：

### 1. README
- 论文标题、作者、发表信息
- 数据来源和获取方式（公开数据附链接，受限数据说明申请流程）
- 软件环境（Stata 版本、R 版本、Python 版本 + packages）
- 运行步骤（编号，一步一步）
- 预期运行时间
- 文件对应关系（哪个脚本生成哪个表/图）

### 2. 数据
- `data/raw/` — 原始数据（如果可以公开分发）
- `data/processed/` — 中间处理数据
- `data/codebook/` — 变量说明书

### 3. 代码
- 按执行顺序编号：`01_clean.do`, `02_analysis.do`, `03_figures.do`
- 每个脚本开头说明输入和输出
- 随机种子固定
- 路径使用相对路径

### 4. 输出
- `output/tables/` — 论文中的所有表格
- `output/figures/` — 论文中的所有图表

## 质量评估标准

| 等级 | 标准 |
|---|---|
| A（优秀） | 一键运行，结果完全一致 |
| B（良好） | 需要少量环境调整，核心结果一致 |
| C（合格） | 需要修改部分代码，主要结果可复制 |
| D（不合格） | 数据缺失或代码无法运行 |

## 参考规范

- [AEA Data Editor Guidelines](https://aeadataeditor.github.io/aea-de-guidance/)
- [ICPSR Deposit Guidelines](https://www.icpsr.umich.edu/web/pages/deposit/guide/)
