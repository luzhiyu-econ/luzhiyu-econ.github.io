---
title: "#0：操作系统的本质区别"
tags:
  - skills/basic
order: 1
description: 理解 Windows 与 macOS/Linux 的根本差异，为后续所有开发技能打下认知基础。
---

> 你选的操作系统，决定了你和计算机对话的方式。

很多人学编程的第一个障碍不是语法，而是：**"为什么同样的操作，在我的电脑上不行？"** 答案往往是——你用的操作系统和教程里的不一样，而它们之间的差异远比你想象的大。

---

## 一、两种哲学：Unix vs Windows

现代操作系统可以粗略分为两大阵营：

| | Unix 系（macOS / Linux） | Windows |
|---|---|---|
| 设计哲学 | "一切皆文件"，小工具组合完成复杂任务 | GUI 优先，提供集成化的大型工具 |
| 诞生背景 | 大学和研究机构（1969，贝尔实验室） | 个人电脑市场（1985，微软） |
| 典型用户 | 开发者、服务器管理员、科研人员 | 办公用户、游戏玩家、企业桌面 |
| 内核 | Linux 内核 / Darwin（macOS） | NT 内核 |

### macOS 和 Linux 是什么关系？

```
         Unix（1969）
          │
    ┌─────┴──────┐
    │            │
  BSD          System V
    │            │
  FreeBSD      各种商业 Unix
    │
  Darwin ──── macOS（苹果在 BSD 基础上构建）
  
  另一条线：
  Linus Torvalds（1991）从零编写 ──── Linux 内核
    │
    ├── Ubuntu
    ├── CentOS / Rocky Linux
    ├── Debian
    └── Arch Linux ...
```

macOS 和 Linux **不是同一个系统**，但它们都继承了 Unix 的设计哲学。这就是为什么在 macOS 终端里学的命令，绝大部分在 Linux 上也能用，反之亦然。而 Windows 走的是一条完全不同的路。

---

## 二、文件系统：最直观的差异

### 2.1 路径分隔符

这是最经典的差异：

```
Windows:  C:\Users\zhiyu\Documents\paper.pdf
macOS:    /Users/zhiyu/Documents/paper.pdf
Linux:    /home/zhiyu/Documents/paper.pdf
```

| | Unix 系 | Windows |
|---|---|---|
| 分隔符 | 正斜杠 `/` | 反斜杠 `\` |
| 根目录 | 单一根 `/` | 每个磁盘一个根 `C:\`、`D:\` |
| 用户目录 | `/home/用户名`（Linux）<br>`/Users/用户名`（macOS） | `C:\Users\用户名` |

> **实用提示**：在 Python 中写路径时，使用 `pathlib.Path` 或 `os.path.join()` 可以自动处理分隔符差异，不用担心跨平台问题。

### 2.2 大小写敏感性

```bash
# Linux —— 这是两个不同的文件
README.md
readme.md

# macOS —— 默认不区分大小写（但保留大小写）
# 创建 README.md 后，访问 readme.md 会指向同一个文件

# Windows —— 同 macOS，不区分大小写
```

这个差异会在 Git 协作中引发隐蔽的 bug：你在 macOS 上把文件从 `Utils.py` 改名为 `utils.py`，Git 可能感知不到这个变化，但到了 Linux 服务器上就会找不到文件。

### 2.3 根目录结构

Unix 系统有一套标准的目录布局：

```
/
├── bin/       可执行文件（基础命令：ls, cp, mv）
├── etc/       系统配置文件
├── home/      用户主目录（Linux）
├── Users/     用户主目录（macOS）
├── tmp/       临时文件
├── usr/       用户安装的程序和库
│   ├── bin/   用户命令
│   ├── lib/   库文件
│   └── local/ 手动安装的软件
├── var/       可变数据（日志、缓存）
└── dev/       设备文件（"一切皆文件"的体现）
```

Windows 则以盘符为根：

```
C:\
├── Program Files\       64位程序
├── Program Files (x86)\ 32位程序
├── Users\               用户目录
│   └── zhiyu\
│       ├── Desktop\
│       ├── Documents\
│       └── AppData\     应用数据（常被隐藏）
├── Windows\             系统文件
└── temp\                临时文件
```

---

## 三、权限模型

### Unix 权限：简洁的三组三位

在 Unix 系统中，每个文件都有三组权限，分别对应**所有者、所属组、其他人**：

```bash
$ ls -l script.py
-rwxr-xr--  1 zhiyu  staff  1024 Mar 10 10:00 script.py
│├──┤├──┤├──┤
│ 所有者 组  其他人
│
└── 文件类型（- 普通文件，d 目录，l 链接）
```

| 字母 | 含义 | 数字 |
|---|---|---|
| `r` | 读（Read） | 4 |
| `w` | 写（Write） | 2 |
| `x` | 执行（Execute） | 1 |

```bash
chmod 755 script.py   # 所有者 rwx(7)，组 r-x(5)，其他 r-x(5)
chmod +x script.py    # 给所有人加上执行权限
chown zhiyu:staff script.py  # 修改所有者和组
```

### Windows 权限：ACL 体系

Windows 使用更复杂的 ACL（访问控制列表），通过"属性 → 安全"选项卡配置。日常使用中最常碰到的是 UAC（用户账户控制）弹窗——那个"是否允许此应用更改你的设备"的提示。

### 为什么这很重要？

当你在 Linux 服务器上运行脚本时：

```bash
$ python script.py
bash: permission denied: script.py

# 你需要：
$ chmod +x script.py  # 添加执行权限
```

这在 Windows 上几乎不会遇到，因为 Windows 通过文件扩展名（`.exe`, `.py`）判断是否可执行，而不是权限位。

---

## 四、换行符：看不见的陷阱

文本文件中"按下回车"这个动作，在不同系统中被编码为不同的字符：

| 系统 | 换行符 | 转义表示 | 名称 |
|---|---|---|---|
| Unix / macOS | `LF` | `\n` | Line Feed |
| Windows | `CR+LF` | `\r\n` | Carriage Return + Line Feed |

这个差异来源于打字机时代：CR 把打印头移回行首，LF 把纸向上推一行。Unix 简化为只用 LF，Windows 保留了两个字符的组合。

### 会引发什么问题？

```bash
# 在 Windows 上写的 shell 脚本，传到 Linux 上执行
$ bash script.sh
/bin/bash^M: bad interpreter: No such file or directory
```

那个 `^M` 就是多余的 `\r`。解决方法：

```bash
# 方法一：用 dos2unix 转换
dos2unix script.sh

# 方法二：用 sed 去掉 \r
sed -i 's/\r$//' script.sh

# 方法三（推荐）：在 Git 中配置自动转换
git config --global core.autocrlf input   # macOS/Linux
git config --global core.autocrlf true    # Windows
```

---

## 五、包管理器：安装软件的正确方式

在 Unix 世界里，你不需要去网站下载 `.exe` 安装包——用包管理器一行命令搞定：

| 系统 | 包管理器 | 安装示例 |
|---|---|---|
| Ubuntu / Debian | `apt` | `sudo apt install git` |
| CentOS / Fedora | `dnf` / `yum` | `sudo dnf install git` |
| macOS | `brew`（Homebrew） | `brew install git` |
| Windows | `winget` / `choco` | `winget install Git.Git` |

```bash
# macOS 安装 Homebrew（macOS 用户的第一步）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 然后就可以用 brew 安装几乎所有开发工具
brew install git node python wget
```

### 为什么包管理器很重要？

1. **版本管理**：轻松升级和回退
2. **依赖处理**：自动安装依赖项
3. **干净卸载**：不留残余文件
4. **可复现**：一行命令就能在新机器上还原环境

---

## 六、"一切皆文件"到底意味着什么

Unix 的核心设计理念是把**所有东西**抽象成文件：

```bash
# 硬件设备是文件
/dev/sda          # 第一块硬盘
/dev/null         # 黑洞——写入的数据全部丢弃
/dev/random       # 随机数生成器

# 进程信息是文件
/proc/cpuinfo     # CPU 信息
/proc/meminfo     # 内存信息

# 网络连接也是文件描述符
```

这意味着你可以用**同一套工具**（cat, grep, pipe）操作所有东西：

```bash
# 查看 CPU 信息——就像读一个普通文本文件
cat /proc/cpuinfo

# 把不需要的输出扔进黑洞
command_with_noisy_output 2>/dev/null

# 生成随机密码
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 16
```

Windows 没有这个抽象层。硬件通过驱动程序访问，进程通过任务管理器查看，它们是不同的子系统，用不同的工具操作。

---

## 七、Windows 上的 Linux：WSL

如果你是 Windows 用户但想获得 Unix 的开发体验，**WSL（Windows Subsystem for Linux）** 是最佳方案：

```powershell
# 在 PowerShell 中安装（管理员权限）
wsl --install

# 安装完成后，你就有了一个完整的 Linux 环境
# 可以直接运行 bash、apt、python 等所有 Linux 命令
```

WSL 2 运行的是一个真正的 Linux 内核，性能接近原生 Linux。它让你在 Windows 上同时拥有两个世界的优点。

---

## 八、开发者为什么倾向 Unix 系统？

| 原因 | 说明 |
|---|---|
| 服务器生态 | 全球超过 96% 的服务器运行 Linux，开发环境一致减少"在我电脑上能跑"问题 |
| 终端体验 | Unix shell 功能强大，管道和工具链设计精良 |
| 包管理器 | apt/brew 生态成熟，安装开发工具极其方便 |
| 开源友好 | 大量开源项目优先支持 Linux/macOS |
| 容器化 | Docker 原生运行在 Linux 上，macOS 兼容性好 |
| 脚本能力 | Bash 脚本在 CI/CD、自动化中无处不在 |

> 这不是说 Windows 不能编程。有了 WSL + Windows Terminal + VS Code 的组合，Windows 的开发体验已经非常好了。关键是**理解差异**，而不是做二选一的判断。

---

## 小结

| 概念 | Unix 系（macOS/Linux） | Windows |
|---|---|---|
| 路径分隔符 | `/` | `\` |
| 大小写 | 敏感（Linux）/ 不敏感（macOS 默认） | 不敏感 |
| 换行符 | LF (`\n`) | CRLF (`\r\n`) |
| 权限 | rwx 三组三位 | ACL 访问控制列表 |
| 包管理 | apt / brew | winget / choco |
| 设计理念 | 一切皆文件，组合小工具 | GUI 集成，大型应用 |
| 脚本语言 | Bash / Zsh | PowerShell / Batch |

理解了这些本质区别，后续学习终端、Git、环境搭建等技能时，你就不会被跨平台的差异绊倒了。

---

> **下一篇**：[[Basic Skill 1 - Terminal|终端与命令行基础]] —— 学会用键盘和计算机高效对话。
