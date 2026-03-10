---
title: "#3：Agent 设计方法论"
tags:
  - skills/AI CLI Tools/Claude Code
order: 3
description: 掌握 Claude Code 的内置 Agent 体系、自定义 Agent 设计原则、并行编排模式与 Git Worktree 工作流，构建高效的经济学多 Agent 研究系统。
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> Agent 是 Claude Code 的"分身术"——把一个复杂任务拆成几个独立子任务，让多个 Agent 各自在独立的上下文中并行执行，互不干扰。

你有没有试过让 Claude Code 做一件复杂的事——比如"清洗数据、跑回归、画图、更新论文"——结果到第三步时它已经忘了第一步的关键信息？这就是**单上下文窗口的瓶颈**。Agent 体系的核心就是解决这个问题：把大任务拆成小任务，每个子 Agent 在独立的上下文中工作，完成后返回摘要，主对话保持清爽。

---

## 一、内置 Agent 体系

Claude Code 自带三个内置子 Agent，各有不同的定位：

### 1.1 三种内置 Agent

| Agent | 模型 | 工具权限 | 用途 | 上下文 |
|---|---|---|---|---|
| **Explore** | Haiku（快速廉价） | 只读（Read, Glob, Grep） | 搜索代码、分析结构、回答问题 | 独立 |
| **Plan** | 继承主模型 | 只读 | Plan Mode 中做调研、制定方案 | 独立 |
| **General** | 继承主模型 | 全部工具 | 复杂多步骤任务、需要修改文件 | 独立 |

```
主对话（你的上下文窗口）
┌──────────────────────────────────────────────┐
│ CLAUDE.md + 对话历史 + 你的提问                │
│                                              │
│ "帮我了解 src/analysis/ 目录的结构"           │
│                                              │
│   ┌──── 启动 Explore Agent ────┐             │
│   │   独立上下文窗口            │             │
│   │   ├── Read src/analysis/   │             │
│   │   ├── Glob **/*.py         │             │
│   │   ├── Grep "import"        │             │
│   │   └── 返回摘要             │             │
│   └────────────────────────────┘             │
│                                              │
│ 收到摘要（几百 token），而非原始文件内容（几万） │
└──────────────────────────────────────────────┘
```

**关键价值**：Explore Agent 读了 20 个文件（可能消耗 50K token），但只向主对话返回一段几百 token 的摘要。你的主上下文几乎没有被污染。

### 1.2 何时使用哪个 Agent

```
你的需求是什么？
  │
  ├── 只需要查信息，不改任何东西
  │   ├── 简单查询 → Explore Agent（Haiku，快速廉价）
  │   └── 需要深度分析 → Plan Agent（更强的模型）
  │
  └── 需要修改文件、运行命令
      └── General Agent（完整工具权限）
```

> 参考：[Sub-agents 官方文档](https://code.claude.com/docs/en/sub-agents)

### 动手练习

在你的经济学项目中输入：

```
用子 Agent 探索 data/ 目录，告诉我有哪些数据文件、各文件的行数和列数、以及变量名。不要做任何修改。
```

观察 Claude 如何启动 Explore Agent，以及返回的摘要有多精炼。

---

## 二、自定义 Agent 设计原则

### 2.1 Agent 定义文件格式

在 `.claude/agents/` 目录下创建 `.md` 文件即可定义自定义 Agent：

```markdown
---
name: agent-name
description: 一句话描述，Claude 根据此决定何时调用
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

你是一名 [角色描述]，专注于 [工作领域]。

工作流程：
1. 第一步...
2. 第二步...
3. 第三步...

规范：
- 规则一
- 规则二
```

### 2.2 Frontmatter 字段完整参考

| 字段 | 必需 | 说明 | 示例 |
|---|---|---|---|
| `name` | 是 | Agent 的唯一标识名 | `data-cleaner` |
| `description` | 是 | 一句话描述用途，Claude 据此决定何时调用 | `数据清洗和预处理专家` |
| `tools` | 否 | 允许使用的工具列表（逗号分隔） | `Read, Write, Bash` |
| `model` | 否 | 使用的模型（haiku/sonnet/opus） | `sonnet` |
| `memory` | 否 | 记忆范围（project/user） | `project` |

### 2.3 设计原则

**原则一：单一职责**

每个 Agent 只做一件事。不要创建一个"万能 Agent"——那和不用 Agent 没区别。

```
✗ 错误：research-and-code-and-review Agent（什么都做）
✓ 正确：data-cleaner / stats-reviewer / paper-writer（各司其职）
```

**原则二：模型选择策略**

```
任务类型                    推荐模型      原因
─────────────────────────────────────────────
搜索/检索/简单查询           Haiku        快速廉价，够用
日常编码/数据处理/脚本       Sonnet       性价比最优（90% 任务）
架构设计/论文审查/复杂推理   Opus         推理深度最强
```

**原则三：工具权限最小化**

只给 Agent 完成任务所需的最少工具。审查类 Agent 不需要 Write 权限，搜索类 Agent 不需要 Bash 权限。

```
data-cleaner:     Read, Write, Edit, Bash, Glob, Grep  ← 需要读写和运行脚本
stats-reviewer:   Read, Bash, Grep, Glob                ← 只需读取和运行检验
lit-researcher:   Read, Bash, Grep, WebSearch            ← 需要联网搜索
```

### 动手练习

在 `.claude/agents/` 下创建你的第一个自定义 Agent：

```bash
mkdir -p .claude/agents
cat > .claude/agents/data-explorer.md << 'EOF'
---
name: data-explorer
description: 快速了解数据集结构和质量。读取文件、统计行列数、检查缺失值。
tools: Read, Bash, Glob, Grep
model: haiku
---

你是数据探索助手。对给定的数据文件执行以下检查：
1. 文件格式、编码、行数
2. 变量名和数据类型
3. 缺失值比例
4. 基本描述统计

输出格式：简洁的 Markdown 表格。
EOF
```

然后在 Claude Code 中说："用 data-explorer Agent 分析 data/raw/census.csv"。

---

## 三、Sub-Agent Context Problem

### 3.1 问题本质

当主对话（Orchestrator）启动一个子 Agent 时，存在一个根本性的信息不对称：

```
┌─────────────────────┐
│   ORCHESTRATOR       │
│  （主对话）           │
│                     │
│  拥有：              │
│  - 完整对话历史      │
│  - 用户的真实意图    │
│  - 项目上下文        │
│  - 前面步骤的结果    │
└─────────┬───────────┘
          │ 只传递了一句查询
          ▼
┌─────────────────────┐
│    SUB-AGENT         │
│  （子 Agent）        │
│                     │
│  只知道：            │
│  - 字面上的查询      │
│  - 自己的 prompt     │
│  不知道：            │
│  - 为什么要做这个    │
│  - 结果要怎么用      │
│  - 哪些细节重要      │
└─────────────────────┘
```

**类比**：老板让你去参加一个会议，然后给他一个摘要。你回来汇报后，十有八九老板会追问——因为你不知道老板关心的重点是什么，你的摘要不可能包含他需要的所有信息。

### 3.2 Iterative Retrieval Pattern

解决方案：让主对话**评估**每次子 Agent 的返回，不够就追问，最多循环 3 次：

```
┌─────────────────┐
│  ORCHESTRATOR    │
│  传递：查询 + 目标 │──────────────────────┐
└────────┬────────┘                        │
         │                                 │
         ▼                                 │
┌─────────────────┐                        │
│   SUB-AGENT     │                        │
│  执行调研        │                        │
└────────┬────────┘                        │
         │ 返回摘要                         │
         ▼                                 │
┌─────────────────┐      ┌─────────────┐  │
│   评估：足够吗？  │─ 否 →│  追问具体问题  │──┘
└────────┬────────┘      └─────────────┘
         │ 是（或已循环 3 次）
         ▼
    ┌──────────┐
    │  接受结果  │
    └──────────┘
```

### 3.3 实践原则

**传递目标上下文，而非仅传递查询**：

```
✗ 差的方式：
  "用子 Agent 查一下 data/raw/ 有什么文件"

✓ 好的方式：
  "用子 Agent 查 data/raw/ 的文件结构。目标：我需要了解有哪些数据集
   可以构建一个地级市面板，特别关注变量中是否有城市代码和年份字段，
   以及数据的时间跨度是否覆盖 2005-2019。"
```

第二种方式告诉子 Agent **为什么**要查、**什么**信息最重要，返回的摘要会精准得多。

### 动手练习

尝试两种方式启动子 Agent 查看你的数据目录，对比返回结果的质量差异：

```
方式1："用子 Agent 看看 data/ 目录有什么"
方式2："用子 Agent 分析 data/ 目录。目标：我要构建 2005-2019 的地级市面板数据，
        需要知道哪些文件可以合并，关键匹配变量是什么，时间覆盖范围是否一致。"
```

---

## 四、Agent 编排模式

### 4.1 Sequential Phases 模式（顺序阶段）

最稳健的模式。每个阶段用一个 Agent，输出文件作为下一阶段的输入：

```
Phase 1: RESEARCH（用 Explore Agent）
  │ 输入：用户需求
  │ 输出：research-summary.md
  ▼
Phase 2: PLAN（用 Plan Agent）
  │ 输入：research-summary.md
  │ 输出：plan.md
  ▼
Phase 3: IMPLEMENT（用 coding Agent）
  │ 输入：plan.md
  │ 输出：代码文件
  ▼
Phase 4: REVIEW（用 stats-reviewer Agent）
  │ 输入：代码 + 输出
  │ 输出：review-comments.md
  ▼
Phase 5: VERIFY（运行测试）
  │ 输入：review-comments.md
  │ 输出：通过 或 回到 Phase 3
  ▼
  完成
```

**核心规则**：
- 每个 Agent 只有一个明确输入和一个明确输出
- 输出存为文件（不仅仅是对话中的记忆）
- 阶段之间用 `/clear` 清理上下文
- 不要跳过阶段

### 4.2 Writer/Reviewer 模式

两个独立会话，一个写代码，另一个审查：

```
Session A（Writer）              Session B（Reviewer）
─────────────────               ──────────────────────
实现 IV 回归分析                 
  ↓ 完成
                                审查 src/analysis/iv_regression.py
                                找出边界情况、标准误问题
                                  ↓ 输出审查意见
根据审查意见修改
  ↓ 完成
                                再次审查修改后的版本
                                  ↓ 通过
```

**优势**：新鲜上下文做审查不会有偏见——Claude 不会因为是自己写的代码就放过问题。

### 4.3 Two-Instance Kickoff Pattern

新项目启动时特别有用：

```
┌─ Instance 1: Scaffolding ────────────┐  ┌─ Instance 2: Deep Research ─────────┐
│                                       │  │                                      │
│  创建项目结构                          │  │  连接外部服务和文档                    │
│  设置 CLAUDE.md                       │  │  搜索相关 API 和工具                   │
│  配置 rules / agents / settings       │  │  创建详细的 PRD 文档                   │
│  建立代码骨架                          │  │  绘制架构图（Mermaid）                 │
│  设定 .gitignore / requirements.txt   │  │  整理参考文献和数据来源                  │
│                                       │  │                                      │
└───────────────────────────────────────┘  └──────────────────────────────────────┘
         ↓                                          ↓
         └─────────── 合并到同一个 repo ───────────────┘
```

### 4.4 Cascade 方法

管理多个 Claude 终端的实用模式：

```
← 旧任务                                    新任务 →
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│ Tab1│  │ Tab2│  │ Tab3│  │ Tab4│
│ 完成 │  │ 进行 │  │ 等待 │  │ 刚开 │
│     │  │ 中  │  │ 输入 │  │ 始  │
└─────┘  └─────┘  └─────┘  └─────┘
  从左到右扫描，最多 3-4 个任务
```

**规则**：
- 新任务总是在右边新建标签
- 从左到右扫描检查
- 聚焦最多 3-4 个任务
- 用 `/rename` 给每个会话起有意义的名字

### 动手练习

用 Sequential Phases 模式完成一个小任务：

```
1. "用 Explore Agent 调研 data/raw/ 的所有 CSV 文件结构，输出到 tmp/research.md"
2. "读取 tmp/research.md，制定数据合并方案，输出到 tmp/plan.md"
3. "按照 tmp/plan.md 实现数据合并脚本"
4. "运行脚本，验证输出结果正确"
```

---

## 五、Git Worktree 并行 Agent

### 5.1 什么是 Git Worktree

Git Worktree 让你在同一个仓库下创建多个独立的工作目录，每个目录可以检出不同的分支，但共享同一个 `.git` 历史。

```
my-project/                     ← 主工作目录（main 分支）
my-project-feature-auth/        ← worktree 1（feature-auth 分支）
my-project-data-clean/          ← worktree 2（data-clean 分支）

三个目录的 .git 指向同一个仓库，但文件完全独立。
```

### 5.2 Claude Code 内置 Worktree 支持

```bash
# 创建命名 worktree 并启动 Claude
claude --worktree feature-auth       # 创建 worktree-feature-auth 分支
claude -w feature-auth               # 简写

# 自动生成名称
claude --worktree                    # 自动命名
```

### 5.3 子 Agent 的 isolation: worktree

在自定义 Agent 的 frontmatter 中设置 `isolation: worktree`，让子 Agent 在独立的 worktree 中运行——它的文件修改不会影响主工作目录：

```markdown
# .claude/agents/risky-refactor.md
---
name: risky-refactor
description: 在独立 worktree 中执行可能破坏性的重构
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
isolation: worktree
---

在独立工作目录中执行重构。
完成后运行测试确认无破坏。
如果测试通过，提交到 worktree 分支。
如果测试失败，报告问题但不影响主分支。
```

**工作原理**：

```
主工作目录（你正在工作）
    │
    ├── 启动 risky-refactor Agent
    │   → Claude 自动创建 worktree
    │   → Agent 在 worktree 中修改文件
    │   → 运行测试
    │   └── 返回结果到主对话
    │
    主工作目录完全不受影响
```

### 5.4 /tasks 命令：管理并行实例

当你同时运行多个 Claude 实例时，`/tasks` 帮你追踪所有活跃的会话：

```bash
# 查看所有活跃的 Claude 实例
/tasks

# 输出示例：
#  ID   Name              Status    Branch
#  1    data-cleaning     active    worktree-data-clean
#  2    regression        idle      worktree-regression
#  3    visualization     active    worktree-viz

# 配合 /rename 使用
/rename data-cleaning     # 给当前会话命名
```

**最佳实践**：
- 启动每个新实例后立即 `/rename`
- 定期用 `/tasks` 检查所有实例状态
- 完成的实例及时关闭，释放资源

### 5.3 并行工作流

```
终端 1                        终端 2                        终端 3
cd project                    cd project                    cd project
claude -w data-clean          claude -w regression          claude -w visualization
  │                             │                             │
  ├── 清洗面板数据               ├── 实现 DID 回归              ├── 绘制 event study 图
  ├── 处理缺失值                 ├── 跑稳健性检验               ├── 设计 coefficient plot
  ├── 输出 processed/            ├── 输出 tables/               ├── 输出 figures/
  │                             │                             │
  ▼                             ▼                             ▼
git merge worktree-data-clean  git merge worktree-regression  git merge worktree-viz
```

### 5.4 最佳实例数量

```
实例数    适用场景                    注意事项
─────────────────────────────────────────────
1         简单顺序任务                够用就别并行
2         一个编码 + 一个调研          最常用的组合
3-4       大项目多个独立模块          管理精力上限
5+        除非你是全职 AI 工程师      绝大多数人不需要
```

> **关键建议**：从 1 个实例开始，只在真正需要时才增加。过度并行带来的管理开销可能超过收益。用 `/rename` 和 `/tasks` 保持清晰。

### 5.5 Desktop App 自动 Worktree

Claude Code Desktop App 为每个新会话自动创建独立 worktree，可视化管理。

> 参考：[Agent Teams 官方文档](https://code.claude.com/docs/en/agent-teams)

### 动手练习

```bash
# 创建两个并行 worktree
claude -w data-prep
# 在第一个中："清洗 data/raw/census.csv，输出到 data/processed/"

# 新开终端
claude -w analysis
# 在第二个中："基于 data/processed/ 的数据跑 DID 回归"

# 完成后合并
git merge worktree-data-prep
git merge worktree-analysis
```

---

## 六、Agent Teams

### 6.1 概念

当任务规模超出单个上下文窗口（比如一个大项目的全面重构），可以使用 Agent Teams——每个成员运行在**完全独立的 Claude Code 实例**中。

```
┌── Team Lead（主实例）──────────────────────────┐
│                                                │
│  分配任务、协调进度、合并结果                      │
│                                                │
│  ┌─ Member 1 ─┐  ┌─ Member 2 ─┐  ┌─ Member 3 ─┐
│  │ 数据处理    │  │ 回归分析    │  │ 论文更新    │
│  │ (worktree1)│  │ (worktree2)│  │ (worktree3)│
│  └────────────┘  └────────────┘  └────────────┘
│                                                │
│  通过文件系统和 Git 协调                          │
└────────────────────────────────────────────────┘
```

### 6.2 协调方式

| 方式 | 说明 | 适用场景 |
|---|---|---|
| 文件系统 | 通过共享文件（如 `tmp/progress.md`）通信 | 简单任务分工 |
| Git | 各自分支，完成后 merge | 代码修改任务 |
| tmux | 多面板在同一终端中管理 | 需要同时监控 |

### 6.3 文件系统协调详解

多个 Claude 实例可以通过共享文件进行协调：

```
项目根目录/
├── tmp/
│   ├── progress.md            ← 各实例更新进度
│   ├── data-clean-done.flag   ← 完成标记文件
│   └── handoff-notes.md       ← 交接笔记
```

**协调模式示例**（数据清洗 → 回归分析的串联）：

```
实例 1（data-cleaning）：
  "清洗 data/raw/panel.csv，输出到 data/processed/panel_clean.csv。
   完成后创建 tmp/data-clean-done.flag 文件，
   内容写明清洗了哪些变量、删了多少行、注意事项。"

实例 2（regression）：
  "等待 tmp/data-clean-done.flag 出现后，
   读取其中的说明，然后基于 data/processed/panel_clean.csv 运行回归。"
```

### 6.4 tmux 多实例管理

```bash
# 创建 tmux 会话，3 个面板
tmux new-session -s research
tmux split-window -h
tmux split-window -v

# 面板 1：数据处理
cd ~/research/project && claude
/rename data-cleaning

# 面板 2：回归分析
cd ~/research/project && claude
/rename regression

# 面板 3：论文更新
cd ~/research/project && claude
/rename paper-update

# 快捷键导航
# Ctrl+b → 方向键   在面板间切换
# Ctrl+b → z        全屏/还原当前面板
```

### 6.5 经济学多实例协调案例

一个完整的 DID 论文项目，用 3 个实例并行推进：

```
实例 1: data-pipeline              实例 2: analysis             实例 3: writing
/rename data-pipeline              /rename analysis             /rename writing

"清洗城市面板数据，构造            "等数据就绪后：               "搜索最新 DID 文献，
 DID 变量，输出到                   运行 M1-M6 基准回归，        更新文献综述，
 data/processed/"                   输出 LaTeX 表格"            初稿 introduction"

完成后：创建                       完成后：创建                  完成后：提交
tmp/data-done.flag                tmp/regression-done.flag      paper/ 更新

       └──────────┐                     │
                   ▼                     ▼
              实例 2 读取 flag       实例 3 等待表格
              继续执行分析           整合到论文正文
```

> **成本注意**：每个实例独立消耗 token。只有任务真的独立时才用并行——简单顺序任务用单个会话更经济。

### 动手练习

如果你有一个需要"数据清洗 + 回归分析 + 画图"的项目，尝试用 tmux 开 3 个 Claude 实例并行处理。注意每个实例的 `/rename` 命名，以及用 flag 文件做交接。

---

## 七、经济学研究 Agent 设计示例

### 7.1 数据清洗专家

```markdown
# .claude/agents/data-cleaner.md
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
- 输出文件名含日期戳：processed_YYYYMMDD.csv
```

### 7.2 统计审查专家

```markdown
# .claude/agents/stats-reviewer.md
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

DID 特别检查：
- 平行趋势是否通过检验
- 是否存在负权重问题（推荐 CS/SA/JWDID）
- 动态效应是否合理
- HonestDiD 敏感性分析

IV 特别检查：
- 第一阶段 F 统计量 > 10
- 过度识别检验（Hansen J）
- 排他性约束论证

输出格式：
- 关键问题（必须修改）
- 建议改进（推荐修改）
- 次要建议（可选改进）
```

### 7.3 论文写作助手

```markdown
# .claude/agents/paper-writer.md
---
name: paper-writer
description: 学术论文写作助手。帮助撰写、修改和润色英文经济学论文。
tools: Read, Write, Edit, Grep
model: opus
memory: project
---

你是一名经济学领域的学术写作专家，母语为英语，
熟悉顶刊的写作风格（AER, QJE, Econometrica, JPE, REStud）。

写作规范：
- 语言简洁精确，避免冗余修饰
- 使用主动语态和第一人称复数（we）
- 因果关系用词准确（effect vs association vs correlation）
- 段落结构：topic sentence → evidence → interpretation
- 数字引用格式遵循 AEA 风格指南
- 回归结果描述：先说系数方向和显著性，再说经济含义

记忆更新：
- 记录项目中使用的专业术语和缩写
- 记录导师的修改偏好和写作习惯
- 记录各期刊的特殊格式要求
```

### 7.4 文献调研助手

```markdown
# .claude/agents/lit-researcher.md
---
name: lit-researcher
description: 文献调研和综述辅助。搜索相关文献、提取关键信息、管理引用。
tools: Read, Bash, Grep, Glob
model: sonnet
---

你是一名经济学文献研究助手，擅长：
- 根据主题搜索相关学术文献
- 提取文献的核心贡献和方法论
- 识别研究空白（research gap）
- 整理 BibTeX 引用格式

工作流程：
1. 理解研究主题和现有文献范围
2. 搜索并筛选相关文献
3. 提取每篇文献的：标题、作者、年份、期刊、核心方法、主要发现
4. 输出结构化的文献综述笔记
5. 生成 BibTeX 条目

输出到 paper/literature_notes.md
```

### 7.5 复制检验专家

```markdown
# .claude/agents/replication-checker.md
---
name: replication-checker
description: 验证数据分析结果的可复制性。运行脚本、比对输出、报告差异。
tools: Read, Bash, Glob, Grep
model: sonnet
---

你是复制检验专家，负责确保研究结果的可复现性。

工作流程：
1. 阅读项目的 README 和数据文档
2. 从零开始运行所有分析脚本（按指定顺序）
3. 对比生成的输出与已有输出（表格数值、图表）
4. 记录任何差异，标注严重程度
5. 检查代码中的随机种子是否固定
6. 验证环境依赖是否完整记录（requirements.txt）

输出：replication_report.md
```

### 7.6 可视化专家

```markdown
# .claude/agents/viz-specialist.md
---
name: viz-specialist
description: 学术论文级别可视化专家。绘制 coefficient plot、event study、分布图等。
tools: Read, Write, Edit, Bash
model: sonnet
---

你是学术论文可视化专家，使用 Python matplotlib 绘图。

图表标准：
- 分辨率：300 DPI
- 字号：轴标签 12pt，标题 14pt，图例 10pt
- 字体：Times New Roman 或 Computer Modern
- 颜色：灰度友好（考虑黑白打印）
- 格式：同时输出 PNG + PDF
- 尺寸：单栏 3.5"×3"，双栏 7"×5"

常用图表类型：
- Coefficient plot（系数图）
- Event study plot（事件研究图）
- Distribution/histogram（分布图）
- Scatter with regression line（散点回归图）
- Heat map（热力图）
- Parallel trends（平行趋势图）

输出到 output/figures/，文件名描述内容：
fig_event_study_baseline.pdf
fig_coef_plot_robustness.pdf
```

### 7.7 Agent 抽象层级

来自社区总结的 Agent 使用建议：

```
Tier 1: 容易上手（推荐先掌握）
├── Sub-agents — 防止上下文腐蚀，即席专业化
├── Metaprompting — "我花 3 分钟设计 prompt，节省 20 分钟任务时间"
└── 开头多问 — 让 Claude 先面试你，收集完整需求再动手

Tier 2: 需要经验（掌握 Tier 1 后再尝试）
├── 长时间运行 Agent — 需要理解 15 分钟/1.5 小时/4 小时任务的不同
├── 并行多 Agent — 高方差，只对高度复杂或可清晰分割的任务有用
├── 角色化多 Agent — 模型进化太快，硬编码角色很快过时
└── 计算机使用 Agent — 早期范式，需要大量调试
```

> **建议**：从 Tier 1 开始。90% 的经济学研究任务用"主对话 + 1-2 个子 Agent"就能搞定。

### 动手练习

从上面的 6 个 Agent 定义中选 2-3 个，复制到你项目的 `.claude/agents/` 目录下，然后：

```
"用 stats-reviewer Agent 审查 src/analysis/did_estimation.py 的方法论"
"用 viz-specialist Agent 画 output/tables/main_results.csv 的 coefficient plot"
```

---

## 八、小结

| 概念 | 要记住的 |
|---|---|
| 内置 Agent | Explore(Haiku 只读) / Plan(只读) / General(全权限)，独立上下文 |
| 自定义 Agent | `.claude/agents/*.md`，单一职责，模型和工具最小化 |
| Context Problem | 传递目标上下文，不仅传查询；Iterative Retrieval 最多 3 轮 |
| 编排模式 | Sequential Phases 最稳健，Writer/Reviewer 防偏见 |
| Git Worktree | `claude -w name` 创建并行工作目录，互不冲突 |
| Agent Teams | 完全独立实例，通过文件和 Git 协调 |
| 最佳实例数 | 从 1 开始，真正需要时才加到 2-4 个 |
| Tier 建议 | 先掌握 Tier 1（子 Agent + Metaprompting），再尝试 Tier 2 |

### 进阶阅读

- [Sub-agents 官方文档](https://code.claude.com/docs/en/sub-agents)
- [Agent Teams](https://code.claude.com/docs/en/agent-teams)
- [Common Workflows](https://code.claude.com/docs/en/common-workflows)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) — Agent 最佳实践仓库

---

> **上一篇**：[[Claude Code 2 - Configuration Deep Dive|#2：Claude Code 配置方法论]]
> **下一篇**：[[Claude Code 4 - Skills for Economics|#4：Skills 设计——经济学研究技能包]]
