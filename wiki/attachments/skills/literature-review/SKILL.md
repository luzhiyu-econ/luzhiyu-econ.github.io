---
name: literature-review
description: 文献调研和综述辅助。搜索相关文献、提取核心信息、管理 BibTeX 引用。
disable-model-invocation: true
---

对主题 $ARGUMENTS 进行文献调研。

## 工作流程

### Step 1: 文献搜索
1. 根据主题关键词搜索相关学术文献
2. 优先搜索以下来源：
   - Google Scholar（通过 WebSearch）
   - NBER Working Papers
   - SSRN
   - 顶刊近 5 年发表（AER, QJE, Econometrica, JPE, REStud）
3. 收集 15-20 篇最相关文献

### Step 2: 信息提取
对每篇文献提取：
- 标题、作者、年份、期刊
- 核心研究问题（一句话）
- 识别策略 / 主要方法
- 关键发现（1-2 句）
- 与当前研究的关联

### Step 3: 文献分类
按以下维度整理：
- **直接相关**：研究同一问题或使用同一方法
- **方法论参考**：提供方法论支撑
- **背景文献**：提供制度背景或理论框架

### Step 4: 输出
1. 结构化笔记 → `paper/literature_notes.md`
2. BibTeX 条目 → `paper/references.bib`（追加模式）
3. 研究空白分析 → 当前文献中哪些问题未被充分研究

### BibTeX 格式规范
```bibtex
@article{AuthorYear,
  author  = {Last, First and Last2, First2},
  title   = {Full Title},
  journal = {Journal Name},
  year    = {2024},
  volume  = {114},
  number  = {3},
  pages   = {1-45},
  doi     = {10.xxxx/xxxxx}
}
```
