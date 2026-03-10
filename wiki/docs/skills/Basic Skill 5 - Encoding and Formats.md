---
title: "#5：文件编码与数据格式"
tags:
  - skills/basic
order: 6
description: 理解字符编码的本质，掌握 JSON、YAML、CSV、Markdown 等常见数据格式。
---

> 计算机只认识 0 和 1，而你看到的每一个汉字、每一个 emoji 背后都有一套精密的编码规则。

你一定遇到过**乱码**——打开文件后看到一堆 `锟斤拷` 或 `???`。理解编码不是可选的冷知识，而是解决实际问题的必备技能。

---

## 一、字符编码：从 ASCII 到 UTF-8

### 1.1 ASCII：一切的起点

1963 年，美国制定了 ASCII（American Standard Code for Information Interchange），用 7 位二进制（0-127）表示 128 个字符：

| 范围 | 内容 |
|---|---|
| 0 - 31 | 控制字符（换行 `\n`、制表符 `\t` 等） |
| 32 - 126 | 可打印字符（字母、数字、标点） |
| 127 | 删除键 |

```
A = 65 = 01000001
a = 97 = 01100001
0 = 48 = 00110000
```

ASCII 的问题：**只够表示英文**。中文、日文、阿拉伯文、emoji 统统没份。

### 1.2 混乱年代：各国各搞一套

每个国家/地区为自己的语言制定了编码标准：

| 编码 | 覆盖 | 典型问题 |
|---|---|---|
| GB2312 / GBK / GB18030 | 简体中文 | 用 GBK 打开 Big5 文件 = 乱码 |
| Big5 | 繁体中文 | 用 Big5 打开 GBK 文件 = 乱码 |
| Shift_JIS | 日文 | 和中文编码互相冲突 |
| ISO-8859-1 (Latin-1) | 西欧语言 | 不支持中文 |

这就是乱码的根源：**写入时用编码 A，读取时用编码 B**，字节被错误地映射成其他字符。

### 1.3 Unicode：大一统

Unicode 为世界上**所有文字**分配了唯一的编号（码点），格式为 `U+XXXX`：

```
A       = U+0041
中      = U+4E2D
😀      = U+1F600
𠮷（生僻字）= U+20BB7
```

Unicode 目前收录了超过 15 万个字符，涵盖人类几乎所有书写系统。

但 Unicode 只是一个**字符集**（编号方案），不直接规定如何存储。存储方案叫**编码方式**，最常见的就是 UTF-8。

### 1.4 UTF-8：现代标准

UTF-8 是一种**可变长度编码**，用 1~4 个字节表示一个字符：

| 字符范围 | 字节数 | 示例 |
|---|---|---|
| U+0000 ~ U+007F | 1 字节 | 英文字母、数字（和 ASCII 完全兼容） |
| U+0080 ~ U+07FF | 2 字节 | 拉丁扩展、希腊字母 |
| U+0800 ~ U+FFFF | 3 字节 | 中日韩汉字 |
| U+10000 ~ U+10FFFF | 4 字节 | emoji、生僻字 |

```
"A"   → 1 字节:  41
"中"  → 3 字节:  E4 B8 AD
"😀" → 4 字节:  F0 9F 98 80
```

UTF-8 的优点：
- **兼容 ASCII**：纯英文文件用 UTF-8 和 ASCII 打开效果完全一样
- **节省空间**：英文只占 1 字节，不像 UTF-16 固定 2 字节
- **无字节序问题**：不需要 BOM（Byte Order Mark）

> **一条金律**：所有新文件、新项目，**一律用 UTF-8 编码**。这已经是全球共识。

---

## 二、实战：编码问题的排查与解决

### 2.1 查看文件编码

```bash
# macOS / Linux
file -I data.csv
# data.csv: text/csv; charset=utf-8

# 查看十六进制内容
xxd data.csv | head
```

### 2.2 转换编码

```bash
# 用 iconv 转换
iconv -f GBK -t UTF-8 data_gbk.csv > data_utf8.csv

# 批量转换目录下所有 csv
for f in *.csv; do
  iconv -f GBK -t UTF-8 "$f" > "utf8_$f"
done
```

### 2.3 Python 中处理编码

```python
# 读取 GBK 编码的文件
with open("data.csv", encoding="gbk") as f:
    content = f.read()

# 用 pandas 读取
import pandas as pd
df = pd.read_csv("data.csv", encoding="gbk")

# 写入时指定编码（Excel 友好的 UTF-8 with BOM）
df.to_csv("output.csv", encoding="utf-8-sig", index=False)
```

> **Tips**：国内政府网站和银行下载的 CSV 文件几乎都是 GBK 编码。用 `encoding="gbk"` 或 `encoding="gb18030"` 打开。

---

## 三、换行符：LF vs CRLF

这个话题在第 0 篇提过，这里补充技术细节。

| 名称 | 字节 | 转义 | 系统 |
|---|---|---|---|
| LF (Line Feed) | `0x0A` | `\n` | Unix / macOS / Linux |
| CR (Carriage Return) | `0x0D` | `\r` | 老版 Mac（OS 9 之前） |
| CRLF | `0x0D 0x0A` | `\r\n` | Windows |

### 为什么这么设计？

来源于电传打字机的两个机械动作：
- **CR**：把打印头移回行首（Carriage Return）
- **LF**：把纸向上推一行（Line Feed）

Unix 简化为只用 LF，Windows 保留了完整的 CR+LF。

### 在编辑器中查看和转换

VS Code 右下角会显示当前文件的换行符（`LF` 或 `CRLF`），点击即可切换。

### Git 的自动处理

```bash
# 推荐配置：提交时自动转为 LF，检出时保持（macOS/Linux）
git config --global core.autocrlf input

# Windows：提交时转为 LF，检出时转为 CRLF
git config --global core.autocrlf true
```

也可以在项目根目录创建 `.gitattributes` 文件进行精确控制：

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
*.ps1 text eol=crlf
```

---

## 四、常见数据格式

### 4.1 JSON（JavaScript Object Notation）

最通用的数据交换格式，几乎所有编程语言和 API 都支持：

```json
{
  "name": "陆知雨",
  "age": 24,
  "university": "中央财经大学",
  "skills": ["Python", "Stata", "R"],
  "publications": [
    {
      "title": "Some Paper",
      "year": 2026,
      "published": true
    }
  ],
  "address": null
}
```

**规则**：
- 键必须用双引号
- 值可以是：字符串、数字、布尔值、null、数组、对象
- 不支持注释（这是最大的痛点）
- 最后一个元素后不能有逗号（trailing comma）

```python
import json

# 读取
with open("data.json", encoding="utf-8") as f:
    data = json.load(f)

# 写入（ensure_ascii=False 保留中文）
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

### 4.2 YAML（YAML Ain't Markup Language）

比 JSON 更适合人类读写的配置格式：

```yaml
name: 陆知雨
age: 24
university: 中央财经大学

skills:
  - Python
  - Stata
  - R

publications:
  - title: Some Paper
    year: 2026
    published: true

# YAML 支持注释！
address: null
```

**JSON vs YAML 对比**：

| 特性 | JSON | YAML |
|---|---|---|
| 可读性 | 一般 | 好 |
| 注释 | 不支持 | 支持（`#`） |
| 复杂度 | 简单 | 较复杂（缩进敏感） |
| 用途 | API 数据交换 | 配置文件 |
| 文件扩展名 | `.json` | `.yml` / `.yaml` |

> YAML 广泛用于：Docker Compose、GitHub Actions、Kubernetes、conda environment.yml 等配置文件。

### 4.3 CSV / TSV

表格数据的最简单表示：

```csv
姓名,年龄,城市
张三,25,北京
李四,30,上海
```

```tsv
姓名	年龄	城市
张三	25	北京
李四	30	上海
```

| 格式 | 分隔符 | 优点 | 缺点 |
|---|---|---|---|
| CSV | 逗号 `,` | 最通用 | 值含逗号时需引号包裹 |
| TSV | Tab `\t` | 处理更简单 | 不够常见 |

**常见坑**：
- Excel 打开 UTF-8 的 CSV 会乱码 → 用 `utf-8-sig` 编码（带 BOM）
- 字段中包含逗号或换行 → 必须用双引号包裹

### 4.4 Markdown

你现在看到的这篇文章就是用 Markdown 写的。它是一种轻量级标记语言：

```markdown
# 一级标题
## 二级标题

**加粗** *斜体* `行内代码`

- 无序列表
- 第二项

1. 有序列表
2. 第二项

[链接文字](https://example.com)
![图片描述](image.png)

> 引用块

| 表头 | 表头 |
|------|------|
| 内容 | 内容 |
```

Markdown 的核心优势：**纯文本 + 简单语法 = 可读性极佳**。它被广泛用于：
- README 文档
- 技术博客
- 笔记软件（Obsidian、Notion）
- GitHub Issue / PR

### 4.5 TOML

Python 生态中越来越常见的配置格式（`pyproject.toml`）：

```toml
[project]
name = "my-package"
version = "0.1.0"
description = "A sample project"

[project.dependencies]
pandas = ">=2.0"
numpy = ">=1.24"

[tool.ruff]
line-length = 88
target-version = "py311"
```

TOML 的特点：语义清晰，比 YAML 更不容易出错，不依赖缩进。

### 4.6 .env

存储环境变量的简单键值对格式：

```env
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=sk-1234567890abcdef
DEBUG=true
```

> **安全警告**：`.env` 文件通常包含密码和密钥，**绝对不要**提交到 Git。务必在 `.gitignore` 中添加 `.env`。

---

## 五、二进制 vs 文本文件

| | 文本文件 | 二进制文件 |
|---|---|---|
| 内容 | 人类可读的字符 | 机器直接处理的字节流 |
| 编辑 | 任何文本编辑器 | 需要专门的程序 |
| 示例 | `.py`, `.md`, `.json`, `.csv` | `.png`, `.pdf`, `.xlsx`, `.zip` |
| Git 处理 | 逐行对比 diff | 只能判断"变了/没变" |
| 编码 | 需要指定（UTF-8 等） | 有自己的内部格式 |

### 如何判断？

```bash
file document.txt
# document.txt: UTF-8 Unicode text

file image.png
# image.png: PNG image data, 800 x 600, 8-bit/color RGBA

file data.xlsx
# data.xlsx: Microsoft Excel 2007+
```

> `.xlsx` 看起来是"表格"，但实际上是个 ZIP 压缩包，里面包含一堆 XML 文件。所以它是二进制文件，不能用 `cat` 查看。

---

## 六、实用编码速查

### 常见乱码与解决方案

| 现象 | 原因 | 解决 |
|---|---|---|
| `锟斤拷` | GBK 文件被当作 UTF-8 读取 | 用 GBK 编码重新打开 |
| `æ–‡ä»¶` | UTF-8 文件被当作 Latin-1 读取 | 指定 UTF-8 编码 |
| `????` | 字体不支持该字符 | 换用支持 Unicode 的字体 |
| `ÐÄ·Ñ½ð¶î` | 编码识别错误 | 尝试 `gb18030` 编码 |
| Excel 打开 CSV 乱码 | 缺少 BOM | 保存为 `utf-8-sig` 编码 |

### 编码选择原则

```
新建文件 → 一律 UTF-8
读取文件 → 先判断编码（file -I 或 chardet）
国内旧数据 → 尝试 GBK / GB18030
保存给 Excel → 用 utf-8-sig（带 BOM）
```

---

## 小结

| 概念 | 要记住的 |
|---|---|
| UTF-8 | 现代标准，所有新文件都用它 |
| GBK | 中文旧系统常见，国内数据源常用 |
| LF vs CRLF | Unix 用 LF，Windows 用 CRLF，Git 可自动处理 |
| JSON | API 和数据交换的标准格式 |
| YAML | 配置文件首选，支持注释 |
| CSV | 表格数据最简形式，注意编码 |
| Markdown | 技术写作的事实标准 |
| TOML | Python 项目配置的新趋势 |

编码和格式是"基础设施"级别的知识——你不需要每天都想着它们，但当问题出现时（乱码、解析错误、格式不兼容），你能立刻知道问题出在哪。

---

> **下一篇**：[[Basic Skill 6 - Shell Advanced|Shell 进阶与效率提升]] —— 用脚本和工具让终端能力翻倍。
