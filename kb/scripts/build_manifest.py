#!/usr/bin/env python3
"""
build_manifest.py — Auto-generate kb/manifest.json from docs/ folder structure.

Scans kb/docs/ recursively, reads YAML frontmatter from each .md file,
and builds a **tag-driven** virtual folder tree.  Hierarchical tags like
``skills/tools`` become nested folders (Skills > Tools) in the manifest.

A single file with multiple tags appears under each corresponding folder.

Zero external dependencies (stdlib only).
"""

import json
import os
import re
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KB_ROOT = os.path.dirname(SCRIPT_DIR)
DOCS_DIR = os.path.join(KB_ROOT, "docs")
MANIFEST_PATH = os.path.join(KB_ROOT, "manifest.json")

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)
YAML_LIST_RE = re.compile(r"\[([^\]]*)\]")


def parse_frontmatter(filepath):
    """Extract title, tags, and order from YAML frontmatter (no PyYAML needed)."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(4096)
    except OSError:
        return {}

    m = FRONTMATTER_RE.match(content)
    if not m:
        return {}

    fm = {}
    lines = m.group(1).splitlines()
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if not stripped or stripped.startswith("#"):
            i += 1
            continue
        if ":" not in stripped:
            i += 1
            continue

        key, _, val = stripped.partition(":")
        key = key.strip().lower()
        val = val.strip()

        if key == "tags":
            if val:
                list_match = YAML_LIST_RE.search(val)
                if list_match:
                    fm["tags"] = [t.strip().strip("'\"") for t in list_match.group(1).split(",") if t.strip()]
                else:
                    fm["tags"] = [t.strip().strip("'\"") for t in val.split(",") if t.strip()]
            else:
                tags = []
                j = i + 1
                while j < len(lines):
                    item = lines[j].strip()
                    if item.startswith("- "):
                        tags.append(item[2:].strip().strip("'\""))
                        j += 1
                    else:
                        break
                fm["tags"] = tags
                i = j
                continue
        elif key == "title":
            fm["title"] = val.strip("'\"")
        elif key == "order":
            try:
                fm["order"] = int(val)
            except ValueError:
                pass

        i += 1

    return fm


def title_from_filename(filename):
    """Derive a display title from a filename."""
    name = filename.replace(".md", "")
    name = name.replace("-", " ").replace("_", " ")
    return name.title()


ACRONYMS = {"nlp", "api", "llm", "vpn", "ai", "ml", "cv"}


def format_folder_title(name):
    """Title-case a folder name, keeping known acronyms uppercase."""
    words = name.replace("-", " ").replace("_", " ").split()
    return " ".join(w.upper() if w.lower() in ACRONYMS else w.title() for w in words)


def should_skip(name):
    """Skip hidden and underscore-prefixed entries."""
    return name.startswith(".") or name.startswith("_")


def collect_all_docs(dirpath, rel_prefix="docs"):
    """Recursively collect every .md file under dirpath into a flat list."""
    results = []
    try:
        entries = sorted(os.listdir(dirpath))
    except OSError:
        return results

    for entry in entries:
        if should_skip(entry):
            continue
        full = os.path.join(dirpath, entry)
        if os.path.isdir(full):
            results.extend(collect_all_docs(full, os.path.join(rel_prefix, entry)))
        elif entry.endswith(".md"):
            fm = parse_frontmatter(full)
            rel_path = os.path.join(rel_prefix, entry).replace(os.sep, "/")
            results.append({
                "title": fm.get("title") or title_from_filename(entry),
                "path": rel_path,
                "tags": fm.get("tags", []),
                "_order": fm.get("order", 9999),
            })

    return results


def build_tag_tree(all_docs):
    """Build a virtual folder tree driven by hierarchical tags.

    - ``index`` tagged docs go to root level.
    - Docs without tags go to root level.
    - Tag ``a/b/c`` produces nested folders A > B > C with the doc inside C.
    """
    root_items = []
    tag_dict = {}

    for doc in all_docs:
        tags = [t for t in doc["tags"] if t != "index"]
        if not tags:
            root_items.append(doc)
            continue

        for tag in tags:
            parts = tag.split("/")
            node = tag_dict
            for part in parts:
                node = node.setdefault(part, {})
            node.setdefault("__docs__", []).append(doc)

    root_items.sort(key=lambda d: (d["_order"], d["title"]))

    tree = [_make_doc_node(d) for d in root_items]
    tree.extend(_dict_to_tree(tag_dict))
    return tree


def _dict_to_tree(d):
    """Convert the nested tag dict into the manifest folder/doc structure."""
    folders = []
    for key, value in sorted(d.items()):
        if key == "__docs__":
            continue
        children = []
        docs = value.get("__docs__", [])
        docs.sort(key=lambda d: (d["_order"], d["title"]))
        children.extend(_make_doc_node(doc) for doc in docs)
        children.extend(_dict_to_tree(value))
        folders.append({
            "title": format_folder_title(key),
            "type": "folder",
            "children": children,
        })
    return folders


def _make_doc_node(doc):
    return {
        "title": doc["title"],
        "path": doc["path"],
        "tags": doc["tags"],
    }


def walk_docs(tree):
    seen = set()
    for node in tree:
        if node.get("type") == "folder":
            yield from walk_docs(node.get("children", []))
        else:
            path = node["path"]
            if path not in seen:
                seen.add(path)
                yield node


def collect_activity():
    """Collect per-day commit counts for files under kb/docs/ via git log."""
    try:
        result = subprocess.run(
            ["git", "log", "--format=%ad", "--date=short", "--", "docs/"],
            capture_output=True, text=True, cwd=KB_ROOT, timeout=30,
        )
        if result.returncode != 0:
            return {}
    except (OSError, FileNotFoundError, subprocess.TimeoutExpired):
        return {}

    counts = {}
    for line in result.stdout.strip().splitlines():
        date = line.strip()
        if date:
            counts[date] = counts.get(date, 0) + 1
    return counts


def main():
    if not os.path.isdir(DOCS_DIR):
        print(f"Error: docs directory not found at {DOCS_DIR}", file=sys.stderr)
        sys.exit(1)

    all_docs = collect_all_docs(DOCS_DIR)
    tree = build_tag_tree(all_docs)
    activity = collect_activity()
    manifest = {"tree": tree, "activity": activity}

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    doc_count = sum(1 for _ in walk_docs(tree))
    print(f"manifest.json generated: {doc_count} unique doc(s), {len(activity)} active day(s).")


if __name__ == "__main__":
    main()
