---
title: "#2：终端与命令行基础"
tags:
  - skills/basic
order: 2
description: 掌握终端的核心概念与必备命令，学会用键盘高效操控计算机。
---

> 图形界面让简单的事更简单，命令行让困难的事成为可能。

每一个开发者迟早要面对那个黑底白字的窗口。它看起来很吓人，但一旦掌握，你会发现**键盘比鼠标快得多**。

---

## 一、概念辨析：终端、Shell、控制台

这三个词经常被混用，但它们是不同的东西：

```
┌──────────────────────────────────────────┐
│           终端（Terminal）                 │
│  ┌────────────────────────────────────┐  │
│  │  你看到的那个窗口程序               │  │
│  │  macOS: Terminal.app / iTerm2      │  │
│  │  Windows: Windows Terminal         │  │
│  │  Linux: GNOME Terminal / Konsole   │  │
│  └──────────────┬─────────────────────┘  │
│                 │ 启动                    │
│  ┌──────────────▼─────────────────────┐  │
│  │  Shell（命令解释器）                │  │
│  │  接收你输入的命令，解释并执行        │  │
│  │  bash / zsh / fish / PowerShell    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- **终端（Terminal）**：显示文字的窗口程序，负责输入和输出的展示
- **Shell**：运行在终端里的命令解释器，负责理解和执行你的命令
- **控制台（Console）**：历史遗留概念，原指物理终端设备，现在基本等同于终端

### 常见的 Shell

| Shell | 系统 | 特点 |
|---|---|---|
| `bash` | Linux 默认、macOS 旧版 | 最通用，脚本兼容性最好 |
| `zsh` | macOS 默认（Catalina 起） | bash 的超集，补全更强，插件生态丰富 |
| `fish` | 需手动安装 | 开箱即用的高亮和补全，语法与 bash 不兼容 |
| `PowerShell` | Windows 默认 | 面向对象（输出是对象而非文本），功能强大 |
| `cmd` | Windows 传统 | 功能有限，逐渐被 PowerShell 取代 |

```bash
# 查看当前使用的 Shell
echo $SHELL        # macOS / Linux
$PSVersionTable     # PowerShell
```

---

## 二、导航命令：在文件系统中移动

### 2.1 知道自己在哪

```bash
pwd                 # Print Working Directory，显示当前路径
# /Users/zhiyu/projects
```

### 2.2 查看目录内容

```bash
ls                  # 列出当前目录的文件和文件夹
ls -l               # 详细信息（权限、大小、日期）
ls -la              # 包括隐藏文件（以 . 开头的）
ls -lh              # 人类可读的文件大小（KB, MB）

# Windows PowerShell 等价命令
dir
Get-ChildItem
```

`ls -la` 的输出解读：

```
drwxr-xr-x  5 zhiyu  staff   160 Mar 10 10:00 projects
-rw-r--r--  1 zhiyu  staff  2048 Mar 10 09:30 notes.md
│            │  │       │     │         │         │
类型+权限  链接数 所有者  组   大小      修改时间    文件名
```

### 2.3 切换目录

```bash
cd projects         # 进入 projects 目录
cd ..               # 返回上一级目录
cd ../..            # 返回上两级
cd ~                # 回到用户主目录（Home）
cd -                # 回到上一次所在的目录（很实用！）
cd /                # 回到根目录
```

> **技巧**：输入路径时按 `Tab` 键可以自动补全，这是终端最重要的快捷键之一。

---

## 三、文件与目录操作

### 3.1 创建

```bash
mkdir myproject              # 创建目录
mkdir -p a/b/c               # 递归创建多层目录

touch readme.md              # 创建空文件（或更新已有文件的时间戳）
```

### 3.2 复制、移动、重命名

```bash
cp file.txt backup.txt            # 复制文件
cp -r folder/ folder_backup/      # 递归复制目录（-r 必须加）

mv old_name.txt new_name.txt      # 重命名
mv file.txt ~/Desktop/            # 移动到桌面
```

### 3.3 删除

```bash
rm file.txt                  # 删除文件（没有回收站！直接消失）
rm -r folder/                # 递归删除目录及其内容
rm -ri folder/               # 删除前逐个确认（安全选项）
```

> **警告**：`rm -rf /` 会删除整个系统的所有文件。**永远不要**运行这个命令。终端里删除不经过回收站，一旦执行无法恢复。

### 3.4 跨平台命令对照表

| 操作 | macOS / Linux | Windows (PowerShell) | Windows (cmd) |
|---|---|---|---|
| 当前路径 | `pwd` | `pwd` / `Get-Location` | `cd` |
| 列出文件 | `ls` | `ls` / `Get-ChildItem` | `dir` |
| 切换目录 | `cd` | `cd` / `Set-Location` | `cd` |
| 创建目录 | `mkdir` | `mkdir` / `New-Item -Type Directory` | `mkdir` |
| 复制 | `cp` | `cp` / `Copy-Item` | `copy` |
| 移动/重命名 | `mv` | `mv` / `Move-Item` | `move` / `ren` |
| 删除文件 | `rm` | `rm` / `Remove-Item` | `del` |
| 删除目录 | `rm -r` | `rm -r` / `Remove-Item -Recurse` | `rmdir /s` |
| 清屏 | `clear` | `clear` / `cls` | `cls` |

---

## 四、查看文件内容

```bash
cat file.txt          # 输出整个文件内容
head -n 20 file.txt   # 查看前 20 行
tail -n 20 file.txt   # 查看后 20 行
tail -f log.txt       # 实时追踪文件尾部（看日志用）

less file.txt         # 分页查看（按 q 退出，空格翻页，/ 搜索）

wc file.txt           # 统计行数、单词数、字节数
wc -l file.txt        # 只看行数
```

### 小场景：快速了解一个项目

```bash
ls -la                # 看项目有哪些文件
cat README.md         # 看说明文档
wc -l *.py            # 看每个 Python 文件有多少行代码
head -n 5 main.py     # 瞄一眼主文件开头
```

---

## 五、搜索与查找

### 5.1 查找文件

```bash
find . -name "*.py"                  # 在当前目录递归查找所有 .py 文件
find . -name "*.log" -mtime -7       # 找最近 7 天修改过的 .log 文件
find . -type d -name "node_modules"  # 只找目录
```

### 5.2 搜索文件内容

```bash
grep "import" main.py                # 在文件中搜索包含 "import" 的行
grep -r "TODO" .                     # 递归搜索当前目录所有文件
grep -rn "error" --include="*.log"   # 递归搜索，显示行号，只搜 .log 文件
grep -i "hello" file.txt             # 忽略大小写
```

### 5.3 查找命令位置

```bash
which python           # 查看 python 命令的实际路径
which git              # /usr/bin/git

whereis python         # 显示命令的所有相关路径（Linux）
```

---

## 六、管道与重定向：命令的组合艺术

这是 Unix 哲学的精髓——**小工具通过管道组合成强大的工作流**。

### 6.1 管道 `|`

把前一个命令的输出，作为后一个命令的输入：

```bash
# 查找所有 Python 文件并统计数量
find . -name "*.py" | wc -l

# 查看进程列表，筛选出 python 相关的
ps aux | grep python

# 查看最占空间的 10 个文件
du -sh * | sort -rh | head -10

# 统计代码中 import 了多少个不同的库
grep -rh "^import " *.py | sort -u | wc -l
```

```
命令A ──输出──▶ | ──输入──▶ 命令B ──输出──▶ | ──输入──▶ 命令C
```

### 6.2 重定向

```bash
# 输出重定向（覆盖写入文件）
echo "hello" > output.txt

# 输出重定向（追加到文件）
echo "world" >> output.txt

# 将错误信息重定向到文件
python script.py 2> error.log

# 同时重定向标准输出和错误输出
python script.py > output.log 2>&1

# 输入重定向
sort < unsorted.txt > sorted.txt
```

### 6.3 特殊设备

```bash
# 丢弃所有输出（静默运行）
noisy_command > /dev/null 2>&1

# 同时输出到屏幕和文件
echo "log this" | tee logfile.txt
```

---

## 七、环境变量与 PATH

### 7.1 什么是环境变量

环境变量是操作系统中的**全局键值对**，用于存储配置信息：

```bash
echo $HOME             # 用户主目录
echo $USER             # 当前用户名
echo $PATH             # 命令搜索路径（最重要！）
echo $SHELL            # 当前 Shell

# 查看所有环境变量
env

# 设置临时环境变量（仅当前会话有效）
export MY_VAR="hello"
echo $MY_VAR
```

### 7.2 PATH 机制

当你输入 `python` 时，Shell 怎么知道去哪里找这个程序？答案是 **PATH**：

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# PATH 是一个用冒号分隔的目录列表
# Shell 会从左到右依次在这些目录中查找命令
```

```
你输入: python
  │
  ▼
Shell 查找 PATH 中的目录：
  /usr/local/bin/python  ← 找到了！执行这个
  /usr/bin/python
  /bin/python
  ...
```

### 7.3 修改 PATH

```bash
# 临时添加（当前会话）
export PATH="$HOME/my_tools:$PATH"

# 永久添加（写入配置文件）
# 对于 zsh（macOS 默认）
echo 'export PATH="$HOME/my_tools:$PATH"' >> ~/.zshrc
source ~/.zshrc    # 立即生效

# 对于 bash（Linux 默认）
echo 'export PATH="$HOME/my_tools:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

> **常见问题**：安装了 Python/Node.js 但终端找不到？十有八九是 PATH 没配对。用 `which python` 和 `echo $PATH` 排查。

---

## 八、终端快捷键（提升 10 倍效率）

这些快捷键在 bash 和 zsh 中通用：

| 快捷键 | 功能 |
|---|---|
| `Tab` | 自动补全（最常用） |
| `Ctrl + C` | 中断当前运行的命令 |
| `Ctrl + D` | 退出当前 Shell（等同于输入 `exit`） |
| `Ctrl + L` | 清屏（等同于 `clear`） |
| `Ctrl + A` | 光标移到行首 |
| `Ctrl + E` | 光标移到行尾 |
| `Ctrl + W` | 删除光标前一个单词 |
| `Ctrl + U` | 删除光标到行首的内容 |
| `Ctrl + R` | 反向搜索历史命令（极其实用！） |
| `↑` / `↓` | 浏览历史命令 |
| `!!` | 重复执行上一条命令 |
| `sudo !!` | 用 sudo 重新执行上一条命令 |

### 历史命令搜索

```bash
# Ctrl + R 后输入关键词，即可搜索历史命令
(reverse-i-search)`git': git push origin master

# 查看历史命令
history
history | grep "docker"    # 搜索包含 docker 的历史命令
```

---

## 九、实战练习

试着完成以下操作来检验自己对终端的掌握程度：

```bash
# 1. 创建一个项目目录结构
mkdir -p myproject/{src,tests,docs}

# 2. 创建几个文件
touch myproject/src/main.py
touch myproject/tests/test_main.py
touch myproject/README.md

# 3. 写入内容
echo '# My Project' > myproject/README.md
echo 'print("hello world")' > myproject/src/main.py

# 4. 查看目录树（如果安装了 tree 命令）
tree myproject
# myproject
# ├── README.md
# ├── docs
# ├── src
# │   └── main.py
# └── tests
#     └── test_main.py

# 5. 搜索项目中的所有 Python 文件
find myproject -name "*.py"

# 6. 统计总代码行数
find myproject -name "*.py" | xargs wc -l

# 7. 打包整个项目（bonus）
tar -czf myproject.tar.gz myproject/
```

---

## 小结

| 类别 | 核心命令 |
|---|---|
| 导航 | `pwd`, `cd`, `ls` |
| 文件操作 | `mkdir`, `touch`, `cp`, `mv`, `rm` |
| 查看内容 | `cat`, `head`, `tail`, `less`, `wc` |
| 搜索 | `find`, `grep`, `which` |
| 组合 | `\|`（管道）, `>`（重定向）, `tee` |
| 环境 | `echo $PATH`, `export`, `source` |
| 效率 | `Tab`, `Ctrl+R`, `Ctrl+C`, `!!` |

终端是你和计算机之间最直接、最高效的沟通方式。一开始会慢，但随着肌肉记忆的建立，你会越来越快——直到有一天你发现自己在命令行里做什么都比 GUI 快。

---

> **下一篇**：[[Basic Skill 3 - Git|Git 版本控制从入门到工作流]]
