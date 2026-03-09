---
title: "Basic Skill #3.5：Claude Code 从入门到多智能体协作"
tags:
  - skills/basic
order: 5
description: 掌握 Claude Code 的安装配置、换源、VS Code 集成与多 Agent 工作流，用 AI 加速科研编程。
---

> Claude Code 不是聊天机器人——它是一个能**自主读写文件、执行命令、搜索代码库**的 AI Agent。你描述目标，它规划并执行。

当你在 ChatGPT 或 Claude 网页版里粘贴代码让 AI 帮你改，你还在做**人工搬运**。Claude Code 直接运行在你的终端里，它能看到你的整个项目、运行你的脚本、修改你的文件——就像一个坐在你旁边的 pair programmer。

---

## 一、Claude Code 是什么：基本原理

### 1.1 它做了什么

Claude Code 是 Anthropic 推出的**终端原生 AI 编程代理**。和网页版 Claude 最大的区别是——它能**直接操作你的计算机**：

```
传统方式（网页 ChatGPT / Claude）：
  你 → 复制代码 → 粘贴到网页 → AI 回答 → 复制回答 → 粘贴回编辑器
  （来回搬运，效率低，上下文有限）

Claude Code 方式：
  你 → 在终端描述需求 → Claude 自主探索代码库 → 修改文件 → 运行测试 → 报告结果
  （AI 直接操作项目，全自动）
```

### 1.2 它拥有的工具

Claude Code 能使用一组**内置工具**来完成任务：

| 工具 | 功能 | 类比 |
|---|---|---|
| `Read` | 读取文件内容 | `cat file.py` |
| `Write` | 创建或覆盖文件 | 写入新文件 |
| `Edit` | 精确修改文件中的某几行 | 编辑器中的查找替换 |
| `Bash` | 执行终端命令 | 在 Shell 里运行任何命令 |
| `Glob` | 按文件名模式搜索 | `find . -name "*.py"` |
| `Grep` | 在文件内容中搜索关键词 | `grep -r "import" .` |
| `Agent` | 启动子 Agent 执行独立任务 | 委派助手去做子任务 |

**关键理解**：Claude Code 不是"生成一段代码让你粘贴"。它实际**执行**这些工具——真的读了你的文件，真的运行了你的命令，真的改了你的代码。

### 1.3 上下文窗口机制

每次启动 Claude Code 都是一个**新的对话**。Claude 能"看到"的信息（上下文窗口）约 200K token，大约相当于一本 500 页的书。

```
上下文窗口（200K token）
┌──────────────────────────────────────────────────────┐
│  CLAUDE.md 项目指令                                   │ ← 每次启动自动加载
│  Auto Memory 记忆笔记                                 │ ← 每次启动自动加载
│  .claude/rules/ 规则文件                              │ ← 每次启动自动加载
│──────────────────────────────────────────────────────│
│  你的对话 + Claude 的思考 + 工具调用结果                │ ← 随对话增长
│  （读取的文件内容、命令输出等都会占用空间）             │
│──────────────────────────────────────────────────────│
│  剩余可用空间                                         │ ← 用完就需要 /compact
└──────────────────────────────────────────────────────┘
```

上下文满了怎么办？用 `/compact` 命令压缩历史对话，只保留关键信息。CLAUDE.md 的内容在压缩后会从磁盘重新加载，不会丢失。

---

## 二、安装与认证

### 2.1 安装

```bash
# macOS / Linux / WSL（推荐，自动更新）
curl -fsSL https://claude.ai/install.sh | bash

# macOS 用 Homebrew
brew install --cask claude-code

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Windows 用 winget
winget install Anthropic.ClaudeCode

# 验证安装
claude --version
```

### 2.2 认证

```bash
# 启动并登录
claude

# Claude Code 会引导你完成认证
# 支持以下方式：
# - Claude Pro/Max 订阅（推荐）
# - Anthropic API 密钥
# - 企业提供商（Amazon Bedrock, Google Vertex AI）
```

### 2.3 订阅方案

| 方案 | 价格 | 额度 | 适合谁 |
|---|---|---|---|
| Pro | $20/月 | 每 5 小时约 45 条消息 | 轻度使用、尝鲜 |
| Max 5x | $100/月 | 每 5 小时约 225 条消息 | 日常科研编程 |
| Max 20x | $200/月 | 每 5 小时约 900 条消息 | 重度使用、多项目并行 |
| API 按量 | 按 token 计费 | 无固定限制 | 精确控制成本 |

> API 按量计费参考：Sonnet 输入 $3/百万 token，输出 $15/百万 token。日均成本大约 $6。

### 2.4 首次运行：/init

```bash
cd ~/research/my-econ-project
claude

# 进入后运行
/init
```

`/init` 会自动分析你的项目结构，生成一份初始 `CLAUDE.md` 文件。这个文件告诉 Claude 你的项目是什么、怎么构建、有什么约定。

### 2.5 常用斜杠命令

| 命令 | 功能 |
|---|---|
| `/init` | 分析项目，生成初始 CLAUDE.md |
| `/model` | 切换 AI 模型（sonnet / opus / haiku） |
| `/compact` | 压缩对话历史，释放上下文空间 |
| `/cost` | 查看当前会话的 token 消耗 |
| `/clear` | 清空对话历史（在不同任务之间切换时用） |
| `/memory` | 查看和编辑加载的记忆文件 |
| `/agents` | 管理子 Agent |
| `/doctor` | 诊断安装和配置问题 |

---

## 三、换源：使用第三方 API

Claude Code 默认连接 Anthropic 官方 API。但你可以通过**环境变量**将请求转发到其他 API 提供商（如 OpenRouter），从而：

- 使用更便宜的中转节点
- 在官方 API 不可用时使用替代渠道
- 通过代理解决网络问题

### 3.1 直接连接 OpenRouter

[OpenRouter](https://openrouter.ai) 是一个 AI API 聚合平台，支持 400+ 模型：

```bash
# 设置环境变量（临时，当前终端会话有效）
export ANTHROPIC_BASE_URL="https://openrouter.ai/api/v1"
export ANTHROPIC_API_KEY="sk-or-你的OpenRouter密钥"

# 启动 Claude Code
claude
```

写入 `~/.zshrc` 永久生效：

```bash
# 在 ~/.zshrc 末尾添加
export ANTHROPIC_BASE_URL="https://openrouter.ai/api/v1"
export ANTHROPIC_API_KEY="sk-or-你的OpenRouter密钥"
```

### 3.2 使用代理服务器

如果你需要更多控制（如模型映射、日志记录），可以部署本地代理：

```bash
# 方案一：y-router（Docker，推荐）
# 在本地运行一个中转服务器，然后把 Claude Code 指向它
export ANTHROPIC_BASE_URL="http://localhost:8787"
export ANTHROPIC_AUTH_TOKEN="你的API密钥"
claude

# 方案二：claude-code-provider-proxy（Python/FastAPI）
# 支持 OpenAI 兼容的 API 格式转换
git clone https://github.com/ujisati/claude-code-provider-proxy
cd claude-code-provider-proxy
# 按 README 配置 .env 文件后运行
```

### 3.3 验证连接

```bash
# 启动 Claude Code 后检查
/cost     # 如果能正常显示 token 用量，说明连接成功
/model    # 查看可用模型
```

> **安全提醒**：API 密钥绝对不要写在 CLAUDE.md 或任何会被 Git 追踪的文件中。使用环境变量或 `.env`（并在 `.gitignore` 中排除）。

---

## 四、VS Code 插件与 Vibe Coding

除了终端 CLI，Claude Code 还有一个 **VS Code 扩展**，让你在编辑器中直接与 AI 协作。

### 4.1 安装

在 VS Code 中按 `Cmd+Shift+X`（macOS），搜索 **"Claude Code"**，安装 Anthropic 官方扩展。Cursor 用户同理。

### 4.2 CLI vs VS Code 插件

| 特性 | 终端 CLI | VS Code 插件 |
|---|---|---|
| 适合场景 | 键盘驱动、多任务、自动化 | 可视化开发、审查变更 |
| 变更展示 | 文字描述 | 内联 Diff（高亮增删） |
| 操作方式 | 纯文本输入 | 点击 Accept / Reject |
| Plan Mode | 文字输出计划 | 可视化计划，逐步编辑 |
| 资源消耗 | 较低 | 适中 |
| 多窗口 | 多终端标签 | 多工作区面板 |

### 4.3 Vibe Coding 工作流

"Vibe Coding"（氛围编程）是指你**用自然语言描述意图**，AI 自主探索代码库、规划方案、编写代码——你只需审查和确认。

```
Vibe Coding 流程：

  你："帮我写一个脚本，读取 data/ 目录下所有 CSV 文件，
       合并成一个 DataFrame，清洗缺失值，输出到 output/merged.csv"
      │
      ▼
  Claude Code 自动执行：
  1. 探索 data/ 目录，了解有哪些 CSV 文件
  2. 读取几个文件，了解数据结构
  3. 编写 Python 脚本（选择合适的 pandas 方法）
  4. 运行脚本，检查输出是否正确
  5. 报告完成，展示处理了多少行数据
      │
      ▼
  你：审查 Diff → Accept 或提出修改意见
```

### 4.4 Plan Mode

在 VS Code 插件中可以开启 **Plan Mode**：Claude 先提出修改计划，你审核通过后它才执行。

这对于重要的代码变更非常有用——你能在任何修改发生之前看到完整的方案。

---

## 五、Claude Code 的项目文件体系：让 AI 真正理解你的项目

这是 Claude Code 最核心也最容易被忽略的部分。**Claude Code 不是凭空生成代码的——它依赖一套文件体系来理解你的项目**。理解这套体系，是从"用 AI 写脚本"到"用 AI 驱动整个研究项目"的关键跨越。

### 5.1 全局视图：Claude Code 启动时读什么

当你在终端输入 `claude` 启动一个会话时，Claude Code 按以下顺序加载信息：

```
Claude Code 启动
    │
    ▼
① 加载 CLAUDE.md（项目指令）
    │ 从当前目录向上搜索，逐级加载每个 CLAUDE.md
    │ 还会加载 .claude/CLAUDE.md（如果存在）
    │
    ▼
② 加载 .claude/rules/*.md（规则文件）
    │ 无 paths 字段的 → 全部加载
    │ 有 paths 字段的 → 等访问匹配文件时按需加载
    │
    ▼
③ 加载 Auto Memory（自动记忆）
    │ ~/.claude/projects/<项目>/memory/MEMORY.md 的前 200 行
    │
    ▼
④ 加载 CLAUDE.local.md（个人本地指令，不进 Git）
    │
    ▼
⑤ 扫描 .claude/agents/*.md（自定义子 Agent）
    │ 只注册元数据（名称和描述），不加载全文
    │
    ▼
⑥ 扫描 .claude/skills/（技能包）
    │ 只注册元数据，等调用时才加载全文
    │
    ▼
⑦ 等待你的输入...
```

### 5.2 项目目录结构一览

```
my-research-project/
│
├── CLAUDE.md                 ← 项目主指令（团队共享，提交到 Git）
├── CLAUDE.local.md           ← 个人偏好（自动 gitignore）
│
├── .claude/                  ← Claude Code 配置目录
│   ├── CLAUDE.md             ← 等同于根目录 CLAUDE.md（二选一）
│   ├── settings.json         ← 项目级设置（hooks、权限等）
│   ├── settings.local.json   ← 个人本地设置（不进 Git）
│   ├── rules/                ← 规则文件目录
│   │   ├── code-style.md     ← 代码风格规则
│   │   ├── data-pipeline.md  ← 数据处理约定
│   │   └── stata-compat.md   ← Stata 兼容性说明
│   ├── agents/               ← 自定义子 Agent
│   │   ├── data-cleaner.md   ← 数据清洗专家
│   │   ├── stats-reviewer.md ← 统计审查员
│   │   └── paper-writer.md   ← 论文写作助手
│   └── skills/               ← 技能包
│       └── regression-diagnostics/
│           └── SKILL.md      ← 回归诊断工作流
│
├── .mcp.json                 ← MCP 服务器配置（外部工具集成）
│
├── data/                     ← 数据目录
├── src/                      ← 代码目录
├── output/                   ← 输出目录
└── paper/                    ← 论文目录
```

### 5.3 每个文件的作用详解

#### CLAUDE.md——项目的"操作手册"

这是 Claude Code 最重要的文件。每次启动都会**完整读入上下文**。它告诉 Claude：这个项目是什么、怎么运行、有什么规矩。

```markdown
# 项目概述
本项目分析中国地级市面板数据，研究产业政策对制造业升级的因果效应。
技术栈：Python 3.11 + pandas + statsmodels + matplotlib

# 常用命令
- 运行数据清洗: `python src/clean_data.py`
- 运行回归分析: `python src/regression.py --model did`
- 生成图表: `python src/plot_results.py`
- 运行全部测试: `pytest tests/`

# 目录结构
- data/raw/ — 原始数据（不要修改）
- data/processed/ — 清洗后数据
- src/ — 所有源代码
- output/tables/ — 回归结果表
- output/figures/ — 图表
- paper/ — LaTeX 论文源文件

# 代码规范
- 所有数据处理脚本使用 pathlib 处理路径
- DataFrame 变量名使用 df_ 前缀
- 回归结果输出为 LaTeX 表格格式
- 图表使用 matplotlib，字号 12pt，DPI 300
- 缺失值处理必须记录到 output/logs/

# 注意事项
- data/raw/ 下的文件绝对不要修改或删除
- 不要在代码中硬编码文件路径，使用配置文件
- 所有数值结果保留 4 位小数
```

**写作原则**：
- 控制在 **200 行以内**（越长，Claude 遵循度越低）
- 写**具体可验证的规则**，而不是模糊的建议
- 用 Markdown 标题和列表组织结构

#### .claude/rules/——模块化的专项规则

当 CLAUDE.md 太长时，把不同领域的规则拆分到 `.claude/rules/` 目录下：

```markdown
# .claude/rules/data-pipeline.md

所有数据处理步骤必须满足：
- 输入数据路径从 config.yaml 读取，禁止硬编码
- 每个处理步骤输出中间结果到 data/processed/
- 缺失值比例超过 30% 的变量自动标记并记录日志
- Panel 数据操作前检查 entity-time 唯一性
```

**路径限定规则**——只在访问特定文件时生效，节省上下文空间：

```markdown
---
paths:
  - "src/**/*.py"
---

# Python 代码规范
- 类型标注所有函数签名
- docstring 使用 Google 风格
- import 排序：标准库 / 第三方 / 本项目
```

#### Auto Memory——Claude 自己做的笔记

Claude Code 会自动把工作中发现的有用信息记录下来：

```
~/.claude/projects/<你的项目>/memory/
├── MEMORY.md          ← 索引文件（前 200 行每次加载）
├── debugging.md       ← 调试经验
├── data-quirks.md     ← 数据中发现的问题
└── preferences.md     ← 你的偏好习惯
```

这些笔记会在下次启动时自动加载。你可以通过 `/memory` 命令查看和编辑。你也可以主动告诉 Claude"记住这个"，比如"记住：这个项目的 CSV 文件都是 GBK 编码"。

#### CLAUDE.local.md——个人偏好

存放不进 Git 的私人配置（自动被 gitignore）：

```markdown
# 我的本地环境
- Python 路径: /opt/homebrew/bin/python3.11
- 数据存放在外接硬盘: /Volumes/Data/raw/
- 使用代理: export http_proxy=http://127.0.0.1:7890
```

#### .claude/agents/——自定义子 Agent

每个 `.md` 文件定义一个专门的子 Agent（详见第六节）。

#### .claude/settings.json——正式配置

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50"
  },
  "permissions": {
    "allow": ["Read", "Glob", "Grep", "Bash(python *)"],
    "deny": ["Bash(rm -rf *)"]
  }
}
```

#### .mcp.json——外部工具集成

MCP（Model Context Protocol）让 Claude Code 连接外部服务：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

### 5.4 记忆层级与作用域总结

```
┌───────────────────────────────────────────────────────────────┐
│                   Claude Code 记忆层级                         │
│                                                               │
│  ┌─ 组织级 ──────────────────────────────────────────────┐   │
│  │ /Library/Application Support/ClaudeCode/CLAUDE.md     │   │
│  │ 全公司统一规范（IT 管理员部署）                          │   │
│  └───────────────────────────────────────────────────────┘   │
│       ▼ 被覆盖                                                │
│  ┌─ 用户级 ──────────────────────────────────────────────┐   │
│  │ ~/.claude/CLAUDE.md      个人跨项目偏好                │   │
│  │ ~/.claude/rules/*.md     个人通用规则                   │   │
│  │ ~/.claude/agents/*.md    个人子 Agent                   │   │
│  └───────────────────────────────────────────────────────┘   │
│       ▼ 被覆盖                                                │
│  ┌─ 项目级 ──────────────────────────────────────────────┐   │
│  │ ./CLAUDE.md              团队共享指令（提交到 Git）     │   │
│  │ ./.claude/rules/*.md     项目规则                       │   │
│  │ ./.claude/agents/*.md    项目子 Agent                   │   │
│  │ ./.claude/settings.json  项目设置                       │   │
│  └───────────────────────────────────────────────────────┘   │
│       ▼ 被覆盖                                                │
│  ┌─ 本地级 ──────────────────────────────────────────────┐   │
│  │ ./CLAUDE.local.md        个人本地偏好（不进 Git）       │   │
│  │ ./.claude/settings.local.json  本地设置覆盖             │   │
│  └───────────────────────────────────────────────────────┘   │
│       ▼ 补充                                                  │
│  ┌─ 自动记忆 ────────────────────────────────────────────┐   │
│  │ ~/.claude/projects/<项目>/memory/MEMORY.md             │   │
│  │ Claude 自动积累的经验笔记                               │   │
│  └───────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘

优先级：本地 > 项目 > 用户 > 组织
```

---

## 六、自定义 Agent 与 Multi-Agent 并行

### 6.1 内置子 Agent

Claude Code 自带三个内置子 Agent：

| Agent | 模型 | 工具权限 | 用途 |
|---|---|---|---|
| **Explore** | Haiku（快速） | 只读（不能写/改文件） | 搜索代码、分析结构 |
| **Plan** | 继承主模型 | 只读 | 在 Plan Mode 中做调研 |
| **General** | 继承主模型 | 全部工具 | 复杂多步骤任务 |

每个子 Agent 运行在**独立的上下文窗口**中——这意味着它的探索结果不会挤占你主对话的空间。

### 6.2 自定义子 Agent

在 `.claude/agents/` 目录下创建 Markdown 文件：

**数据清洗专家** (`.claude/agents/data-cleaner.md`)：

```markdown
---
name: data-cleaner
description: 数据清洗和预处理专家。当需要处理原始数据、清洗缺失值、转换变量格式时使用。
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

你是一名经验丰富的数据工程师，专注于社会科学研究数据的清洗与预处理。

工作流程：
1. 先了解数据源（读取文件的前几行和数据字典）
2. 检查数据质量：缺失值、异常值、重复行、编码问题
3. 制定清洗方案并征求确认
4. 执行清洗，每个步骤输出中间检查结果
5. 生成数据质量报告

规范：
- 原始数据只读，清洗结果输出到 data/processed/
- 所有清洗步骤可复现（写入脚本而非手动操作）
- 缺失值处理方案记录到清洗日志
- 中文编码优先尝试 GBK 和 GB18030
- Panel 数据必须检查 entity-time 唯一性
```

**统计审查员** (`.claude/agents/stats-reviewer.md`)：

```markdown
---
name: stats-reviewer
description: 统计方法和回归结果审查专家。当完成回归分析需要检验结果稳健性时使用。
tools: Read, Bash, Grep, Glob
model: opus
---

你是一名计量经济学方法论专家，负责审查研究中的统计分析。

审查清单：
1. 识别策略合理性（内生性来源、工具变量有效性）
2. 回归结果解读（系数大小、显著性、经济含义）
3. 稳健性检验是否充分（替换变量、子样本、不同估计方法）
4. 标准误聚类层级是否合适
5. 图表是否清晰准确地呈现了结果

输出格式：
- 关键问题（必须修改）
- 建议改进（推荐修改）
- 次要建议（可选改进）
```

**论文写作助手** (`.claude/agents/paper-writer.md`)：

```markdown
---
name: paper-writer
description: 学术论文写作助手。帮助撰写、修改和润色英文经济学论文。
tools: Read, Write, Edit, Grep
model: opus
memory: project
---

你是一名经济学领域的学术写作专家，母语为英语，熟悉顶刊的写作风格（AER, QJE, Econometrica）。

写作规范：
- 语言简洁精确，避免冗余修饰
- 使用主动语态和第一人称复数（we）
- 因果关系用词准确（effect vs association vs correlation）
- 段落结构：topic sentence → evidence → interpretation
- 数字引用格式遵循 AEA 风格指南

记忆更新：
- 记录项目中使用的专业术语和缩写
- 记录导师的修改偏好和写作习惯
- 记录各期刊的特殊格式要求
```

### 6.3 并行 Multi-Agent 工作流

Claude Code 可以同时启动多个子 Agent **并行处理**独立的任务：

```
你："帮我同时完成以下三件事：
     1. 清洗 data/raw/census_2020.csv
     2. 画 output/figures/ 里所有回归结果的 coefficient plot
     3. 把 paper/results.tex 中的表格描述更新为最新结果"

Claude Code 自动分发：
     │
     ├──▶ [data-cleaner Agent]     清洗 Census 数据
     │    （独立上下文）
     │
     ├──▶ [General Agent]          绘制 coefficient plots
     │    （独立上下文）
     │
     └──▶ [paper-writer Agent]     更新论文表格描述
          （独立上下文）

三个 Agent 同时运行，各自完成后向主会话报告结果。
```

### 6.4 操作方法

```bash
# 直接在对话中请求并行
"用三个子 Agent 分别处理这三个任务..."

# 按 Ctrl+B 把当前任务放到后台
# 然后可以继续下一个任务

# 查看所有运行中的 Agent
/tasks

# 指定使用某个自定义 Agent
"用 data-cleaner Agent 处理这个 CSV 文件"

# 恢复/继续之前的 Agent 工作
"继续之前 data-cleaner 的工作，把剩余的变量也清洗一下"
```

### 6.5 Agent Teams（高级）

当任务规模超出单个上下文窗口（比如一个大项目的全面重构），可以使用 **Agent Teams**——每个成员运行在完全独立的 Claude Code 实例中，通过文件系统和 Git 协调：

```bash
# 在不同的终端窗口/tmux 面板中
# 终端 1：
cd ~/research/project && claude
"负责 src/data_processing/ 的代码优化"

# 终端 2：
cd ~/research/project && claude
"负责 src/visualization/ 的图表重绘"

# 终端 3：
cd ~/research/project && claude
"负责 paper/ 的论文更新"
```

> **成本注意**：每个 Agent 消耗独立的 token。只有任务真的独立时才用并行——简单顺序任务用单个会话更省。

---

## 七、实战：经济学研究项目的最佳 Claude Code 配置

下面给出一个完整的经济学研究项目配置样例，参考了 [everything-claude-code](https://github.com/affaan-m/everything-claude-code) 的架构思路，适配学术研究场景。

### 7.1 项目结构

```
econ-industrial-policy/
│
├── CLAUDE.md                          ← 项目主指令
├── CLAUDE.local.md                    ← 个人本地配置
│
├── .claude/
│   ├── settings.json                  ← 项目设置
│   ├── rules/
│   │   ├── python-style.md            ← Python 代码规范
│   │   ├── data-integrity.md          ← 数据完整性约定
│   │   ├── stata-interop.md           ← Stata 互操作规则
│   │   └── latex-conventions.md       ← LaTeX 写作约定
│   └── agents/
│       ├── data-cleaner.md            ← 数据清洗 Agent
│       ├── stats-reviewer.md          ← 统计审查 Agent
│       ├── paper-writer.md            ← 论文写作 Agent
│       └── lit-researcher.md          ← 文献调研 Agent
│
├── config.yaml                        ← 项目全局配置
├── requirements.txt                   ← Python 依赖
│
├── data/
│   ├── raw/                           ← 原始数据（只读）
│   │   ├── census_2020.csv
│   │   ├── firm_panel.dta
│   │   └── policy_shocks.xlsx
│   ├── processed/                     ← 清洗后数据
│   ├── codebook/                      ← 变量说明书
│   └── README.md                      ← 数据来源说明
│
├── src/
│   ├── __init__.py
│   ├── config.py                      ← 路径和参数配置
│   ├── clean/                         ← 数据清洗脚本
│   │   ├── clean_census.py
│   │   └── clean_firm_panel.py
│   ├── analysis/                      ← 分析脚本
│   │   ├── did_estimation.py
│   │   ├── iv_regression.py
│   │   └── robustness_checks.py
│   ├── viz/                           ← 可视化
│   │   ├── coefficient_plots.py
│   │   └── event_study_plots.py
│   └── utils/                         ← 工具函数
│       ├── data_utils.py
│       └── table_utils.py
│
├── output/
│   ├── tables/                        ← 回归结果表
│   ├── figures/                       ← 图表
│   └── logs/                          ← 运行日志
│
├── paper/
│   ├── main.tex
│   ├── sections/
│   ├── references.bib
│   └── figures/                       ← 论文用图（从 output 复制）
│
└── tests/
    ├── test_clean.py
    └── test_analysis.py
```

### 7.2 CLAUDE.md 样例

```markdown
# Industrial Policy and Manufacturing Upgrading

## 项目概述
分析中国地级市面板数据（2005-2019），使用双重差分法（DID）研究产业政策
对制造业升级的因果效应。技术栈：Python 3.11, pandas, statsmodels, matplotlib。

## 常用命令
- 安装依赖: `pip install -r requirements.txt`
- 数据清洗: `python -m src.clean.clean_census`
- 主回归: `python -m src.analysis.did_estimation`
- 稳健性: `python -m src.analysis.robustness_checks`
- 全部测试: `pytest tests/ -v`
- 编译论文: `cd paper && latexmk -pdf main.tex`

## 目录约定
- `data/raw/` 只读，任何脚本不得修改原始数据
- `data/processed/` 存放清洗后数据，文件名含日期戳
- `output/tables/` 表格以 LaTeX 格式输出
- `output/figures/` 图表 PNG (300 DPI) + PDF 双格式
- 所有路径通过 `src/config.py` 中的 `PATHS` 字典获取

## 代码规范
- 函数必须有 Google 风格 docstring，包含参数和返回值说明
- DataFrame 变量以 `df_` 前缀命名
- 回归模型对象以 `model_` 或 `result_` 前缀命名
- 标准误默认 cluster 到地级市层级
- 使用 `logging` 模块记录关键步骤，不用 print

## 禁止事项
- 不要删除或修改 data/raw/ 中的任何文件
- 不要在代码中硬编码绝对路径
- 不要用 `from module import *`
- 不要把 API Key 写入任何被 Git 追踪的文件

@data/codebook/variable_definitions.md
@config.yaml
```

### 7.3 settings.json 样例

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50"
  },
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(python *)",
      "Bash(pytest *)",
      "Bash(pip *)",
      "Bash(latexmk *)",
      "Bash(git *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Write(data/raw/*)"
    ]
  }
}
```

### 7.4 典型工作场景

**场景一：从零开始一个新分析**

```
你：帮我分析政策冲击对企业研发投入的影响，使用 IV 回归。
    工具变量用官员更替作为外生冲击。数据在 data/processed/firm_panel.csv。

Claude Code 会：
1. [Explore Agent] 读取数据文件，了解变量结构
2. 回到主对话，提出分析方案
3. 你确认后，编写 src/analysis/iv_regression.py
4. 运行回归，检查第一阶段 F 统计量
5. 输出表格到 output/tables/iv_results.tex
6. 报告结果并讨论识别策略的潜在问题
```

**场景二：并行处理多个任务**

```
你：项目到了最后阶段，请帮我同时完成：
    1. 检查所有回归的标准误聚类是否一致
    2. 为每个主要结果画 event study 图
    3. 把最新的表格和图嵌入论文 LaTeX

Claude Code 自动分发三个 Agent 并行处理。
```

**场景三：审查和改进**

```
你：用 stats-reviewer Agent 审查 src/analysis/ 下所有回归的方法论

[stats-reviewer Agent 启动]
- 逐个检查回归模型
- 检验识别策略
- 检查稳健性检验覆盖面
- 输出审查报告，按严重度排序
```

---

## 八、实用技巧与最佳实践

### 三步法：先探索、再计划、再编码

```bash
# 第一步：让 Claude 理解问题
"先探索 src/analysis/ 目录，了解现有的回归模型和数据结构，不要做任何修改"

# 第二步：制定方案
"根据你的理解，提出添加工具变量回归的方案，我来审核"

# 第三步：确认后执行
"方案没问题，开始实现"
```

### 给 Claude 提供验证手段

```bash
# 最有用的一句话
"写完后运行 pytest tests/ 验证结果"

# 或者
"运行回归后，打印系数表让我确认结果合理"
```

### 管理上下文

| 场景 | 操作 |
|---|---|
| 切换完全无关的任务 | `/clear`（免费，瞬间清空） |
| 长会话中间歇 | `/compact`（保留摘要，释放空间） |
| 继续昨天的工作 | `claude -c`（恢复最近对话） |
| 查看消耗了多少 | `/cost` |
| 日常任务用便宜模型 | `/model sonnet`（默认） |
| 复杂推理切换强模型 | `/model opus` |

### 安全注意事项

- API Key **只通过环境变量传递**，不写入任何文件
- `data/raw/` 在 settings.json 中设为写入拒绝
- 敏感数据路径放在 `CLAUDE.local.md`（不进 Git）
- 定期用 `/memory` 审查 Claude 自动记录了什么

---

## 小结

| 概念 | 要记住的 |
|---|---|
| Claude Code 本质 | 终端里的 AI Agent，能直接操作文件和运行命令 |
| CLAUDE.md | 项目操作手册，每次启动加载，控制在 200 行内 |
| .claude/rules/ | 模块化规则，可按文件类型限定作用域 |
| Auto Memory | Claude 自动积累的项目经验笔记 |
| 子 Agent | 独立上下文运行，适合隔离大任务 |
| 并行 Agent | 多个独立任务同时处理，用 `/tasks` 监控 |
| /compact | 上下文满了就压缩，CLAUDE.md 不会丢失 |
| 换源 | `ANTHROPIC_BASE_URL` + `ANTHROPIC_API_KEY` 环境变量 |

Claude Code 的核心思想是：**把你从"搬运工"变成"决策者"**。你负责定义目标和审查结果，Claude 负责探索、规划和执行。配合良好的 CLAUDE.md 和自定义 Agent，它能成为你科研工作流中最强大的加速器。

---

> **上一篇**：[[Basic Skill 3 - Dev Environment|开发环境搭建指南]]
> **下一篇**：[[Basic Skill 4 - Encoding and Formats|文件编码与数据格式]]
