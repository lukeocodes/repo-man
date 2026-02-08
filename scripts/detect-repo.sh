#!/usr/bin/env bash
# Auto-detect repo context for repo-man plugin

echo "REMOTE:$(git remote get-url origin 2>/dev/null || echo 'none')"
echo "BASENAME:$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null)"
echo "ROOT:$(git rev-parse --show-toplevel 2>/dev/null)"
echo "BRANCH:$(git branch --show-current 2>/dev/null)"

if test -f CLAUDE.local.md; then
  echo "LOCAL_MD:EXISTS"
else
  echo "LOCAL_MD:NOT_FOUND"
fi

echo "CLAUDE_FILES:"
find . -maxdepth 1 -name "CLAUDE*.md" 2>/dev/null

echo "MANIFESTS:"
find . -maxdepth 1 \( \
  -name "package.json" \
  -o -name "pyproject.toml" \
  -o -name "Cargo.toml" \
  -o -name "go.mod" \
  -o -name "*.csproj" \
  -o -name "*.sln" \
  -o -name "Makefile" \
  -o -name "deepgram.toml" \
\) 2>/dev/null
