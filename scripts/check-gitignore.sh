#!/usr/bin/env bash
# Check if CLAUDE.local.md is gitignored (locally and globally)

# --- Local check ---
LOCAL_IGNORED="false"
if [ -f .gitignore ] && grep -q "CLAUDE.local.md" .gitignore 2>/dev/null; then
  LOCAL_IGNORED="true"
fi

# --- Global check ---
GLOBAL_IGNORED="false"
GLOBAL_PATH=""

CONFIGURED=$(git config --global core.excludesFile 2>/dev/null)
XDG_DEFAULT="$HOME/.config/git/ignore"
COMMON_GLOBAL="$HOME/.gitignore_global"

# Check configured path first
if [ -n "$CONFIGURED" ] && grep -q "CLAUDE.local.md" "$CONFIGURED" 2>/dev/null; then
  GLOBAL_IGNORED="true"
  GLOBAL_PATH="$CONFIGURED"
fi

# Check XDG default
if [ "$GLOBAL_IGNORED" = "false" ] && grep -q "CLAUDE.local.md" "$XDG_DEFAULT" 2>/dev/null; then
  GLOBAL_IGNORED="true"
  GLOBAL_PATH="$XDG_DEFAULT"
fi

# Check common convention
if [ "$GLOBAL_IGNORED" = "false" ] && grep -q "CLAUDE.local.md" "$COMMON_GLOBAL" 2>/dev/null; then
  GLOBAL_IGNORED="true"
  GLOBAL_PATH="$COMMON_GLOBAL"
fi

# --- Determine best global file to append to ---
# Priority: configured > existing XDG > existing common > NONE (needs setup)
GLOBAL_APPEND=""
if [ -n "$CONFIGURED" ]; then
  GLOBAL_APPEND="$CONFIGURED"
elif [ -f "$XDG_DEFAULT" ]; then
  GLOBAL_APPEND="$XDG_DEFAULT"
elif [ -f "$COMMON_GLOBAL" ]; then
  GLOBAL_APPEND="$COMMON_GLOBAL"
fi

# --- Output ---
echo "LOCAL_IGNORED:$LOCAL_IGNORED"
echo "GLOBAL_IGNORED:$GLOBAL_IGNORED"
echo "GLOBAL_PATH:${GLOBAL_PATH:-NONE}"
echo "GLOBAL_CONFIGURED:${CONFIGURED:-NONE}"
echo "GLOBAL_APPEND:${GLOBAL_APPEND:-NONE}"
