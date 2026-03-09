# Stata → Python 命令对照表

## 数据读写

| Stata | Python (pandas) |
|---|---|
| `use "data.dta"` | `pd.read_stata("data.dta")` |
| `save "data.dta", replace` | `df.to_stata("data.dta", write_index=False)` |
| `import delimited "data.csv"` | `pd.read_csv("data.csv")` |
| `export delimited "data.csv"` | `df.to_csv("data.csv", index=False)` |

## 变量操作

| Stata | Python (pandas) |
|---|---|
| `gen x = expr` | `df["x"] = expr` |
| `replace x = v if cond` | `df.loc[cond, "x"] = v` |
| `drop x` | `df = df.drop(columns=["x"])` |
| `keep x y z` | `df = df[["x", "y", "z"]]` |
| `rename old new` | `df = df.rename(columns={"old": "new"})` |
| `label variable x "desc"` | (pandas 无原生标签) |

## 组操作

| Stata | Python (pandas) |
|---|---|
| `bysort id: gen n = _n` | `df.groupby("id").cumcount() + 1` |
| `bysort id: gen N = _N` | `df.groupby("id")["id"].transform("count")` |
| `bysort id: egen m = mean(x)` | `df.groupby("id")["x"].transform("mean")` |
| `collapse (mean) x, by(g)` | `df.groupby("g")["x"].agg("mean").reset_index()` |

## 合并

| Stata | Python (pandas) |
|---|---|
| `merge 1:1 id using "file"` | `pd.merge(df1, df2, on="id", how="outer")` |
| `merge m:1 id using "file"` | `pd.merge(df1, df2, on="id", how="left")` |
| `append using "file"` | `pd.concat([df1, df2], ignore_index=True)` |

## 回归

| Stata | Python |
|---|---|
| `reg y x` | `sm.OLS(y, sm.add_constant(x)).fit()` |
| `reghdfe y x, absorb(id t)` | `PanelOLS.from_formula("y ~ x + EntityEffects + TimeEffects", df)` |
| `ivregress 2sls y (x=z)` | `IV2SLS.from_formula("y ~ 1 + [x ~ z]", df)` |
| `xtreg y x, fe` | `PanelOLS.from_formula("y ~ x + EntityEffects", df)` |
| `cluster(id)` | `.fit(cov_type="clustered", cluster_entity=True)` |

## 描述统计

| Stata | Python |
|---|---|
| `sum x, detail` | `df["x"].describe()` |
| `tab x` | `df["x"].value_counts()` |
| `tabstat x, by(g) stat(mean sd)` | `df.groupby("g")["x"].agg(["mean", "std"])` |
| `correlate x y` | `df[["x","y"]].corr()` |

## 面板设置

| Stata | Python |
|---|---|
| `xtset id year` | `df = df.set_index(["id", "year"])` |
| `xtdescribe` | `df.groupby("id").size().describe()` |

## 所需 Python 包

```
pandas
numpy
statsmodels
linearmodels
pyreadstat
scipy
```
