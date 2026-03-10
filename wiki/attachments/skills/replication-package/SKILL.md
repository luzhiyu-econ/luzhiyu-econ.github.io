---
name: replication-package
description: 构建完整的学术论文复制包（replication package）。
disable-model-invocation: true
---

为当前项目构建复制包。

工作流程：
1. 扫描项目结构，识别数据、代码、输出文件
2. 创建 replication/ 目录，按标准结构组织：
   ```
   replication/
   ├── README.md          ← 复制说明（如何运行）
   ├── data/
   │   ├── raw/           ← 原始数据（或下载说明）
   │   └── processed/     ← 中间数据
   ├── code/
   │   ├── 01_clean.py    ← 数据清洗
   │   ├── 02_analysis.py ← 主分析
   │   ├── 03_robust.py   ← 稳健性检验
   │   └── 04_figures.py  ← 图表生成
   ├── output/
   │   ├── tables/        ← 表格
   │   └── figures/       ← 图表
   └── requirements.txt   ← 依赖列表
   ```
3. 生成 README.md，包含：
   - 论文标题和作者
   - 数据来源和获取方式
   - 软件环境要求
   - 运行步骤（一步一步）
   - 预期运行时间
   - 文件对应关系（哪个脚本生成哪个表/图）
4. 验证所有脚本从头到尾可以运行
5. 检查是否有硬编码路径
6. 确认随机种子已固定
