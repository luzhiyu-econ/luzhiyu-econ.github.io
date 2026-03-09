---
title: "#6：SSH 与远程开发"
tags:
  - skills/basic
order: 7
description: 掌握 SSH 密钥认证、远程连接、文件传输与终端复用，实现随时随地开发。
---

> SSH 是开发者的"任意门"——一行命令，直达世界另一端的服务器。

无论是连接学校的计算服务器、管理云主机，还是向 GitHub 推送代码，SSH 都是背后的核心协议。

---

## 一、SSH 是什么

SSH（Secure Shell）是一种**加密的远程登录协议**，让你安全地连接到远程计算机并执行命令。

```
你的电脑（客户端）                远程服务器
    │                               │
    │──── SSH 加密隧道 ──────────▶ │
    │     （所有数据都被加密）       │
    │                               │
    │  你在本地输入命令              │
    │  命令在远程服务器上执行        │
    │  结果通过加密隧道返回          │
    └───────────────────────────────┘
```

### SSH vs 传统方式

| 方式 | 安全性 | 用途 |
|---|---|---|
| Telnet | 明文传输（不安全） | 已淘汰 |
| SSH | 加密传输 | 远程登录、文件传输、端口转发 |
| RDP | 加密 | Windows 远程桌面（图形界面） |

---

## 二、密钥认证：比密码更安全更方便

SSH 支持两种认证方式：

| 方式 | 安全性 | 便利性 |
|---|---|---|
| 密码认证 | 一般（可能被暴力破解） | 每次都要输密码 |
| 密钥认证 | 极高（几乎不可能破解） | 配置一次，永久免密 |

### 2.1 密钥对原理

```
┌─────────────────────┐    ┌─────────────────────┐
│     你的电脑         │    │     远程服务器       │
│                     │    │                     │
│  私钥（Private Key）│    │  公钥（Public Key）  │
│  ~/.ssh/id_ed25519  │    │  ~/.ssh/authorized  │
│                     │    │        _keys        │
│  绝对保密！          │    │  可以随便分发       │
│  相当于钥匙          │    │  相当于锁           │
└─────────────────────┘    └─────────────────────┘

连接时：
1. 服务器用公钥生成一个随机"挑战"
2. 你的电脑用私钥"解答"
3. 服务器验证答案 → 通过 → 连接成功

全程密码不在网络上传输。
```

### 2.2 生成 SSH 密钥

```bash
# 生成密钥对（推荐 Ed25519 算法）
ssh-keygen -t ed25519 -C "your_email@example.com"
```

执行后会询问：
- **保存路径**：直接回车（默认 `~/.ssh/id_ed25519`）
- **密码短语（passphrase）**：可以设置，也可以留空

```bash
# 生成后会有两个文件
~/.ssh/id_ed25519       # 私钥（绝对不要泄露！）
~/.ssh/id_ed25519.pub   # 公钥（可以给任何人）
```

### 2.3 把公钥部署到服务器

```bash
# 方式一：ssh-copy-id（最简单）
ssh-copy-id user@server_ip

# 方式二：手动复制
cat ~/.ssh/id_ed25519.pub
# 复制输出内容，然后登录服务器，粘贴到 ~/.ssh/authorized_keys

# 方式三：一行命令
cat ~/.ssh/id_ed25519.pub | ssh user@server_ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 2.4 把公钥添加到 GitHub

```bash
# 复制公钥内容
cat ~/.ssh/id_ed25519.pub | pbcopy   # macOS
cat ~/.ssh/id_ed25519.pub            # Linux（手动复制）
```

然后去 GitHub → Settings → SSH and GPG keys → New SSH key，粘贴公钥。

```bash
# 验证
ssh -T git@github.com
# Hi username! You've successfully authenticated...

# 之后 clone 仓库用 SSH 地址而非 HTTPS
git clone git@github.com:username/repo.git
```

---

## 三、SSH 连接与配置

### 3.1 基本连接

```bash
# 基本格式
ssh username@server_ip

# 指定端口（默认 22）
ssh -p 2222 username@server_ip

# 连接后就进入了远程服务器的 Shell
# 输入 exit 或 Ctrl+D 断开连接
```

### 3.2 SSH Config 文件

每次输入 `ssh -p 2222 zhiyu@192.168.1.100` 太繁琐？用配置文件简化：

编辑 `~/.ssh/config`：

```
Host lab
    HostName 192.168.1.100
    User zhiyu
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host github
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519

Host cloud
    HostName my-server.example.com
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

配置后，连接只需：

```bash
ssh lab       # 等同于 ssh -p 2222 zhiyu@192.168.1.100
ssh cloud     # 等同于 ssh root@my-server.example.com
```

### 常用配置项

| 配置项 | 作用 |
|---|---|
| `Host` | 连接别名 |
| `HostName` | 服务器地址（IP 或域名） |
| `User` | 登录用户名 |
| `Port` | SSH 端口 |
| `IdentityFile` | 私钥路径 |
| `ServerAliveInterval` | 心跳间隔（秒），防止连接超时断开 |
| `ServerAliveCountMax` | 心跳失败几次后断开 |
| `ProxyJump` | 跳板机（通过 A 连接 B） |

### 跳板机配置

某些服务器需要先连接跳板机（Bastion Host），再跳转到目标机器：

```
Host bastion
    HostName bastion.example.com
    User zhiyu

Host internal-server
    HostName 10.0.0.5
    User zhiyu
    ProxyJump bastion
```

```bash
ssh internal-server
# 自动通过 bastion 跳转到 10.0.0.5
```

---

## 四、文件传输

### 4.1 scp：简单复制

```bash
# 上传：本地 → 服务器
scp file.txt lab:~/data/

# 下载：服务器 → 本地
scp lab:~/results/output.csv ./

# 传目录（加 -r）
scp -r ./project lab:~/projects/
```

### 4.2 rsync：增量同步（推荐）

rsync 只传输变化的部分，速度快得多：

```bash
# 上传目录
rsync -avz ./project/ lab:~/project/

# 下载目录
rsync -avz lab:~/results/ ./results/

# 排除某些文件
rsync -avz --exclude='*.pyc' --exclude='__pycache__' ./src/ lab:~/src/

# 显示进度
rsync -avz --progress ./data/ lab:~/data/
```

参数含义：
- `-a`：归档模式（保留权限、时间戳等）
- `-v`：显示详细信息
- `-z`：压缩传输

### 4.3 sftp：交互式传输

```bash
sftp lab
# 进入交互模式
sftp> ls                    # 列出远程文件
sftp> lls                   # 列出本地文件
sftp> get remote_file.txt   # 下载
sftp> put local_file.txt    # 上传
sftp> exit
```

### 对比

| 工具 | 优点 | 缺点 | 适用场景 |
|---|---|---|---|
| scp | 简单直观 | 每次全量传输 | 偶尔传几个文件 |
| rsync | 增量传输、可排除文件 | 语法稍复杂 | 频繁同步项目 |
| sftp | 交互式，可浏览目录 | 不能批量操作 | 探索性地查找文件 |

---

## 五、端口转发（隧道）

SSH 隧道让你安全地访问远程服务器上的服务。

### 5.1 本地端口转发

场景：远程服务器上运行了 Jupyter Notebook（端口 8888），但服务器防火墙不允许直接访问。

```bash
# 把服务器的 8888 端口映射到本地的 8888 端口
ssh -L 8888:localhost:8888 lab

# 然后在本地浏览器访问 http://localhost:8888 即可
```

```
你的电脑                  SSH 隧道              远程服务器
localhost:8888 ─── 加密 ──────────────▶ localhost:8888
    │                                       │
浏览器访问                            Jupyter Notebook
```

### 5.2 动态端口转发（SOCKS 代理）

```bash
# 在本地创建一个 SOCKS5 代理
ssh -D 1080 lab

# 然后配置浏览器使用 SOCKS5 代理 localhost:1080
# 所有流量通过服务器中转
```

### 5.3 后台运行隧道

```bash
# -f 后台运行，-N 不执行远程命令
ssh -f -N -L 8888:localhost:8888 lab
```

---

## 六、tmux：终端复用器

当你通过 SSH 连接服务器运行长时间任务时，一旦连接断开，任务就会被终止。**tmux** 解决了这个问题。

### 6.1 核心概念

```
┌─ tmux 服务器（运行在远程服务器上）──────────────┐
│                                                │
│  ┌─ Session: work ──────────────────────────┐  │
│  │                                          │  │
│  │  ┌─ Window 0: editor ─┐ ┌─ Window 1 ──┐│  │
│  │  │                    │ │  training    ││  │
│  │  │  ┌─Pane─┐┌─Pane─┐ │ │              ││  │
│  │  │  │ vim  ││ bash │ │ │ python train ││  │
│  │  │  │      ││      │ │ │              ││  │
│  │  │  └──────┘└──────┘ │ │              ││  │
│  │  └────────────────────┘ └──────────────┘│  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  即使 SSH 断开，tmux 中的一切继续运行            │
└────────────────────────────────────────────────┘
```

### 6.2 基本操作

```bash
# 安装（大多数服务器已预装）
sudo apt install tmux   # Ubuntu
brew install tmux        # macOS

# 创建新会话
tmux new -s work

# 退出会话（detach）但保持运行
# 按 Ctrl+B 然后按 D

# 查看所有会话
tmux ls

# 重新连接会话
tmux attach -t work
tmux a -t work           # 简写

# 杀死会话
tmux kill-session -t work
```

### 6.3 常用快捷键

所有 tmux 快捷键都以 **`Ctrl+B`（前缀键）** 开头：

| 操作 | 快捷键 |
|---|---|
| 分离会话（detach） | `Ctrl+B` → `D` |
| 新建窗口 | `Ctrl+B` → `C` |
| 切换窗口 | `Ctrl+B` → `数字键` |
| 水平分屏 | `Ctrl+B` → `"` |
| 垂直分屏 | `Ctrl+B` → `%` |
| 切换面板 | `Ctrl+B` → `方向键` |
| 关闭当前面板 | `Ctrl+B` → `X` |
| 滚动查看历史 | `Ctrl+B` → `[`（用方向键滚动，按 `Q` 退出） |
| 重命名窗口 | `Ctrl+B` → `,` |

### 6.4 典型工作流

```bash
# 1. SSH 连接服务器
ssh lab

# 2. 创建 tmux 会话
tmux new -s training

# 3. 分屏：一个跑训练，一个看 GPU
# 按 Ctrl+B 然后 " 水平分屏
python train.py          # 上面的面板
# 按 Ctrl+B 然后方向键切到下面的面板
watch -n 1 nvidia-smi    # 下面的面板

# 4. 断开连接回家（Ctrl+B → D）

# 5. 第二天重新连接
ssh lab
tmux a -t training       # 一切都在，训练还在跑
```

---

## 七、VS Code / Cursor 远程开发

SSH 不只是终端操作——现代编辑器可以通过 SSH 直接在远程服务器上开发，体验和本地一样。

### 设置步骤

1. 安装 **Remote - SSH** 扩展
2. 按 `Cmd+Shift+P`（macOS）→ 输入 `Remote-SSH: Connect to Host`
3. 选择 SSH Config 中配置的主机（如 `lab`）
4. VS Code 会在远程服务器上安装 VS Code Server
5. 之后就像操作本地文件一样编辑远程文件

```
你的电脑                         远程服务器
┌────────────────┐              ┌────────────────┐
│ VS Code (GUI)  │◀── SSH ────▶│ VS Code Server  │
│ 界面渲染       │              │ 文件读写        │
│ 快捷键处理     │              │ 语法分析        │
│                │              │ 代码运行        │
└────────────────┘              └────────────────┘

文件存在服务器上，编辑体验在本地。
```

### 优势

- **延迟极低**：只传输 UI 差异，不是整个桌面
- **扩展在远程运行**：Python 扩展在服务器上分析代码，利用服务器算力
- **终端集成**：VS Code 内置终端直接就是远程 Shell
- **端口自动转发**：运行 Web 服务后自动映射到本地

---

## 八、SSH 安全最佳实践

| 实践 | 说明 |
|---|---|
| 使用密钥认证 | 禁用密码登录，防暴力破解 |
| 使用 Ed25519 密钥 | 比 RSA 更安全、更短 |
| 给私钥设置密码短语 | 即使私钥泄露，攻击者也无法直接使用 |
| 不要共享私钥 | 每台设备生成独立的密钥对 |
| 定期轮换密钥 | 定期生成新密钥，删除旧密钥 |
| 使用 ssh-agent | 避免反复输入密码短语 |

```bash
# 启动 ssh-agent 并添加密钥
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# macOS 上把密码存入钥匙串（只需输入一次）
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

---

## 小结

| 技能 | 关键内容 |
|---|---|
| 密钥认证 | `ssh-keygen`, 公钥部署到服务器/GitHub |
| SSH Config | `~/.ssh/config` 简化连接 |
| 文件传输 | scp（简单）、rsync（增量同步）、sftp（交互式） |
| 端口转发 | `-L` 本地转发、`-D` 动态代理 |
| tmux | 会话持久化、分屏、断开后任务继续运行 |
| 远程开发 | VS Code Remote SSH，本地编辑器 + 远程算力 |

SSH 是连接"本地"和"远程"的桥梁。掌握了它，你就不再局限于面前这台电脑的算力——整个云端都是你的工作台。

---

> **下一篇**：[[Basic Skill 7 - Networking|网络基础与调试]] —— 理解 HTTP、DNS、端口等概念，掌握网络问题排查技能。
