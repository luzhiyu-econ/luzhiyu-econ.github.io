---
title: "#8：网络基础与调试"
tags:
  - skills/basic
order: 9
description: 理解 IP、端口、DNS、HTTP 等核心网络概念，掌握常用网络调试工具。
---

> 你写的每一行代码，迟早要通过网络和这个世界交互。

调用 API、部署 Web 应用、远程连接服务器、下载数据——所有这些操作的底层都是网络。理解网络基础不是运维的专属技能，而是每个开发者的必修课。

---

## 一、网络分层模型（简化版）

网络通信被分成多个层次，每层各司其职。你不需要背诵 OSI 七层模型，理解下面这个简化版就够了：

```
┌────────────────────────────────────┐
│  应用层（Application Layer）        │  ← 你直接接触的
│  HTTP, HTTPS, SSH, FTP, DNS        │    浏览器、API、终端命令
├────────────────────────────────────┤
│  传输层（Transport Layer）          │  ← 数据怎么传
│  TCP（可靠）, UDP（快速）           │    端口号在这一层
├────────────────────────────────────┤
│  网络层（Network Layer）            │  ← 数据往哪发
│  IP 协议                           │    IP 地址在这一层
├────────────────────────────────────┤
│  链路层（Link Layer）               │  ← 物理连接
│  以太网, Wi-Fi                     │    MAC 地址、网卡
└────────────────────────────────────┘
```

一个简单的比喻：

| 网络层次 | 快递类比 |
|---|---|
| 应用层 | 快递里装的是什么（文件、食品） |
| 传输层 | 选择快递公司（顺丰=TCP可靠、闪送=UDP快速） |
| 网络层 | 收件地址（IP） |
| 链路层 | 快递车、道路 |

---

## 二、IP 地址

IP 地址是网络中每台设备的"门牌号"。

### 2.1 IPv4

```
192.168.1.100
│       │   │
│       │   └── 主机号
│       └────── 子网
└────────────── 网段
```

| 类别 | 范围 | 说明 |
|---|---|---|
| 私有地址 | `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x` | 局域网内部使用，不可直接上互联网 |
| 公有地址 | 其他所有 | 全球唯一，由 ISP 分配 |
| 回环地址 | `127.0.0.1` / `localhost` | 指向自己的电脑 |
| 全零地址 | `0.0.0.0` | 监听所有网卡（服务器常见） |

### 2.2 查看本机 IP

```bash
# macOS
ifconfig | grep "inet "
# 或者
ipconfig getifaddr en0        # Wi-Fi

# Linux
ip addr show
hostname -I

# Windows
ipconfig

# 查看公网 IP
curl ifconfig.me
curl ip.sb
```

### 2.3 localhost 与 127.0.0.1

当你在本地运行一个 Web 服务器时：

```bash
python -m http.server 8000
# Serving HTTP on 0.0.0.0 port 8000

# 以下三种方式都能访问：
# http://localhost:8000
# http://127.0.0.1:8000
# http://0.0.0.0:8000（仅限本机）
```

`localhost` 和 `127.0.0.1` 都指向本机，只是前者是域名、后者是 IP。

---

## 三、端口（Port）

IP 地址确定了"哪台电脑"，端口确定了"电脑上的哪个程序"。

```
IP 地址     = 酒店的地址
端口号      = 房间号

192.168.1.100:8000
      │          │
   服务器地址   端口号
```

### 常见端口

| 端口 | 服务 | 说明 |
|---|---|---|
| 22 | SSH | 远程登录 |
| 80 | HTTP | 网页（明文） |
| 443 | HTTPS | 网页（加密） |
| 3000 | 开发服务器 | React/Next.js 等前端开发 |
| 3306 | MySQL | 数据库 |
| 5432 | PostgreSQL | 数据库 |
| 5000 | Flask | Python Web 开发 |
| 8000 | 各种开发服务器 | Django, FastAPI 等 |
| 8080 | 各种开发服务器 | 备用 HTTP 端口 |
| 8888 | Jupyter Notebook | 数据科学开发 |

```bash
# 查看端口占用
lsof -i :8000                # macOS / Linux
netstat -tlnp                 # Linux
ss -tlnp                      # Linux（更新的命令）
```

---

## 四、DNS：域名系统

DNS 把人类可读的域名翻译成 IP 地址。

```
你输入: google.com
   │
   ▼
DNS 服务器查询: google.com → 142.250.80.46
   │
   ▼
浏览器连接: 142.250.80.46:443
```

### 4.1 DNS 查询工具

```bash
# 查看域名的 IP
nslookup google.com
dig google.com

# dig 的输出更详细
dig google.com +short        # 只显示 IP
# 142.250.80.46

# 查看本机 DNS 缓存
# macOS
sudo dscacheutil -flushcache   # 清除 DNS 缓存
```

### 4.2 /etc/hosts 文件

本地的 DNS 覆盖——在这里添加的映射优先级高于 DNS 服务器：

```bash
# 查看
cat /etc/hosts

# 常见用途：
# 127.0.0.1  myproject.local    # 开发时用自定义域名
# 127.0.0.1  ads.example.com    # 屏蔽广告域名
```

---

## 五、HTTP/HTTPS 协议

HTTP 是 Web 的基础协议。每次你打开网页、调用 API，背后都是 HTTP 请求和响应。

### 5.1 请求与响应

```
客户端（浏览器 / curl / Python）         服务器
        │                                  │
        │─── HTTP 请求 ──────────────────▶│
        │    GET /api/data HTTP/1.1        │
        │    Host: api.example.com         │
        │    Authorization: Bearer xxx     │
        │                                  │
        │◀── HTTP 响应 ──────────────────│
        │    HTTP/1.1 200 OK               │
        │    Content-Type: application/json │
        │    {"data": [1, 2, 3]}           │
        │                                  │
```

### 5.2 请求方法

| 方法 | 用途 | 示例 |
|---|---|---|
| `GET` | 获取数据 | 打开网页、查询 API |
| `POST` | 提交数据 | 登录、提交表单、上传文件 |
| `PUT` | 更新数据（完整替换） | 更新用户资料 |
| `PATCH` | 更新数据（部分修改） | 修改密码 |
| `DELETE` | 删除数据 | 删除一条记录 |

### 5.3 状态码

| 范围 | 含义 | 常见 |
|---|---|---|
| 2xx | 成功 | `200 OK`, `201 Created`, `204 No Content` |
| 3xx | 重定向 | `301 Moved Permanently`, `304 Not Modified` |
| 4xx | 客户端错误 | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests` |
| 5xx | 服务器错误 | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

> 记住几个最常见的：**200（成功）、404（找不到）、401（未认证）、403（没权限）、500（服务器炸了）**。

### 5.4 HTTP vs HTTPS

| | HTTP | HTTPS |
|---|---|---|
| 端口 | 80 | 443 |
| 加密 | 无 | TLS/SSL 加密 |
| 安全性 | 数据明文传输 | 数据加密传输 |
| 证书 | 不需要 | 需要 SSL 证书 |

HTTPS = HTTP + TLS 加密。现在所有正式网站都应该使用 HTTPS。

---

## 六、实用网络调试工具

### 6.1 ping：测试连通性

```bash
ping google.com
# PING google.com (142.250.80.46): 56 data bytes
# 64 bytes from 142.250.80.46: icmp_seq=0 ttl=116 time=12.3 ms
# 64 bytes from 142.250.80.46: icmp_seq=1 ttl=116 time=11.8 ms

# Ctrl+C 停止

# 只 ping 5 次
ping -c 5 google.com
```

ping 能告诉你：
- 目标是否可达
- 网络延迟（time）
- 丢包率

### 6.2 traceroute：追踪路由

```bash
# 查看数据包经过了哪些路由器
traceroute google.com      # macOS / Linux
tracert google.com         # Windows

# 输出示例
# 1  router.local (192.168.1.1)     1.2 ms
# 2  isp-gateway (10.0.0.1)         5.3 ms
# 3  ...
# 10 google.com (142.250.80.46)     12.1 ms
```

### 6.3 curl：万能的 HTTP 客户端

curl 是命令行中最重要的网络工具：

```bash
# 基本 GET 请求
curl https://api.github.com

# 查看响应头
curl -I https://example.com

# 详细输出（包含请求和响应的完整信息）
curl -v https://example.com

# POST 请求（发送 JSON）
curl -X POST https://api.example.com/data \
  -H "Content-Type: application/json" \
  -d '{"name": "zhiyu", "age": 24}'

# 带认证的请求
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.example.com/user

# 下载文件
curl -O https://example.com/file.zip        # 保持原文件名
curl -o myfile.zip https://example.com/file  # 指定文件名

# 跟随重定向
curl -L https://short.url/abc

# 设置超时
curl --connect-timeout 5 --max-time 30 https://slow-api.com

# 发送表单数据
curl -X POST -F "file=@photo.jpg" https://api.example.com/upload

# 静默模式（只输出响应体）
curl -s https://api.example.com/data | jq .
```

### 6.4 wget：下载利器

```bash
# 下载文件
wget https://example.com/data.csv

# 断点续传
wget -c https://example.com/large_file.zip

# 递归下载整个网站（镜像）
wget -r -l 2 https://docs.example.com

# 后台下载
wget -b https://example.com/huge_file.tar.gz
```

### 6.5 工具对比

| 工具 | 主要用途 | 优势 |
|---|---|---|
| `ping` | 测试连通性 | 最简单，判断网络是否通 |
| `traceroute` | 追踪路由路径 | 定位网络瓶颈在哪一跳 |
| `curl` | HTTP 请求 | 功能最全，调 API 必备 |
| `wget` | 下载文件 | 断点续传、递归下载 |
| `dig` / `nslookup` | DNS 查询 | 排查域名解析问题 |
| `netstat` / `ss` | 查看端口和连接 | 排查端口占用 |

---

## 七、API 测试实战

用 curl 调用 RESTful API 是开发中非常常见的操作：

### 7.1 调用公开 API

```bash
# GitHub API：获取用户信息
curl -s https://api.github.com/users/octocat | jq .

# 输出（jq 自动格式化 JSON）：
# {
#   "login": "octocat",
#   "id": 583231,
#   "name": "The Octocat",
#   "public_repos": 8,
#   ...
# }

# 天气 API
curl -s "https://wttr.in/Beijing?format=3"
# Beijing: ☀️ +15°C
```

### 7.2 调用需要认证的 API

```bash
# OpenAI API 示例
curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }' | jq .choices[0].message.content
```

### 7.3 用 Python 发请求

```python
import requests

# GET
response = requests.get("https://api.github.com/users/octocat")
data = response.json()
print(data["name"])

# POST with JSON
response = requests.post(
    "https://api.example.com/data",
    json={"name": "zhiyu", "age": 24},
    headers={"Authorization": "Bearer TOKEN"}
)
print(response.status_code)  # 200
print(response.json())
```

---

## 八、代理设置

在终端中使用代理（配合 Clash 等工具）：

### 8.1 临时设置

```bash
# 设置 HTTP/HTTPS 代理
export http_proxy=http://127.0.0.1:7890
export https_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7890

# 取消代理
unset http_proxy https_proxy all_proxy
```

### 8.2 写入配置文件

在 `~/.zshrc` 中添加快捷函数：

```bash
proxy_on() {
    export http_proxy=http://127.0.0.1:7890
    export https_proxy=http://127.0.0.1:7890
    export all_proxy=socks5://127.0.0.1:7890
    echo "代理已开启"
}

proxy_off() {
    unset http_proxy https_proxy all_proxy
    echo "代理已关闭"
}
```

### 8.3 Git 代理

```bash
# 设置 Git 代理
git config --global http.proxy http://127.0.0.1:7890

# 取消
git config --global --unset http.proxy
```

---

## 九、常见网络问题排查

### 排查流程

```
网络不通？
  │
  ├── ping 目标 IP → 不通 → 检查网络连接/防火墙
  │
  ├── ping 域名 → 不通但 IP 通 → DNS 问题
  │   └── 换 DNS（8.8.8.8）或清 DNS 缓存
  │
  ├── curl 返回超时 → 端口被墙/服务未启动
  │   └── 检查防火墙规则、服务状态
  │
  ├── curl 返回 4xx → 客户端问题
  │   ├── 401 → 认证信息错误
  │   ├── 403 → 没权限
  │   └── 404 → URL 错误
  │
  └── curl 返回 5xx → 服务器问题
      └── 查看服务器日志
```

### 常见问题速查

| 问题 | 排查命令 | 可能原因 |
|---|---|---|
| 网页打不开 | `ping domain.com` | 网络断了 / DNS 问题 |
| API 超时 | `curl -v URL` | 防火墙 / 服务挂了 |
| 端口被占用 | `lsof -i :PORT` | 其他进程占用 |
| DNS 解析失败 | `dig domain.com` | DNS 污染 / 配置错误 |
| Git push 失败 | `ssh -T git@github.com` | SSH 密钥问题 / 网络问题 |
| pip install 超时 | `pip install -i https://pypi.tuna.tsinghua.edu.cn/simple PKG` | 换国内镜像源 |

---

## 小结

| 概念 | 要记住的 |
|---|---|
| IP 地址 | 设备在网络中的门牌号，`127.0.0.1` 是自己 |
| 端口 | 区分同一设备上的不同服务，常见：22(SSH), 80(HTTP), 443(HTTPS) |
| DNS | 域名 → IP 的翻译系统 |
| HTTP | Web 的基础协议，GET 获取/POST 提交 |
| 状态码 | 200 成功, 404 找不到, 500 服务器错误 |
| curl | 命令行 HTTP 客户端，调 API 必备 |
| 代理 | `http_proxy` 环境变量控制终端代理 |

网络知识的学习是渐进式的——不需要一次理解所有细节，遇到问题时知道**去哪里查、用什么工具排查**，就已经超越了大部分初学者。

---
