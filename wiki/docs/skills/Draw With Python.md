---
title: "如何解决 matplotlib 画图中文乱码问题"
tags:
  - skills/figure&table
  - skills/python
description: 从系统字体配置到项目内嵌字体文件，彻底解决 matplotlib 画图时中文显示乱码的问题。
---

> 如果你只想快速解决问题，直接跳到[方案二](#二推荐将字体文件放入项目目录)，这是最稳健的跨平台方案。

用 Python 画图时，图表标题、坐标轴标签里的中文变成了一堆方块或问号——这是 matplotlib 新手几乎必踩的坑。根本原因是：**matplotlib 默认使用的 DejaVu Sans 字体不包含中文字形**，遇到汉字只能渲染成乱码。

本文提供两种解决路径：

- **方案一**：调用各操作系统自带的中文字体（简单，但跨机器可能失效）
- **方案二**（推荐）：把字体文件放进项目目录，显式加载（一劳永逸，团队协作无忧）

---

## 一、使用系统自带中文字体

不同操作系统内置的中文字体名称不同，设置前需要确认当前系统。

### 1.1 各系统可用字体

| 操作系统 | 常用字体英文名 | 备注 |
|----------|---------------|------|
| Windows | `SimHei`（黑体）、`SimSun`（宋体）、`Microsoft YaHei`（微软雅黑） | 基本都有 |
| macOS | `PingFang SC`（苹方）、`STHeiti`（华文黑体）、`Heiti TC` | 版本不同可能有差异 |
| Linux | 通常**没有**预装中文字体，需手动安装 | 见下文说明 |

### 1.2 设置方式

```python
import matplotlib.pyplot as plt
import matplotlib

# 方法 A：通过 rcParams 全局设置（推荐写在脚本最顶部）
matplotlib.rcParams['font.sans-serif'] = ['SimHei']       # Windows 黑体
# matplotlib.rcParams['font.sans-serif'] = ['PingFang SC'] # macOS 苹方
matplotlib.rcParams['axes.unicode_minus'] = False          # 修复负号显示为方块的问题

plt.plot([1, 2, 3], [1, 4, 9])
plt.title('二次函数')
plt.xlabel('横轴')
plt.ylabel('纵轴')
plt.show()
```

`axes.unicode_minus = False` 这一行**不能漏**。matplotlib 默认用 Unicode 减号（U+2212）代替 ASCII 连字符，而中文字体通常不包含这个字符，会导致负号也变成方块。

### 1.3 自动检测操作系统并切换字体

如果你的代码需要在多台机器上运行，可以加一段自动适配逻辑：

```python
import platform
import matplotlib

system = platform.system()
if system == 'Windows':
    font_name = 'SimHei'
elif system == 'Darwin':   # macOS
    font_name = 'PingFang SC'
else:                       # Linux 等
    font_name = 'WenQuanYi Micro Hei'   # 需提前安装，见下文

matplotlib.rcParams['font.sans-serif'] = [font_name, 'DejaVu Sans']
matplotlib.rcParams['axes.unicode_minus'] = False
```

### 1.4 Linux 的特殊情况

Linux 发行版通常不自带中文字体，需要额外安装。以 Ubuntu / Debian 为例：

```bash
# 安装文泉驿字体（常见选择）
sudo apt-get install fonts-wqy-microhei

# 更新字体缓存
fc-cache -fv

# 清除 matplotlib 字体缓存，让它重新扫描
rm -f ~/.cache/matplotlib/fontlist*.json
```

安装完成后，在代码中指定 `'WenQuanYi Micro Hei'` 即可。

> **局限性**：以上方案依赖系统字体，一旦把代码迁移到新机器（尤其是 CI/CD 服务器或同事电脑），就可能因为字体不存在而报错或重新乱码。方案二可以彻底规避这个问题。

---

## 二、（推荐）将字体文件放入项目目录

最稳妥的做法：**把 `.ttf` 字体文件直接放进项目仓库**，在代码里用相对路径加载，无论换什么机器，只要 clone 了项目就能正常显示中文。

### 2.1 下载字体文件

推荐两款免费、开源授权的字体：

| 字体 | 风格 | 下载地址 |
|------|------|----------|
| SimSun（中易宋体） | 宋体，学术图表常用 | [simsun.ttf](https://github.com/kongchengji/FontSimsun/blob/master/simsun.ttf) |
| Times New Roman | 衬线体，英文学术标准 | [times.ttf](https://github.com/jneilliii/OctoPrint-RTMPStreamer/blob/master/octoprint_rtmpstreamer/static/fonts/times.ttf) |

将下载的 `.ttf` 文件放入项目的 `fonts/` 目录（可自由命名）：

```
your_project/
├── fonts/
│   ├── simsun.ttf
│   └── times.ttf
├── analysis.py
└── ...
```

### 2.2 方法 A：`font_manager.addfont()` 全局注册（推荐）

这是 matplotlib 官方推荐的现代做法（需要 matplotlib ≥ 3.2）。注册之后，整个脚本中所有图表都能用这个字体。

```python
import matplotlib
from matplotlib import font_manager
from pathlib import Path

# 注册字体（每次 import matplotlib 后都需要调用一次）
font_path = Path(__file__).parent / "fonts" / "simsun.ttf"
font_manager.fontManager.addfont(str(font_path))

# 获取注册后的字体名称，然后设置全局默认
prop = font_manager.FontProperties(fname=str(font_path))
matplotlib.rcParams['font.family'] = prop.get_name()
matplotlib.rcParams['axes.unicode_minus'] = False
```

之后正常使用 `plt` 即可，所有文字都会用 SimSun 渲染：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 100)
plt.plot(x, np.sin(x))
plt.title('正弦函数')
plt.xlabel('弧度')
plt.ylabel('幅值')
plt.tight_layout()
plt.savefig('output.png', dpi=150)
```

### 2.3 方法 B：`FontProperties` 逐元素指定

如果只想对某几个文字元素使用中文字体，或者需要混用中英文字体，可以用 `FontProperties` 精细控制：

```python
from matplotlib.font_manager import FontProperties
from pathlib import Path
import matplotlib.pyplot as plt

cn_font = FontProperties(fname=str(Path("fonts/simsun.ttf")), size=12)
en_font = FontProperties(fname=str(Path("fonts/times.ttf")),  size=12)

fig, ax = plt.subplots()
ax.plot([1, 2, 3], [3, 1, 2])
ax.set_title('人均 GDP 变化趋势', fontproperties=cn_font)
ax.set_xlabel('Year', fontproperties=en_font)
ax.set_ylabel('万元', fontproperties=cn_font)
plt.tight_layout()
plt.show()
```

这种方式的好处是可以让**中英文分别使用最适合的字体**，在学术论文图表中非常实用。

### 2.4 Jupyter Notebook 中的路径问题

在 `.ipynb` 文件中，`__file__` 不可用，建议改用：

```python
import os
from pathlib import Path

# 方式一：相对于当前工作目录
font_path = Path(os.getcwd()) / "fonts" / "simsun.ttf"

# 方式二：手动写绝对路径（不推荐，跨机器会失效）
# font_path = Path("/Users/yourname/project/fonts/simsun.ttf")
```

---

## 三、常见问题排查

### Q：设置了字体但中文还是乱码？

matplotlib 会缓存字体列表。新加入字体文件后，旧缓存里没有记录，设置不会生效。删除缓存文件后重启 Python 即可：

```python
import matplotlib
print(matplotlib.get_cachedir())   # 查看缓存目录
```

找到该目录，删除其中的 `fontlist-*.json` 文件，再次运行脚本。

### Q：`rcParams` 设置的字体名称不对，报 `findfont: Font family not found` 警告？

用下面的代码列出 matplotlib 当前能识别的所有字体名称：

```python
from matplotlib import font_manager

fonts = sorted([f.name for f in font_manager.fontManager.ttflist])
for f in fonts:
    print(f)
```

在输出列表里找到目标字体的**准确名称**，再填入 `rcParams`。

### Q：负号（`-`）显示为方块？

设置 `axes.unicode_minus = False`：

```python
import matplotlib
matplotlib.rcParams['axes.unicode_minus'] = False
```

---

## 四、方案对比总结

| | 系统字体方案 | 项目内字体文件方案 |
|--|------------|-----------------|
| 配置复杂度 | 低 | 略高（需下载字体文件） |
| 跨平台一致性 | 差（各系统字体不同） | **好**（字体随代码走） |
| 团队协作 | 需每人配置环境 | **clone 即用** |
| CI/CD 服务器 | 需额外安装字体 | **无需额外操作** |
| 推荐场景 | 个人临时脚本 | **正式项目、共享代码** |
