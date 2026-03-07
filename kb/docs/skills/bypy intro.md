---
title: 如何在 Linux 服务器下载百度网盘文件
tags:
  - skills/server
---
# 如何在 Linux 服务器下载百度网盘文件

在科研或数据处理过程中，我们经常需要将百度网盘中的数据下载到 Linux 服务器上。由于服务器通常没有图形界面，无法使用百度网盘客户端，这时候 **bypy** 就派上用场了。

bypy 是一个开源的百度网盘 Python 命令行客户端，支持文件的上传、下载和同步，无需图形界面即可操作。

> 项目地址：[https://github.com/houtianze/bypy](https://github.com/houtianze/bypy)

---

## 一、安装 bypy

确保服务器已安装 Python 3 和 pip，然后执行：

```bash
pip install bypy
```

验证安装是否成功：

```bash
bypy --version
```

---

## 二、首次授权

bypy 需要获得你百度账号的授权才能访问网盘文件。运行以下命令开始授权流程：

```bash
bypy info
```

终端会输出类似如下信息：

```
Please visit:
https://openapi.baidu.com/oauth/2.0/authorize?......
And authorize this app.
Paste the Authorization Code here within 300 seconds:
```

**操作步骤：**

1. 复制终端中显示的 URL
2. 在本地电脑的浏览器中打开该链接
3. 登录百度账号并点击"授权"
4. 将页面上显示的**授权码**复制
5. 回到终端粘贴授权码，按回车

授权成功后会显示网盘的配额信息，说明连接成功。

> **注意：** 授权码有效期为 300 秒，需在规定时间内完成粘贴。授权信息会被缓存，之后使用无需重复授权。

---

## 三、了解工作目录

bypy 默认操作的根目录是百度网盘中的：

```
/apps/bypy/
```

这意味着你需要先将要下载的文件**移动或复制**到网盘的 `/apps/bypy/` 目录下。可以通过百度网盘网页版或手机 App 操作。

---

## 四、常用命令

### 4.1 查看网盘文件

```bash
bypy list
```

示例输出：

```
/apps/bypy ($t $f $s $m $d):
D 新闻文本             0 2026-03-07, 19:20:24
F 数据.zip    123456789 2026-02-05, 00:32:39 md5hash...
```

其中 `D` 表示目录，`F` 表示文件。

### 4.2 下载单个文件

```bash
bypy downfile 数据.zip
```

文件会下载到当前工作目录下。

### 4.3 下载整个文件夹

```bash
bypy downdir 新闻文本
```

会将网盘上的 `新闻文本` 文件夹及其内容下载到当前目录。

### 4.4 同步网盘到本地

```bash
bypy syncdown
```

将 `/apps/bypy/` 下的所有内容同步到当前本地目录。已存在且未修改的文件会自动跳过。

### 4.5 上传文件

```bash
# 上传单个文件
bypy upload data.csv

# 同步本地目录到网盘
bypy syncup
```

### 4.6 比较本地与网盘差异

```bash
bypy compare
```

---

## 五、进阶技巧

### 5.1 使用 aria2 加速下载

bypy 支持 aria2 多线程下载，速度会有明显提升。

先安装 aria2：

```bash
# Ubuntu/Debian
sudo apt install aria2

# CentOS/RHEL
sudo yum install aria2
```

安装后 bypy 会自动检测并使用 aria2 进行下载，无需额外配置。

### 5.2 后台运行（适合大文件）

下载大文件时，建议使用 `nohup` 或 `screen`/`tmux` 避免 SSH 断连导致中断：

```bash
# 使用 nohup
nohup bypy downdir 新闻文本 > download.log 2>&1 &

# 查看下载进度
tail -f download.log
```

或者使用 tmux：

```bash
tmux new -s download
bypy downdir 新闻文本
# 按 Ctrl+B 然后按 D 分离会话
# 重新连接：tmux attach -t download
```

### 5.3 在 Jupyter Notebook 中使用

如果你的服务器运行了 JupyterLab，可以直接在代码单元格中执行：

```python
!pip install bypy
!bypy list
!bypy downdir 新闻文本
```

也可以在 Python 代码中调用：

```python
from bypy import ByPy

bp = ByPy()
bp.list()
bp.downdir('新闻文本')
```

### 5.4 指定下载路径

```bash
bypy downdir 新闻文本 /home/user/data/新闻文本
```

---

## 六、常见问题

### Q1：授权码粘贴后提示失败？

- 确保在 300 秒内完成粘贴
- 检查是否复制了完整的授权码（无多余空格）
- 尝试重新运行 `bypy info`

### Q2：下载速度很慢？

- 安装 aria2 进行多线程下载
- 检查服务器网络带宽
- 百度网盘对非会员有限速，bypy 走的是开放 API，不受客户端限速影响，但仍可能受到 API 层面的限制

### Q3：提示 Token 过期？

重新运行 `bypy info` 进行授权即可刷新 Token。

### Q4：`/apps/bypy/` 目录在哪里？

打开百度网盘（网页版或 App），在"全部文件"中找到 `apps` 文件夹，里面的 `bypy` 文件夹就是 bypy 的工作目录。如果没有，运行一次 `bypy list` 后会自动创建。

---

## 七、命令速查表

| 命令 | 说明 |
|---|---|
| `bypy info` | 授权 / 查看网盘信息 |
| `bypy list` | 列出网盘文件 |
| `bypy downfile <文件>` | 下载单个文件 |
| `bypy downdir <目录>` | 下载文件夹 |
| `bypy syncdown` | 同步网盘到本地 |
| `bypy upload <路径>` | 上传文件 |
| `bypy syncup` | 同步本地到网盘 |
| `bypy compare` | 比较本地与网盘差异 |

---

## 总结

bypy 是在 Linux 服务器上操作百度网盘最便捷的工具之一。只需 `pip install bypy`，完成一次授权，就能通过命令行自由地上传下载文件。配合 aria2 和 tmux，即使是大文件也能稳定高效地传输。
