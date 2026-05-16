#!/usr/bin/env bash
# git-sync.sh — 安全同步脚本
# 用法: bash scripts/git-sync.sh [branch]
# 自动 stash → fetch → rebase → unstash
set -euo pipefail

BRANCH="${1:-gh-pages}"
REPO="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -z "$REPO" ]; then
  echo "❌ 不是 Git 仓库"
  exit 1
fi

cd "$REPO"

# 记录同步前 HEAD
OLD_HEAD="$(git rev-parse HEAD)"

# stash 未暂存更改
HAS_STASH=false
if ! git diff --quiet HEAD 2>/dev/null; then
  git stash push -m "git-sync auto stash $(date +%s)"
  HAS_STASH=true
fi

# fetch + rebase
git fetch origin "$BRANCH" 2>&1
git rebase "origin/$BRANCH" 2>&1 || {
  echo "❌ rebase 冲突，手动解决后重试"
  if [ "$HAS_STASH" = true ]; then
    git stash pop 2>/dev/null || true
  fi
  exit 2
}

# pop stash
if [ "$HAS_STASH" = true ]; then
  git stash pop 2>/dev/null || true
fi

NEW_HEAD="$(git rev-parse HEAD)"

if [ "$OLD_HEAD" = "$NEW_HEAD" ]; then
  echo "⏸ 无新提交"
  exit 0
fi

echo "✅ 已同步: $(git rev-parse --short $OLD_HEAD) → $(git rev-parse --short $NEW_HEAD)"
echo "新提交:"
git log --oneline "$OLD_HEAD".."$NEW_HEAD"
exit 0
