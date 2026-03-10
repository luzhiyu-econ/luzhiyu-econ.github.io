---
name: regression-diagnostics
description: 对回归分析结果进行全面诊断。支持 DID、IV、RDD 三种方法。
disable-model-invocation: true
---

对以下回归分析执行诊断：$ARGUMENTS

根据回归类型执行对应的检查清单：

## DID（双重差分）检查清单
1. 平行趋势检验：事件研究图中处理前系数是否联合不显著
2. 动态效应：处理后系数的时间路径是否合理
3. 负权重问题：是否使用了 CS/SA/JWDID 等稳健估计量
4. HonestDiD 敏感性：显著后期系数的 breakdown point
5. 标准误聚类层级：是否在处理单元层级聚类
6. 安慰剂检验：时间安慰剂和随机化安慰剂是否通过
7. Oster δ* 检验：|δ*| > 1 为基本稳健

## IV（工具变量）检查清单
1. 第一阶段 F 统计量：> 10 为基本合格，> 104 为 Lee et al. (2022) 标准
2. 过度识别检验：Hansen J 统计量 p 值
3. 排他性约束：工具变量是否只通过内生变量影响因变量
4. 弱工具变量：Anderson-Rubin 检验、tF 检验

## RDD（断点回归）检查清单
1. 带宽选择：MSE-optimal bandwidth（rdrobust 默认）
2. McCrary 密度检验：断点处密度是否连续
3. 协变量平衡性：断点两侧控制变量是否跳跃
4. Placebo cutoff：在非断点处是否有效应
5. 带宽敏感性：不同带宽下结果是否稳健

对每个检查项给出：通过/警告/失败，并附具体改进建议。
