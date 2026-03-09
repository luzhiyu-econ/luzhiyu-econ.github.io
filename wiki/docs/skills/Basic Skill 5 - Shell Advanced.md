---
title: "#5：Shell 进阶与效率提升"
tags:
  - skills/basic
order: 7
description: 掌握 Shell 脚本、正则表达式、文本处理工具与进程管理，让终端能力翻倍。
---

> 初学者用终端执行命令，高手用终端自动化一切。

第 1 篇介绍了终端的基础命令。本篇进入进阶领域：用脚本批量处理任务、用正则表达式精准匹配文本、用现代工具替代传统命令。

---

## 一、Shell 脚本基础

Shell 脚本就是把你在终端里手动输入的命令**写成文件，一键执行**。

### 1.1 第一个脚本

```bash
#!/bin/bash

echo "Hello, $(whoami)!"
echo "今天是 $(date '+%Y-%m-%d')"
echo "当前目录: $(pwd)"
echo "Python 版本: $(python --version 2>&1)"
```

```bash
# 保存为 info.sh，然后执行
chmod +x info.sh    # 添加执行权限
./info.sh           # 运行
```

第一行 `#!/bin/bash` 叫做 **shebang**，告诉系统用哪个 Shell 来执行这个脚本。

### 1.2 变量

```bash
# 赋值（等号两边不能有空格！）
name="zhiyu"
count=42

# 使用变量
echo "Hello, $name"
echo "文件数量: ${count} 个"    # 花括号避免歧义

# 命令替换：把命令的输出赋给变量
today=$(date '+%Y-%m-%d')
file_count=$(ls | wc -l)

# 只读变量
readonly PI=3.14159
```

### 1.3 条件判断

```bash
#!/bin/bash

file="data.csv"

if [ -f "$file" ]; then
    echo "$file 存在，行数：$(wc -l < "$file")"
elif [ -d "$file" ]; then
    echo "$file 是一个目录"
else
    echo "$file 不存在"
fi
```

常用判断条件：

| 表达式 | 含义 |
|---|---|
| `-f file` | 文件存在且是普通文件 |
| `-d dir` | 目录存在 |
| `-e path` | 路径存在（文件或目录） |
| `-z "$str"` | 字符串为空 |
| `-n "$str"` | 字符串非空 |
| `"$a" = "$b"` | 字符串相等 |
| `$a -eq $b` | 数值相等 |
| `$a -gt $b` | 数值大于 |

### 1.4 循环

```bash
# for 循环：遍历文件
for file in *.csv; do
    echo "处理: $file"
    wc -l "$file"
done

# for 循环：数字范围
for i in {1..10}; do
    echo "第 $i 次"
done

# while 循环：逐行读取文件
while IFS= read -r line; do
    echo "行内容: $line"
done < input.txt
```

### 1.5 函数

```bash
#!/bin/bash

backup() {
    local src="$1"
    local dst="${src}.bak.$(date +%Y%m%d)"
    cp "$src" "$dst"
    echo "已备份: $src → $dst"
}

backup "config.yml"
backup "data.csv"
```

### 1.6 实用脚本示例

**批量重命名文件**：

```bash
#!/bin/bash
# 把所有 .jpeg 文件重命名为 .jpg

for file in *.jpeg; do
    [ -f "$file" ] || continue
    new_name="${file%.jpeg}.jpg"
    mv "$file" "$new_name"
    echo "重命名: $file → $new_name"
done
```

**批量处理 CSV 文件**：

```bash
#!/bin/bash
# 统计每个 CSV 文件的行数和大小

echo "文件名,行数,大小"
for csv in data/*.csv; do
    lines=$(wc -l < "$csv")
    size=$(du -h "$csv" | cut -f1)
    echo "$(basename "$csv"),$lines,$size"
done
```

---

## 二、正则表达式入门

正则表达式（Regular Expression，简称 regex）是**描述文本模式的语言**。它不是某个工具的功能，而是一种通用的模式匹配语法，被 grep、sed、awk、Python、JavaScript 等广泛支持。

### 2.1 基础语法

| 语法 | 含义 | 示例 | 匹配 |
|---|---|---|---|
| `.` | 任意单个字符 | `a.c` | abc, aXc, a1c |
| `*` | 前一个字符重复 0 次或多次 | `ab*c` | ac, abc, abbc |
| `+` | 前一个字符重复 1 次或多次 | `ab+c` | abc, abbc（不匹配 ac） |
| `?` | 前一个字符出现 0 或 1 次 | `colou?r` | color, colour |
| `^` | 行首 | `^import` | 以 import 开头的行 |
| `$` | 行尾 | `\.py$` | 以 .py 结尾的行 |
| `[abc]` | 字符集合中的任一个 | `[aeiou]` | 任何一个元音字母 |
| `[0-9]` | 数字范围 | `[0-9]+` | 一个或多个数字 |
| `[^abc]` | 不在集合中的字符 | `[^0-9]` | 非数字字符 |
| `\d` | 数字（等同 `[0-9]`） | `\d{4}` | 四个数字 |
| `\w` | 字母/数字/下划线 | `\w+` | 一个单词 |
| `\s` | 空白字符 | `\s+` | 一个或多个空格 |
| `{n}` | 精确重复 n 次 | `\d{4}` | 恰好 4 个数字 |
| `{n,m}` | 重复 n 到 m 次 | `\d{1,3}` | 1 到 3 个数字 |
| `(...)` | 分组 | `(ab)+` | ab, abab, ababab |
| `\|` | 或 | `cat\|dog` | cat 或 dog |

### 2.2 实战示例

```bash
# 匹配邮箱地址
grep -E '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' contacts.txt

# 匹配 IP 地址
grep -E '\b[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b' log.txt

# 匹配日期格式 YYYY-MM-DD
grep -E '\d{4}-\d{2}-\d{2}' data.txt

# 匹配中文字符
grep -P '[\x{4e00}-\x{9fff}]+' document.txt
```

> **学习建议**：在 [regex101.com](https://regex101.com) 上实时测试你的正则表达式，它会可视化地解释匹配过程。

---

## 三、文本处理三剑客：grep、sed、awk

### 3.1 grep：搜索

grep 在前面已经介绍过基础用法，这里补充进阶技巧：

```bash
# 使用扩展正则（-E）
grep -E "error|warning|fatal" app.log

# 显示匹配行的前后上下文
grep -C 3 "Exception" app.log     # 前后各 3 行
grep -B 5 "ERROR" app.log         # 前 5 行
grep -A 5 "ERROR" app.log         # 后 5 行

# 统计匹配次数
grep -c "import" main.py

# 只输出匹配的部分（而非整行）
grep -oE '[0-9]+\.[0-9]+' prices.txt

# 递归搜索并排除目录
grep -r "TODO" --exclude-dir={node_modules,.git,__pycache__} .
```

### 3.2 sed：流编辑器

sed（Stream Editor）逐行读取输入，按规则替换/删除/插入文本：

```bash
# 替换（s/旧/新/）
sed 's/old/new/' file.txt           # 每行第一个匹配
sed 's/old/new/g' file.txt          # 每行所有匹配（g = global）
sed -i '' 's/old/new/g' file.txt    # 直接修改文件（macOS 需要 -i ''）
sed -i 's/old/new/g' file.txt      # 直接修改文件（Linux）

# 删除行
sed '/^#/d' config.txt              # 删除注释行
sed '/^$/d' file.txt                # 删除空行
sed '1,5d' file.txt                 # 删除前 5 行

# 打印特定行
sed -n '10,20p' file.txt            # 打印第 10-20 行
sed -n '/START/,/END/p' file.txt    # 打印两个模式之间的内容
```

### 3.3 awk：列处理

awk 擅长按列处理结构化文本：

```bash
# 基本语法：awk '{动作}' 文件
# $0 = 整行, $1 = 第一列, $2 = 第二列, NR = 行号, NF = 列数

# 打印第 1 和第 3 列
awk '{print $1, $3}' data.txt

# 以逗号为分隔符（处理 CSV）
awk -F',' '{print $1, $2}' data.csv

# 带条件筛选
awk -F',' '$3 > 100 {print $1, $3}' sales.csv    # 第 3 列大于 100

# 求和
awk -F',' '{sum += $3} END {print "总计:", sum}' sales.csv

# 打印行号
awk '{print NR": "$0}' file.txt

# 去重（等同 sort | uniq 但保持顺序）
awk '!seen[$0]++' file.txt
```

### 三剑客组合技

```bash
# 场景：从日志中提取所有错误的 IP 地址并统计出现次数
grep "ERROR" access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# 场景：批量替换项目中的 API 地址
grep -rl "old-api.example.com" src/ | xargs sed -i '' 's/old-api.example.com/new-api.example.com/g'

# 场景：统计代码行数（排除空行和注释）
find . -name "*.py" | xargs grep -v '^$' | grep -v '^\s*#' | wc -l
```

---

## 四、进程管理

### 4.1 查看进程

```bash
# 查看所有进程
ps aux

# 查看特定进程
ps aux | grep python

# 实时监控（推荐用 htop）
top
htop                  # 更现代的界面，需安装

# 查看端口占用
lsof -i :8000         # 谁在用 8000 端口
```

### 4.2 前台与后台

```bash
# 在后台运行命令
python train.py &

# 查看后台任务
jobs

# 把当前前台任务放到后台
# 先按 Ctrl+Z 暂停，再输入
bg

# 把后台任务拉回前台
fg
fg %1                 # 指定任务编号
```

### 4.3 终止进程

```bash
# 发送终止信号
kill 12345            # 发送 SIGTERM（温和终止）
kill -9 12345         # 发送 SIGKILL（强制杀死）

# 按名称杀进程
pkill python
killall python

# 按端口杀进程
kill $(lsof -t -i :8000)
```

### 4.4 让任务在断开连接后继续运行

```bash
# 方式一：nohup（最简单）
nohup python train.py > output.log 2>&1 &

# 方式二：tmux / screen（推荐，详见第 6 篇）

# 方式三：disown
python train.py &
disown
```

---

## 五、别名（Alias）与自定义函数

在 `~/.zshrc`（或 `~/.bashrc`）中添加：

### 5.1 别名

```bash
# 快捷命令
alias ll="ls -la"
alias la="ls -la"
alias ..="cd .."
alias ...="cd ../.."
alias cls="clear"

# Git 快捷键
alias gs="git status"
alias gc="git commit"
alias gp="git push"
alias gl="git log --oneline --graph -20"
alias gd="git diff"

# Python 相关
alias py="python"
alias pip="pip3"
alias venv="python -m venv .venv && source .venv/bin/activate"

# 安全删除（移到回收站而非直接删除）
alias rm="rm -i"

# 现代替代工具
alias cat="bat --paging=never"
alias ls="eza --icons"
alias grep="rg"
alias find="fd"
```

### 5.2 自定义函数

```bash
# 创建目录并进入
mkcd() {
    mkdir -p "$1" && cd "$1"
}

# 快速创建 Python 项目
pyinit() {
    mkdir -p "$1"/{src,tests,docs}
    touch "$1"/src/__init__.py
    touch "$1"/tests/__init__.py
    echo "# $1" > "$1"/README.md
    echo "创建项目: $1"
    cd "$1"
}

# 搜索历史命令
hs() {
    history | grep "$1"
}

# 快速查看端口占用
port() {
    lsof -i :"$1"
}

# 解压万能函数
extract() {
    case "$1" in
        *.tar.gz|*.tgz)  tar xzf "$1" ;;
        *.tar.bz2)       tar xjf "$1" ;;
        *.tar.xz)        tar xJf "$1" ;;
        *.zip)           unzip "$1" ;;
        *.gz)            gunzip "$1" ;;
        *.rar)           unrar x "$1" ;;
        *.7z)            7z x "$1" ;;
        *)               echo "不支持的格式: $1" ;;
    esac
}
```

修改 `~/.zshrc` 后，执行 `source ~/.zshrc` 使其生效。

---

## 六、Dotfiles 管理

以 `.` 开头的配置文件（dotfiles）定义了你的整个开发环境：

```
~/.zshrc          Shell 配置
~/.gitconfig      Git 配置
~/.ssh/config     SSH 配置
~/.vimrc          Vim 配置
```

### 用 Git 管理 dotfiles

```bash
# 创建 dotfiles 仓库
mkdir ~/dotfiles
cd ~/dotfiles
git init

# 把配置文件复制过来
cp ~/.zshrc ./zshrc
cp ~/.gitconfig ./gitconfig

# 用符号链接（symlink）关联
ln -sf ~/dotfiles/zshrc ~/.zshrc
ln -sf ~/dotfiles/gitconfig ~/.gitconfig

# 提交并推送到 GitHub
git add .
git commit -m "initial dotfiles"
git remote add origin https://github.com/YOU/dotfiles.git
git push -u origin main
```

这样你在任何新机器上都能一键恢复自己的环境配置。

---

## 七、现代命令行工具推荐

这些工具是传统命令的现代替代，更快、更友好：

| 传统命令 | 现代替代 | 优势 |
|---|---|---|
| `cat` | `bat` | 语法高亮、行号、Git 集成 |
| `ls` | `eza` | 图标、颜色、树形视图 |
| `find` | `fd` | 更简洁的语法、更快、默认忽略 .gitignore |
| `grep` | `ripgrep` (`rg`) | 极快、自动忽略 .gitignore、更好的输出 |
| `top` | `htop` / `btop` | 交互式界面、进程树、鼠标支持 |
| `man` | `tldr` | 实用示例为主，不再被长文档淹没 |
| `diff` | `delta` | 语法高亮、行内差异、Git 集成 |
| `du` | `dust` | 可视化磁盘占用 |
| `cd` | `z` / `zoxide` | 智能跳转，输入部分路径名即可 |

### fzf：模糊搜索的瑞士军刀

```bash
brew install fzf

# 文件模糊搜索
vim $(fzf)

# 历史命令模糊搜索（绑定到 Ctrl+R）
$(fzf --history)

# 和其他命令组合
cd $(fd -t d | fzf)                 # 模糊搜索并进入目录
git checkout $(git branch | fzf)     # 模糊搜索并切换分支
kill $(ps aux | fzf | awk '{print $2}')  # 模糊搜索并杀进程
```

---

## 小结

| 技能 | 关键内容 |
|---|---|
| Shell 脚本 | 变量、条件、循环、函数 |
| 正则表达式 | `.`, `*`, `+`, `[]`, `^`, `$`, `\d`, `\w` |
| 文本三剑客 | grep（搜索）、sed（替换）、awk（列处理） |
| 进程管理 | `ps`, `kill`, `&`, `nohup`, `jobs` |
| 效率提升 | alias、函数、dotfiles 管理 |
| 现代工具 | bat, eza, fd, rg, fzf, zoxide |

Shell 的进阶技能不需要一次全部掌握。建议的学习路径：**先学会写简单脚本和用 grep/sed → 遇到重复性工作时用脚本自动化 → 逐步引入现代工具替代旧命令**。

---

> **下一篇**：[[Basic Skill 6 - SSH|SSH 与远程开发]] —— 安全连接远程服务器，随时随地写代码。
