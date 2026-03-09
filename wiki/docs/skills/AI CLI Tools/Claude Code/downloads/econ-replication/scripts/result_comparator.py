"""
结果比对工具
比较原始论文结果与复制结果的数值差异。

用法：
    python result_comparator.py original.csv replicated.csv --tolerance 0.01

输入：两个 CSV 文件，格式为：
    table, variable, coefficient, std_error, significance

输出：差异报告到 stdout
"""

import argparse
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("需要安装 pandas: pip install pandas")
    sys.exit(1)


def compare_results(
    original_path: str,
    replicated_path: str,
    coef_tolerance: float = 0.01,
    se_tolerance: float = 0.005,
) -> pd.DataFrame:
    original = pd.read_csv(original_path)
    replicated = pd.read_csv(replicated_path)

    merged = pd.merge(
        original,
        replicated,
        on=["table", "variable"],
        suffixes=("_orig", "_repl"),
    )

    merged["coef_diff"] = abs(
        merged["coefficient_orig"] - merged["coefficient_repl"]
    )
    merged["se_diff"] = abs(merged["std_error_orig"] - merged["std_error_repl"])

    def classify(row):
        if row["coef_diff"] == 0 and row["se_diff"] == 0:
            return "完全一致"
        elif row["coef_diff"] <= coef_tolerance and row["se_diff"] <= se_tolerance:
            return "容差内"
        else:
            return "超出容差"

    merged["status"] = merged.apply(classify, axis=1)
    return merged


def print_report(results: pd.DataFrame):
    total = len(results)
    exact = (results["status"] == "完全一致").sum()
    within = (results["status"] == "容差内").sum()
    beyond = (results["status"] == "超出容差").sum()

    print("=" * 60)
    print("复制结果比对报告")
    print("=" * 60)
    print(f"总比对项：{total}")
    print(f"  完全一致：{exact} ({exact/total*100:.1f}%)")
    print(f"  容差范围内：{within} ({within/total*100:.1f}%)")
    print(f"  超出容差：{beyond} ({beyond/total*100:.1f}%)")
    print()

    if beyond > 0:
        print("超出容差的项目：")
        print("-" * 60)
        for _, row in results[results["status"] == "超出容差"].iterrows():
            print(
                f"  {row['table']} - {row['variable']}: "
                f"原始={row['coefficient_orig']:.4f}, "
                f"复制={row['coefficient_repl']:.4f}, "
                f"差异={row['coef_diff']:.4f}"
            )

    rating = "A" if beyond == 0 else "B" if beyond <= 2 else "C" if exact + within > beyond else "D"
    print(f"\n总体评级：{rating}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="比对论文复制结果")
    parser.add_argument("original", help="原始结果 CSV 文件路径")
    parser.add_argument("replicated", help="复制结果 CSV 文件路径")
    parser.add_argument("--coef-tolerance", type=float, default=0.01)
    parser.add_argument("--se-tolerance", type=float, default=0.005)
    args = parser.parse_args()

    results = compare_results(
        args.original, args.replicated, args.coef_tolerance, args.se_tolerance
    )
    print_report(results)
