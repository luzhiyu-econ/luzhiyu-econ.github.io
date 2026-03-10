"""
复制包下载器
从 AEA, ICPSR, Zenodo 等平台搜索和下载论文复制包。

用法：
    python package_downloader.py "Autor et al 2013" --output replication/

注意：
    实际下载可能需要平台账号和登录。
    此脚本提供搜索入口和下载框架。
"""

import argparse
import sys
from pathlib import Path

try:
    import urllib.request
    import json
except ImportError:
    pass


SEARCH_URLS = {
    "AEA": "https://www.aeaweb.org/articles?id=",
    "ICPSR": "https://www.openicpsr.org/openicpsr/search/studies?q=",
    "Zenodo": "https://zenodo.org/api/records?q=",
    "Harvard Dataverse": "https://dataverse.harvard.edu/api/search?q=",
}


def search_zenodo(query: str, max_results: int = 5) -> list:
    url = f"https://zenodo.org/api/records?q={query}&size={max_results}"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read())
            results = []
            for hit in data.get("hits", {}).get("hits", []):
                results.append(
                    {
                        "title": hit.get("metadata", {}).get("title", ""),
                        "doi": hit.get("doi", ""),
                        "url": hit.get("links", {}).get("html", ""),
                    }
                )
            return results
    except Exception as e:
        print(f"Zenodo 搜索失败: {e}")
        return []


def print_search_guide(query: str):
    print("=" * 60)
    print(f"搜索复制包: {query}")
    print("=" * 60)
    print()
    print("请在以下平台搜索:")
    print()
    for name, base_url in SEARCH_URLS.items():
        print(f"  {name}:")
        print(f"    {base_url}{query.replace(' ', '+')}")
        print()
    print("Zenodo 自动搜索结果:")
    results = search_zenodo(query)
    if results:
        for i, r in enumerate(results, 1):
            print(f"  {i}. {r['title']}")
            print(f"     URL: {r['url']}")
            print()
    else:
        print("  未找到结果")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="搜索论文复制包")
    parser.add_argument("query", help="论文标题或作者关键词")
    parser.add_argument("--output", default="replication/", help="下载目录")
    args = parser.parse_args()

    print_search_guide(args.query)
