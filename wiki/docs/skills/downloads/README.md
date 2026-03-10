# Downloads — Claude Code 经济学教程资源

本目录提供教程系列中引用的可下载资源。

## econ-replication

经济学论文复制工作流技能包，配合 Claude Code 使用。

**安装方式**：

```bash
# 复制到你的 Claude Code 项目
cp -r econ-replication /your-project/.claude/skills/

# 在 Claude Code 中使用
/econ-replication "Autor et al. (2013) - The China Syndrome"
```

**包含内容**：

| 文件 | 说明 |
|---|---|
| `SKILL.md` | 主技能定义：5 步复制工作流 |
| `references/package_anatomy.md` | 优质复制包的结构标准 |
| `references/replication_report_template.md` | 标准化复制报告模板 |
| `references/stata_to_python.md` | Stata→Python 命令对照表 |
| `references/wechat_post_template.md` | 微信公众号推文模板 |
| `scripts/result_comparator.py` | 结果数值比对工具 |
| `scripts/package_downloader.py` | 复制包搜索下载工具 |

详见教程 [#4：Skills 设计](../4%20-%20Skills%20for%20Economics.md)。
