---
title: "#7：功能全景与资源索引"
tags:
  - skills/ai-cli
order: 7
description: Claude Code 全部功能的分类索引、新兴功能速览、社区资源和官方文档链接。本章作为持续更新的入口。
---
**AI时代日新月异，本教程撰写于 2026 年 3 月 10 日，不代表 Claude Code 的最新状态。**

> 本章是"活的文档"——当 Claude Code 发布新功能时，只需更新此章。它是你持续跟进 Claude Code 进化的入口。

前六章覆盖了 Claude Code 的原理、配置、Agent、Skills、数据科学和项目架构。但 Claude Code 更新极快——几乎每周都有新功能发布。本章汇总所有功能和资源，帮助你快速找到需要的信息。

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

从任何设备（手机、平板、浏览器）继续本地 Claude Code 会话。会话始终运行在本地机器上。

```bash
# 启动
claude remote-control

# 或在现有会话中
/remote-control  # 简写 /rc
```

- **原理**：本地执行 + 远程查看，E2E 加密
- **设备**：claude.ai/code, iOS app, Android app
- **QR 码**：扫描终端中的二维码快速连接
- **文档**：[Remote Control](https://code.claude.com/docs/en/remote-control)

### 2.2 Teleport — 会话漫游

在不同环境间无缝转移工作会话。

```bash
# 将终端会话交接到桌面应用
/desktop

# 将 Web 上的长时间任务拉入本地终端
/teleport
```

### 2.3 Chrome 集成

连接 Chrome 浏览器进行 Web 应用测试和调试。

```bash
# 启用 Chrome 集成
claude --chrome

# 让 Claude 在浏览器中操作
"在 Chrome 中打开 localhost:8080，测试表单提交"
```

- **功能**：页面导航、元素交互、表单填写、截图对比
- **文档**：[Chrome](https://code.claude.com/docs/en/chrome)

### 2.4 Slack 集成

从 Slack 聊天直接触发 Claude Code 任务。

- **模式**：Code + Chat（Claude 决定路由）或 Code only
- **工作流**：Slack 消息 → Claude Code 会话 → 进度更新回 Slack → PR 创建
- **文档**：[Slack](https://code.claude.com/docs/en/slack)

### 2.5 Desktop App

独立桌面应用，提供可视化操作界面。

- **特色**：自动 worktree 隔离、可视化 diff、App 预览、PR 监控
- **平台**：macOS (Intel + Apple Silicon), Windows
- **文档**：[Desktop](https://code.claude.com/docs/en/desktop)，[Desktop Quickstart](https://code.claude.com/docs/en/desktop-quickstart)

### 2.6 GitHub Actions / GitLab CI/CD

在 CI/CD 流程中自动化 Claude Code。

```yaml
# PR 中 @claude 触发自动代码审查
# 自动创建 PR、修复 bug、回答问题
```

- **GitHub**：[GitHub Actions](https://code.claude.com/docs/en/github-actions)
- **GitLab**：[GitLab CI/CD](https://code.claude.com/docs/en/gitlab-ci-cd)

### 2.7 Agent SDK

编程化调用 Claude Code，构建自定义 Agent。

```python
# Python SDK
from claude_code import AgentSDK
agent = AgentSDK()
result = agent.run("analyze data/raw/census.csv")
```

- **语言**：Python, TypeScript
- **文档**：[Agent SDK](https://code.claude.com/docs/en/sdk)，[Headless Mode](https://code.claude.com/docs/en/headless)

### 2.8 Plugins & Marketplace

一键安装社区扩展。

```bash
/plugin  # 浏览和安装插件
```

- **文档**：[Plugins](https://code.claude.com/docs/en/plugins)，[Discover Plugins](https://code.claude.com/docs/en/discover-plugins)

### 2.9 Sandboxing

OS 级别的文件系统和网络隔离。

```bash
/sandbox  # 启用沙箱模式
```

- **文档**：[Sandboxing](https://code.claude.com/docs/en/sandboxing)

### 2.10 Fast Mode

更快的 Opus 4.6 响应速度。

- **文档**：[Fast Mode](https://code.claude.com/docs/en/fast-mode)

### 2.11 Scheduled Tasks

定时运行 prompt 或设置提醒。

```bash
/loop "every 30m check build status"  # 定时轮询
```

- **文档**：[Scheduled Tasks](https://code.claude.com/docs/en/scheduled-tasks)

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

## 六、本教程系列导航

| 章节 | 标题 | 核心内容 |
|---|---|---|
| 入门 | [Basic Skill 3.5](../Basic%20Skill%203.5%20-%20Claude%20Code.md) | 安装、认证、换源、VS Code、基本文件体系 |
| 第 1 章 | [运行原理深度解析](1%20-%20How%20Claude%20Code%20Works.md) | Agentic Loop、工具、上下文、Token 经济学 |
| 第 2 章 | [配置方法论](2%20-%20Configuration%20Deep%20Dive.md) | CLAUDE.md、Rules、Hooks、MCP、Permissions |
| 第 3 章 | [Agent 设计方法论](3%20-%20Agent%20Architecture.md) | 自定义 Agent、编排模式、Git Worktree |
| 第 4 章 | [Skills 设计](4%20-%20Skills%20for%20Economics.md) | Skills 系统、经济学技能包、Continuous Learning |
| 第 5 章 | [数据科学处理实战](5%20-%20Data%20Science%20Workflows.md) | 数据清洗、DID/IV/RDD、可视化、验证循环 |
| 第 6 章 | [项目架构设计方法论](6%20-%20Project%20Architecture.md) | CLAUDE.md 体系、Session 管理、Token 优化 |
| 第 7 章 | 本章 | 功能全景、资源索引（持续更新入口） |

---

> **上一篇**：[[6 - Project Architecture|#6：项目架构设计方法论]]
> **入门指南**：[[Basic Skill 3.5 - Claude Code|Basic Skill 3.5：Claude Code 配置指南]]
