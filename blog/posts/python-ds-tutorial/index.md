# Python 数据科学完整教程：从环境配置到Vibe-coding

> 本文是一份面向社科研究者的 Python 数据科学入门指南，涵盖环境搭建、基础语法、数据处理、可视化、机器学习，以及如何用 AI 工具加速编程。适合零基础或有少量编程经验的读者。

---

## 目录

- [第一部分：环境配置](#第一部分环境配置和基础安装)
- [第二部分：Python 基础语法](#第二部分需要学会的基础语法)
- [第三部分：数据科学核心技能](#第三部分进阶数据科学技能)
- [第四部分：AI 辅助编程](#第四部分使用ai加速代码开发)
- [附录：常见问题](#附录常见问题解决方案)

---

## 第一部分：环境配置和基础安装

### 1.1 Anaconda 安装

**下载与安装：**

1. 访问 [Anaconda 官网](https://www.anaconda.com/download) 下载对应系统版本；也可前往 [清华镜像站](https://mirrors.tuna.tsinghua.edu.cn/anaconda/archive/) 下载，速度更快
2. **Windows**：双击 `.exe` 安装，建议勾选 "Add Anaconda to PATH"
3. **macOS**：双击下载的 `.pkg` 安装包，按提示完成安装即可
4. **Linux**：在终端执行 `bash Anaconda3-*.sh`，按提示完成安装

> **注意：** Anaconda 在 2024 年底更改了命名规则，版本号从原来的 `x.x.x` 格式改为 `年份.月份` 的日期格式（如 `2025.06`）。从镜像站下载时，请选择 **Anaconda3**（注意是 3）开头、日期较新、且与你操作系统对应的版本。

**验证安装：**

```bash
conda --version
python --version
```

### 1.2 VSCode 安装与配置

- 访问 [VSCode 官网](https://code.visualstudio.com/) 下载安装

**必装扩展：**

| 扩展名 | 用途 |
|--------|------|
| Python (Microsoft) | 核心 Python 支持 |
| Jupyter (Microsoft) | Notebook 支持 |
| Pylance | 智能代码补全 |
| Python Environment Manager | 环境管理 |
| Data Wrangler | 表格可视化 |
| GitHub Copilot | AI 代码补全 |
| 简体中文语言包 | 中文界面 |

安装方式：VSCode 左侧 Extensions 图标 → 搜索扩展名 → Install

### 1.3 配置 Anaconda 环境

> 可跳过此步，直接使用 base 环境（Python >= 3.7 即可）。

```bash
# 创建 Python 3.11 环境
conda create -n ds_env python=3.11

# 激活环境
conda activate ds_env

# 安装核心数据科学包
conda install numpy pandas matplotlib seaborn scikit-learn jupyter notebook

# 安装额外工具
pip install plotly openpyxl xlrd
```

**在 VSCode 中选择解释器：**

1. `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）
2. 输入 `Python: Select Interpreter`
3. 选择 `ds_env` 环境

**验证配置：**

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

print("NumPy版本:", np.__version__)
print("Pandas版本:", pd.__version__)
print("环境配置成功！")
```

### 1.4 Jupyter Notebook 集成

在 VSCode 中创建 `.ipynb` 文件即可自动识别为 Notebook，右上角选择内核（ds_env 环境）。

**优势：**

- 交互式编程，实时查看结果
- Markdown 文档与代码混合编写
- 非常适合数据探索和可视化

---

## 第二部分：需要学会的基础语法

### 2.1 数据类型与变量

```python
# 基础数据类型
integer_num = 42                    # 整数
float_num = 3.14                    # 浮点数
string_text = "Hello Python"        # 字符串
boolean_val = True                  # 布尔值

# 集合类型
my_list = [1, 2, 3, 4, 5]          # 列表（可变）
my_tuple = (1, 2, 3)               # 元组（不可变）
my_dict = {"name": "Alice", "age": 25}  # 字典
my_set = {1, 2, 3, 4}              # 集合（唯一值）

# 类型转换
num_str = str(42)                   # "42"
str_num = int("42")                 # 42
```

### 2.2 逻辑语法

```python
# 条件判断
score = 85
if score >= 90:
    print("优秀")
elif score >= 60:
    print("及格")
else:
    print("不及格")

# for 循环
for i in range(5):
    print(i)

# while 循环
count = 0
while count < 5:
    print(count)
    count += 1

# 列表推导式（Pythonic 写法，推荐掌握）
squares = [x**2 for x in range(10)]
even_numbers = [x for x in range(20) if x % 2 == 0]
```

### 2.3 函数定义

```python
# 基础函数
def greet(name):
    return f"Hello, {name}!"

# 默认参数
def power(base, exponent=2):
    return base ** exponent

# 可变参数
def sum_all(*args):
    return sum(args)

# 关键字参数
def create_profile(**kwargs):
    return kwargs

# Lambda 函数（适合简短逻辑）
square = lambda x: x**2
```

### 2.4 文件操作

```python
# 读取文件
with open('data.txt', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = f.readlines()

# 写入文件
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write("Hello World\n")

# CSV 文件（用 Pandas 更方便）
import pandas as pd
df = pd.read_csv('data.csv')
df.to_csv('output.csv', index=False)
```

### 2.5 异常处理

```python
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"错误: {e}")
except Exception as e:
    print(f"未知错误: {e}")
finally:
    print("无论如何都会执行")
```

---

## 第三部分：进阶数据科学技能

### 3.1 NumPy — 数值计算基础

```python
import numpy as np

# 数组创建
arr = np.array([1, 2, 3, 4, 5])
zeros = np.zeros((3, 3))
ones = np.ones((2, 4))
random_arr = np.random.rand(5, 5)

# 数组操作
arr_2d = np.array([[1, 2, 3], [4, 5, 6]])
print(arr_2d.shape)           # (2, 3)
print(arr_2d.reshape(3, 2))   # 重塑形状
print(arr_2d.T)               # 转置

# 数学运算
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(a + b)                  # 元素相加
print(np.dot(a, b))           # 点积
print(np.mean(a))             # 均值
print(np.std(a))              # 标准差

# 索引和切片
arr = np.arange(10)
print(arr[2:5])               # [2, 3, 4]
print(arr[arr > 5])           # 布尔索引
```

### 3.2 Pandas — 数据处理核心

```python
import pandas as pd

# 创建 DataFrame
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 70000]
}
df = pd.DataFrame(data)

# 数据读取
df = pd.read_csv('data.csv')
df = pd.read_excel('data.xlsx')

# 数据查看
print(df.head())              # 前 5 行
print(df.info())              # 数据信息
print(df.describe())          # 统计摘要

# 数据选择
print(df['name'])             # 选择列
print(df[['name', 'age']])    # 选择多列
print(df.loc[0])              # 按标签选择行
print(df.iloc[0:2])           # 按位置选择行

# 数据筛选
high_salary = df[df['salary'] > 55000]
filtered = df[(df['age'] > 25) & (df['salary'] < 65000)]

# 数据处理
df['bonus'] = df['salary'] * 0.1       # 新增列
df.drop('bonus', axis=1, inplace=True) # 删除列
df.fillna(0, inplace=True)             # 填充缺失值
df.dropna(inplace=True)                # 删除缺失值

# 分组聚合
grouped = df.groupby('department')['salary'].mean()

# 数据合并
df1 = pd.DataFrame({'id': [1, 2], 'name': ['A', 'B']})
df2 = pd.DataFrame({'id': [1, 2], 'score': [90, 85]})
merged = pd.merge(df1, df2, on='id')
```

### 3.3 Matplotlib & Seaborn — 数据可视化

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 设置中文字体（避免乱码）
plt.rcParams['font.sans-serif'] = ['SimHei']       # Windows
# plt.rcParams['font.sans-serif'] = ['Arial Unicode MS']  # Mac
plt.rcParams['axes.unicode_minus'] = False

# 基础折线图
x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]
plt.plot(x, y, marker='o')
plt.xlabel('X轴')
plt.ylabel('Y轴')
plt.title('折线图示例')
plt.grid(True)
plt.show()

# 子图布局
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes[0, 0].plot(x, y)
axes[0, 1].bar(x, y)
axes[1, 0].scatter(x, y)
axes[1, 1].hist(y, bins=5)
plt.tight_layout()
plt.show()

# Seaborn 高级可视化
tips = sns.load_dataset('tips')
sns.set_style('whitegrid')

sns.pairplot(tips, hue='sex')           # 散点图矩阵
sns.heatmap(tips.corr(), annot=True, cmap='coolwarm')  # 热力图
sns.boxplot(x='day', y='total_bill', data=tips)        # 箱线图
plt.show()
```

### 3.4 Scikit-learn — 机器学习

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

# 数据准备
X = df[['feature1', 'feature2', 'feature3']]
y = df['target']

# 数据分割（80% 训练 / 20% 测试）
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 数据标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 训练模型
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# 预测与评估
y_pred = model.predict(X_test_scaled)
print(f"均方误差: {mean_squared_error(y_test, y_pred):.2f}")
print(f"R² 分数: {r2_score(y_test, y_pred):.2f}")
```

**分类任务示例：**

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)
y_pred = clf.predict(X_test)

print(classification_report(y_test, y_pred))
sns.heatmap(confusion_matrix(y_test, y_pred), annot=True, fmt='d')
```

### 3.5 实战项目：房价预测完整流程

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

# 1. 数据加载
df = pd.read_csv('house_prices.csv')

# 2. 数据探索
print(df.head())
print(df.info())
print(df.describe())
print(df.isnull().sum())

# 3. 数据清洗
df = df.dropna()
df = df.drop_duplicates()

# 4. 特征工程
df['price_per_sqft'] = df['price'] / df['sqft']
df['age'] = 2024 - df['year_built']

# 5. 可视化分析
plt.figure(figsize=(12, 8))
sns.heatmap(df.corr(), annot=True, cmap='coolwarm')
plt.title('特征相关性矩阵')
plt.show()

# 6. 模型训练
features = ['sqft', 'bedrooms', 'bathrooms', 'age']
X = df[features]
y = df['price']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 7. 模型评估
y_pred = model.predict(X_test)
print(f"平均绝对误差: ${mean_absolute_error(y_test, y_pred):,.2f}")

# 8. 特征重要性
importance = pd.DataFrame({
    'feature': features,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

plt.barh(importance['feature'], importance['importance'])
plt.xlabel('重要性')
plt.title('特征重要性排名')
plt.show()
```

---

## 第四部分：使用 AI 加速代码开发

### 4.1 GitHub Copilot 配置

1. VSCode 扩展商店搜索 **GitHub Copilot** 并安装
2. 使用 GitHub 账号登录（学生可申请免费使用）

**使用技巧：**

```python
# 技巧 1：写清晰的注释，Copilot 自动补全代码
# 计算列表中所有偶数的平方和
def sum_even_squares(numbers):
    return sum(x**2 for x in numbers if x % 2 == 0)

# 技巧 2：用函数名暗示功能，按 Tab 接受建议
def calculate_correlation_matrix(df):
    ...

# 快捷键：
# Alt + ]  下一个建议
# Alt + [  上一个建议
# Tab      接受建议
```

### 4.2 ChatGPT / Claude 辅助编程

#### 场景 1：代码解释

> "解释这段代码的功能：`df.groupby('category').agg({'sales': ['sum', 'mean'], 'profit': 'max'})`"

#### 场景 2：调试错误

> "我遇到了 `KeyError: 'column_name'`，代码如下：[粘贴代码]，数据集信息：[粘贴 df.info() 输出]"

#### 场景 3：代码优化

```python
# 原始代码（低效，逐行循环）
result = []
for i in range(len(df)):
    if df.loc[i, 'value'] > 100:
        result.append(df.loc[i, 'name'])

# AI 建议的优化版本（向量化操作，快几个数量级）
result = df[df['value'] > 100]['name'].tolist()
```

#### 场景 4：生成测试数据

> "帮我生成一个包含 1000 条客户购买记录的测试数据集，包含字段：customer_id, product, price, quantity, date"

### 4.3 AI 辅助数据分析完整案例

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Step 1: 数据加载与探索
df = pd.read_csv('sales_data.csv')
print(df.info())
print(df.describe())
print(df.isnull().sum())

# Step 2: 特征工程
df['order_date'] = pd.to_datetime(df['order_date'])
df['month'] = df['order_date'].dt.month
df['weekday'] = df['order_date'].dt.dayofweek
df['revenue'] = df['price'] * df['quantity']
df['discount_rate'] = (df['original_price'] - df['price']) / df['original_price']

# Step 3: 可视化分析
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

monthly_sales = df.groupby('month')['revenue'].sum()
axes[0, 0].plot(monthly_sales.index, monthly_sales.values, marker='o')
axes[0, 0].set_title('月度销售趋势')

category_counts = df['category'].value_counts()
axes[0, 1].bar(category_counts.index, category_counts.values)
axes[0, 1].set_title('产品类别分布')
axes[0, 1].tick_params(axis='x', rotation=45)

axes[1, 0].scatter(df['discount_rate'], df['quantity'], alpha=0.5)
axes[1, 0].set_title('折扣率与销量关系')

weekday_sales = df.groupby(['weekday', 'category'])['revenue'].sum().unstack()
sns.heatmap(weekday_sales, annot=True, fmt='.0f', ax=axes[1, 1])
axes[1, 1].set_title('周几 × 类别 销售热力图')

plt.tight_layout()
plt.show()

# Step 4: 建模预测
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

features = ['price', 'discount_rate', 'month', 'weekday',
            'category_encoded', 'inventory_level']
X = df[features].copy()
X['category_encoded'] = pd.Categorical(df['category']).codes
y = df['quantity']

model = RandomForestRegressor(n_estimators=100, random_state=42)
scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error')
print(f"平均绝对误差: {-scores.mean():.2f}")
```

### 4.4 高效使用 AI 的技巧

**1. 提供充分上下文**

- 差："这个错误怎么解决？"
- 好："我在用 Pandas 读取 CSV 时遇到 `UnicodeDecodeError`，文件包含中文字符，代码是 `pd.read_csv('data.csv')`，Python 3.11，如何解决？"

**2. 分步提问，而非一次性要求完成整个项目**

**3. 要求解释推理过程**，例如："为什么用 RandomForest 而不是线性回归？"

**4. 利用 AI 做代码审查**：让它检查性能问题、潜在 bug、PEP 8 规范。

### 4.5 推荐学习资源

**GitHub 开源项目：**

- [data-science-ipython-notebooks](https://github.com/donnemartin/data-science-ipython-notebooks) — 数据科学教程合集
- [Python-100-Days](https://github.com/jackfrued/Python-100-Days) — 100 天 Python 学习计划
- [scikit-learn 官方示例](https://github.com/scikit-learn/scikit-learn)

**在线平台：**

- [Kaggle Learn](https://www.kaggle.com/learn) — 免费交互式课程
- [Real Python](https://realpython.com/) — 深度教程文章

---

## 附录：常见问题解决方案

### Q1: conda 命令找不到

```bash
# Windows: 将 Anaconda 添加到 PATH
# 控制面板 → 系统 → 高级系统设置 → 环境变量
# 添加: C:\Users\YourName\Anaconda3\Scripts

# 或直接使用 Anaconda Prompt
```

### Q2: pip 安装速度慢

```bash
# 设置清华镜像源（永久生效）
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 单次使用
pip install numpy -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q3: Jupyter Notebook 无法显示图表

```python
# 在 Notebook 开头添加
%matplotlib inline
import matplotlib.pyplot as plt
```

### Q4: Matplotlib 中文乱码

```python
import matplotlib.pyplot as plt
plt.rcParams['font.sans-serif'] = ['SimHei']            # Windows
# plt.rcParams['font.sans-serif'] = ['Arial Unicode MS'] # Mac
plt.rcParams['axes.unicode_minus'] = False
```

### Q5: 内存不足

```python
# 分块读取大文件
for chunk in pd.read_csv('large_file.csv', chunksize=10000):
    process(chunk)

# 使用更省内存的数据类型
df['id'] = df['id'].astype('int32')
```
