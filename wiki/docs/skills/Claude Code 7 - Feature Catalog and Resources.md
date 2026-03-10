---
title: "#7：功能全景与资源索引"
tags:
  - skills/claude-code
order: 8
description: Claude Code 全部功能的分类索引、新兴功能速览、社区资源和官方文档链接。本章作为持续更新的入口。
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> 本章持续更新，欢迎关注。

前六章覆盖了 Claude Code 的原理、配置、Agent、Skills、数据科学和项目架构。但 Claude Code 更新极快——几乎每周都有新功能发布。本章汇总部分笔者觉得有趣或实用的资源。

---

## 一、功能全景图

```
Claude Code
│
├── 平台入口
│   ├── Terminal CLI          — 功能最全的命令行界面
│   ├── VS Code / Cursor      — IDE 内嵌集成
│   ├── JetBrains             — IntelliJ/PyCharm/WebStorm 插件
│   ├── Desktop App           — 独立桌面应用
│   ├── Web (claude.ai/code)  — 浏览器中使用
│   └── Mobile (iOS/Android)  — 手机端访问
│
├── 核心能力
│   ├── Agentic Loop          — 自主探索→行动→验证循环
│   ├── Built-in Tools        — Read/Write/Edit/Bash/Glob/Grep/Agent
│   ├── Context Window        — 200K token 上下文管理
│   ├── Checkpoints           — 文件快照与回退
│   └── Sessions              — 会话持久化与恢复
│
├── 配置体系
│   ├── CLAUDE.md             — 项目指令文件
│   ├── Rules                 — 模块化规则
│   ├── Auto Memory           — 自动记忆
│   ├── Settings              — 多级设置
│   ├── Permissions           — 权限控制
│   └── Hooks                 — 生命周期自动化
│
├── 扩展体系
│   ├── Custom Agents         — 自定义子 Agent
│   ├── Skills                — 可复用技能包
│   ├── MCP                   — 外部工具连接
│   ├── Plugins               — 社区插件
│   └── Agent SDK             — 编程化调用
│
├── 协作集成
│   ├── GitHub Actions        — CI/CD 自动化
│   ├── GitLab CI/CD          — GitLab 集成
│   ├── Slack                 — 团队聊天集成
│   └── Chrome                — 浏览器调试
│
└── 远程与漫游
    ├── Remote Control        — 任何设备远程控制
    ├── Teleport              — 会话跨平台转移
    ├── Git Worktree          — 并行工作目录
    └── Agent Teams           — 多实例协调
```

---

## 二、新兴功能速览

以下功能在前六章中未深入展开，这里提供快速介绍和官方文档入口。

### 2.1 Remote Control — 远程控制

从任何设备（手机、平板、浏览器）继续本地 Claude Code 会话。

```bash
# 启动远程控制
claude remote-control

# 或在现有会话中
/remote-control  # 简写 /rc
```

**工作原理**：

```
你的电脑（本地）                       你的手机/平板（远程）
┌─────────────────────┐              ┌─────────────────┐
│  Claude Code 运行中  │◄── E2E ───►│ claude.ai/code  │
│  代码执行在本地       │   加密连接   │ 或 iOS/Android  │
│  文件操作在本地       │              │ 只做查看和输入   │
└─────────────────────┘              └─────────────────┘
```

**经济学场景**：在服务器上跑长时间的大数据处理，用手机实时监控进度和结果。

**配置步骤**：
1. 在终端运行 `claude remote-control`
2. 扫描终端显示的 QR 码
3. 在手机浏览器或 App 中打开连接
4. 通过远程界面继续对话、查看输出

> **文档**：[Remote Control](https://code.claude.com/docs/en/remote-control)

### 2.2 Teleport — 会话漫游

在不同环境间无缝转移工作会话——把终端里的工作搬到桌面应用，或反过来。

```bash
# 将当前终端会话交接到桌面应用
/desktop

# 将 Web/App 上的会话拉入本地终端
/teleport
```

**典型场景**：
- 白天在办公室用终端 CLI 编码，晚上回家用 Desktop App 继续
- 在 Web 上启动了一个长时间任务，需要在本地终端接管以获得完整工具权限
- 在手机上规划了分析思路，回到电脑上 teleport 过来执行

**注意**：Teleport 转移的是对话上下文和状态，不是文件。两端需要访问同一个项目目录（通过 Git 同步或共享文件系统）。

### 2.3 Chrome 集成

连接本地 Chrome 浏览器，让 Claude 具备浏览器操作能力。

```bash
# 启用 Chrome 集成
claude --chrome
```

**核心能力**：

| 功能 | 说明 | 经济学场景 |
|---|---|---|
| 页面导航 | 打开 URL、点击链接 | 访问数据下载页面 |
| 元素交互 | 点击、滚动、填写表单 | 自动填写数据申请表 |
| 截图 | 捕获当前页面截图 | 检查生成的图表效果 |
| 截图对比 | 对比两张截图差异 | 验证图表一致性 |
| 控制台 | 执行 JavaScript | 调试 Web 可视化 |

**图表调试工作流**：

```
1. Claude 生成 matplotlib 图表 → 保存为 PNG
2. "在 Chrome 中打开 output/figures/event_study.png"
3. Claude 截图并分析："标题字号偏小，建议改为 16pt"
4. 修改后重新生成 → 再次截图对比
```

> **文档**：[Chrome](https://code.claude.com/docs/en/chrome)

### 2.4 Slack 集成

将 Claude Code 接入团队 Slack workspace，团队成员可以直接在聊天中触发代码操作。

**两种模式**：
- **Code + Chat**：Claude 自动判断消息是需要执行代码还是简单回答
- **Code only**：所有消息都触发 Claude Code 会话

**完整工作流**：

```
团队成员在 Slack 中发送消息
    │
    ├── "@claude 跑一下上个月的 DID 回归，用最新数据"
    │   → Claude Code 启动会话
    │   → 执行数据更新和回归
    │   → 进度更新发回 Slack 频道
    │   → 最终结果（系数表格）发回 Slack
    │
    └── "@claude 审查 PR #42 的统计方法"
        → Claude Code 读取 PR 内容
        → 生成审查意见
        → 发回 Slack + 在 PR 中留评论
```

**适用团队**：多人合作的研究项目，导师可以在 Slack 中直接要求 Claude 运行分析。

> **文档**：[Slack](https://code.claude.com/docs/en/slack)

### 2.5 Desktop App

独立桌面应用，提供可视化的 Claude Code 操作界面。

**核心特色**：
- **自动 Worktree 隔离**：每个新会话自动创建独立 worktree，修改互不干扰
- **可视化 Diff**：实时查看 Claude 对文件的每次修改
- **App 预览**：对 Web 应用实时预览效果
- **PR 监控**：Dashboard 查看所有活跃 PR 状态
- **会话管理**：可视化管理多个并行会话

**平台支持**：macOS (Intel + Apple Silicon), Windows

**经济学场景**：不熟悉命令行的合作者（如导师）可以通过 Desktop App 使用 Claude Code 的全部能力。

> **文档**：[Desktop](https://code.claude.com/docs/en/desktop)，[Desktop Quickstart](https://code.claude.com/docs/en/desktop-quickstart)

### 2.6 GitHub Actions / GitLab CI/CD

在 CI/CD 流程中自动化 Claude Code——每次 PR 自动代码审查，甚至自动修复。

**GitHub Actions 典型用法**：

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

**触发方式**：
- 在 PR 评论中 `@claude` 即可触发
- 可以要求审查代码、修复 bug、回答问题
- Claude 可以直接推送修复 commit

**GitLab 等效配置**参见 [GitLab CI/CD 文档](https://code.claude.com/docs/en/gitlab-ci-cd)。

> **文档**：[GitHub Actions](https://code.claude.com/docs/en/github-actions)

### 2.7 Agent SDK

编程化调用 Claude Code，将其嵌入自定义脚本和应用。

```python
# Python SDK 示例
from claude_code import AgentSDK

agent = AgentSDK(model="sonnet")
result = agent.run(
    prompt="分析 data/raw/census.csv 的变量结构",
    allowed_tools=["Read", "Bash(python *)"],
    output_format="json"
)
print(result)
```

```typescript
// TypeScript SDK 示例
import { AgentSDK } from '@anthropic-ai/claude-code';

const agent = new AgentSDK({ model: 'sonnet' });
const result = await agent.run({
  prompt: 'Run DID regression on processed data',
  allowedTools: ['Read', 'Bash(python *)'],
});
```

**经济学应用**：构建自动化研究管道——定时拉取数据、运行分析、生成报告，全程无需人工干预。

**Headless Mode**：无需终端界面的服务器端运行模式。

> **文档**：[Agent SDK](https://code.claude.com/docs/en/sdk)，[Headless Mode](https://code.claude.com/docs/en/headless)

### 2.8 Plugins & Marketplace

一键安装社区开发的扩展包。

```bash
# 浏览可用插件
/plugin

# 安装特定插件
/plugin install code-intelligence
```

**推荐类型**：
- **Code Intelligence**：类型检查、跳转定义、自动错误检测
- **Language Support**：特定语言的增强支持
- **Workflow Plugins**：特定领域的工作流自动化

**插件组成**：一个插件可以打包 Skills + Hooks + Agents + MCP 服务器，一次安装配置全部到位。

> **文档**：[Plugins](https://code.claude.com/docs/en/plugins)，[Discover Plugins](https://code.claude.com/docs/en/discover-plugins)

### 2.9 Sandboxing

OS 级别的文件系统和网络隔离，确保 Claude Code 在安全的沙箱中运行。

```bash
# 启用沙箱模式
/sandbox

# 在沙箱中运行（适合自动化场景）
claude --sandbox --dangerously-skip-permissions
```

**隔离范围**：
- **文件系统**：只能访问项目目录及其子目录
- **网络**：可配置允许的域名白名单
- **进程**：限制可执行的命令

**何时使用**：运行不信任的代码（如第三方复制包）、自动化流水线中跳过权限确认。

> **文档**：[Sandboxing](https://code.claude.com/docs/en/sandboxing)

### 2.10 Fast Mode

Opus 4.6 的加速模式——更快的响应速度，适合需要快速迭代的编码场景。

**原理**：在保持 Opus 推理质量的同时，通过优化推理路径减少延迟。

**何时开启**：
- 快速原型开发
- 交互式调试（需要频繁来回）
- 代码审查（大量文件快速扫描）

> **文档**：[Fast Mode](https://code.claude.com/docs/en/fast-mode)

### 2.11 Scheduled Tasks

定时运行任务或设置提醒。

```bash
# 每 30 分钟检查构建状态
/loop "every 30m check build status and report"

# 每小时检查数据更新
/loop "every 1h check if data/raw/ has new files, if so run cleaning pipeline"
```

**经济学场景**：
- 定时检查数据平台（如 CSMAR、WIND）是否有数据更新
- 监控长时间回归的运行状态
- 提醒你定期 commit 和备份

> **文档**：[Scheduled Tasks](https://code.claude.com/docs/en/scheduled-tasks)

---

## 三、官方文档完整索引

### 核心概念

| 文档 | 说明 |
|---|---|
| [Overview](https://code.claude.com/docs/en/overview) | Claude Code 总览 |
| [How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works) | 运行原理（Agentic Loop） |
| [Best Practices](https://code.claude.com/docs/en/best-practices) | 最佳实践 |
| [Common Workflows](https://code.claude.com/docs/en/common-workflows) | 常见工作流 |
| [CLI Reference](https://code.claude.com/docs/en/cli-reference) | 命令行参考 |

### 配置与扩展

| 文档 | 说明 |
|---|---|
| [Memory (CLAUDE.md)](https://code.claude.com/docs/en/memory) | 项目记忆与指令 |
| [Settings](https://code.claude.com/docs/en/settings) | 设置系统 |
| [Permissions](https://code.claude.com/docs/en/permissions) | 权限配置 |
| [Skills](https://code.claude.com/docs/en/skills) | 技能系统 |
| [Sub-agents](https://code.claude.com/docs/en/sub-agents) | 子 Agent |
| [Hooks Guide](https://code.claude.com/docs/en/hooks-guide) | Hooks 使用指南 |
| [Hooks Reference](https://code.claude.com/docs/en/hooks) | Hooks 技术参考 |
| [MCP](https://code.claude.com/docs/en/mcp) | Model Context Protocol |
| [Plugins](https://code.claude.com/docs/en/plugins) | 插件系统 |
| [Plugins Reference](https://code.claude.com/docs/en/plugins-reference) | 插件技术参考 |
| [Features Overview](https://code.claude.com/docs/en/features-overview) | 扩展功能总览 |

### 平台与集成

| 文档 | 说明 |
|---|---|
| [VS Code](https://code.claude.com/docs/en/vs-code) | VS Code 扩展 |
| [JetBrains](https://code.claude.com/docs/en/jetbrains) | JetBrains 插件 |
| [Desktop](https://code.claude.com/docs/en/desktop) | 桌面应用 |
| [Web](https://code.claude.com/docs/en/claude-code-on-the-web) | Web 版 |
| [Chrome](https://code.claude.com/docs/en/chrome) | Chrome 集成 |
| [Slack](https://code.claude.com/docs/en/slack) | Slack 集成 |
| [GitHub Actions](https://code.claude.com/docs/en/github-actions) | GitHub CI/CD |
| [GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd) | GitLab CI/CD |
| [Remote Control](https://code.claude.com/docs/en/remote-control) | 远程控制 |

### 运维与安全

| 文档 | 说明 |
|---|---|
| [Checkpointing](https://code.claude.com/docs/en/checkpointing) | 检查点 |
| [Costs](https://code.claude.com/docs/en/costs) | 成本管理 |
| [Security](https://code.claude.com/docs/en/security) | 安全 |
| [Sandboxing](https://code.claude.com/docs/en/sandboxing) | 沙箱 |
| [Troubleshooting](https://code.claude.com/docs/en/troubleshooting) | 故障排除 |
| [Data Usage](https://code.claude.com/docs/en/data-usage) | 数据使用政策 |
| [Authentication](https://code.claude.com/docs/en/authentication) | 认证 |
| [Model Configuration](https://code.claude.com/docs/en/model-config) | 模型配置 |

### 企业与高级

| 文档 | 说明 |
|---|---|
| [Agent SDK](https://code.claude.com/docs/en/sdk) | 编程化调用 |
| [Headless Mode](https://code.claude.com/docs/en/headless) | 无头模式 |
| [Agent Teams](https://code.claude.com/docs/en/agent-teams) | 多 Agent 协调 |
| [Amazon Bedrock](https://code.claude.com/docs/en/amazon-bedrock) | AWS 部署 |
| [Google Vertex AI](https://code.claude.com/docs/en/google-vertex-ai) | GCP 部署 |
| [Enterprise Deployment](https://code.claude.com/docs/en/third-party-integrations) | 企业部署 |

> **完整索引**：[Claude Code Docs Index (llms.txt)](https://code.claude.com/docs/llms.txt)

---

## 四、社区资源精选

### 4.1 必读仓库

| 资源 | 说明 |
|---|---|
| [everything-claude-code](https://github.com/affaan-m/everything-claude-code) | 最全的 Claude Code 配置和技巧仓库（60K+ Stars） |
| [A-General-Empirical-Workflow-for-DID](https://github.com/wenddymacro/A-General-Empirical-Workflow-for-DID) | 许文立教授的通用 DID 实证 Workflow |

### 4.2 社区文章

| 文章 | 作者 | 内容 |
|---|---|---|
| [The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa) | @affaanmustafa | 基础配置完全指南 |
| [The Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352) | @affaanmustafa | 高级技巧：Token优化、验证循环、并行化 |
| [32 Claude Code Tips](https://agenticcoding.substack.com/p/32-claude-code-tips-from-basics-to) | YK | 从入门到进阶的 32 条实用建议 |

### 4.3 官方资源

| 资源 | 说明 |
|---|---|
| [code.claude.com](https://code.claude.com/) | 官方产品页 |
| [Changelog](https://code.claude.com/docs/en/changelog) | 版本更新日志 |
| [Anthropic Engineering Blog](https://www.anthropic.com/engineering) | 技术博客 |
| [Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | Agent 评估指南 |

---

## 五、版本更新追踪

Claude Code 更新频繁。保持跟进的方法：

1. **Changelog**：定期查看 [Changelog](https://code.claude.com/docs/en/changelog)
2. **`/doctor`**：运行诊断检查是否有更新
3. **Homebrew 更新**：`brew upgrade claude-code`
4. **Native 安装**：自动后台更新


---

> **上一篇**：[[Claude Code 6 - Project Architecture|#6：项目架构设计方法]]