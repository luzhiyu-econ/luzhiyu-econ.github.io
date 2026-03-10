---
title: "#4：开发环境搭建指南"
tags:
  - skills/basic
order: 4
description: 从包管理器到编辑器，配置一个高效、美观的开发环境。
---

> 工欲善其事，必先利其器。好的开发环境是一切工作的前提。

很多初学者把大量时间花在"配环境"上，踩了无数坑。本篇把搭建开发环境这件事系统化，帮你一次走通。

---

## 一、系统包管理器：第一个要装的东西

在安装任何开发工具之前，先装好系统级的包管理器。

### macOS：Homebrew

```bash
# 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 验证安装
brew --version

# 常用操作
brew install git              # 安装
brew upgrade git              # 升级
brew uninstall git            # 卸载
brew list                     # 查看已安装
brew search python            # 搜索
brew update                   # 更新 Homebrew 自身
brew cleanup                  # 清理旧版本缓存
```

> **Apple Silicon (M1/M2/M3) 注意**：Homebrew 安装路径从 `/usr/local` 变成了 `/opt/homebrew`。安装完成后需要按照提示把它加入 PATH。

### Linux (Ubuntu/Debian)：apt

```bash
sudo apt update               # 更新软件源（每次安装前建议先执行）
sudo apt install git           # 安装
sudo apt upgrade               # 升级所有已安装的包
sudo apt remove git            # 卸载
sudo apt autoremove            # 清理不再需要的依赖
```

### Windows：winget / Chocolatey

```powershell
# winget（Windows 10/11 自带）
winget install Git.Git
winget install Python.Python.3.12
winget upgrade --all

# Chocolatey（需要先安装）
choco install git python nodejs -y
```

---

## 二、编辑器与 IDE 的选择

### 光谱：从轻量到重量

```
轻量 ◀─────────────────────────────────────────────▶ 重量

 Vim/Neovim    VS Code / Cursor    PyCharm / WebStorm
  │               │                      │
  纯终端          轻量级 IDE              全功能 IDE
  学习曲线陡      上手快，扩展丰富         开箱即用
  速度极快        速度快                   较重但功能全
  极度可定制      高度可定制               配置少
```

### 推荐选择

| 场景 | 推荐 |
|---|---|
| 通用开发（Python / JS / 前端） | **VS Code** 或 **Cursor** |
| Python 专项（数据科学、机器学习） | **VS Code** + Python 扩展，或 **PyCharm** |
| 远程服务器上临时编辑 | **Vim** 或 **nano** |
| AI 辅助编程 | **Cursor**（内置 AI，基于 VS Code） |

### 安装

```bash
# macOS
brew install --cask visual-studio-code
brew install --cask cursor

# 或者直接去官网下载：
# VS Code:  https://code.visualstudio.com
# Cursor:   https://cursor.com
```

### VS Code / Cursor 推荐扩展

| 扩展 | 功能 |
|---|---|
| Python | Python 语言支持、调试、Lint |
| Pylance | Python 智能补全（微软出品） |
| Jupyter | 在编辑器中运行 Notebook |
| GitLens | Git 增强（谁在什么时候改了这行） |
| Markdown All in One | Markdown 编写增强 |
| Remote - SSH | 远程服务器开发 |
| Even Better TOML | TOML 文件支持 |
| Error Lens | 把错误信息直接显示在代码行旁 |

```bash
# 在终端批量安装扩展
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension ms-toolsai.jupyter
```

### 实用设置

在 VS Code / Cursor 中按 `Cmd+,`（macOS）或 `Ctrl+,`（Windows）打开设置，推荐调整：

```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 4,
  "editor.formatOnSave": true,
  "editor.minimap.enabled": false,
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "terminal.integrated.fontSize": 13,
  "workbench.colorTheme": "One Dark Pro"
}
```

---

## 三、Python 环境管理

Python 环境管理是初学者踩坑最多的地方。核心问题：**不同项目可能需要不同版本的 Python 和不同的库，它们不能混在一起。**

### 3.1 方案对比

| 工具 | 定位 | 优点 | 缺点 |
|---|---|---|---|
| **Miniconda** | Python 版本 + 虚拟环境 + 包管理 | 科研生态最好，管理简单 | 体积稍大，有时和 pip 冲突 |
| **Anaconda** | Miniconda 的完整版 | 预装 200+ 科学计算包 | 体积巨大（3GB+） |
| **venv + pip** | Python 内置虚拟环境 | 轻量，无需额外安装 | 不管理 Python 版本 |
| **uv** | 新一代 Python 包管理器 | 极快（Rust 编写），兼容 pip | 较新，生态还在成长 |

### 3.2 推荐路径：Miniconda

```bash
# macOS / Linux 安装 Miniconda
# 从 https://docs.conda.io/en/latest/miniconda.html 下载
# 或者用 brew（macOS）
brew install --cask miniconda

# 初始化（让终端启动时自动激活 conda）
conda init zsh    # macOS
conda init bash   # Linux
```

### 3.3 虚拟环境管理

```bash
# 创建环境（指定 Python 版本）
conda create -n myproject python=3.11 -y

# 激活环境
conda activate myproject

# 激活后，终端提示符会变成：
# (myproject) zhiyu@mac:~$

# 安装包
conda install pandas numpy matplotlib
pip install some-package         # conda 没有的包用 pip

# 退出环境
conda deactivate

# 查看所有环境
conda env list

# 删除环境
conda env remove -n myproject

# 导出环境（方便别人复现）
conda env export > environment.yml

# 从 yml 文件创建环境
conda env create -f environment.yml
```

### 3.4 使用 venv（轻量方案）

```bash
# 创建虚拟环境
python -m venv .venv

# 激活
source .venv/bin/activate       # macOS / Linux
.venv\Scripts\activate          # Windows

# 安装依赖
pip install pandas numpy

# 导出依赖
pip freeze > requirements.txt

# 从 requirements.txt 安装
pip install -r requirements.txt

# 退出
deactivate
```

### 3.5 使用 uv（新一代工具）

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
# 或
brew install uv

# 创建项目
uv init myproject
cd myproject

# 添加依赖
uv add pandas numpy requests

# 运行脚本
uv run python main.py

# uv 自动管理虚拟环境和 Python 版本，无需手动操作
```

---

## 四、Node.js 环境

如果你涉及前端开发或需要使用 npm 包：

### 使用 nvm 管理 Node.js 版本

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重启终端后
nvm install --lts         # 安装最新 LTS 版本
nvm install 20            # 安装指定大版本
nvm use 20                # 切换版本
nvm alias default 20      # 设置默认版本

# 验证
node --version
npm --version
```

### 包管理器

```bash
# npm（随 Node.js 自带）
npm install express
npm install -D prettier     # 开发依赖

# pnpm（更快、更节省空间）
npm install -g pnpm
pnpm install express
```

---

## 五、终端美化

一个好看的终端不只是颜值，更重要的是**信息密度**——让你一眼看到当前目录、Git 分支、Python 环境等关键信息。

### 5.1 Oh My Zsh（macOS / Linux）

```bash
# 安装 Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

推荐插件（编辑 `~/.zshrc` 中的 `plugins` 行）：

```bash
plugins=(
  git                  # Git 快捷别名（gst, gco, gp 等）
  zsh-autosuggestions  # 根据历史自动建议命令
  zsh-syntax-highlighting  # 命令语法高亮
  z                    # 智能目录跳转（输入部分路径名即可跳转）
)
```

安装第三方插件：

```bash
# zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM}/plugins/zsh-autosuggestions

# zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM}/plugins/zsh-syntax-highlighting
```

### 5.2 Starship（跨平台提示符）

Starship 是一个用 Rust 编写的极快终端提示符，支持所有主流 Shell：

```bash
# 安装
brew install starship        # macOS
curl -sS https://starship.rs/install.sh | sh   # Linux

# 在 ~/.zshrc 末尾添加
eval "$(starship init zsh)"

# 在 ~/.bashrc 末尾添加（如果用 bash）
eval "$(starship init bash)"
```

Starship 会自动显示：
- 当前目录
- Git 分支和状态
- Python / Node.js 版本
- 上一个命令的执行时间
- 命令是否失败

### 5.3 推荐终端应用

| 平台 | 推荐终端 |
|---|---|
| macOS | **iTerm2**（功能最全）或内置 Terminal.app |
| Windows | **Windows Terminal**（微软官方，支持多标签） |
| Linux | 发行版自带即可，或 **Alacritty**（GPU 加速） |

---

## 六、其他实用工具

| 工具 | 用途 | 安装 |
|---|---|---|
| `tree` | 以树形展示目录结构 | `brew install tree` |
| `htop` | 进程监控（比 top 好用） | `brew install htop` |
| `jq` | 命令行 JSON 处理 | `brew install jq` |
| `tldr` | 简化版 man 手册 | `brew install tldr` |
| `bat` | 带语法高亮的 cat | `brew install bat` |
| `ripgrep` (`rg`) | 极快的代码搜索 | `brew install ripgrep` |
| `fd` | 更友好的 find | `brew install fd` |
| `fzf` | 模糊搜索（文件、历史命令） | `brew install fzf` |
| `eza` | 现代化的 ls 替代 | `brew install eza` |
| `delta` | 更好的 Git diff 展示 | `brew install git-delta` |

推荐在 `~/.zshrc` 中设置别名：

```bash
alias cat="bat"
alias ls="eza"
alias find="fd"
alias grep="rg"
alias top="htop"
```

---

## 七、一键搭建清单

下面是一台新 Mac 的推荐安装顺序：

```bash
# 1. 安装 Xcode Command Line Tools（Git 等基础工具）
xcode-select --install

# 2. 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. 通过 brew 安装开发工具
brew install git node python uv ripgrep bat fd fzf eza htop jq tldr tree

# 4. 安装 GUI 应用
brew install --cask visual-studio-code cursor iterm2 miniconda

# 5. 配置 Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 6. 安装 Starship
brew install starship
echo 'eval "$(starship init zsh)"' >> ~/.zshrc

# 7. 初始化 conda
conda init zsh

# 8. 配置 Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global init.defaultBranch main
git config --global core.autocrlf input
```

---

## 小结

| 层级 | 要装什么 | 工具 |
|---|---|---|
| 系统包管理 | 统一安装渠道 | Homebrew / apt / winget |
| 编辑器 | 写代码的地方 | VS Code / Cursor |
| Python 环境 | 虚拟环境隔离 | Miniconda / venv / uv |
| Node.js 环境 | 前端 / npm 工具 | nvm + pnpm |
| 终端增强 | 高效的命令行体验 | Oh My Zsh + Starship |
| 实用工具 | 提升日常效率 | bat, ripgrep, fzf, eza... |

环境搭建是一次性投入——花半天时间配好一次，之后几年都受益。不要怕折腾，每一次配置过程都在加深你对系统的理解。

---

> **下一篇**：[[Basic Skill 5 - Encoding and Formats|文件编码与数据格式]]
