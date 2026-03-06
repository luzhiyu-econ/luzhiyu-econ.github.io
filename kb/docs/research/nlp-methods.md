# NLP 方法论笔记

#nlp #methodology

## 文本分类

### 基于预训练模型的微调

使用 ERNIE/BERT 等预训练语言模型进行领域特定文本分类的一般流程：

1. **数据标注** — 人工标注训练集（通常 1000-5000 条）
2. **模型选择** — 根据语言和领域选择基座模型
3. **微调训练** — 设置合适的学习率（通常 2e-5 ~ 5e-5）
4. **评估验证** — 使用 F1-score、Precision、Recall 评估

```python
from transformers import AutoModelForSequenceClassification, AutoTokenizer

model_name = "nghuyong/ernie-3.0-base-zh"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=5)
```

### 关键参数选择

| 参数 | 推荐范围 | 说明 |
|------|----------|------|
| Learning Rate | 2e-5 ~ 5e-5 | 过大容易灾难性遗忘 |
| Batch Size | 16 ~ 32 | 受显存限制 |
| Epochs | 3 ~ 10 | 需配合 early stopping |
| Max Length | 128 ~ 512 | 视文本长度分布决定 |

## 文本向量化

> 向量化是将非结构化文本转为数值表示的关键步骤，是后续分析的基础。

常用方法：
- **TF-IDF** — 简单高效，适合基线模型
- **Word2Vec / FastText** — 捕捉语义关系
- **Sentence-BERT** — 获取句子级别的语义向量

---

*持续更新中…*
