---
title: "#4：Skills 设计"
tags:
  - skills/claude-code
order: 4
description: 掌握 Claude Code Skills 系统的原理与设计方法，构建经济学研究专用技能包，实现工作流复用与自动化。
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> 把你反复使用的工作流打包成可复用的模块，一次设计，永久受益。

> 每次做回归诊断都要重复告诉 Claude 检查平行趋势、F 统计量、标准误聚类……为什么不把这些打包成一个"技能"，以后一句 `/regression-diagnostics DID` 就全部搞定？这就是 Skills 的价值。

---

## 一、Skills 系统原理

### 1.1 什么是 Skill

Skill 是一个放在 `.claude/skills/` 目录下的 `SKILL.md` 文件，定义了一个可复用的工作流或知识包。

```
.claude/skills/
├── regression-diagnostics/
│   └── SKILL.md            ← 回归诊断工作流
├── data-quality-audit/
│   └── SKILL.md            ← 数据质量审计
└── econ-replication/
    ├── SKILL.md             ← 论文复制工作流
    ├── references/          ← 参考资料
    └── scripts/             ← 辅助脚本
```

### 1.2 SKILL.md 格式

```markdown
---
name: skill-name
description: 一句话描述功能（Claude 据此决定何时自动调用）
disable-model-invocation: false
---

技能的具体指令内容...
可以使用 $ARGUMENTS 接收参数...
```

### 1.3 Frontmatter 字段参考

| 字段 | 必需 | 说明 |
|---|---|---|
| `name` | 是 | 技能标识名，也是调用命令名 |
| `description` | 是 | 功能描述，Claude 据此自动匹配调用 |
| `disable-model-invocation` | 否 | 设为 `true` 时 Claude 不会自动调用，只能手动 `/name` |

### 1.4 惰性加载机制

```
Claude Code 启动
    │
    ▼
扫描 .claude/skills/*/SKILL.md
    │
    ├── 只读取 name 和 description（几十 token）
    │   不加载完整内容（可能几千 token）
    │
    ▼
等待调用...
    │
    ├── 用户手动调用：/skill-name args
    │   → 加载完整 SKILL.md 内容到上下文
    │
    └── Claude 自动匹配 description
        → 加载完整 SKILL.md 内容到上下文
```

**设计意义**：你可以放 50 个 Skill 在目录里，启动时只消耗极少的 token，用到哪个才加载哪个。

### 1.5 $ARGUMENTS 变量

`$ARGUMENTS` 会被替换为调用时传入的参数：

```markdown
# SKILL.md 中写
分析以下文件的数据质量：$ARGUMENTS
```

调用 `/data-quality-audit data/raw/census.csv` 时，`$ARGUMENTS` 变成 `data/raw/census.csv`。

### 1.6 Skills vs Commands 的历史

早期 Claude Code 有 `.claude/commands/` 目录存放命令。现在 Commands 已合并入 Skills 系统，旧的 commands 文件仍然兼容，但推荐迁移到 skills。

> 参考：[Skills 官方文档](https://code.claude.com/docs/en/skills)

### 动手练习

创建你的第一个 Skill：

```bash
mkdir -p .claude/skills/hello-econ
cat > .claude/skills/hello-econ/SKILL.md << 'EOF'
---
name: hello-econ
description: 快速了解一个经济学数据集的基本情况
---

对文件 $ARGUMENTS 执行以下分析：
1. 读取前 10 行，展示变量名和数据类型
2. 报告行数、列数、缺失值比例
3. 对数值变量输出描述统计（均值、标准差、最小、最大）
4. 判断是否为面板数据（检查是否有 ID + 时间 变量）
5. 用一段话总结这个数据集适合做什么分析
EOF
```

然后运行：`/hello-econ data/raw/firm_panel.csv`

---

## 二、内置 Skills 详解

Claude Code 自带几个开箱即用的 Skill：

### 2.1 /claude-api

```
用途：加载 Anthropic API 参考文档
触发：当代码中 import 了 Anthropic SDK 时自动激活
手动：/claude-api
```

### 2.2 /batch

```
用途：编排大规模并行代码修改
场景：需要修改 100+ 文件的迁移任务
用法：/batch "把所有 .py 文件中的 print() 替换为 logging.info()"
```

### 2.3 /debug

```
用途：排查 Claude Code 会话本身的问题
场景：Claude 行为异常、工具报错
用法：/debug
```

### 2.4 /simplify

```
用途：审查并简化最近修改的代码
场景：完成一轮编码后，让 Claude 回顾并优化
用法：/simplify
```

### 2.5 /loop

```
用途：按间隔重复运行提示
场景：监控日志、轮询状态
用法：/loop "每 30 秒检查一次 output/progress.log，报告新增的错误"
```

---

## 三、经济学专用 Skills 设计

- [下载全部经济学 Skills（.zip，18 KB）](/wiki/assets/downloads/econ-skills-all.zip)
- [下载 econ-replication 完整包（.zip，9 KB）](/wiki/assets/downloads/econ-replication.zip)

> **一键安装**：下载解压后，将 `skills/` 目录下的文件夹复制到你项目的 `.claude/skills/` 即可使用。全部 Skills 包含 8 个单文件 Skill + econ-replication 完整工作流包。

以下是 8 个生产级别的经济学 Skill 定义，可以直接复制使用，也可以通过上方按钮一键下载。

### 3.1 回归诊断工作流

```markdown
# .claude/skills/regression-diagnostics/SKILL.md
---
name: regression-diagnostics
description: 对回归分析结果进行全面诊断。支持 DID、IV、RDD 三种方法。
disable-model-invocation: true
---

对以下回归分析执行诊断：$ARGUMENTS

根据回归类型执行对应的检查清单：

## DID（双重差分）检查清单
1. 平行趋势检验：事件研究图中处理前系数是否联合不显著
2. 动态效应：处理后系数的时间路径是否合理
3. 负权重问题：是否使用了 CS/SA/JWDID 等稳健估计量
4. HonestDiD 敏感性：显著后期系数的 breakdown point
5. 标准误聚类层级：是否在处理单元层级聚类
6. 安慰剂检验：时间安慰剂和随机化安慰剂是否通过
7. Oster δ* 检验：|δ*| > 1 为基本稳健

## IV（工具变量）检查清单
1. 第一阶段 F 统计量：> 10 为基本合格，> 104 为 Lee et al. (2022) 标准
2. 过度识别检验：Hansen J 统计量 p 值
3. 排他性约束：工具变量是否只通过内生变量影响因变量
4. 弱工具变量：Anderson-Rubin 检验、tF 检验

## RDD（断点回归）检查清单
1. 带宽选择：MSE-optimal bandwidth（rdrobust 默认）
2. McCrary 密度检验：断点处密度是否连续
3. 协变量平衡性：断点两侧控制变量是否跳跃
4. Placebo cutoff：在非断点处是否有效应
5. 带宽敏感性：不同带宽下结果是否稳健

对每个检查项给出：通过/警告/失败，并附具体改进建议。
```

### 3.2 数据质量审计

```markdown
# .claude/skills/data-quality-audit/SKILL.md
---
name: data-quality-audit
description: 对数据文件进行全面质量审计，检查缺失值、异常值、编码和面板完整性。
---

审计数据文件：$ARGUMENTS

执行以下检查并输出报告：

### 1. 基本信息
- 文件格式、编码（尝试 UTF-8/GBK/GB18030）
- 行数、列数、文件大小

### 2. 变量检查
- 列出所有变量名、数据类型
- 标记可能的 ID 变量和时间变量

### 3. 缺失值分析
- 每个变量的缺失比例
- 缺失比例 > 30% 的变量标记为高风险
- 缺失模式分析（随机缺失 vs 系统性缺失）

### 4. 异常值检测
- 数值变量：超过 3 倍标准差的观测数量
- 建议 winsorize 的上下限（1% 和 99% 分位数）

### 5. 面板数据检查（如果检测到面板结构）
- Entity-Time 唯一性检验
- 面板是否平衡（balanced）
- 缺失的 entity-time 组合数量

### 6. 汇总建议
- 数据可用性评分（A/B/C/D）
- 必须处理的问题清单
- 建议的清洗步骤

输出到 output/data_quality_report.md
```

### 3.3 Stata 代码转 Python

```markdown
# .claude/skills/stata-to-python/SKILL.md
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
```

### 3.4 LaTeX 表格生成器

```markdown
# .claude/skills/latex-table-generator/SKILL.md
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
```

### 3.5 Event Study 图生成器

```markdown
# .claude/skills/event-study-plot/SKILL.md
---
name: event-study-plot
description: 生成学术论文级别的 event study 图。
disable-model-invocation: true
---

基于数据 $ARGUMENTS 生成 event study 图。

图表标准：
- 分辨率：300 DPI
- 字号：轴标签 12pt，标题 14pt
- 字体：Times New Roman
- 基准期 k=-1 归零，用红色虚线标记
- 95% 置信区间用浅蓝色阴影
- 零线用黑色虚线
- X 轴：Years relative to policy
- Y 轴：Coefficient (ATT)
- 同时输出 PNG + PDF 到 output/figures/

Python 实现使用 matplotlib，模板：
```python
import matplotlib.pyplot as plt
import matplotlib
matplotlib.rcParams['font.family'] = 'Times New Roman'
matplotlib.rcParams['font.size'] = 12

fig, ax = plt.subplots(figsize=(8, 5))
ax.axhline(y=0, color='black', linestyle='--', linewidth=0.8)
ax.axvline(x=-0.5, color='red', linestyle=':', linewidth=0.7)
ax.fill_between(periods, ci_lower, ci_upper, alpha=0.15, color='steelblue')
ax.plot(periods, coefficients, 'o-', color='steelblue', markersize=5)
ax.set_xlabel('Years relative to policy', fontsize=12)
ax.set_ylabel('Coefficient (ATT)', fontsize=12)
plt.tight_layout()
plt.savefig('output/figures/event_study.pdf', dpi=300, bbox_inches='tight')
plt.savefig('output/figures/event_study.png', dpi=300, bbox_inches='tight')
```
```

### 3.6 复制包构建器

```markdown
# .claude/skills/replication-package/SKILL.md
---
name: replication-package
description: 构建完整的学术论文复制包（replication package）。
disable-model-invocation: true
---

为当前项目构建复制包。

工作流程：
1. 扫描项目结构，识别数据、代码、输出文件
2. 创建 replication/ 目录，按标准结构组织：
   ```
   replication/
   ├── README.md          ← 复制说明（如何运行）
   ├── data/
   │   ├── raw/           ← 原始数据（或下载说明）
   │   └── processed/     ← 中间数据
   ├── code/
   │   ├── 01_clean.py    ← 数据清洗
   │   ├── 02_analysis.py ← 主分析
   │   ├── 03_robust.py   ← 稳健性检验
   │   └── 04_figures.py  ← 图表生成
   ├── output/
   │   ├── tables/        ← 表格
   │   └── figures/       ← 图表
   └── requirements.txt   ← 依赖列表
   ```
3. 生成 README.md，包含：
   - 论文标题和作者
   - 数据来源和获取方式
   - 软件环境要求
   - 运行步骤（一步一步）
   - 预期运行时间
   - 文件对应关系（哪个脚本生成哪个表/图）
4. 验证所有脚本从头到尾可以运行
5. 检查是否有硬编码路径
6. 确认随机种子已固定
```

### 3.7 文献综述辅助

```markdown
# .claude/skills/literature-review/SKILL.md
---
name: literature-review
description: 文献调研和综述辅助。搜索相关文献、提取核心信息、管理 BibTeX 引用。
disable-model-invocation: true
---

对主题 $ARGUMENTS 进行文献调研。

## 工作流程

### Step 1: 文献搜索
1. 根据主题关键词搜索相关学术文献
2. 优先搜索以下来源：
   - Google Scholar（通过 WebSearch）
   - NBER Working Papers
   - SSRN
   - 顶刊近 5 年发表（AER, QJE, Econometrica, JPE, REStud）
3. 收集 15-20 篇最相关文献

### Step 2: 信息提取
对每篇文献提取：
- 标题、作者、年份、期刊
- 核心研究问题（一句话）
- 识别策略 / 主要方法
- 关键发现（1-2 句）
- 与当前研究的关联

### Step 3: 文献分类
按以下维度整理：
- **直接相关**：研究同一问题或使用同一方法
- **方法论参考**：提供方法论支撑
- **背景文献**：提供制度背景或理论框架

### Step 4: 输出
1. 结构化笔记 → `paper/literature_notes.md`
2. BibTeX 条目 → `paper/references.bib`（追加模式）
3. 研究空白分析 → 当前文献中哪些问题未被充分研究

### BibTeX 格式规范
```bibtex
@article{AuthorYear,
  author  = {Last, First and Last2, First2},
  title   = {Full Title},
  journal = {Journal Name},
  year    = {2024},
  volume  = {114},
  number  = {3},
  pages   = {1-45},
  doi     = {10.xxxx/xxxxx}
}
```
```

### 3.8 论文结构脚手架

```markdown
# .claude/skills/paper-structure/SKILL.md
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
```

### 动手练习

点击上方 📦 按钮下载全部 Skills，解压后安装并测试：

```bash
# 解压到项目目录
unzip econ-skills-all.zip -d .claude/

# 测试回归诊断
/regression-diagnostics DID

# 测试文献综述
/literature-review "heterogeneous treatment effects in DID"
```

---

## 四、实际案例：econ-replication Skill

### 4.1 案例介绍

`econ-replication` 是一个完整的经济学论文复制技能包，展示了 Skill 如何将复杂的多步骤工作流打包为一键可用的工具。

### 4.2 目录结构

```
econ-replication/
├── SKILL.md                           ← 主技能定义
│   定义完整的论文复制工作流：
│   下载 → 理解 → 运行 → 比对 → 报告
│
├── references/                        ← 参考资料
│   ├── package_anatomy.md             ← 优质复制包的结构标准
│   │   什么是好的复制包？包含哪些要素？
│   │
│   ├── replication_report_template.md ← 复制报告模板
│   │   标准化的报告格式：原始结果 vs 复制结果
│   │
│   ├── stata_to_python.md             ← Stata-Python 命令对照表
│   │   帮助将 Stata 复制包翻译为 Python
│   │
│   └── wechat_post_template.md        ← 微信公众号推文模板
│       将复制结果整理成可发表的推文
│
└── scripts/                           ← 辅助脚本
    ├── package_downloader.py          ← 复制包下载器
    │   从 AEA/ICPSR/Zenodo 等平台下载数据和代码
    │
    └── result_comparator.py           ← 结果比对工具
        自动对比原始表格和复制表格的数值差异
```

### 4.3 安装方法

[下载 econ-replication（.zip，9 KB）](/wiki/assets/downloads/econ-replication.zip)

```bash
# 下载后解压并安装到项目
unzip econ-replication.zip -d .claude/skills/
```

### 4.4 使用方式

```bash
# 启动复制工作流
/econ-replication "Autor et al. (2013) - The China Syndrome"

# Claude 会自动执行：
# 1. 搜索并下载该论文的复制包
# 2. 分析包的结构和数据说明
# 3. 逐步运行分析脚本
# 4. 对比生成结果与论文表格
# 5. 输出复制报告
```

### 4.5 工作流详解

```
/econ-replication "Paper Title"
    │
    ▼
Step 1: 下载与理解
    ├── 搜索论文的复制包（AEA Data Editor, ICPSR, Zenodo）
    ├── 下载数据和代码
    ├── 阅读 README，理解运行流程
    └── 输出：复制包概况报告
    │
    ▼
Step 2: 环境搭建
    ├── 识别依赖（Stata packages / R packages / Python packages）
    ├── 安装缺失依赖
    ├── 如果是 Stata 代码，评估是否需要翻译为 Python
    └── 输出：环境就绪确认
    │
    ▼
Step 3: 运行与复制
    ├── 按 README 顺序运行每个脚本
    ├── 记录每个步骤的输出
    ├── 捕获并解决运行错误
    └── 输出：复制结果文件
    │
    ▼
Step 4: 结果比对
    ├── 自动对比每个表格的系数和标准误
    ├── 标记差异（容差范围内/超出容差）
    ├── 对比每张图的视觉一致性
    └── 输出：差异报告
    │
    ▼
Step 5: 报告生成
    ├── 生成标准格式复制报告
    ├── 分析差异原因（版本/随机种子/平台）
    └── 可选：生成微信推文草稿
```

> **安装提示**：点击上方绿色按钮一键下载 zip，解压后将 `econ-replication/` 目录放入项目的 `.claude/skills/` 即可。源文件也可在 [GitHub 仓库](https://github.com/luzhiyu-econ/luzhiyu-econ.github.io/tree/master/wiki/attachments/econ-replication) 浏览。

### 动手练习

1. 将 econ-replication 安装到你的项目
2. 选一篇有公开复制包的论文（如 AEA 最近发表的论文）
3. 运行 `/econ-replication "论文标题"` 体验完整流程

---

## 五、Continuous Learning 机制

### 5.1 自动技能提取

Claude Code 可以在会话结束时自动分析本次工作中发现的有价值模式，并保存为可复用的 Skill：

```
会话中你解决了一个棘手问题
    │
    ▼
Claude 识别出这是一个可复用的模式
    │
    ▼
自动保存到 ~/.claude/skills/learned/
    │
    ▼
下次遇到类似问题时自动加载
```

### 5.2 /learn 命令

在会话中间随时手动提取技能：

```bash
# 刚解决了一个编码问题
/learn

# Claude 会提示你描述刚才解决的问题
# 然后生成一个 Skill 文件，保存到 ~/.claude/skills/learned/
```

### 5.3 Stop Hook 自动评估

在会话结束时自动运行评估脚本，提取值得保留的模式：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/skills/continuous-learning/evaluate-session.sh"
          }
        ]
      }
    ]
  }
}
```

评估脚本分析会话中的：
- 错误解决方案（什么错误、怎么修的）
- 调试技巧（什么方法有效）
- 项目特有的知识（数据格式、编码规律）
- 用户纠正模式（哪些地方 Claude 总犯错）

### 5.4 Session Log Pattern

保持跨会话连续性：

```
~/.claude/sessions/
├── 2026-03-10-did-analysis.tmp    ← 今天的 DID 分析会话
├── 2026-03-09-data-cleaning.tmp   ← 昨天的数据清洗会话
└── 2026-03-08-literature.tmp      ← 前天的文献调研会话
```

每个文件记录：
- 已完成的任务
- 进行中的任务
- 遇到的障碍
- 关键决策和原因
- 下次会话需要的上下文

> 参考：[everything-claude-code](https://github.com/affaan-m/everything-claude-code) — 包含完整的 continuous learning 实现

### 动手练习

在一次有价值的调试后运行 `/learn`，观察 Claude 如何将你的解决方案打包为可复用的 Skill。

---

## 六、Plugins 系统

### 6.1 Plugin Marketplace

```bash
# 浏览可用插件
/plugin

# 插件是 Skills + Hooks + Agents + MCP 的打包组合
# 一键安装，无需手动配置
```

### 6.2 Code Intelligence Plugins

特别推荐安装的插件类型——给 Claude 精确的代码理解能力：

| 功能 | 说明 |
|---|---|
| Type checking | 编辑后自动检查类型错误 |
| Goto definition | 跳转到符号定义 |
| Find references | 查找所有引用位置 |
| Auto-detect errors | 编辑后立即发现问题 |

### 6.3 插件的组成

一个插件可以包含：

```
my-plugin/
├── plugin.json        ← 插件元数据
├── skills/            ← 技能包
├── hooks/             ← 自动化钩子
├── agents/            ← 子 Agent 定义
└── mcp/               ← MCP 服务器配置
```

> 参考：[Plugins 官方文档](https://code.claude.com/docs/en/plugins)，[Discover Plugins](https://code.claude.com/docs/en/discover-plugins)

---

## 七、小结

| 概念 | 要记住的 |
|---|---|
| Skill 本质 | `.claude/skills/NAME/SKILL.md`，可复用的工作流包 |
| 惰性加载 | 启动时只注册描述，调用时才加载全文 |
| $ARGUMENTS | 接收调用参数，如 `/skill-name file.csv` |
| disable-model-invocation | 设为 true 防止自动调用（有副作用的 Skill 必须设） |
| 内置 Skills | /batch（并行修改）、/debug（诊断）、/simplify（优化） |
| Continuous Learning | /learn 手动提取 + Stop Hook 自i ki
| Plugins | Skills + Hooks + Agents + MCP 的打包发行单元 |

### 进阶阅读

- [Skills 官方文档](https://code.claude.com/docs/en/skills)
- [Plugins 官方文档](https://code.claude.com/docs/en/plugins)
- [Discover Plugins](https://code.claude.com/docs/en/discover-plugins)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) — Continuous Learning 实现

---

> **上一篇**：[[Claude Code 3 - Agent Architecture|#3：Agent 设计方法]]
> **下一篇**：[[Claude Code 5 - Data Science Workflows|#5：数据科学处理实战]]
