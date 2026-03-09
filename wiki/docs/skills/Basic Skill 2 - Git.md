---
title: "#2：Git 版本控制从入门到工作流"
tags:
  - skills/basic
order: 3
description: 理解 Git 的核心概念，掌握日常开发中最常用的操作与协作工作流。
---

> 没有版本控制的编程，就像没有存档的游戏——一次失误可能让你回到起点。

你一定经历过这样的场景：

```
论文_v1.docx
论文_v2.docx
论文_v2_导师修改.docx
论文_v2_导师修改_最终版.docx
论文_v2_导师修改_最终版_真的最终版.docx
```

Git 就是为了消灭这种混乱而生的。

---

## 一、Git 是什么

Git 是一个**分布式版本控制系统**，由 Linus Torvalds（Linux 之父）在 2005 年创建。它的核心能力：

1. **记录每一次修改**：谁在什么时间改了什么，全部可追溯
2. **随时回退**：任何版本都可以恢复
3. **并行开发**：多人可以同时修改不同部分，最后合并
4. **分支实验**：想尝试新功能？开个分支，不影响主线

### Git vs GitHub

| | Git | GitHub |
|---|---|---|
| 是什么 | 版本控制工具（在本地运行） | 代码托管平台（网站） |
| 类比 | 视频编辑软件 | YouTube |
| 功能 | 追踪文件变化、管理版本 | 存储远程仓库、协作、Issue、PR |
| 替代品 | — | GitLab、Gitee、Bitbucket |

Git 是本地工具，没有网络也能用。GitHub 是基于 Git 的在线平台，提供了协作、托管、社交等功能。

---

## 二、核心概念：三区模型

理解 Git 的关键在于理解它的**三个区域**：

```
┌─────────────────────────────────────────────────────┐
│                    你的项目目录                       │
│                                                     │
│  ┌─────────────┐   git add   ┌──────────────┐      │
│  │  工作区       │ ─────────▶ │  暂存区        │      │
│  │ Working Dir  │            │ Staging Area  │      │
│  │             │   ◀──────── │              │      │
│  │ 你正在编辑的  │  git restore │ 准备提交的     │      │
│  │ 文件         │            │ 修改          │      │
│  └─────────────┘            └──────┬───────┘      │
│                                     │ git commit    │
│                              ┌──────▼───────┐      │
│                              │  本地仓库      │      │
│                              │ Repository    │      │
│                              │              │      │
│                              │ 所有历史版本   │      │
│                              └──────────────┘      │
└─────────────────────────────────────────────────────┘
```

- **工作区（Working Directory）**：你当前看到和编辑的文件
- **暂存区（Staging Area / Index）**：选好的"要提交的修改"，相当于购物车
- **本地仓库（Repository）**：所有历史版本的数据库，存在 `.git/` 目录中

为什么需要暂存区？因为你可能同时修改了 10 个文件，但只想提交其中 3 个——暂存区让你精确控制每次提交包含哪些变化。

---

## 三、初始配置

安装 Git 后，首先配置你的身份信息（每台电脑只需做一次）：

```bash
git config --global user.name "Zhiyu Lu"
git config --global user.email "your_email@example.com"

# 查看当前配置
git config --list
```

推荐的额外配置：

```bash
# 设置默认分支名为 main（新标准）
git config --global init.defaultBranch main

# 处理换行符（参考第 0 篇）
git config --global core.autocrlf input   # macOS/Linux
git config --global core.autocrlf true    # Windows

# 设置默认编辑器
git config --global core.editor "code --wait"  # VS Code
```

---

## 四、基础操作

### 4.1 创建仓库

```bash
# 方式一：把现有目录变成 Git 仓库
cd myproject
git init
# Initialized empty Git repository in /Users/zhiyu/myproject/.git/

# 方式二：克隆远程仓库
git clone https://github.com/username/repo.git
cd repo
```

### 4.2 日常工作流：改 → 存 → 交

```bash
# 1. 编辑文件（在编辑器中修改代码）

# 2. 查看状态——哪些文件被修改了
git status

# 3. 查看具体改了什么
git diff                    # 工作区 vs 暂存区
git diff --staged           # 暂存区 vs 最新提交

# 4. 添加到暂存区
git add main.py             # 添加指定文件
git add src/                # 添加整个目录
git add .                   # 添加所有修改（谨慎使用）

# 5. 提交
git commit -m "feat: add data preprocessing module"
```

### 4.3 提交信息的写法

好的提交信息就像好的日记——未来的你会感谢现在的你。

```bash
# 好的提交信息
git commit -m "fix: resolve CSV encoding error on Windows"
git commit -m "feat: add export to Excel functionality"
git commit -m "docs: update API usage examples in README"
git commit -m "refactor: extract validation logic into utils"

# 差的提交信息
git commit -m "update"
git commit -m "fix bug"
git commit -m "asdfgh"
```

常用前缀约定（Conventional Commits）：

| 前缀 | 含义 |
|---|---|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档变更 |
| `refactor` | 重构（不改变功能） |
| `style` | 代码格式调整 |
| `test` | 测试相关 |
| `chore` | 构建、工具等杂项 |

### 4.4 查看历史

```bash
git log                     # 完整历史
git log --oneline           # 每条记录一行（简洁）
git log --oneline --graph   # 带分支图的简洁历史
git log -5                  # 最近 5 条
git log --author="zhiyu"    # 按作者筛选
git log -- main.py          # 某个文件的修改历史
```

输出示例：

```
* a1b2c3d (HEAD -> main) feat: add data export
* e4f5g6h fix: handle empty input
* i7j8k9l docs: update README
* m0n1o2p initial commit
```

---

## 五、分支：平行宇宙

分支是 Git 最强大的特性之一。它让你可以在不影响主线的情况下开发新功能。

```
      main:    A ── B ── C ── D ── E ── F（合并后）
                          \           /
      feature:             C1 ── C2 ──（新功能开发完成）
```

### 5.1 基本操作

```bash
# 查看所有分支
git branch                    # 本地分支
git branch -a                 # 包括远程分支

# 创建新分支
git branch feature-login

# 切换分支
git switch feature-login      # 推荐（Git 2.23+）
git checkout feature-login    # 传统方式

# 创建并切换（一步到位）
git switch -c feature-login
git checkout -b feature-login

# 删除分支
git branch -d feature-login   # 已合并的分支
git branch -D feature-login   # 强制删除
```

### 5.2 合并分支

```bash
# 先切回主分支
git switch main

# 合并 feature 分支到当前分支
git merge feature-login
```

如果两个分支修改了同一个文件的同一部分，Git 会标记**合并冲突**：

```
<<<<<<< HEAD
这是 main 分支的版本
=======
这是 feature 分支的版本
>>>>>>> feature-login
```

解决方法：手动编辑文件，删除冲突标记，保留你想要的内容，然后：

```bash
git add conflicted_file.py
git commit -m "merge: resolve conflict in data parser"
```

---

## 六、远程协作

### 6.1 关联远程仓库

```bash
# 查看已关联的远程仓库
git remote -v

# 添加远程仓库（通常命名为 origin）
git remote add origin https://github.com/username/repo.git
```

### 6.2 推送与拉取

```bash
# 推送本地提交到远程
git push origin main

# 首次推送并设置上游跟踪
git push -u origin main
# 之后就可以简写
git push

# 从远程拉取最新代码
git pull                    # = git fetch + git merge
git fetch                   # 只下载，不合并（更安全）
```

### 6.3 GitHub 协作工作流

```
1. Fork 别人的仓库        → 你的 GitHub 账号下有了一份副本
2. Clone 到本地           → git clone https://github.com/YOU/repo.git
3. 创建功能分支           → git switch -c fix-typo
4. 修改、提交、推送       → git push origin fix-typo
5. 在 GitHub 上发起 PR   → Pull Request: fix-typo → main
6. 代码审查 + 合并        → 仓库维护者合并你的改动
```

```
你的 Fork（GitHub）     原始仓库（GitHub）
    ▲                       ▲
    │ push                  │ Pull Request
    │                       │
你的本地仓库  ─ ─ ─ ─ ─ ─ ┘
```

---

## 七、.gitignore：告诉 Git 忽略哪些文件

项目中有些文件不应该被 Git 追踪——比如密码、编译产物、系统文件。

在项目根目录创建 `.gitignore` 文件：

```gitignore
# 操作系统文件
.DS_Store
Thumbs.db

# 编辑器配置
.vscode/
.idea/
*.swp

# Python
__pycache__/
*.pyc
.env
venv/

# Node.js
node_modules/
dist/

# 数据和密钥
*.csv
*.xlsx
secrets.json
.env

# Jupyter Notebook 检查点
.ipynb_checkpoints/
```

> **提示**：[gitignore.io](https://www.toptal.com/developers/gitignore) 可以根据你的语言和工具自动生成 `.gitignore`。

---

## 八、急救手册：常见问题

### 8.1 撤销修改

```bash
# 场景：修改了文件但还没 add，想恢复原样
git restore main.py

# 场景：已经 add 了，想从暂存区撤回（文件改动保留）
git restore --staged main.py

# 场景：想彻底撤销工作区和暂存区的所有改动
git restore .
```

### 8.2 修改最近一次提交

```bash
# 场景：提交信息写错了
git commit --amend -m "fix: correct typo in config"

# 场景：忘了加一个文件
git add forgotten_file.py
git commit --amend --no-edit    # 追加到上一次提交，不改信息
```

> **注意**：`--amend` 只能用于修改**尚未推送到远程**的提交。已推送的提交不要 amend，否则会导致历史不一致。

### 8.3 回退到历史版本

```bash
# 查看历史，找到目标 commit 的哈希值
git log --oneline

# 方式一：创建一个新提交来撤销某次修改（安全，推荐）
git revert a1b2c3d

# 方式二：回退到某个版本（危险，会丢失之后的提交）
git reset --hard a1b2c3d       # 硬重置，丢弃所有改动
git reset --soft a1b2c3d       # 软重置，保留改动在暂存区
```

### 8.4 暂存当前工作

```bash
# 场景：正在开发功能 A，突然需要修一个紧急 bug
git stash                      # 把当前改动暂存起来
# 切换分支去修 bug...
git stash pop                  # 修完后恢复之前的改动

git stash list                 # 查看所有暂存
```

---

## 九、Git 操作速查表

```
┌──────────────────────────────────────────────────────────────┐
│                       Git 日常工作流                          │
│                                                              │
│   编辑文件 → git add → git commit → git push                 │
│                                                              │
│   ┌─────────┐    add    ┌─────────┐  commit  ┌──────────┐  │
│   │ 工作区   │ ────────▶ │ 暂存区   │ ───────▶ │ 本地仓库  │  │
│   └─────────┘           └─────────┘          └─────┬────┘  │
│                                                     │ push   │
│                                               ┌─────▼────┐  │
│                                               │ 远程仓库  │  │
│                                               │ (GitHub)  │  │
│                                               └──────────┘  │
│                                                              │
│   常用命令：                                                  │
│   git status        查看状态                                  │
│   git diff          查看修改                                  │
│   git log --oneline 查看历史                                  │
│   git branch        管理分支                                  │
│   git stash         暂存改动                                  │
│   git restore       撤销修改                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 小结

| 场景 | 命令 |
|---|---|
| 开始新项目 | `git init` 或 `git clone URL` |
| 日常提交 | `git add .` → `git commit -m "msg"` → `git push` |
| 查看状态 | `git status`, `git diff`, `git log --oneline` |
| 分支操作 | `git switch -c branch`, `git merge branch` |
| 撤销修改 | `git restore file`, `git reset`, `git revert` |
| 远程同步 | `git push`, `git pull`, `git fetch` |
| 临时存档 | `git stash`, `git stash pop` |

Git 的学习曲线确实有点陡，但你不需要一次学会所有命令。**先掌握 add → commit → push 的基本流程**，遇到问题再查对应的命令，慢慢你的 Git 技能树就会丰满起来。

---

> **下一篇**：[[Basic Skill 3 - Dev Environment|开发环境搭建指南]] —— 配置一个顺手的开发环境，事半功倍。
