---
title: "#2：Claude Code 配置方法"
tags:
  - skills/Claude Code
order: 2
description: 全面掌握 Claude Code 的多平台入口选择、CLAUDE.md 设计哲学、Rules 系统、记忆层级、Hooks 自动化、MCP 配置、权限模型与 Settings 体系，打造经济学研究专属的 AI 编程环境。
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> Claude Code 开箱即用只需要一条命令，但**真正的生产力跃升**来自于针对你的工作流深度配置。

---

## 一、多平台入口对比

Claude Code 可以从六个入口使用，它们共享同一个底层引擎——`CLAUDE.md`、Settings、MCP 服务器配置在各平台间通用。

### 1.1 六大平台一览

| 平台 | 安装方式 | 核心体验 | 特色功能 | 适合场景 |
|---|---|---|---|---|
| **Terminal CLI** | `curl` / `brew` | 纯命令行交互 | 功能最全，管道组合，Hooks 完整支持 | 日常编码、脚本自动化、服务器端 |
| **VS Code / Cursor 扩展** | 扩展市场安装 | IDE 内嵌面板 | Inline diff、@-mentions、plan review、对话历史 | Python/R 项目开发 |
| **JetBrains 插件** | 插件市场安装 | IDE 内嵌面板 | 交互式 diff、PyCharm 深度集成 | 偏好 PyCharm 的研究者 |
| **Desktop App** | 独立安装包 | 可视化桌面应用 | 可视化 diff、并行会话、定时任务、云端会话 | 非程序员、可视化审查 |
| **Web (claude.ai/code)** | 无需安装 | 浏览器使用 | 长时间运行任务、云端执行、无需本地环境 | 远程服务器、临时使用 |
| **iOS / Android** | App Store / Google Play | 手机端 | 发起或继续 coding 会话、Remote Control | 移动端审查、紧急修复 |

### 1.2 决策树：经济学研究者如何选择

```
你的主要工作环境是什么？
│
├── 本地开发（有 Python/Stata/R 项目）
│   │
│   ├── 习惯终端操作？
│   │   └── ✅ Terminal CLI（推荐首选）
│   │
│   ├── 习惯 VS Code？
│   │   └── ✅ VS Code 扩展 + Terminal CLI 互补
│   │
│   └── 习惯 PyCharm？
│       └── ✅ JetBrains 插件
│
├── 远程服务器（HPC / 云计算）
│   │
│   ├── 有 SSH 访问？
│   │   └── ✅ Terminal CLI + Remote SSH Tunneling
│   │
│   └── 无 SSH / 只有浏览器？
│       └── ✅ Web (claude.ai/code)
│
└── 移动场景（出差/开会）
    └── ✅ iOS/Android + Remote Control
```

### 1.3 经济学推荐方案

对于 90% 的经济学研究者，推荐 **Terminal CLI + VS Code 扩展** 组合：

- **Terminal CLI** 用于重度编码、数据处理管道、Git 操作、批量任务
- **VS Code 扩展** 用于交互式代码审查、LaTeX 编辑、可视化 diff
- **Remote Control** 用于在手机上检查长时间运行的估计任务

```bash
# 典型工作流
claude                          # 终端中启动
claude --resume                 # 恢复昨天的数据清洗会话
code .                          # VS Code 打开项目，扩展自动激活
```

### 1.4 动手练习

> **练习**：在你的机器上同时配置 Terminal CLI 和 VS Code 扩展。
>
> 1. 终端运行 `claude --version` 确认 CLI 可用
> 2. 在 VS Code 中安装 Claude Code 扩展
> 3. 在终端中启动 `claude`，让它修改一个文件
> 4. 在 VS Code 中观察 inline diff 的变化
> 5. 尝试从手机安装 Claude 应用，用 `/remote-control` 连接本地会话

---

## 二、CLAUDE.md 设计哲学

CLAUDE.md 是 Claude Code 的"项目大脑"——每次会话启动时自动加载到上下文窗口。写得好，Claude 如同经验丰富的 RA（Research Assistant）；写得差，Claude 就是个什么都不懂的实习生。

### 2.1 核心原则：控制在 200 行以内

CLAUDE.md 的内容会**消耗上下文窗口空间**。官方建议：

- 每个 CLAUDE.md 文件 **不超过 200 行**
- 越长的文件，Claude 遵从率越低
- 过长时拆分到 `.claude/rules/` 或用 `@import` 引入

**长度 vs 遵从率经验曲线**（基于社区实践数据）：

```
规则遵从率 %
100 │ ●
 95 │    ●
 90 │        ●
 85 │             ●
 80 │                   ●
 70 │                            ●
 60 │                                       ●
 50 │                                                  ●
    └───────────────────────────────────────────────────→
     50     100    150    200    300    400    500    行数

  ◄─────── 推荐区间 ────────►
  50~200 行：遵从率 ≥ 90%
  200~300 行：遵从率显著下降
  300+ 行：关键规则容易被"淹没"
```

**为什么会下降**：CLAUDE.md 越长，越靠后的规则在上下文中的"注意力权重"越低。Claude 在处理长文本时，开头和最近的内容权重最高（primacy + recency bias），中间部分容易被忽略。所以 **把最重要的规则放在 CLAUDE.md 的开头**。

```
上下文窗口（200K token）
┌─────────────────────────────────────────────┐
│  CLAUDE.md（≤200 行）          ~2K token     │ ← 每行约 10 token
│  Auto Memory（≤200 行）        ~2K token     │
│  .claude/rules/（按需加载）     ~1K token     │
│─────────────────────────────────────────────│
│  对话 + 工具调用结果             ~195K token  │ ← 留给实际工作
└─────────────────────────────────────────────┘
```

### 2.2 具体规则 vs 模糊建议

CLAUDE.md 是上下文而非强制配置——**越具体，遵从率越高**。

| 类型 | 差的写法 ❌ | 好的写法 ✅ |
|---|---|---|
| 代码风格 | "Format code properly" | "Use 4-space indentation for Python, 2-space for YAML" |
| 测试 | "Test your changes" | "Run `pytest tests/ -x` before committing" |
| 文件组织 | "Keep files organized" | "Data scripts go in `src/data/`, estimation in `src/models/`" |
| 数据安全 | "Be careful with data" | "NEVER modify files in `data/raw/`, only read from them" |
| 依赖 | "Use good libraries" | "Use pandas 2.x, statsmodels, linearmodels for panel data" |
| 输出 | "Save results" | "All tables save to `output/tables/` as .tex, figures to `output/figures/` as .pdf" |

### 2.3 `@import` 语法

CLAUDE.md 可以引入外部文件，避免主文件过长：

```markdown
# 项目概述
这是一个关于最低工资效应的面板数据研究。

# 参考文档
See @README.md for project overview.
See @docs/variable-definitions.md for all variable names.

# 额外指令
- Git workflow @docs/git-conventions.md
- @~/.claude/my-global-preferences.md
```

**路径规则**：
- 相对路径：相对于**包含 import 的文件**，不是工作目录
- `~` 开头：用户主目录
- 最大嵌套深度：5 层
- 首次使用外部 import 时 Claude Code 会弹出确认对话框

### 2.4 该写什么 / 不该写什么

| 该写 ✅ | 不该写 ❌ |
|---|---|
| 构建和测试命令 | 已在代码中显而易见的信息 |
| 编码规范和命名约定 | 过长的架构说明（拆分到 rules） |
| 项目目录结构说明 | 临时性的调试指令（用对话） |
| 首选库和版本约束 | 个人偏好（放 `~/.claude/CLAUDE.md`） |
| 数据文件的只读约束 | 重复 README 里的内容（用 @import） |
| 常用工作流（如何跑回归） | 不相关项目的规则 |

### 2.5 强调技巧

Claude 对**大写字母和特殊标记**更敏感：

```markdown
# 关键规则
- NEVER delete or modify files in `data/raw/`
- ALWAYS run tests before committing
- **IMPORTANT**: Use robust standard errors for all regressions
- ⚠️ Data files are IMMUTABLE once committed
```

### 2.6 迭代优化

CLAUDE.md 不是一次写好的，而是随项目演化的：

```
初始化 ──→ /init 自动生成 ──→ 基本可用
  │
  ├── 使用中发现 Claude 做错了
  │   └── 问 Claude："remember that we use HC1 standard errors"
  │       └── Claude 写入 Auto Memory 或你手动加到 CLAUDE.md
  │
  ├── 代码审查中发现不一致
  │   └── 添加具体规则到 CLAUDE.md
  │
  └── CLAUDE.md 超过 200 行
      └── 拆分到 .claude/rules/ 或用 @import
```

### 2.7 完整经济学 CLAUDE.md 示例

```markdown
# Econ Research Project: Minimum Wage Effects

## Build & Test
- Python 3.11+, virtual env at `.venv/`
- Install: `pip install -r requirements.txt`
- Test: `pytest tests/ -x --tb=short`
- Lint: `ruff check src/`

## Directory Structure
- `data/raw/`       — 原始数据，NEVER modify
- `data/processed/` — 清洗后数据，脚本生成
- `src/data/`       — 数据清洗脚本
- `src/models/`     — 估计模型
- `src/viz/`        — 可视化
- `output/tables/`  — LaTeX 表格输出
- `output/figures/` — PDF 图表输出

## Coding Standards
- 4-space indentation, type hints for all functions
- Use pathlib.Path, not os.path
- Docstrings: Google style
- Variable naming: snake_case, descriptive (e.g., `log_wage`, `treat_post`)
- pandas: method chaining, .pipe() for complex transforms

## Econometrics Conventions
- ALWAYS use HC1 (robust) standard errors unless noted
- Panel models: use linearmodels FixedEffects, not statsmodels
- Clustering: default to state-level clustering for CPS data
- Report: coefficient, SE, p-value, N, R², F-stat
- Stars: * p<0.1, ** p<0.05, *** p<0.01

## Output Format
- Tables: stargazer-style LaTeX via `src/utils/table_export.py`
- Figures: matplotlib with `src/viz/style.mplstyle`, save as PDF
- All outputs reproducible from `make all`

## Git Conventions
- Branches: `feature/`, `fix/`, `data/`
- Commit messages: imperative mood, reference issue number
- NEVER commit data files > 10MB (use Git LFS)

## Key References
See @docs/variable-codebook.md for variable definitions.
See @README.md for project overview.
```

### 2.8 动手练习

> **练习**：为你当前的研究项目创建 CLAUDE.md。
>
> 1. `cd` 到你的项目目录
> 2. 运行 `claude` 然后输入 `/init`，观察自动生成的内容
> 3. 根据 2.7 节的模板补充经济学特定规则
> 4. 确保文件不超过 200 行
> 5. 测试：让 Claude 修改一个数据处理脚本，看它是否遵循了 CLAUDE.md 中的规范

---

## 三、Rules 系统

当 CLAUDE.md 超过 200 行，或某些规则只适用于特定类型的文件时，`.claude/rules/` 是更好的选择。

### 3.1 基本结构

```
your-project/
├── .claude/
│   ├── CLAUDE.md              # 主项目指令（≤200 行）
│   └── rules/
│       ├── python-style.md    # Python 编码规范
│       ├── data-integrity.md  # 数据完整性规则
│       ├── stata-interop.md   # Stata 互操作规则
│       └── latex-conventions.md  # LaTeX 约定
```

**加载机制**：
- 无 `paths:` frontmatter 的规则文件 → 每次启动都加载
- 有 `paths:` frontmatter 的规则文件 → 当 Claude 访问匹配文件时按需加载（节省上下文）

### 3.2 Path-scoped Rules（路径作用域规则）

使用 YAML frontmatter 中的 `paths:` 字段限定规则生效的文件范围：

```markdown
---
paths:
  - "src/**/*.py"
  - "scripts/**/*.py"
---

# Python 代码规范（仅在处理 .py 文件时加载）

- Use type hints for all function signatures
- ...
```

`paths` 支持 glob 模式：

| 模式 | 匹配 |
|---|---|
| `**/*.py` | 任意目录下的 Python 文件 |
| `src/**/*` | `src/` 下的所有文件 |
| `*.md` | 项目根目录的 Markdown 文件 |
| `src/models/*.py` | 特定目录下的 Python 文件 |
| `**/*.{do,ado}` | 所有 Stata do-file |

### 3.3 四个经济学 Rule 文件示例

**示例 1：`.claude/rules/python-style.md`**

```markdown
---
paths:
  - "**/*.py"
---

# Python Code Style

- 4-space indentation, max line length 88 (Black default)
- Type hints required for all function signatures
- Google-style docstrings with Args/Returns/Raises
- Use pathlib.Path instead of os.path
- pandas: prefer method chaining and .pipe()
- numpy: explicit dtype in array creation
- Imports order: stdlib → third-party → local, separated by blank lines
- NEVER use `from module import *`
- Variable names: snake_case, descriptive (log_wage not lw)
```

**示例 2：`.claude/rules/data-integrity.md`**

```markdown
# Data Integrity Rules (always loaded)

- Files in `data/raw/` are IMMUTABLE — NEVER write, modify, or delete
- All data transformations must be scripted in `src/data/`
- Processed data goes to `data/processed/` only
- Every data pipeline step must log: input rows → output rows → dropped rows
- Missing values: document reason, NEVER silently drop
- Merges: always verify merge quality with `_merge` indicator
- Save intermediate datasets with timestamp suffix for debugging
```

**示例 3：`.claude/rules/stata-interop.md`**

```markdown
---
paths:
  - "**/*.do"
  - "**/*.ado"
  - "**/*.dta"
  - "src/stata/**"
---

# Stata Interoperability

- .dta files: read with pandas.read_stata(), preserve value labels
- When converting Stata → Python: match variable names exactly
- Stata do-files: use `version 17` header, `set more off`
- Factor variables: i.varname in Stata = C(varname) in linearmodels
- Clustering: `vce(cluster state)` in Stata = `cluster_entity` in linearmodels
- Export tables: use estout/esttab format compatible with our LaTeX template
- When asked to "replicate Stata results", match coefficients to 4 decimal places
```

**示例 4：`.claude/rules/latex-conventions.md`**

```markdown
---
paths:
  - "**/*.tex"
  - "**/*.bib"
  - "output/tables/**"
---

# LaTeX Conventions

- Use booktabs package: \toprule, \midrule, \bottomrule (no \hline)
- Table format: 3-decimal coefficients, SEs in parentheses below
- Stars: \sym{*} p<0.1, \sym{**} p<0.05, \sym{***} p<0.01
- Figure captions: descriptive, include data source
- Bibliography: BibTeX with .bib file, natbib package, author-year style
- Labels: tab:<name> for tables, fig:<name> for figures, eq:<name> for equations
- NEVER hardcode numbers in text — use \input{} from generated .tex fragments
```

### 3.4 用户级 Rules

个人偏好（跨所有项目）放在 `~/.claude/rules/`：

```
~/.claude/rules/
├── preferences.md    # 个人编码风格
└── workflows.md      # 个人工作流偏好
```

用户级 rules 优先级低于项目级 rules。

### 3.5 动手练习

> **练习**：为你的项目创建路径作用域 rule。
>
> 1. 创建 `.claude/rules/` 目录
> 2. 创建 `python-style.md`，添加 `paths: ["**/*.py"]` frontmatter
> 3. 写 5 条 Python 编码规则
> 4. 让 Claude 修改一个 `.py` 文件，验证规则是否生效
> 5. 再让 Claude 修改一个 `.tex` 文件，确认 Python 规则不会加载（用 `/memory` 检查）

---

## 四、记忆层级

Claude Code 的记忆系统分为五个层级，从组织到个人、从静态到动态。理解这个层级是正确配置的基础。

### 4.1 五层记忆体系

```
优先级（高 → 低）：

┌──────────────────────────────────────────────────────────────┐
│  ① Managed Policy CLAUDE.md                                  │
│  位置: /Library/Application Support/ClaudeCode/CLAUDE.md     │
│  作用: 组织级强制规则（IT 部署），不可被覆盖                   │
│  经济学场景: 研究机构统一合规要求                              │
├──────────────────────────────────────────────────────────────┤
│  ② User CLAUDE.md + User Rules                               │
│  位置: ~/.claude/CLAUDE.md + ~/.claude/rules/                │
│  作用: 个人全局偏好，适用于所有项目                           │
│  经济学场景: 你的编码风格、常用包版本                          │
├──────────────────────────────────────────────────────────────┤
│  ③ Project CLAUDE.md + Project Rules                          │
│  位置: ./CLAUDE.md + .claude/rules/                          │
│  作用: 项目团队共享，提交到 Git                               │
│  经济学场景: 特定论文项目的数据规范、回归约定                  │
├──────────────────────────────────────────────────────────────┤
│  ④ Local CLAUDE.md                                           │
│  位置: ./CLAUDE.local.md                                     │
│  作用: 个人项目偏好，不提交到 Git                             │
│  经济学场景: 你的沙盒 URL、测试数据路径                       │
├──────────────────────────────────────────────────────────────┤
│  ⑤ Auto Memory                                               │
│  位置: ~/.claude/projects/<project>/memory/MEMORY.md         │
│  作用: Claude 自己积累的学习笔记，跨会话持久化                │
│  经济学场景: build 命令、调试技巧、你纠正过的偏好             │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 优先级与覆盖规则

当同一条规则在多个层级出现时，**更具体的层级优先**：

```
Managed Policy    ← 最高优先级，不可覆盖
    ↑ 覆盖
Local (.local.md) ← 覆盖 Project 和 User
    ↑ 覆盖
Project           ← 覆盖 User
    ↑ 覆盖
User              ← 最低优先级（默认兜底）
```

Auto Memory 特殊：它是上下文而非严格的配置层级。MEMORY.md 的前 200 行在每次会话加载，超出部分 Claude 按需读取。

### 4.3 文件位置速查

| 层级 | 文件路径 | 是否共享 | 是否提交 Git |
|---|---|---|---|
| Managed | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | 所有用户 | 否（IT 部署） |
| User | `~/.claude/CLAUDE.md` | 只有你 | 否 |
| User Rules | `~/.claude/rules/*.md` | 只有你 | 否 |
| Project | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 团队共享 | 是 |
| Project Rules | `./.claude/rules/*.md` | 团队共享 | 是 |
| Local | `./CLAUDE.local.md` | 只有你 | 否（自动 gitignore） |
| Auto Memory | `~/.claude/projects/<project>/memory/MEMORY.md` | 只有你 | 否 |

### 4.4 `/memory` 命令

在 Claude Code 会话中使用 `/memory` 可以：

- 列出当前加载的所有 CLAUDE.md 和 rules 文件
- 切换 Auto Memory 开关
- 打开 Auto Memory 文件夹进行编辑
- 选择任意文件在编辑器中打开

### 4.5 "告诉 Claude 记住" 模式

两种方式让 Claude 记住信息：

```
方式 1：写入 Auto Memory（推荐日常使用）
你说："remember that we use HC1 standard errors for all regressions"
Claude → 自动写入 ~/.claude/projects/<project>/memory/MEMORY.md

方式 2：写入 CLAUDE.md（推荐重要规则）
你说："add to CLAUDE.md: always use HC1 standard errors"
Claude → 修改 ./CLAUDE.md
```

**区别**：Auto Memory 是 Claude 自己管理的笔记，可能在压缩时丢失细节；CLAUDE.md 是你控制的文档，每次压缩后从磁盘重新加载，永不丢失。

### 4.6 动手练习

> **练习**：体验记忆层级。
>
> 1. 创建 `~/.claude/CLAUDE.md`，写入："My name is [你的名字]. I prefer concise responses."
> 2. 创建项目级 `./CLAUDE.md`，写入项目特定的规则
> 3. 启动 Claude Code，运行 `/memory` 查看加载了哪些文件
> 4. 告诉 Claude："remember that I always want 4 decimal places in regression tables"
> 5. 退出并重启 Claude Code，问："what do you know about my preferences?"
> 6. 检查 `~/.claude/projects/` 目录，找到 Auto Memory 文件

---

## 五、Hooks 系统

Hooks 是 Claude Code 生命周期中**确定性执行**的自动化机制。与 CLAUDE.md 指令不同，Hooks **保证每次都会执行**——不是"建议"，而是"强制"。

### 5.1 所有生命周期事件

Claude Code 提供 18 个生命周期事件（截至 2026 年 3 月）：

| 事件 | 触发时机 | 常见用途 |
|---|---|---|
| `SessionStart` | 会话开始或恢复 | 环境检查、加载记忆 |
| `SessionEnd` | 会话结束 | 清理、保存状态 |
| `UserPromptSubmit` | 用户提交提示后 | 输入预处理 |
| `PreToolUse` | 工具调用前（可阻止） | 安全检查、权限拦截 |
| `PostToolUse` | 工具调用成功后 | 自动格式化、日志 |
| `PostToolUseFailure` | 工具调用失败后 | 错误报告 |
| `PermissionRequest` | 权限对话框弹出 | 自动审批/拒绝 |
| `Notification` | 发送通知时 | 自定义通知渠道 |
| `SubagentStart` | 子 Agent 启动 | 监控 |
| `SubagentStop` | 子 Agent 完成 | 结果汇总 |
| `Stop` | Claude 完成响应 | 自动测试、结果检查 |
| `TeammateIdle` | 团队成员即将空闲 | 任务分配 |
| `TaskCompleted` | 任务标记完成 | 通知、记录 |
| `InstructionsLoaded` | CLAUDE.md/rules 文件加载 | 调试配置加载 |
| `ConfigChange` | 配置文件变更 | 动态响应 |
| `WorktreeCreate` | Worktree 创建时 | 自定义 git 行为 |
| `WorktreeRemove` | Worktree 移除时 | 清理 |
| `PreCompact` | 上下文压缩前 | 保存关键信息 |

### 5.2 三种 Hook 类型

```
Hook 类型及使用占比：

┌──────────────────────────────────────────────────────┐
│  Command Hook（Shell 脚本）              ████████ 90% │
│  → 格式化、安全检查、文件操作                         │
│  → 最快、最可靠、最常用                               │
├──────────────────────────────────────────────────────┤
│  Prompt Hook（LLM 判断）                  █ 5%        │
│  → 单轮 yes/no 决策                                  │
│  → 需要语义理解的场景                                 │
├──────────────────────────────────────────────────────┤
│  Agent Hook（子智能体）                   █ 5%        │
│  → 最多 50 轮工具调用                                 │
│  → 复杂验证、多步检查                                 │
└──────────────────────────────────────────────────────┘
```

配置字段：

| 字段 | 必需 | 说明 |
|---|---|---|
| `type` | 是 | `"command"` / `"prompt"` / `"agent"` / `"http"` |
| `command` / `prompt` / `url` | 是 | 要执行的脚本 / 提示词 / URL |
| `timeout` | 否 | 超时秒数（command 默认 600s，prompt 30s，agent 60s） |
| `statusMessage` | 否 | 运行时的加载提示信息 |
| `async` | 否 | 是否后台异步运行（仅 command） |
| `once` | 否 | 是否只运行一次（仅 skill 中） |

### 5.3 经济学 Hook 实战：自动格式化

每次 Claude 写入或编辑 Python 文件后，自动运行 `ruff format`：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo $CLAUDE_TOOL_INPUT | jq -r '.file_path // .path // empty'); if [[ \"$FILE\" == *.py ]]; then ruff format \"$FILE\" 2>/dev/null; ruff check --fix \"$FILE\" 2>/dev/null; fi",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### 5.4 经济学 Hook 实战：数据保护

阻止任何对 `data/raw/` 目录的写入操作：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/protect-raw-data.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/hooks/protect-raw-data.sh`：

```bash
#!/bin/bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')

case "$TOOL" in
  Write|Edit)
    FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
    ;;
  Bash)
    CMD=$(echo "$INPUT" | jq -r '.tool_input.command')
    if echo "$CMD" | grep -qE '(>|>>|mv|cp|rm|write|to_csv|to_stata|to_parquet).*data/raw'; then
      jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"BLOCKED: data/raw/ is immutable. Write to data/processed/ instead."}}'
      exit 0
    fi
    exit 0
    ;;
esac

if echo "$FILE" | grep -q 'data/raw'; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"BLOCKED: data/raw/ is immutable. Write to data/processed/ instead."}}'
else
  exit 0
fi
```

### 5.5 经济学 Hook 实战：记忆持久化链

用 Hook 链实现跨会话的记忆持久化——每次 Compact 前保存要点，启动时恢复，结束时归档：

```
PreCompact ──→ 压缩前保存当前工作摘要到文件
SessionStart ─→ 启动时加载上次保存的摘要
Stop ─────────→ 每轮结束后更新进度
```

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "mkdir -p .claude/state && date '+%Y-%m-%d %H:%M' > .claude/state/last-compact.txt",
            "statusMessage": "Saving session state before compaction..."
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "if [ -f .claude/state/last-compact.txt ]; then echo '{\"message\":\"Session state found. Last compaction: '$(cat .claude/state/last-compact.txt)'\"}'; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "mkdir -p .claude/state && echo \"$(date '+%H:%M:%S') — Turn completed\" >> .claude/state/session-log.txt",
            "async": true
          }
        ]
      }
    ]
  }
}
```

### 5.6 经济学 Hook 实战：自动 pytest

每次 Claude 完成响应后，如果修改了 Python 文件，自动运行相关测试：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep '\\.py$'); if [ -n \"$CHANGED\" ]; then pytest tests/ -x --tb=short -q 2>&1 | tail -20; fi",
            "timeout": 120,
            "statusMessage": "Running tests on changed Python files..."
          }
        ]
      }
    ]
  }
}
```

### 5.7 完整 settings.json Hook 配置示例

将上述 Hook 组合到一个完整的项目级配置中（`.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-raw-data.sh",
            "statusMessage": "Checking data protection rules..."
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo $CLAUDE_TOOL_INPUT | jq -r '.file_path // .path // empty'); if [[ \"$FILE\" == *.py ]]; then ruff format \"$FILE\" 2>/dev/null; fi",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep '\\.py$'); if [ -n \"$CHANGED\" ]; then pytest tests/ -x --tb=short -q 2>&1 | tail -20; fi",
            "timeout": 120,
            "statusMessage": "Running post-turn tests..."
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "mkdir -p .claude/state && date '+%Y-%m-%d %H:%M' > .claude/state/last-compact.txt"
          }
        ]
      }
    ]
  }
}
```

### 5.8 动手练习

> **练习**：创建你的第一个 Hook。
>
> 1. 创建 `.claude/hooks/` 目录
> 2. 写一个 `protect-raw-data.sh` 脚本（参考 5.4 节），`chmod +x` 赋予执行权限
> 3. 在 `.claude/settings.json` 中添加 PreToolUse Hook
> 4. 启动 Claude Code，让它 "write a test file to data/raw/test.csv"
> 5. 验证 Hook 阻止了写入，并给出了清晰的错误信息
> 6. 让 Claude "write the same file to data/processed/test.csv"，确认可以成功写入

---

## 六、MCP 配置

MCP（Model Context Protocol）是一个开放标准，让 Claude Code 连接外部工具和数据源。通过 MCP 服务器，Claude 可以操作 GitHub、查询数据库、读取 Google Drive 文档等。

### 6.1 .mcp.json 格式

项目级 MCP 配置文件 `.mcp.json` 放在项目根目录，提交到 Git 供团队共享：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"],
      "env": {}
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL:-postgresql://localhost:5432/research}"
      }
    }
  }
}
```

**环境变量语法**：
- `${VAR}` — 展开为环境变量值
- `${VAR:-default}` — 变量未设置时使用默认值

### 6.2 常见 MCP 服务器

| 服务器 | 功能 | 经济学用途 |
|---|---|---|
| **GitHub** | PR 管理、Issue 追踪、代码搜索 | 协作论文代码仓库 |
| **Filesystem** | 指定目录的文件读写 | 访问共享数据目录 |
| **PostgreSQL / SQLite** | 数据库查询 | 直接查询研究数据库 |
| **Google Drive** | 读取 Google Docs/Sheets | 读取协作文档 |
| **Notion** | Notion 页面和数据库 | 项目管理、文献笔记 |
| **Slack** | Slack 消息和频道 | 团队通讯集成 |
| **Memory** | 知识图谱存储 | 跨项目知识管理 |

### 6.3 安装 MCP 服务器

```bash
# 方式 1：HTTP 远程服务器（推荐）
claude mcp add --transport http notion https://mcp.notion.com/mcp

# 方式 2：本地 stdio 服务器
claude mcp add --transport stdio github -- npx -y @modelcontextprotocol/server-github
# 带环境变量
claude mcp add --transport stdio --env GITHUB_TOKEN=ghp_xxx github \
  -- npx -y @modelcontextprotocol/server-github

# 指定作用域
claude mcp add --scope project --transport http paypal https://mcp.paypal.com/mcp
claude mcp add --scope user --transport http notion https://mcp.notion.com/mcp

# 管理
claude mcp list              # 列出所有 MCP 服务器
claude mcp get github        # 查看特定服务器详情
claude mcp remove github     # 移除
/mcp                         # 在会话中查看状态
```

### 6.4 MCP Tool Search：惰性加载

当你配置了大量 MCP 服务器（比如 50+ 工具），Claude Code 不会在启动时加载所有工具定义。**MCP Tool Search** 使用惰性加载机制：

```
传统方式（Tool Search 关闭）：
  启动 → 加载全部 50 个工具定义 → 消耗大量 token → 准确率 79.5%

Tool Search 方式（默认开启）：
  启动 → 只加载工具名和描述索引 → 按需加载完整定义
  → token 消耗减少 95% → 准确率 88.1%
```

### 6.5 什么时候 CLI 优于 MCP

MCP 并非万能。对于一些场景，直接使用 CLI 工具更高效：

| 场景 | 用 CLI ✅ | 用 MCP ❌ |
|---|---|---|
| 简单 git 操作 | `git commit -m "..."` | GitHub MCP server |
| 本地文件操作 | 内置 Read/Write 工具 | Filesystem MCP server |
| 一次性 curl 请求 | `curl https://...` | 专门的 HTTP MCP |
| 环境特定脚本 | `make build` | 自定义 MCP server |

**经验法则**：如果 Claude 的内置工具或一条 shell 命令就能做到，不需要 MCP。MCP 适合**需要持久连接、认证和复杂交互**的场景（数据库、SaaS API）。

### 6.6 `/mcp` 查看状态与成本

在会话中输入 `/mcp` 可以：
- 查看所有已连接的 MCP 服务器状态
- 检查服务器是否正常运行
- 认证需要 OAuth 的远程服务器
- 查看 MCP 工具调用的 token 开销

> ⚠️ MCP 工具输出超过 10,000 token 时会收到警告。设置 `MAX_MCP_OUTPUT_TOKENS=50000` 可提高上限。

### 6.7 动手练习

> **练习**：配置 GitHub MCP 服务器。
>
> 1. 获取你的 GitHub Personal Access Token
> 2. 运行 `claude mcp add --transport stdio --env GITHUB_TOKEN=ghp_xxx github -- npx -y @modelcontextprotocol/server-github`
> 3. 启动 Claude Code，运行 `/mcp` 确认服务器连接成功
> 4. 让 Claude "list my recent GitHub repositories"
> 5. 让 Claude "create a new issue on my research repo about adding robustness checks"

---

## 七、Permissions 权限模型

Claude Code 的权限系统让你精确控制 AI 能做什么、不能做什么。对经济学研究者来说，**保护原始数据和敏感凭证**是关键。

### 7.1 权限层级

```
工具类型与权限：

只读操作（自动批准）        需确认操作（需你点"是"）
┌──────────────────┐     ┌──────────────────────┐
│ Read（读文件）    │     │ Bash（运行命令）      │
│ Grep（搜索内容）  │     │ Edit（修改文件）      │
│ Glob（搜索文件名）│     │ Write（创建文件）     │
│                  │     │ MCP 工具调用          │
└──────────────────┘     └──────────────────────┘
```

### 7.2 Allow / Deny / Ask 规则

规则评估顺序：**Deny → Ask → Allow**，第一个匹配的规则生效。

```json
{
  "permissions": {
    "allow": [
      "Bash(python *)",
      "Bash(pytest *)",
      "Bash(ruff *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git status)",
      "Bash(make *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Edit(./data/raw/**)",
      "Write(./data/raw/**)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(git checkout main)",
      "Bash(pip install *)"
    ]
  }
}
```

### 7.3 三种权限模式

通过 `Shift+Tab` 在会话中切换，或在 settings.json 中设置 `defaultMode`：

| 模式 | 说明 | 适用场景 |
|---|---|---|
| `default` | 标准模式，首次使用工具时询问 | 日常开发 |
| `acceptEdits` | 自动批准文件编辑（本会话内） | 信任 Claude 修改代码时 |
| `plan` | 只读模式，Claude 只能分析不能修改 | 代码审查、方案讨论 |
| `dontAsk` | 拒绝未预授权的工具（只用 allow 列表中的） | 自动化管道、CI |
| `bypassPermissions` | 跳过所有权限检查 | ⚠️ 仅限隔离容器环境 |

### 7.4 Sandbox 沙盒

Sandbox 提供**操作系统级别**的文件和网络隔离，作为权限系统之外的第二道防线：

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "filesystem": {
      "denyRead": ["~/.aws/credentials", "~/.ssh/id_rsa"],
      "denyWrite": ["//etc", "./data/raw"]
    },
    "network": {
      "allowedDomains": ["github.com", "pypi.org", "*.python.org"]
    }
  }
}
```

### 7.5 经济学权限配置方案

对经济学研究者，核心是**保护原始数据和凭证**：

```json
{
  "permissions": {
    "allow": [
      "Bash(python *)",
      "Bash(pytest *)",
      "Bash(ruff *)",
      "Bash(stata-mp *)",
      "Bash(Rscript *)",
      "Bash(make *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git status)"
    ],
    "deny": [
      "Edit(./data/raw/**)",
      "Write(./data/raw/**)",
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Read(./.env)",
      "Read(./credentials/**)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(pip install *)",
      "Bash(conda install *)"
    ],
    "defaultMode": "default"
  }
}
```

### 7.6 动手练习

> **练习**：配置数据保护权限。
>
> 1. 在 `.claude/settings.json` 中添加 deny 规则阻止修改 `data/raw/`
> 2. 启动 Claude Code，让 Claude "edit data/raw/sample.csv to add a new column"
> 3. 确认操作被拒绝
> 4. 用 `Shift+Tab` 切换到 Plan 模式
> 5. 让 Claude "analyze my project structure and suggest improvements"
> 6. 确认 Claude 只能读取不能修改

---

## 八、Settings 体系

Settings 是 Claude Code 的总配置入口。理解 Settings 层级和主要字段，才能把前面学到的 Hooks、Permissions、MCP 等配置正确地组织起来。

### 8.1 三级配置文件

```
配置优先级（高 → 低）：

┌─────────────────────────────────────────────┐
│  Managed Settings（组织级，不可覆盖）         │
│  macOS: /Library/Application Support/       │
│         ClaudeCode/managed-settings.json    │
│  Linux: /etc/claude-code/managed-settings.json
│  作用: IT 部署的强制策略                     │
├─────────────────────────────────────────────┤
│  Command Line Arguments（临时覆盖）          │
│  claude --model opus --system-prompt "..."  │
│  作用: 单次会话的临时设置                    │
├─────────────────────────────────────────────┤
│  Local Settings（个人项目偏好）               │
│  .claude/settings.local.json                │
│  作用: 不提交 Git 的本地设置                 │
├─────────────────────────────────────────────┤
│  Project Settings（团队共享）                 │
│  .claude/settings.json                      │
│  作用: 提交到 Git，团队共用                  │
├─────────────────────────────────────────────┤
│  User Settings（个人全局）                    │
│  ~/.claude/settings.json                    │
│  作用: 你的所有项目通用                      │
└─────────────────────────────────────────────┘
```

### 8.2 主要配置字段一览

| 字段 | 说明 | 示例 |
|---|---|---|
| `permissions` | Allow / Deny / Ask 规则 | 见第七节 |
| `hooks` | 生命周期 Hook | 见第五节 |
| `model` | 默认模型 | `"claude-sonnet-4-6"` |
| `env` | 环境变量 | `{"PYTHONPATH": "src"}` |
| `sandbox` | 沙盒配置 | 见 7.4 节 |
| `language` | Claude 响应语言 | `"chinese"` |
| `autoMemoryEnabled` | Auto Memory 开关 | `true` |
| `defaultMode` | 默认权限模式 | `"default"` |
| `additionalDirectories` | 额外工作目录 | `["../shared-data/"]` |
| `enableAllProjectMcpServers` | 自动批准项目 MCP | `true` |
| `cleanupPeriodDays` | 会话清理天数 | `30` |
| `includeGitInstructions` | 内置 Git 指令 | `true` |
| `plansDirectory` | 计划文件目录 | `"./plans"` |

### 8.3 完整项目 settings.json 示例

一个针对经济学研究的完整项目配置（`.claude/settings.json`）：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "claude-sonnet-4-6",
  "language": "chinese",
  "autoMemoryEnabled": true,
  "includeGitInstructions": true,
  "env": {
    "PYTHONPATH": "src",
    "PYTHONDONTWRITEBYTECODE": "1"
  },
  "permissions": {
    "allow": [
      "Bash(python *)",
      "Bash(pytest *)",
      "Bash(ruff *)",
      "Bash(make *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git status)",
      "Bash(git add *)",
      "Bash(git commit *)"
    ],
    "deny": [
      "Edit(./data/raw/**)",
      "Write(./data/raw/**)",
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Read(./.env)",
      "Read(./credentials/**)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(pip install *)"
    ],
    "defaultMode": "default"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-raw-data.sh",
            "statusMessage": "Checking data protection..."
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo $CLAUDE_TOOL_INPUT | jq -r '.file_path // .path // empty'); if [[ \"$FILE\" == *.py ]]; then ruff format \"$FILE\" 2>/dev/null; fi",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep '\\.py$'); if [ -n \"$CHANGED\" ]; then pytest tests/ -x --tb=short -q 2>&1 | tail -20; fi",
            "timeout": 120,
            "statusMessage": "Running tests..."
          }
        ]
      }
    ]
  }
}
```

### 8.4 动态 `--system-prompt` 注入

CLI 支持用 `--system-prompt` 在启动时注入临时指令，**不修改任何配置文件**：

```bash
# 强制使用特定编码风格
claude --system-prompt "In this session, use R instead of Python for all data analysis"

# 切换到审查模式
claude --system-prompt "You are a code reviewer. Only suggest improvements, do not modify files." --model opus

# 管道模式中注入指令
cat regression_output.log | claude -p --system-prompt "You are an econometrics expert" "Check these regression results for specification issues"
```

`--system-prompt` 的优先级高于 CLAUDE.md，但低于 Managed Settings。适合一次性任务和管道自动化。

### 8.5 CLI 别名：一键切换工作模式

在 `~/.zshrc`（或 `~/.bashrc`）中设置 Claude Code 别名，快速进入不同工作模式：

```bash
# 开发模式：默认 Sonnet 模型
alias claude-dev='claude --model claude-sonnet-4-6'

# 审查模式：Opus 模型 + Plan 模式 + 审查指令
alias claude-review='claude --model claude-opus-4 --system-prompt "You are reviewing code for an economics research paper. Focus on: 1) Econometric correctness 2) Data handling 3) Reproducibility. Do NOT modify files, only suggest."'

# 研究模式：Opus + 允许 web 搜索
alias claude-research='claude --model claude-opus-4 --system-prompt "You are a research assistant helping with economic literature review and methodology questions."'

# 快速数据检查
alias claude-data='claude --system-prompt "Focus on data quality: check for missing values, outliers, merge issues, and type consistency."'

# Headless 自动化（跳过所有确认）
alias claude-auto='claude --model claude-sonnet-4-6 --system-prompt "Execute tasks automatically without asking for confirmation."'
```

使用示例：

```bash
claude-dev                              # 日常编码
claude-review                           # 代码审查（不会修改文件）
claude-research                         # 文献和方法论问题
echo "check data/processed/*.csv" | claude-data -p  # 管道检查数据
```

### 8.6 动手练习

> **练习**：搭建完整的 Settings 体系。
>
> 1. 创建 `~/.claude/settings.json`，添加你的全局偏好（语言、默认模型）
> 2. 创建 `.claude/settings.json`，添加项目级权限和 Hook
> 3. 创建 `.claude/settings.local.json`，添加你的本地环境变量
> 4. 在 `~/.zshrc` 中添加至少两个 Claude 别名
> 5. 运行 `source ~/.zshrc`，测试 `claude-dev` 和 `claude-review` 别名
> 6. 在 Claude Code 中运行 `/config` 查看配置是否正确加载

---

## 九、小结

本章覆盖了 Claude Code 配置系统的所有层面。以下是关键概念总览：

| 主题 | 核心要点 | 配置文件 |
|---|---|---|
| **多平台入口** | 6 个平台共享一个引擎；经济学推荐 Terminal + VS Code | — |
| **CLAUDE.md** | ≤200 行，具体规则，@import 拆分，迭代优化 | `./CLAUDE.md`, `~/.claude/CLAUDE.md` |
| **Rules 系统** | 模块化规则文件，paths: 作用域按需加载 | `.claude/rules/*.md` |
| **记忆层级** | 5 层从组织到个人，Auto Memory 自动积累 | 多个位置 |
| **Hooks** | 18 个生命周期事件，确定性执行，command 占 90% | `settings.json` 中的 `hooks` |
| **MCP** | 连接外部工具，惰性加载，CLI 能做的不需要 MCP | `.mcp.json` |
| **Permissions** | Deny→Ask→Allow，保护原始数据，Sandbox 双重防线 | `settings.json` 中的 `permissions` |
| **Settings 体系** | 5 级优先级，CLI 别名切换模式 | `settings.json`（多层级） |

### 进阶阅读

- [Claude Code 官方文档：Memory](https://code.claude.com/docs/en/memory) — CLAUDE.md 与 Auto Memory 详解
- [Claude Code 官方文档：Hooks](https://code.claude.com/docs/en/hooks) — Hook 事件与配置参考
- [Claude Code 官方文档：Hooks Guide](https://code.claude.com/docs/en/hooks-guide) — Hook 实战指南
- [Claude Code 官方文档：MCP](https://code.claude.com/docs/en/mcp) — MCP 服务器配置
- [Claude Code 官方文档：Permissions](https://code.claude.com/docs/en/permissions) — 权限系统详解
- [Claude Code 官方文档：Settings](https://code.claude.com/docs/en/settings) — 完整配置参考
- [Claude Code 官方文档：Best Practices](https://code.claude.com/docs/en/best-practices) — 最佳实践

---

**← 上一篇** [#1：Claude Code 工作原理深度解析](./Claude%20Code%201%20-%20How%20Claude%20Code%20Works.md)

**下一篇 →** [#3：Agent 设计方法论](./Claude%20Code%203%20-%20Agent%20Architecture.md)：子 Agent、Git Worktree 并行、经济学科研自动化实战。
