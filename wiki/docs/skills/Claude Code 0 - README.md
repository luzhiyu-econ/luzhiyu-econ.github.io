---
title: "#0：README"
tags:
  - skills/claude-code
order: 1
description: 理解 Claude Code 的机制。
---

在开始阅读本系列之前，建议先完成基础配置：[[Basic Skill 3.5 - Claude Code|Basic Skill 3.5：Claude Code 配置指南]]

## 核心原则

> 对于 Vibe Coding 的方法论，最重要的是**先计划再实施，先思考再动手**。这不仅是对模型的要求，也是对使用者的要求。

根据任务规模，使用策略有所不同：

- **简单任务**：现在的 Agentic Coding Tools 能够很好地理解自然语言背后的意思，它甚至能够帮你完善一些不曾想过的逻辑漏洞或方法缺陷。
- **大型项目**：因为模型上下文的限制，它可能无法记住太多本该需要记住的内容，因此会因为幻觉问题导致错上加错——为了修复一些问题而引入更多的问题。

## 关键实践

**分步骤编码**：一小块功能一小块功能地进行实现，如果需要最后对接，再让它单独处理对接的问题。不要寄希望于它能够完全基于自然语言理解和遵循你的想法和预期。


## 本教程系列导航

| 章节 | 标题 | 核心内容 |
| --- | --- | --- |
| 入门 | [[Basic Skill 3.5 - Claude Code|Basic Skill 3.5]] | 安装、认证、换源、VS Code、基本文件体系 |
| 第 1 章 | [[Claude Code 1 - How Claude Code Works|#1：Claude Code 工作原理]] | Agentic Loop、工具、上下文、Token 经济学 |
| 第 2 章 | [[Claude Code 2 - Configuration Deep Dive|#2：Claude Code 配置方法]] | CLAUDE.md、Rules、Hooks、MCP、Permissions |
| 第 3 章 | [[Claude Code 3 - Agent Architecture|#3：Agent 设计方法论]] | 自定义 Agent、编排模式、Git Worktree |
| 第 4 章 | [[Claude Code 4 - Skills for Economics|#4：Skills 设计]] | Skills 系统、经济学技能包、Continuous Learning |
| 第 5 章 | [[Claude Code 5 - Data Science Workflows|#5：数据科学处理实战]] | 数据清洗、DID/IV/RDD、可视化、验证循环 |
| 第 6 章 | [[Claude Code 6 - Project Architecture|#6：项目架构设计方法论]] | CLAUDE.md 体系、Session 管理、Token 优化 |
| 第 7 章 | [[Claude Code 7 - Feature Catalog and Resources|#7：功能全景与资源索引]] | 功能全景、资源索引（持续更新入口） |