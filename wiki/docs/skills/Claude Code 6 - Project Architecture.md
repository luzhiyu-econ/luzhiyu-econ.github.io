---
title: "#6：项目架构设计方法论"
tags:
  - skills/Claude Code
order: 6
description: 掌握 CLAUDE.md 体系设计方法论、Session 管理策略、Token 优化技巧，构建从零到完整的经济学研究项目。
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> 一个精心设计的项目架构，能让 Claude Code 从"偶尔帮忙"变成"全程驱动"。架构是乘数，好的架构让每一次 prompt 都事半功倍。

前五章讲了 Claude Code 的原理、配置、Agent、Skills 和数据科学工作流。本章把所有东西整合在一起：**如何从零设计一个让 Claude Code 发挥最大效能的经济学研究项目**。

---

## 一、项目架构设计原则

### 1.1 模块化是关键

Claude Code 读文件时，文件越长，消耗的上下文越多，遗漏信息的概率越高。

```
✗ 单文件巨兽                     ✓ 模块化结构
analysis.py (3000 行)           src/
  所有清洗 + 回归 + 画图            ├── clean/
  Claude 读了 3 遍还容易漏            │   ├── clean_census.py (200行)
                                     │   └── clean_firm.py (150行)
                                     ├── analysis/
                                     │   ├── did_baseline.py (180行)
                                     │   └── iv_regression.py (160行)
                                     └── viz/
                                         ├── event_study.py (120行)
                                         └── coef_plot.py (100行)
```

**量化收益**：3000 行的文件 Claude 需要约 15K token 来读取（可能需要多次工具调用）；150 行的模块只需约 1K token，且信息密度更高。

### 1.2 经济学研究项目标准结构

```
econ-research-project/
│
├── CLAUDE.md                          ← 项目主指令
├── CLAUDE.local.md                    ← 个人本地配置（不进 Git）
│
├── .claude/
│   ├── settings.json                  ← 项目设置
│   ├── rules/
│   │   ├── python-style.md            ← Python 代码规范
│   │   ├── data-integrity.md          ← 数据完整性约定
│   │   └── latex-conventions.md       ← LaTeX 写作约定
│   ├── agents/
│   │   ├── data-cleaner.md            ← 数据清洗 Agent
│   │   ├── stats-reviewer.md          ← 统计审查 Agent
│   │   └── paper-writer.md            ← 论文写作 Agent
│   └── skills/
│       ├── regression-diagnostics/    ← 回归诊断 Skill
│       ├── data-quality-audit/        ← 数据质量审计 Skill
│       └── event-study-plot/          ← 事件研究图 Skill
│
├── config.yaml                        ← 路径和参数配置
├── requirements.txt                   ← Python 依赖
│
├── data/
│   ├── raw/                           ← 原始数据（只读！）
│   ├── processed/                     ← 清洗后数据
│   └── codebook/                      ← 变量说明书
│
├── src/
│   ├── config.py                      ← 路径和参数（从 config.yaml 读取）
│   ├── clean/                         ← 数据清洗模块
│   ├── analysis/                      ← 分析模块
│   ├── viz/                           ← 可视化模块
│   └── utils/                         ← 工具函数
│
├── output/
│   ├── tables/                        ← LaTeX 表格
│   ├── figures/                       ← 图表（PDF + PNG）
│   └── logs/                          ← 运行日志
│
├── paper/
│   ├── main.tex                       ← 论文主文件
│   ├── sections/                      ← 各章节
│   └── references.bib                 ← 参考文献
│
└── tests/                             ← 测试
    ├── test_clean.py
    └── test_analysis.py
```

### 1.3 config.yaml 集中管理

```yaml
# config.yaml
paths:
  raw_data: data/raw/
  processed_data: data/processed/
  tables: output/tables/
  figures: output/figures/
  logs: output/logs/

data:
  panel_start: 2005
  panel_end: 2019
  entity_var: city_code
  time_var: year
  treat_var: policy_year

analysis:
  cluster_var: city_code
  winsorize_pct: [0.01, 0.99]
  significance_levels: [0.01, 0.05, 0.10]

figures:
  dpi: 300
  font_family: "Times New Roman"
  font_size: 12
```

### 动手练习

在你的项目中创建上述目录结构，然后运行 `/init` 让 Claude 分析并生成初始 CLAUDE.md。

---

## 二、CLAUDE.md 体系设计方法论

### 2.1 核心原则：每一行都要有存在的理由

```
问自己：如果删掉这一行，Claude 会犯什么错？

  能回答 → 保留
  不能回答 → 删掉
```

### 2.2 反模式：过长的 CLAUDE.md

```
CLAUDE.md 长度 vs Claude 遵循度（经验曲线）

遵循度
100% │ ●
     │   ●
 80% │     ●
     │       ●
 60% │         ●
     │            ●
 40% │               ●
     │                   ●
 20% │                        ●
     └──────────────────────────────
     50   100  150  200  300  500  行数

最佳区间：50-200 行
超过 300 行后，关键规则容易被"淹没"
```

### 2.3 迭代优化流程

```
┌──────────────┐
│ 写初始规则    │ ← /init 生成 + 手动补充
└──────┬───────┘
       ▼
┌──────────────┐
│ 观察行为      │ ← Claude 是否遵循？
└──────┬───────┘
       ▼
┌──────────────┐      ┌──────────────┐
│ 发现偏差？    │─ 是 →│ 分析原因      │
└──────┬───────┘      │ - 规则模糊？  │
       │ 否            │ - 规则太长？  │
       ▼              │ - 优先级低？  │
┌──────────────┐      └──────┬───────┘
│ 规则收敛 ✓    │             │
└──────────────┘             ▼
                      ┌──────────────┐
                      │ 修改规则      │
                      │ - 更具体     │
                      │ - 加 IMPORTANT│
                      │ - 拆到 rules/ │
                      └──────┬───────┘
                             │
                             └──→ 回到"观察行为"
```

### 2.4 实战样例一：实证微观经济学项目

```markdown
# Industrial Policy and Manufacturing Upgrading

## 项目概述
分析中国地级市面板数据（2005-2019），使用双重差分法（DID）
研究产业政策对制造业升级的因果效应。
技术栈：Python 3.11, pandas, linearmodels, matplotlib

## 常用命令
- 安装依赖: `pip install -r requirements.txt`
- 数据清洗: `python -m src.clean.main`
- 主回归: `python -m src.analysis.did_baseline`
- 稳健性: `python -m src.analysis.robustness`
- 全部测试: `pytest tests/ -v`
- 编译论文: `cd paper && latexmk -pdf main.tex`

## 目录约定
- `data/raw/` 只读，任何脚本不得修改
- `data/processed/` 文件名含日期戳
- `output/tables/` LaTeX 格式，booktabs 三线表
- `output/figures/` PDF + PNG 双格式，300 DPI
- 所有路径通过 config.yaml 获取，禁止硬编码

## 代码规范
- 函数必须有 Google 风格 docstring
- DataFrame 变量以 df_ 前缀命名
- 标准误默认 cluster 到地级市层级
- 使用 logging 模块，不用 print
- import 排序：标准库 / 第三方 / 本项目

## IMPORTANT 禁止事项
- 不要删除或修改 data/raw/ 中的文件
- 不要硬编码绝对路径
- 不要用 from module import *
- 不要把 API Key 写入被 Git 追踪的文件

@config.yaml
@data/codebook/variable_definitions.md
```

### 2.5 实战样例二：结构估计项目

```markdown
# Structural Estimation: Discrete Choice Model

## 项目概述
使用 BLP (1995) 框架估计需求弹性。
技术栈：Python 3.11, PyBLP, numpy, scipy

## 常用命令
- 估计: `python -m src.estimation.blp_main`
- 反事实: `python -m src.counterfactual.simulate`
- 测试: `pytest tests/ -v`

## 目录约定
- `data/raw/` 只读
- `src/estimation/` 核心估计代码
- `src/counterfactual/` 反事实模拟

## 代码规范
- 数值计算使用 numpy，避免 for 循环
- 优化收敛容差：1e-12（默认 1e-6 不够）
- GMM 权重矩阵更新必须检查条件数
- 所有随机种子固定：np.random.seed(42)

## IMPORTANT
- BLP 估计耗时长，修改前先确认参数设置
- 不要改 data/raw/ 中的 IVs 构造方式
```

### 2.6 实战样例三：机器学习预测项目

```markdown
# House Price Prediction with ML

## 项目概述
使用 XGBoost + Cross-Validation 预测房价。
技术栈：Python 3.11, xgboost, sklearn, shap

## 常用命令
- 训练: `python -m src.train --config config.yaml`
- 评估: `python -m src.evaluate --model output/models/best.pkl`
- 测试: `pytest tests/ -v`

## 代码规范
- 交叉验证必须使用时间序列分割（不能随机分）
- 特征工程代码和模型代码严格分离
- 超参数搜索结果记录到 output/logs/
- SHAP 值分析必须包含在最终报告中

## IMPORTANT
- 训练集和测试集的划分在 config.yaml 中定义，不要硬编码
- 特征不能泄露未来信息（no data leakage）
```

### 动手练习

为你当前的研究项目写一份 CLAUDE.md（目标 80-150 行），然后运行 3 个 prompt 观察 Claude 是否遵循你的规则。发现偏差就修改规则。

---

## 三、Session 管理策略

### 3.1 决策树

```
你要做什么？
  │
  ├── 切换到完全不同的任务
  │   └── /clear（免费，瞬间清空上下文）
  │
  ├── 长会话中间，上下文快满了
  │   └── /compact（保留摘要，释放空间）
  │       └── /compact focus on regression results（指定保留重点）
  │
  ├── 继续昨天的工作
  │   └── claude --continue（恢复最近对话）
  │       └── claude --resume（选择特定会话）
  │
  ├── 想尝试不同方案但不影响当前进度
  │   └── claude --continue --fork-session
  │
  └── 日常切换模型
      ├── 简单编码 → /model sonnet
      └── 复杂推理 → /model opus
```

### 3.2 Strategic Compact

禁用自动压缩，在逻辑断点手动压缩：

```
阶段 1: 数据探索（大量读取文件）
    │
    ▼
/compact focus on data structure and variable definitions
    │
    ▼
阶段 2: 分析实现（基于压缩后的精华）
    │
    ▼
/compact focus on regression coefficients and model specs
    │
    ▼
阶段 3: 输出整理
```

### 3.3 Session Log Pattern

跨会话保持连续性：

```bash
# 会话结束前
"把当前进度总结保存到 .claude/session-logs/2026-03-10-did.md，包含：
 - 已完成的步骤
 - 待完成的步骤
 - 关键决策和原因
 - 下次需要的上下文"

# 下次会话开始时
"读取 .claude/session-logs/2026-03-10-did.md，继续昨天的工作"
```

### 动手练习

在一个长会话中尝试：做完数据探索后执行 `/compact focus on data structure`，观察压缩前后 `/context` 显示的空间变化。

---

## 四、Token 优化策略

### 4.1 Sub-Agent 架构降低成本

```
成本 = Σ(每个 Agent 的 input token × 单价 + output token × 单价)

策略：把搜索/检索任务委派给 Haiku（便宜 5x）
     只有复杂推理才用 Opus

Haiku: $0.25/M input, $1.25/M output
Sonnet: $3/M input, $15/M output
Opus:  $15/M input, $75/M output
```

### 4.2 CLI 替代 MCP 节省上下文

```
MCP 方式：
  MCP 工具定义占用上下文 → 每个请求都发送 → 累积消耗

CLI 方式：
  不占上下文 → 只在调用时消耗 → 更经济

实践：
  ✗ 用 GitHub MCP 创建 PR（工具定义常驻上下文）
  ✓ 用 Skill 封装 gh pr create 命令（按需调用）
```

### 4.3 模块化代码减少重复读取

```
Claude 读 3000 行文件：~15K token，可能读 2 次 = 30K token
Claude 读 150 行模块：~1K token，读 1 次就够 = 1K token

差距：30 倍
```

### 4.4 mgrep 替代 grep 减少 Token

Claude Code 内置的 `Grep` 工具（mgrep）比 `Bash(grep)` 更高效：

```
Bash(grep "pattern" -r .)
  → 返回所有匹配的完整行
  → 大型代码库可能返回数千行（数万 token）
  → Claude 被迫消化大量无关上下文

mgrep（内置 Grep 工具）
  → 智能截断，只返回最相关的匹配
  → 自动排除 node_modules/、.git/ 等噪声
  → 返回量通常是 grep 的 1/5 到 1/10
```

**最佳实践**：在 CLAUDE.md 中添加规则：

```markdown
## 搜索规范
- 搜索代码时优先使用内置 Grep 工具，不要用 Bash(grep)
- 使用 Glob 而非 Bash(find) 查找文件
- 搜索范围尽可能精确：指定目录和文件类型
```

### 4.5 System Prompt 瘦身

Claude Code 的内置 system prompt 约占 ~18K token。虽然你无法直接修改它，但可以通过以下方式减少总的 prompt 开销：

```
System prompt 构成                    优化方向
────────────────                      ─────────
内置 system prompt    ~18K token      无法修改
CLAUDE.md             ~2-5K token     ← 精简到 200 行以内
.claude/rules/        ~1-3K token     ← 用 paths: 限制加载范围
Auto Memory           ~1-2K token     ← 定期清理过时记忆
MCP 工具定义          ~2-10K token    ← 启用 Tool Search 惰性加载
────────────────
总计                  ~24-38K token   → 优化后 ~20-25K token
```

**立竿见影的优化**：
1. MCP Tool Search 惰性加载：从 ~10K 降到 ~0.5K（仅加载工具名和描述）
2. Rules 路径限制：编辑 Python 时不加载 LaTeX rules
3. CLAUDE.md 精简：删除 Claude 已经知道的常识性规则

### 4.6 月成本估算

| 使用模式 | 模型 | 预估月成本 |
|---|---|---|
| 轻度（每天 2-3 个 prompt） | Pro ($20) | $20/月 |
| 中度（每天 10-20 个 prompt） | Max 5x ($100) | $100/月 |
| 重度（全天使用） | Max 20x ($200) | $200/月 |
| API 按量 | Sonnet 为主 | $5-15/天 |

> **省钱策略**：日常编码用国产 Coding Plan（MiniMax ¥29/月），复杂任务切 Claude 官方。详见 [Basic Skill 3.5 第三节](../Basic%20Skill%203.5%20-%20Claude%20Code.md)。

---

## 五、End-to-End 项目搭建

### 5.1 Two-Instance Kickoff Pattern

新项目启动的最佳实践：

```
终端 1: Scaffolding（搭脚手架）         终端 2: Deep Research（深度调研）
─────────────────────────              ──────────────────────────

claude                                 claude
/rename scaffolding                    /rename research

"创建项目结构：                         "搜索以下内容并整理到 docs/：
 - 标准经济学研究目录                     - DID 最新方法论文献
 - CLAUDE.md 初始版本                    - Python 数据处理最佳实践
 - .claude/ 配置目录                     - 相关数据集的文档
 - requirements.txt                     - 同类研究的方法概览
 - config.yaml                         创建 docs/research_notes.md"
 - .gitignore"

完成后：git add . && git commit         完成后：git add . && git commit
─────────────────────────              ──────────────────────────
              ↓                                    ↓
              └──────── 合并到 main ─────────────────┘
```

### 5.2 完整配置链

```
/init                              ← Step 1: 生成初始 CLAUDE.md
  ▼
手动编辑 CLAUDE.md                  ← Step 2: 细化项目规则
  ▼
创建 .claude/rules/*.md             ← Step 3: 模块化专项规则
  ▼
创建 .claude/agents/*.md            ← Step 4: 定义子 Agent
  ▼
创建 .claude/skills/*/SKILL.md      ← Step 5: 打包可复用工作流
  ▼
配置 .claude/settings.json          ← Step 6: 权限和 hooks
  ▼
配置 .mcp.json                      ← Step 7: 外部工具连接
  ▼
测试：运行几个 prompt 验证           ← Step 8: 迭代优化
```

### 动手练习

用 Two-Instance Kickoff Pattern 从零搭建你的下一个研究项目。

---

### 5.3 End-to-End 搭建详细步骤

以下是一个经济学 DID 项目从零搭建的完整命令序列：

```bash
# Step 1: 初始化项目
mkdir econ-did-project && cd econ-did-project
git init
claude  # 启动 Claude Code

# Step 2: 让 Claude 生成初始结构
"创建标准经济学研究项目结构：data/raw、data/processed、src/clean、
 src/analysis、src/viz、output/tables、output/figures、paper/、tests/"

# Step 3: 生成 CLAUDE.md
/init  # Claude 分析项目并生成初始 CLAUDE.md

# Step 4: 手动编辑 CLAUDE.md（添加项目特有规则）

# Step 5: 创建 Rules
"为 src/analysis/ 下的 Python 文件创建规则：
 标准误默认聚类到地级市层级，回归使用 linearmodels，
 保存到 .claude/rules/analysis-python.md"

# Step 6: 创建 Agents
"创建 data-cleaner 和 stats-reviewer 两个自定义 Agent"

# Step 7: 安装 Skills
cp -r path/to/econ-replication .claude/skills/

# Step 8: 配置权限（保护原始数据）
"在 .claude/settings.json 中禁止修改 data/raw/ 目录"

# Step 9: 提交初始配置
git add . && git commit -m "init: project structure and Claude Code config"

# Step 10: 开始工作
"读取 data/raw/ 中的数据，开始数据清洗"
```

### 动手练习

用上面的 10 步流程从零搭建你的下一个研究项目。

---

## 六、团队协作

### 6.1 共享配置 via Git

```
提交到 Git（团队共享）：         不提交（个人）：
├── CLAUDE.md                  ├── CLAUDE.local.md
├── .claude/settings.json      ├── .claude/settings.local.json
├── .claude/rules/             └── ~/.claude/（用户级配置）
├── .claude/agents/
├── .claude/skills/
└── .mcp.json
```

**冲突处理**：当团队成员对 CLAUDE.md 有不同偏好时：

```
共享层（CLAUDE.md）：           只放所有人都同意的规则
  ├── 目录约定
  ├── 代码规范
  └── 常用命令

个人层（CLAUDE.local.md）：     个人偏好覆盖
  ├── 模型偏好（我习惯用 Opus）
  ├── 格式偏好（tab vs space）
  └── 个人快捷方式

.claude/settings.local.json：  个人工具设置
  ├── 权限放宽（我信任 Claude）
  └── 本地 MCP 服务器配置
```

### 6.2 GitHub Actions 自动化

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          model: sonnet
```

**实际用法**：在 PR 评论中 `@claude` 可以触发自动代码审查、bug 修复、甚至直接创建修复 PR。

> 参考：[GitHub Actions](https://code.claude.com/docs/en/github-actions)

### 6.3 GitLab CI/CD

```yaml
# .gitlab-ci.yml
claude-review:
  image: anthropics/claude-code:latest
  script:
    - claude -p "Review the changes in this MR, focus on statistical methodology"
      --output-format json > review.json
  artifacts:
    paths:
      - review.json
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

> 参考：[GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd)

### 6.4 Slack 集成

将 Claude Code 接入团队 Slack，实现：

```
Slack 频道中发消息
  │
  ├── @claude 运行回归并报告结果
  │   → Claude Code 执行分析
  │   → 进度更新发回 Slack
  │   → 最终结果（表格/图表）发回 Slack
  │
  └── @claude 审查这个 PR
      → Claude Code 审查代码
      → 审查意见发回 Slack
      → 可选：自动创建修复 PR
```

**配置方式**：

1. 在 Anthropic 控制台启用 Slack 集成
2. 在 Slack workspace 安装 Claude Code 应用
3. 配置 Code + Chat 模式（Claude 自动判断是否需要执行代码）

> 参考：[Slack 集成](https://code.claude.com/docs/en/slack)

---

## 七、小结

| 概念 | 要记住的 |
|---|---|
| 模块化 | 主文件 ≤ 300 行，拆分为独立模块 |
| CLAUDE.md | 50-200 行，每行都有存在理由，迭代优化 |
| config.yaml | 集中管理路径和参数，禁止硬编码 |
| Session 管理 | /clear 切任务，/compact 释放空间，--continue 恢复 |
| Token 优化 | Haiku 做搜索，CLI 替代 MCP，模块化减少读取 |
| 项目搭建 | Two-Instance Kickoff，8 步配置链 |
| 团队协作 | 共享 CLAUDE.md + rules，个人用 .local 文件覆盖 |

### 进阶阅读

- [Memory (CLAUDE.md) 官方文档](https://code.claude.com/docs/en/memory)
- [Best Practices](https://code.claude.com/docs/en/best-practices)
- [Settings](https://code.claude.com/docs/en/settings)
- [Costs Management](https://code.claude.com/docs/en/costs)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions)

---

> **上一篇**：[[Claude Code 5 - Data Science Workflows|#5：数据科学处理实战]]
> **下一篇**：[[Claude Code 7 - Feature Catalog and Resources|#7：功能全景与资源索引]]
