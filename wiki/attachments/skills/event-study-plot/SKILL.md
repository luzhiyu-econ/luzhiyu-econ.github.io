---
name: event-study-plot
description: 生成学术论文级别的 event study 图。
disable-model-invocation: true
---

基于数据 $ARGUMENTS 生成 event study 图。

图表标准：
- 分辨率：300 DPI
- 字号：轴标签 12pt，标题 14pt
- 字体：Times New Roman
- 基准期 k=-1 归零，用红色虚线标记
- 95% 置信区间用浅蓝色阴影
- 零线用黑色虚线
- X 轴：Years relative to policy
- Y 轴：Coefficient (ATT)
- 同时输出 PNG + PDF 到 output/figures/

Python 实现使用 matplotlib，模板：
```python
import matplotlib.pyplot as plt
import matplotlib
matplotlib.rcParams['font.family'] = 'Times New Roman'
matplotlib.rcParams['font.size'] = 12

fig, ax = plt.subplots(figsize=(8, 5))
ax.axhline(y=0, color='black', linestyle='--', linewidth=0.8)
ax.axvline(x=-0.5, color='red', linestyle=':', linewidth=0.7)
ax.fill_between(periods, ci_lower, ci_upper, alpha=0.15, color='steelblue')
ax.plot(periods, coefficients, 'o-', color='steelblue', markersize=5)
ax.set_xlabel('Years relative to policy', fontsize=12)
ax.set_ylabel('Coefficient (ATT)', fontsize=12)
plt.tight_layout()
plt.savefig('output/figures/event_study.pdf', dpi=300, bbox_inches='tight')
plt.savefig('output/figures/event_study.png', dpi=300, bbox_inches='tight')
```
