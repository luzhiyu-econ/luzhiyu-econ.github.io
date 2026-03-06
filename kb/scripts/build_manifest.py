#!/usr/bin/env python3
"""
build_manifest.py — Auto-generate kb/manifest.json from docs/ folder structure.

Scans kb/docs/ recursively, reads YAML frontmatter from each .md file,
and outputs a manifest.json that app.js consumes to render the sidebar.

Zero external dependencies (stdlib only).
"""

import json
import os
import re
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
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip().lower()
        val = val.strip()

        if key == "tags":
            list_match = YAML_LIST_RE.search(val)
            if list_match:
                fm["tags"] = [t.strip().strip("'\"") for t in list_match.group(1).split(",") if t.strip()]
            else:
                fm["tags"] = [t.strip().strip("'\"") for t in val.split(",") if t.strip()]
        elif key == "title":
            fm["title"] = val.strip("'\"")
        elif key == "order":
            try:
                fm["order"] = int(val)
            except ValueError:
                pass

    return fm


def title_from_filename(filename):
    """Derive a display title from a filename: remove .md, replace - with space, capitalize words."""
    name = filename.replace(".md", "")
    name = name.replace("-", " ").replace("_", " ")
    return name.title()


def read_folder_meta(dirpath):
    """Read optional _folder.yml for custom folder display name and order."""
    meta_path = os.path.join(dirpath, "_folder.yml")
    if not os.path.isfile(meta_path):
        return {}
    return parse_frontmatter_raw(meta_path)


def parse_frontmatter_raw(filepath):
    """Parse a simple key: value file (for _folder.yml)."""
    result = {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if ":" not in line:
                    continue
                key, _, val = line.partition(":")
                key = key.strip().lower()
                val = val.strip().strip("'\"")
                if key == "title":
                    result["title"] = val
                elif key == "order":
                    try:
                        result["order"] = int(val)
                    except ValueError:
                        pass
    except OSError:
        pass
    return result


def should_skip(name):
    """Skip hidden and underscore-prefixed entries."""
    return name.startswith(".") or name.startswith("_")


def build_tree(dirpath, rel_prefix="docs"):
    """Recursively build the manifest tree for a directory."""
    entries = sorted(os.listdir(dirpath))
    files = []
    folders = []

    for entry in entries:
        if should_skip(entry):
            continue
        full = os.path.join(dirpath, entry)
        if os.path.isdir(full):
            folders.append((entry, full))
        elif entry.endswith(".md"):
            files.append((entry, full))

    tree = []

    for fname, fpath in files:
        fm = parse_frontmatter(fpath)
        rel_path = os.path.join(rel_prefix, fname).replace(os.sep, "/")
        node = {
            "title": fm.get("title") or title_from_filename(fname),
            "path": rel_path,
            "tags": fm.get("tags", []),
        }
        if "order" in fm:
            node["_order"] = fm["order"]
        tree.append(node)

    for dname, dpath in folders:
        children = build_tree(dpath, os.path.join(rel_prefix, dname))
        if not children:
            continue
        meta = read_folder_meta(dpath)
        folder_title = meta.get("title") or dname.replace("-", " ").replace("_", " ").title()
        node = {
            "title": folder_title,
            "type": "folder",
            "children": children,
        }
        if "order" in meta:
            node["_order"] = meta["order"]
        tree.append(node)

    tree.sort(key=lambda n: (n.get("_order", 9999), n.get("title", "")))

    for node in tree:
        node.pop("_order", None)

    return tree


def main():
    if not os.path.isdir(DOCS_DIR):
        print(f"Error: docs directory not found at {DOCS_DIR}", file=sys.stderr)
        sys.exit(1)

    tree = build_tree(DOCS_DIR)
    manifest = {"tree": tree}

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    doc_count = sum(1 for _ in walk_docs(tree))
    print(f"manifest.json generated: {doc_count} doc(s) found.")


def walk_docs(tree):
    for node in tree:
        if node.get("type") == "folder":
            yield from walk_docs(node.get("children", []))
        else:
            yield node


if __name__ == "__main__":
    main()
