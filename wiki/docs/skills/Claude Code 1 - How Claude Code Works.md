---
title: "#1：Claude Code 工作原理"
tags:
  - skills/claude-code
order: 1
description: 理解 Claude Code 的机制。
---
在开始阅读本系列之前，可以先了解一下Claude Code 的基本介绍。
> **入门指南**：[[Basic Skill 3.5 - Claude Code|Basic Skill 3.5：Claude Code 配置指南]]
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> 了解工具的人使用工具，了解原理的人驾驭工具。  

---

## 一、Agentic Loop：Claude Code 的运行逻辑

Claude Code 和 ChatGPT 网页版最本质的区别不是"它能访问文件"——而是它运行在一个 **Agentic Loop**（智能体循环）中。普通聊天机器人收到消息后生成一段文本就结束了；Claude Code 收到消息后会**持续行动**，直到任务完成或需要你确认。

### 1.1 三阶段循环

每一轮循环由三个阶段组成：

```
┌─────────────────────────────────────────────────────────┐
│                    AGENTIC LOOP                         │
│                                                         │
│   ┌───────────────┐                                     │
│   │  1. GATHER    │  收集上下文                          │
│   │  (Read/Grep/  │  → 读文件、搜代码、查目录结构        │
│   │   Glob/Bash)  │                                     │
│   └──────┬────────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌───────────────┐                                     │
│   │  2. ACT       │  执行操作                           │
│   │  (Edit/Write/ │  → 修改代码、创建文件、运行命令      │
│   │   Bash)       │                                     │
│   └──────┬────────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌───────────────┐                                     │
│   │  3. VERIFY    │  验证结果                           │
│   │  (Bash/Read/  │  → 运行测试、检查输出、确认正确性    │
│   │   Grep)       │                                     │
│   └──────┬────────┘                                     │
│          │                                              │
│          ├─── 任务完成？─── 是 ──→ 返回结果给用户        │
│          │                                              │
│          └─── 否 ──→ 回到 GATHER（继续下一轮循环）       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**关键洞察**：Claude 并不是"一次性想好所有步骤然后执行"。它在每一步之后都会根据**实际观察到的结果**决定下一步做什么。这意味着它能处理意外情况——比如运行测试后发现新的报错，它会自动去修复。

### 1.2 与聊天机器人的本质区别

```
聊天机器人（ChatGPT 网页版等）：

  用户提问 ──→ 模型思考 ──→ 生成文本 ──→ 结束
                              │
                         纯文本输出
                      （你需要自己复制粘贴、执行）


Claude Code（Agentic Loop）：

  用户提问 ──→ 模型思考 ──→ 调用工具 ──→ 观察结果 ──→ 模型思考 ──→ ...
                              │              │
                         真实操作          真实反馈
                    （读写文件、运行命令）  （工具执行的返回值）
```

| 维度 | 聊天机器人 | Claude Code |
|---|---|---|
| 输出 | 纯文本 | 文本 + 工具调用 |
| 对代码库的了解 | 你粘贴多少它看多少 | 主动搜索和读取 |
| 执行能力 | 无（只给建议） | 直接修改文件、运行命令 |
| 循环能力 | 单轮生成 | 多轮循环直到完成 |
| 错误处理 | 无法感知真实错误 | 观察错误 → 自动修复 |

### 1.3 Claude 如何选择工具

Claude Code 在每一步中面临一个核心决策：**接下来应该调用哪个工具？** 这个决策不是基于硬编码规则，而是大语言模型根据当前上下文"推理"出来的。可以用以下启发式理解它的决策过程：

```
用户说："帮我修复 regression.py 中的 bug"

Claude 的内部推理链（简化）：
├── 我需要先看 regression.py 的内容 → 选择 Read 工具
│   └── 读取结果：发现第 42 行有个 NameError
├── 我需要理解 clean_data 函数从哪里来 → 选择 Grep 搜索
│   └── 搜索结果：定义在 utils/preprocessing.py
├── 我需要看 preprocessing.py → 选择 Read 工具
│   └── 读取结果：函数签名是 clean_data(df, columns)
├── 现在我知道怎么修了 → 选择 Edit 工具修改 regression.py
│   └── 修改结果：成功
└── 我应该验证修复是否有效 → 选择 Bash 运行 python regression.py
    └── 运行结果：测试通过 ✓
```

### 1.4 案例："修复失败的单元测试"

假设你正在做一个面板数据分析项目，测试突然挂了。你输入：

```
帮我修复 tests/ 下所有失败的测试
```

Claude Code 的 Agentic Loop 会这样展开：

```
Round 1 — GATHER
  ├── Bash: python -m pytest tests/ --tb=short 2>&1
  └── 观察: 3 个测试失败，报错信息如下...

Round 2 — GATHER + ACT
  ├── Read: tests/test_panel_regression.py（失败的测试文件）
  ├── Read: src/panel_regression.py（被测模块）
  ├── Grep: 搜索 "fixed_effects" 在整个项目中的用法
  └── Edit: 修改 src/panel_regression.py 第 87 行

Round 3 — VERIFY
  ├── Bash: python -m pytest tests/test_panel_regression.py -v
  └── 观察: 1 个测试通过，2 个仍然失败

Round 4 — GATHER + ACT
  ├── Read: tests/test_iv_estimation.py
  ├── Edit: 修改 src/iv_estimation.py
  └── Edit: 修改 tests/test_iv_estimation.py（测试本身有 typo）

Round 5 — VERIFY
  ├── Bash: python -m pytest tests/ -v
  └── 观察: 全部 12 个测试通过 ✓

→ 返回给用户: "已修复 3 个失败的测试，主要问题是..."
```

### 1.5 动手练习

> **场景**：你有一个 Stata `.do` 文件转写的 Python 面板回归脚本，运行时报错 `KeyError: 'year_fe'`。
>
> 尝试用 Claude Code 输入以下指令，观察它的 Agentic Loop：
> ```
> 运行 python src/panel_reg.py 然后修复所有报错，直到它能正常输出回归结果
> ```
> 观察点：
> 1. Claude 是否先运行了脚本来查看错误？
> 2. 它是否读取了相关文件来理解上下文？
> 3. 修复后它是否自动重新运行来验证？
> 4. 总共经历了几轮循环？

---

## 二、内置工具详解

Claude Code 的全部能力来自它可以调用的工具（Tools）。理解每个工具的用途和权限，是高效使用 Claude Code 的基础。

### 2.1 核心文件工具

#### Read — 读取文件

```
功能：读取文件内容并返回给 Claude
权限：✅ 自动批准（无需用户确认）
典型场景：查看源代码、读取配置文件、检查数据文件前几行

示例调用：
  Read("src/regression.py")
  → 返回文件完整内容

  Read("data/sample.csv", offset=0, limit=20)
  → 返回文件前 20 行（大文件时有用）
```

Read 是 Claude 最常用的工具之一。在任何修改操作之前，Claude 几乎总是先 Read 目标文件。这保证了它不会"盲改"。

#### Write — 创建/覆盖文件

```
功能：将内容写入文件（如果文件已存在则覆盖）
权限：⚠️ 需要用户确认（首次；之后同类操作可自动批准）
典型场景：创建新的脚本文件、生成配置文件

示例调用：
  Write("output/regression_results.tex", content="\\begin{table}...")
  → 创建一个 LaTeX 表格文件
```

**注意**：Write 是全量覆盖，不是增量编辑。如果你只想改文件中的几行，Claude 会用 Edit 而不是 Write。

#### Edit — 精确编辑

```
功能：对文件进行精确的字符串替换（查找旧文本 → 替换为新文本）
权限：⚠️ 需要用户确认
典型场景：修改一个函数、修复一行 bug、更新一个变量名

示例调用：
  Edit("src/regression.py",
       old_string="ols_result = sm.OLS(y, X)",
       new_string="ols_result = sm.OLS(y, sm.add_constant(X))")
  → 精确替换一行代码
```

Edit 是 Claude Code 最精确的修改工具。它通过**唯一匹配字符串**定位修改位置，不依赖行号（因为行号可能因之前的修改而偏移）。

### 2.2 搜索工具

#### Glob — 文件名搜索

```
功能：按文件名模式搜索项目中的文件
权限：✅ 自动批准
典型场景：找到所有 Python 文件、找某个特定文件的位置

示例调用：
  Glob("**/*.py")
  → 列出所有 Python 文件

  Glob("**/test_*.py")
  → 列出所有测试文件

  Glob("**/data/**/*.csv")
  → 列出 data 目录下所有 CSV 文件
```

#### Grep — 内容搜索

```
功能：在文件内容中搜索正则表达式
权限：✅ 自动批准
典型场景：找某个函数的定义、搜索某个变量的所有用法

示例调用：
  Grep("fixed_effects", glob="**/*.py")
  → 在所有 Python 文件中搜索 "fixed_effects"

  Grep("def clean_data", glob="src/**/*.py")
  → 在 src 目录下找 clean_data 函数的定义
```

### 2.3 执行工具

#### Bash — 运行终端命令

```
功能：在 Shell 中执行任意命令
权限：⚠️ 需要用户确认（可通过 allowlist 配置自动批准）
典型场景：运行脚本、安装依赖、执行 git 操作、查看系统信息

示例调用：
  Bash("python -m pytest tests/ -v")
  → 运行测试套件

  Bash("pip install linearmodels")
  → 安装面板数据回归包

  Bash("wc -l data/*.csv")
  → 统计数据文件行数
```

Bash 是最强大也最危险的工具——它能做任何终端能做的事。因此默认需要确认。在 `CLAUDE.md` 中你可以配置 `allowlist` 来自动批准安全命令。

### 2.4 子代理工具

#### Agent（Subagent）— 委派子任务

```
功能：启动一个独立的子 Agent 处理特定任务
权限：✅ 自动批准（子 Agent 本身只有只读权限）
典型场景：并行搜索、探索代码库、独立分析

示例调用：
  Agent("分析 data/ 目录下所有 CSV 文件的列名和行数")
  → 子 Agent 独立完成任务后返回结果

  Agent("在 src/ 目录中找到所有使用 statsmodels 的文件")
  → 子 Agent 搜索并汇总
```

子 Agent 的关键特性：
- **只读权限**：子 Agent 不能修改文件或运行危险命令
- **独立上下文**：子 Agent 有自己的上下文窗口，不占用主对话空间
- **并行执行**：多个子 Agent 可以同时工作
- **默认使用 Haiku**：成本更低，速度更快

### 2.5 Web 工具

#### WebSearch — 网络搜索

```
功能：搜索互联网获取实时信息
权限：✅ 自动批准
典型场景：查找 API 文档、搜索错误信息的解决方案

示例调用：
  WebSearch("statsmodels PanelOLS fixed effects syntax 2026")
  → 返回搜索结果摘要和相关 URL
```

#### WebFetch — 抓取网页

```
功能：获取指定 URL 的内容并转为 Markdown
权限：⚠️ 需要用户确认
典型场景：读取文档页面、查看 GitHub issue 内容

示例调用：
  WebFetch("https://www.statsmodels.org/stable/api.html")
  → 返回该页面的 Markdown 内容
```

### 2.6 代码智能工具

在支持 Language Server Protocol（LSP）的 IDE 集成环境中，Claude Code 还可以使用：

- **Goto Definition**：跳转到函数/类的定义处
- **Find References**：查找某个符号的所有引用
- **Type Checking**：获取类型检查的诊断信息（如 mypy、pyright 错误）

这些工具依赖 IDE 的语言服务器，在纯终端模式下不可用。

### 2.7 工具权限总览

```
┌──────────────────────────────────────────────────────────────────┐
│                      工具权限模型                                │
├──────────────┬───────────┬──────────────────────────────────────┤
│ 工具         │ 权限级别  │ 说明                                 │
├──────────────┼───────────┼──────────────────────────────────────┤
│ Read         │ ✅ 自动   │ 只读操作，安全                       │
│ Glob         │ ✅ 自动   │ 只读操作，安全                       │
│ Grep         │ ✅ 自动   │ 只读操作，安全                       │
│ Agent        │ ✅ 自动   │ 子 Agent 只有只读权限                │
│ WebSearch    │ ✅ 自动   │ 只读操作                             │
├──────────────┼───────────┼──────────────────────────────────────┤
│ Edit         │ ⚠️ 确认  │ 修改文件，需要用户审批               │
│ Write        │ ⚠️ 确认  │ 创建/覆盖文件                       │
│ Bash         │ ⚠️ 确认  │ 执行命令（可通过 allowlist 自动批准）│
│ WebFetch     │ ⚠️ 确认  │ 访问外部 URL                        │
├──────────────┼───────────┼──────────────────────────────────────┤
│ IDE 工具     │ ✅ 自动   │ 仅在 IDE 集成模式下可用              │
└──────────────┴───────────┴──────────────────────────────────────┘

操作权限升级路径：
  首次 ──→ 弹出确认 ──→ 用户批准
                         ├── "允许本次" → 仅本次自动
                         ├── "允许本会话" → 本会话内自动
                         └── "始终允许" → 写入配置，永久自动
```

### 2.8 动手练习

> **场景**：你刚拿到一个同事的 Python 项目，里面有 50+ 个文件，你不知道项目结构。
>
> 试试这几个指令，体会不同工具的作用：
> ```
> 1. "列出这个项目的文件结构"     → 观察 Claude 使用 Glob + Bash(tree)
> 2. "找到所有用了 pandas 的文件"  → 观察 Claude 使用 Grep
> 3. "这个项目是做什么的？"        → 观察 Claude 使用 Read(README) + Glob + Grep
> ```
> 思考：如果你手动完成同样的任务，需要输入多少命令？

---

## 三、模型层：Sonnet / Opus / Haiku

Claude Code 背后的大语言模型有多个版本可选。选对模型直接影响**速度、质量和成本**。

### 3.1 三个模型的定位

```
                    推理深度
                      ▲
                      │
              Opus ●  │  ← 最强推理，最贵
                      │     适合：复杂架构设计、论文逻辑推导
                      │
           Sonnet ●   │  ← 日常主力，性价比最优
                      │     适合：90% 的编程任务
                      │
            Haiku ●   │  ← 轻量快速，最便宜
                      │     适合：搜索、分类、简单修改
                      │
                      └──────────────────────→ 速度 / 成本效率
```

| 模型 | 定位 | 输入价格 | 输出价格 | 上下文窗口 | 典型用途 |
|---|---|---|---|---|---|
| **Claude Haiku 3.5** | 轻量快速 | $0.80/M tokens | $4/M tokens | 200K | 子 Agent、搜索、分类 |
| **Claude Sonnet 4** | 日常主力 | $3/M tokens | $15/M tokens | 200K | 编码、调试、重构 |
| **Claude Opus 4** | 深度推理 | $15/M tokens | USD75/M tokens | 200K | 架构设计、复杂推理 |

> 价格来源：[Anthropic 官方定价](https://docs.anthropic.com/en/docs/about-claude/pricing)。  
> M tokens = 百万 token。输入和输出价格不同——输出远比输入贵。

### 3.2 模型切换：`/model` 命令

在 Claude Code 会话中随时切换：

```bash
/model                    # 打开模型选择菜单
/model sonnet             # 直接切换到 Sonnet
/model opus               # 切换到 Opus
/model haiku              # 切换到 Haiku
```

切换后当前会话立即生效，之前的对话历史不会丢失。

### 3.3 经济学场景的模型选择策略

| 任务类型 | 推荐模型 | 理由 |
|---|---|---|
| 搜索项目中的变量定义 | Haiku | 简单检索，不需要深度推理 |
| 写一个 OLS 回归脚本 | Sonnet | 标准编码任务，Sonnet 足够 |
| 调试面板数据估计器 | Sonnet | 需要理解代码逻辑但不极端复杂 |
| 设计 DSGE 模型求解框架 | Opus | 涉及复杂数学和架构决策 |
| 重构整个数据 pipeline | Opus | 需要同时理解多个模块的关系 |
| 生成 LaTeX 表格 | Sonnet | 格式化任务，Sonnet 绰绰有余 |
| 批量重命名变量 | Haiku | 机械性操作，Haiku 又快又便宜 |
| 论文写作辅助（经济学直觉） | Opus | 需要理解经济学概念和论证逻辑 |

**经验法则**：日常开发用 Sonnet（占 90% 的时间），遇到需要"想一想"的问题切 Opus，简单搜索或子任务用 Haiku。

### 3.4 Extended Thinking（扩展思考）

Opus 和 Sonnet 支持 Extended Thinking——让模型在回答之前进行更长的"内部推理"。这类似于人类面对复杂问题时"先想一想再动手"。

```bash
# 设置思考预算（token 数量）
export CLAUDE_CODE_MAX_THINKING_TOKENS=50000

# 或在 Claude Code 设置中调整
/config
```

Extended Thinking 的 token 同样消耗费用，但输出质量显著提升。推荐在以下场景开启：
- 多步推理问题（如"为什么这个 IV 估计结果不一致？"）
- 需要同时考虑多个约束的设计问题
- 调试长而复杂的错误链

### 3.5 动手练习

> **场景**：你在做一个宏观经济数据项目。
>
> 1. 用 `/model haiku` 让 Claude 搜索所有 `.csv` 文件并统计行数——体会 Haiku 的速度
> 2. 用 `/model sonnet` 让 Claude 写一个面板回归脚本——体会 Sonnet 的编码能力
> 3. 用 `/model opus` 问 Claude："这个 DSGE 模型的稳态求解应该怎么设计？"——体会 Opus 的推理深度
> 4. 用 `/cost` 查看三个任务分别花了多少 token

---

## 四、上下文窗口深度机制

上下文窗口是 Claude 的"工作记忆"。理解它的构成和限制，是避免 Claude "忘记" 你之前说过的话的关键。

### 4.1 200K Token 的构成

Claude Code 的上下文窗口约 200K token（≈ 15 万英文单词 ≈ 500 页书）。但这 200K 并不是全给你的对话用的——系统层面的内容会预先占用一部分：

```
200K Token 上下文窗口
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ System Prompt（系统提示词）   ~18K tokens  │  │ ← Anthropic 内置，不可修改
│  │  - 工具定义和使用说明                      │  │
│  │  - 安全规则和行为准则                      │  │
│  │  - 输出格式要求                            │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ CLAUDE.md 内容            可变（0~10K+）   │  │ ← 你的项目指令文件
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ .claude/rules/ 规则文件   可变（0~5K）     │  │ ← 额外规则文件
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Auto Memory (MEMORY.md)   前 200 行       │  │ ← 自动学习的记忆
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │  对话内容 + 工具调用 + 工具输出            │  │ ← 随对话增长
│  │  （你说的话、Claude 的回复、                │  │
│  │    读取的文件内容、命令输出等）             │  │
│  │                                           │  │
│  │  ████████████████████░░░░░░░░░░░░░░░░░░░  │  │
│  │  ← 已使用 ─────────→← 剩余可用空间 ─→    │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.2 各组成部分详解

| 组成 | 大小 | 来源 | 特点 |
|---|---|---|---|
| System Prompt | ~18K tokens | Anthropic 内置 | 不可修改，每次都加载 |
| CLAUDE.md | 可变 | 项目根目录 | 随项目自定义，Compact 后从磁盘重载 |
| .claude/rules/ | 可变 | 规则目录 | 可针对文件类型定义不同规则 |
| Auto Memory | ~前 200 行 | ~/.claude/MEMORY.md | 跨会话持久，自动学习 |
| 对话 + 工具输出 | 持续增长 | 当前会话 | **最大的空间消耗者** |

**重要发现**：一次 `Read` 一个大文件（比如 2000 行的 Python 脚本）可能就消耗 5K~10K token。一次 `Bash` 命令的输出（比如完整的测试报告）可能消耗 3K~8K token。这意味着你可能在 10-20 轮对话后就接近上下文上限了。

### 4.3 上下文满了会怎样

当上下文接近上限时，Claude Code 会自动触发 **Compaction**（压缩）。在此之前你会看到警告提示：

```
⚠️ Context window is 85% full. Consider using /compact to free up space.
```

如果放任不管，Claude 会在接近 100% 时自动压缩——但被动压缩的时机可能不理想，最好主动管理。

### 4.4 检查上下文使用：`/context` 命令

```bash
/context

# 输出示例：
# Context usage: 124,532 / 200,000 tokens (62%)
# ├── System prompt: 18,241 tokens
# ├── CLAUDE.md: 3,422 tokens
# ├── Rules: 1,205 tokens
# ├── Memory: 892 tokens
# └── Conversation: 100,772 tokens
```

你也可以在 `CLAUDE.md` 中配置状态栏来持续显示上下文使用率：

```markdown
# CLAUDE.md 中添加
Status bar should show: context usage percentage
```

### 4.5 上下文管理的经济学思维

把上下文窗口想象成你桌子上的空间——桌面有限，不可能把所有材料都铺开。高效使用的关键是：

1. **只加载需要的文件**：不要说"读取 src/ 下所有文件"，而要说"读取与回归分析相关的文件"
2. **及时清理**：完成一个子任务后用 `/compact` 释放空间
3. **利用子 Agent**：让子 Agent 去搜索和汇总，只把结论返回主对话

### 4.6 动手练习

> **场景**：你在一个大型数据项目中（50+ Python 文件），需要做一系列修改。
>
> 1. 开始一个新会话，立即用 `/context` 查看初始上下文占用
> 2. 让 Claude 读取 3-5 个文件，再用 `/context` 查看——注意增长了多少
> 3. 让 Claude 运行一个输出很长的命令（如 `pip list`），再查看上下文
> 4. 思考：如果你需要在这个会话中完成 20 个修改，上下文够用吗？

---

## 五、Compaction 机制

Compaction（压缩）是 Claude Code 管理有限上下文窗口的核心机制。理解它的原理和策略，直接影响你的工作效率。

### 5.1 什么是 Compaction

当上下文窗口接近满时，Claude Code 会将整个对话历史"压缩"成一份精练的摘要，然后用这份摘要替代原始历史继续工作。

```
压缩前：
┌──────────────────────────────────────┐
│ System Prompt (18K)                  │
│ CLAUDE.md (3K)                       │
│ 第1轮对话 + 工具输出 (12K)           │
│ 第2轮对话 + 工具输出 (15K)           │
│ 第3轮对话 + 工具输出 (20K)           │
│ ...                                  │
│ 第15轮对话 + 工具输出 (18K)          │
│ ─────────────────────                │
│ 已用: 180K / 200K                    │
└──────────────────────────────────────┘

                │ /compact
                ▼

压缩后：
┌──────────────────────────────────────┐
│ System Prompt (18K)  ← 从系统重新加载│
│ CLAUDE.md (3K)       ← 从磁盘重新加载│
│ 压缩摘要 (8K~15K)   ← 15轮→一段摘要 │
│ ─────────────────────                │
│ 已用: ~30K / 200K                    │
│ 释放: ~150K 可用空间                 │
└──────────────────────────────────────┘
```

### 5.2 自动 vs 手动 Compaction

| 类型 | 触发条件 | 特点 |
|---|---|---|
| 自动压缩 | 上下文使用超过阈值（~95%） | 时机不可控，可能在关键操作中间触发 |
| 手动 `/compact` | 用户主动输入命令 | 可选择最佳时机，可指定 focus |

### 5.3 `/compact` 的高级用法

```bash
# 基本压缩
/compact

# 带焦点参数的压缩 — 告诉 Claude 摘要时重点保留什么
/compact focus on the panel regression changes
/compact 重点保留 API 接口的修改
/compact focus on the IV estimation bug fix

# 带焦点参数能显著提高压缩质量——Claude 知道哪些信息对你后续工作最重要
```

### 5.4 Compaction 保留与丢弃什么

**保留**：
- 当前任务的目标和进展
- 已完成的关键修改
- 尚未解决的问题
- 你指定的 focus 内容

**可能丢失**：
- 中间过程的详细工具输出（如完整的测试日志）
- 早期对话中的细节（如你开头提到的一个偏好）
- 具体的代码行号和精确内容

### 5.5 战略性 Compaction

高级用户会**禁用自动压缩**，改为在逻辑断点处手动压缩：

```bash
# 在 Claude Code 设置中禁用自动压缩
claude config set autoCompact false
```

推荐的压缩时机：

```
任务 A（修复回归测试）
  ├── 多轮对话...
  ├── 任务完成 ✓
  └── → /compact focus on regression test fixes    ← 在这里压缩

任务 B（重构数据清洗 pipeline）
  ├── 多轮对话...
  ├── 任务完成 ✓
  └── → /compact focus on data pipeline refactor   ← 在这里压缩

任务 C（添加 IV 估计功能）
  ├── 继续工作...
```

### 5.6 CLAUDE.md 中的 Compact Instructions

你可以在 `CLAUDE.md` 中添加 `Compact Instructions` 部分，指导 Claude 在压缩时始终保留某些信息：

```markdown
# CLAUDE.md

## Compact Instructions
在压缩对话历史时，始终保留以下信息：
- 当前正在修改的文件列表及修改目的
- 数据集的列名定义和含义
- 回归模型的变量选择依据
- 尚未完成的 TODO 事项
```

### 5.7 `/rewind` 与部分压缩

`/compact` 压缩的是全部历史。如果你只想回退到某个中间点并从那里重新开始，可以用 `/rewind`：

```bash
/rewind
# 弹出菜单，显示对话中的各个节点
# 选择一个节点后，该节点之后的所有对话将被移除
# 你可以从那个节点重新开始（比如尝试不同的解决方案）
```

这类似于 git 的 `reset --soft`——不是压缩信息，而是"回到过去的某个时刻"。

### 5.8 动手练习

> **场景**：你在一个长会话中先后完成了三个任务——数据清洗、回归分析和结果可视化。
>
> 1. 在完成数据清洗后，用 `/compact focus on data cleaning pipeline` 压缩
> 2. 查看 `/context`——压缩释放了多少空间？
> 3. 继续做回归分析，完成后再 `/compact focus on regression specification`
> 4. 比较：如果不压缩，你能在一个会话中完成三个任务吗？

---

## 六、Token 经济学

使用 Claude Code 不是免费的——理解 token 的消耗模式和成本优化策略，能帮你在预算范围内最大化产出。

### 6.1 Token 定价回顾

<table>
  <thead>
    <tr>
      <th>模型</th>
      <th>输入 (USD/M tokens)</th>
      <th>输出 (USD/M tokens)</th>
      <th>缓存写入</th>
      <th>缓存读取</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Haiku 3.5</td>
      <td>0.80</td>
      <td>4.00</td>
      <td>1.00</td>
      <td>0.08</td>
    </tr>
    <tr>
      <td>Sonnet 4</td>
      <td>3.00</td>
      <td>15.00</td>
      <td>3.75</td>
      <td>0.30</td>
    </tr>
    <tr>
      <td>Opus 4</td>
      <td>15.00</td>
      <td>75.00</td>
      <td>18.75</td>
      <td>1.50</td>
    </tr>
  </tbody>
</table>

> 来源：[Anthropic Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)

注意两个关键点：
1. **输出比输入贵 5 倍**：Claude 的回复和思考过程消耗更多
2. **缓存读取极便宜**：重复的上下文（如 System Prompt）可以缓存，只需 1/10 成本

### 6.2 一个典型会话的 Token 消耗

假设你让 Claude 修复一个面板回归脚本中的 bug，整个过程大约这样：

```
会话 Token 消耗分解
──────────────────────────────────────────────────
步骤                          输入 token  输出 token
──────────────────────────────────────────────────
系统提示（缓存）                18,000        0
CLAUDE.md（缓存）                3,000        0
Round 1: 你的指令                  200      500
Round 1: Read regression.py     2,400      100
Round 1: Claude 分析             2,500    1,200
Round 2: Grep 搜索相关函数         300      800
Round 2: Read utils.py           1,500      100
Round 2: Edit regression.py        300      600
Round 3: Bash 运行测试              200    1,500
Round 3: Claude 总结               500      800
──────────────────────────────────────────────────
合计（本次）                   ~28,900   ~5,600
系统提示缓存命中                18,000        0
──────────────────────────────────────────────────

费用估算（Sonnet）：
  输入：(28,900 - 18,000) × $3/M + 18,000 × $0.30/M
       = $0.033 + $0.0054 = ~$0.038
  输出：5,600 × $15/M = ~$0.084
  总计：~$0.12（约 ¥0.87）
```

**一次修 bug 大约花 1 块钱人民币**。看起来不多，但一天如果做 50 次这样的交互，就是 50 块钱。

### 6.3 月成本估算

| 使用模式 | 日均交互次数 | 主要模型 | 月成本估算 |
|---|---|---|---|
| 轻度（偶尔用） | 10-20 次 | Sonnet | $5-15/月 |
| 中度（日常开发） | 30-50 次 | Sonnet | $15-40/月 |
| 重度（全天候） | 80-150 次 | Sonnet + Opus | $50-120/月 |
| 极重度（多项目） | 200+ 次 | 混合 | $120+/月 |

如果你用的是 Claude Max 订阅（$100/月或 $200/月），则不按 token 计费，而是按消息数限制。对于重度用户通常更划算。

### 6.4 成本优化策略

#### 策略 1：善用子 Agent

```
昂贵做法：
  你 → "搜索所有文件，找到使用 deprecated API 的地方"
  → Claude (Sonnet) 调用 20 次 Grep，所有结果加载到主上下文

省钱做法：
  你 → "搜索所有文件，找到使用 deprecated API 的地方"
  → Claude 启动子 Agent (Haiku) 去搜索
  → 子 Agent 独立完成搜索，只返回精练的结论
  → 节省主上下文空间 + 用更便宜的模型完成搜索
```

#### 策略 2：模块化代码库

```
大文件（3000 行的 main.py）：
  → Claude 每次都需要读取大量代码 → token 消耗高
  → 每次修改后的验证也需要重新理解整个文件

模块化文件（10 个 300 行文件）：
  → Claude 只需读取相关模块 → token 消耗低
  → 修改范围更小，验证更快
```

这也是为什么 Claude Code 官方最佳实践建议保持 [模块化的代码结构](https://code.claude.com/docs/en/best-practices)。

#### 策略 3：精确的指令

```
模糊指令（消耗多）：
  "看看这个项目有什么问题"
  → Claude 需要大量探索，读很多文件，做很多搜索

精确指令（消耗少）：
  "src/regression.py 第 42 行的 NameError，应该是导入缺失，请修复"
  → Claude 直接定位问题，最少的工具调用
```

#### 策略 4：用 CLI 工具替代 MCP

MCP（Model Context Protocol）工具会在每次调用时把工具定义加载到上下文——如果你有 50 个 MCP 工具，光定义就可能消耗 10K+ token。对于常用操作，直接用 CLI 命令更省 token。

### 6.5 动手练习

> **场景**：你有一笔 $30/月的 API 预算，需要用 Claude Code 完成以下任务：
>
> - 每周整理 5 份经济数据 CSV（数据清洗脚本）
> - 每周跑 3 个回归分析
> - 每月写 1 份研究报告的代码部分
>
> 用 `/cost` 追踪几次典型操作的花费，估算你的月度预算是否够用。
> 如果不够，思考哪些策略可以降低成本。

---

## 七、Checkpoint 与 Session 机制

Claude Code 会在每次文件修改前自动保存快照，确保你永远不会因为 AI 的错误修改而丢失代码。

### 7.1 Checkpoint（检查点）

每当 Claude Code 要修改文件时，它会先保存一个 Checkpoint——该文件修改前的完整副本。

```
Checkpoint 工作流：

  Claude 准备修改 regression.py
  ├── 1. 保存 regression.py 当前内容为 Checkpoint
  ├── 2. 执行修改
  └── 3. 如果你不满意 → 可以恢复到 Checkpoint

  时间线：
  ─────●──────────●──────────●──────────●───→
       │          │          │          │
    Checkpoint  Checkpoint  Checkpoint  当前状态
    (v1)        (v2)        (v3)
```

恢复方式：

```bash
# 方式 1：快速撤销（按两次 Esc）
Esc + Esc
# 撤销最近一次修改，恢复到上一个 Checkpoint

# 方式 2：选择性恢复
/rewind
# 弹出菜单，列出所有 Checkpoint，选择要恢复到哪个点
```

Checkpoint 独立于 git——即使你没有 commit，Claude 的修改也能被撤销。这是一个额外的安全网。

### 7.2 Session（会话）

每次启动 `claude` 命令都开始一个新的 Session。Session 之间默认是独立的——新 Session 看不到旧 Session 的对话内容。

```
Session 隔离模型：

  Session A（上午）                 Session B（下午）
  ┌─────────────────┐              ┌─────────────────┐
  │ 上下文：任务 A   │              │ 上下文：全新     │
  │ "修复回归 bug"   │              │ 看不到任务 A     │
  │                  │              │ "添加 IV 估计"   │
  └─────────────────┘              └─────────────────┘
          独立                              独立
```

### 7.3 Session 管理命令

```bash
# 继续上一个会话（最近一次）
claude --continue
claude -c

# 恢复特定会话（弹出选择菜单）
claude --resume
claude -r

# 从现有会话分叉（复制上下文，创建新分支）
claude --fork-session <session-id>

# 重命名当前会话（方便日后查找）
/rename "面板回归 debug 会话"
/rename "DSGE 模型开发"
```

### 7.4 `--continue` vs `--resume` vs `--fork-session`

```
                    --continue          --resume            --fork-session
                    ──────────          --------            ──────────────
作用              继续最近一次会话    从列表选择会话       复制会话并分叉

上下文            完全恢复            完全恢复            复制后独立

适用场景          中断后继续          回到特定旧会话      想尝试不同方案

类比              git stash pop       git checkout <branch>  git branch <new>
```

### 7.5 Git Worktree + Session = 并行工作流

这是 Claude Code 最强大的工作模式之一——用 git worktree 创建隔离的工作目录，每个 worktree 运行一个独立的 Claude Code Session：

```
项目根目录
├── main/                          ← 主目录
│   └── claude session: 数据清洗
│
├── .worktrees/
│   ├── feature-iv/                ← worktree 1
│   │   └── claude session: IV估计开发
│   │
│   └── feature-viz/               ← worktree 2
│       └── claude session: 可视化开发

三个 Claude 实例同时工作，互不干扰！
```

```bash
# 创建命名 worktree（Claude Code 内置支持）
claude --worktree feature-iv
claude -w feature-viz

# 每个 worktree 有自己的文件系统、自己的 git 分支、自己的 Claude 会话
# 完成后合并回主分支
```

> 详细的并行工作流教程见第 3 章。

### 7.6 动手练习

> **场景**：你要为论文实现两种不同的估计方法（OLS 和 IV），但不确定哪个更好。
>
> 1. 启动一个会话，让 Claude 实现 OLS 版本
> 2. 用 `/rename "OLS 实现"` 命名会话
> 3. 启动新会话（或用 `--fork-session`），让 Claude 实现 IV 版本
> 4. 用 `/rename "IV 实现"` 命名
> 5. 用 `claude --resume` 切换回 OLS 会话，继续调优
> 6. 比较两个版本的结果

---

## 八、小结

本章深入解析了 Claude Code 的核心工作原理。以下是关键概念总览：

| 概念 | 核心要点 |
|---|---|
| **Agentic Loop** | 三阶段循环：收集上下文 → 执行操作 → 验证结果，循环直到任务完成 |
| **内置工具** | 7 大核心工具 + Web 工具 + IDE 工具，分自动批准和需确认两类 |
| **模型选择** | Haiku（搜索）、Sonnet（日常编码 90%）、Opus（深度推理），用 `/model` 切换 |
| **上下文窗口** | 200K token 总量，System Prompt + CLAUDE.md + 对话共享，用 `/context` 查看 |
| **Compaction** | 压缩对话历史释放空间，`/compact focus on X` 保留重点信息 |
| **Token 经济学** | 输出比输入贵 5 倍；子 Agent、模块化代码、精确指令可显著降低成本 |
| **Checkpoint** | 每次修改前自动保存快照，`Esc+Esc` 或 `/rewind` 恢复 |
| **Session** | 独立上下文，`--continue`/`--resume`/`--fork-session` 管理多会话 |

### 进阶阅读

- [Claude Code 官方文档：How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works)
- [Claude Code 最佳实践](https://code.claude.com/docs/en/best-practices)
- [Claude Code 成本管理](https://code.claude.com/docs/en/costs)
- [Claude Code Checkpoint 机制](https://code.claude.com/docs/en/checkpointing)
- [Anthropic 模型定价](https://docs.anthropic.com/en/docs/about-claude/pricing)

---

> **下一篇**：[[Claude Code 2 - Configuration Deep Dive|#2：Claude Code 配置方法]]
