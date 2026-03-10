---
name: stata-to-python
description: 将 Stata .do 文件翻译为等效的 Python 脚本。
disable-model-invocation: true
---

翻译以下 Stata 代码为 Python：$ARGUMENTS

使用以下对照关系：

| Stata | Python |
|---|---|
| use "data.dta" | pd.read_stata("data.dta") |
| gen x = ... | df["x"] = ... |
| replace x = ... if | df.loc[condition, "x"] = ... |
| bysort id: gen x = | df.groupby("id")["x"].transform(...) |
| merge 1:1 using | pd.merge(df1, df2, on=..., how=...) |
| collapse (mean) x, by(id) | df.groupby("id")["x"].agg("mean") |
| reghdfe y x, absorb(id year) | from linearmodels import PanelOLS |
| outreg2 using | from stargazer.stargazer import Stargazer |
| preserve / restore | df_backup = df.copy() |
| keep if / drop if | df = df[condition] / df = df[~condition] |
| tabstat x, by(group) | df.groupby("group")["x"].describe() |
| xtset id year | df = df.set_index(["id", "year"]) |

翻译规范：
- 使用 pandas + linearmodels + statsmodels
- 保留原 .do 文件的注释（翻译为中文）
- 路径使用 pathlib
- 添加必要的 import 语句
- 输出为可直接运行的 .py 文件
