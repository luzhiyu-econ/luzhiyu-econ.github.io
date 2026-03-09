---
title: Python 爬虫进阶：Selenium 完全配置指南
tags:
  - skills/crawler
description: 从零开始配置 Selenium 环境，掌握浏览器自动化爬取动态网页的核心技巧，包含环境搭建、API 详解与实战要点。
---
> 本文配套 Jupyter Notebook 可直接运行，文末附下载链接。

在数据采集领域，`requests + BeautifulSoup` 是最经典的组合。但面对越来越多的 **JavaScript 动态渲染页面**，传统方案拿到的往往只是一个空壳 HTML。这时候，Selenium 就派上用场了。

本文以爬取 [北京市财政局财政预决算报告](https://czj.beijing.gov.cn/zwxx/czsj/czyjs/index_6709.html) 为实战案例，带你完整走通 Selenium 爬虫流程。

---

## 一、Selenium 是什么？什么时候该用它？

Selenium 最初是为 Web 自动化测试设计的，但它「像真人一样操控浏览器」的能力让它成了爬虫领域的利器。它可以打开网页、点击按钮、填表、翻页——这些 `requests` 做不到的事情，Selenium 都能做。

**什么时候选 Selenium 而不是 requests？**

- 页面内容通过 JavaScript 异步加载（比如 Ajax、Vue/React 渲染）
- 翻页靠点击按钮而非修改 URL 参数
- 需要登录、滑动验证码等复杂交互
- 页面有反爬机制检测非浏览器请求

当然它也有缺点：速度慢、资源消耗大。如果目标页面是纯静态的，用 requests 更高效。

---

## 二、环境配置

### 2.1 创建 Anaconda 虚拟环境

```bash
conda create -n spider python=3.10 -y
conda activate spider
```


### 2.2 安装依赖

```bash
pip install selenium webdriver-manager pandas openpyxl tqdm beautifulsoup4
```

这些库各司其职：

- **selenium** — 核心库，驱动浏览器
- **webdriver-manager** — 自动下载与 Chrome 版本匹配的 ChromeDriver，省去手动配置的麻烦
- **pandas / openpyxl** — 数据整理和 Excel 导出
- **tqdm** — 进度条（可选）
- **beautifulsoup4** — 辅助 HTML 解析（可选）

### 2.3 验证

```python
import selenium
print(f"Selenium 版本: {selenium.__version__}")  # 应输出 4.x.x
```

另外确保你的电脑上装有 **Google Chrome** 浏览器。

---

## 三、Selenium 核心 API 速览

### 3.1 启动浏览器

```python
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

chrome_options = Options()
chrome_options.add_argument("--headless=new")          # 无头模式，不弹窗口
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_argument("--ignore-certificate-errors")
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_argument(
    "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
```

几个关键选项的含义：

- `--headless=new` — 后台运行，不弹出浏览器窗口。**调试时建议注释掉**，直接看浏览器的行为更直观
- `--ignore-certificate-errors` — 部分政府网站的 HTTPS 证书会过期或配置有误，加上这个不会报错
- `--disable-blink-features=AutomationControlled` — 不让网站检测到这是自动化程序

### 3.2 打开页面 & 获取信息

```python
driver.get("https://example.com")       # 打开网页
print(driver.title)                      # 页面标题
print(driver.current_url)               # 当前 URL
html = driver.page_source               # 整页 HTML 源码
```

### 3.3 定位元素

Selenium 4 统一用 `By` 类定位。两个核心方法：

```python
from selenium.webdriver.common.by import By

# 找第一个匹配元素（找不到抛异常）
el = driver.find_element(By.CSS_SELECTOR, "div.list a")

# 找所有匹配元素（找不到返回空列表）
els = driver.find_elements(By.CSS_SELECTOR, "div.list a")
```

八种定位方式中，最常用的是 **CSS Selector** 和 **XPath**：

```python
# CSS —— 语法简洁，前端开发者友好
driver.find_element(By.CSS_SELECTOR, "a[href*='czyjs']")

# XPath —— 功能最全，支持文本匹配
driver.find_element(By.XPATH, "//a[contains(text(), '预算')]")
```

### 3.4 获取元素信息

```python
el.text                         # 可见文本
el.get_attribute("href")        # 任意 HTML 属性
el.get_attribute("innerHTML")   # 内部 HTML
el.is_displayed()               # 是否可见
```

### 3.5 交互操作

```python
el.click()                      # 点击
el.send_keys("搜索内容")        # 输入文字
el.clear()                      # 清空输入框
driver.execute_script("JS代码")  # 执行自定义 JavaScript
```

### 3.6 等待机制（重要！）

页面打开不等于内容加载完毕。很多数据通过 Ajax 异步加载，必须等它出现后再操作。

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 最多等 15 秒，直到指定元素出现
element = WebDriverWait(driver, 15).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "ul.list li a"))
)
```

这是 Selenium 爬虫中**最核心的技巧**。90% 的「元素找不到」问题都是没等页面加载完导致的。

### 3.7 关闭浏览器

```python
driver.quit()  # 关闭浏览器进程，释放资源（必须调用）
```

---

## 四、实战：爬取北京市财政局财政预决算报告

### 4.1 目标分析

目标页面：`https://czj.beijing.gov.cn/zwxx/czsj/czyjs/index_6709.html`

打开页面用 F12 看结构，可以发现：

- 每条报告是 `<li>` 内嵌一个 `<a>` 链接 + 一个 `<span>` 日期
- 底部的「下一页」按钮是 `<a href="javascript:next(0)">下一页</a>`
- 这意味着翻页由 JavaScript 控制，不能靠改 URL 参数，必须用 Selenium 点击

### 4.2 解析单页数据

```python
def parse_current_page(driver):
    """解析当前页所有报告的标题、链接、日期"""
    reports = []
    base_url = "https://czj.beijing.gov.cn/zwxx/czsj/czyjs/"

    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "li a[href]"))
    )

    items = driver.find_elements(By.CSS_SELECTOR, "ul.list li")
    if not items:
        items = driver.find_elements(
            By.XPATH,
            "//div[contains(@class,'con')]//li[.//a[contains(@href,'.html')]]"
        )

    for item in items:
        try:
            link_el = item.find_element(By.TAG_NAME, "a")
            title = link_el.text.strip()
            href = link_el.get_attribute("href") or ""
            if href and not href.startswith("http"):
                href = base_url + href.lstrip("./")

            try:
                date_text = item.find_element(By.TAG_NAME, "span").text.strip()
            except:
                date_text = ""

            if title:
                reports.append({"标题": title, "链接": href, "日期": date_text})
        except:
            continue

    return reports
```

### 4.3 实现翻页

```python
def has_next_page(driver):
    """判断是否还有下一页"""
    try:
        btn = driver.find_element(By.XPATH, "//a[contains(text(),'下一页')]")
        href = btn.get_attribute("href") or ""
        return "next" in href.lower()
    except:
        return False

def click_next_page(driver):
    """点击下一页"""
    try:
        btn = driver.find_element(By.XPATH, "//a[contains(text(),'下一页')]")
        try:
            btn.click()
        except ElementClickInterceptedException:
            driver.execute_script("arguments[0].click();", btn)
        time.sleep(2)
        return True
    except:
        return False
```

这里有个细节：如果按钮被页面上的其他元素遮挡，`click()` 会抛 `ElementClickInterceptedException`，此时改用 `execute_script` 强制 JS 点击即可。

### 4.4 主流程：遍历所有分页

```python
import time, pandas as pd

driver = create_driver()
driver.get("https://czj.beijing.gov.cn/zwxx/czsj/czyjs/index_6709.html")
time.sleep(3)

all_reports = []
page_num = 1

while True:
    reports = parse_current_page(driver)
    print(f"第 {page_num} 页: {len(reports)} 条")
    all_reports.extend(reports)

    if has_next_page(driver):
        click_next_page(driver)
        page_num += 1
        time.sleep(1.5)  # 礼貌性延迟
    else:
        break

driver.quit()

df = pd.DataFrame(all_reports)
print(f"\n共爬取 {len(df)} 条报告")
```

### 4.5 保存数据

```python
# Excel
df.to_excel("北京市财政预决算报告.xlsx", index=False, sheet_name="财政预决算")

# CSV（utf-8-sig 编码让 Excel 正确显示中文）
df.to_csv("北京市财政预决算报告.csv", index=False, encoding="utf-8-sig")

# JSON
import json
with open("reports.json", "w", encoding="utf-8") as f:
    json.dump(all_reports, f, ensure_ascii=False, indent=2)
```

---

## 五、常见坑 & 反爬应对

### 元素找不到

99% 是页面没加载完。解决方案：用 `WebDriverWait` + `expected_conditions` 显式等待。

### 内容在 iframe 里

```python
driver.switch_to.frame(driver.find_element(By.TAG_NAME, "iframe"))
# 操作完成后
driver.switch_to.default_content()
```

### 被网站检测为爬虫

三个层级的应对手段：

1. **基础** — 随机延迟 `time.sleep(random.uniform(1, 3))`，模拟人类节奏
2. **中级** — 每次启动随机切换 User-Agent
3. **进阶** — 使用 `selenium-stealth` 插件隐藏自动化特征

```python
from selenium_stealth import stealth
stealth(driver, languages=["zh-CN", "zh"], vendor="Google Inc.", platform="Win32")
```

### 浏览器进程残留

一定要在 `try...finally` 中调用 `driver.quit()`：

```python
driver = create_driver()
try:
    # 爬虫逻辑
    pass
finally:
    driver.quit()  # 无论是否出错都会执行
```
---

> ⚠️ **爬虫伦理：** 请遵守目标网站的 robots.txt，控制请求频率，仅爬取公开数据，不对服务器造成压力。政府公开信息的爬取通常是合规的，但仍应保持克制。
