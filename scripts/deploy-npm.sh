#!/usr/bin/env bash
#
# Deploy fix-my-shit to npm.
# Usage:
#   ./scripts/deploy-npm.sh           # publish current version
#   ./scripts/deploy-npm.sh patch      # bump patch (1.0.0 -> 1.0.1) then publish
#   ./scripts/deploy-npm.sh minor      # bump minor (1.0.0 -> 1.1.0) then publish
#   ./scripts/deploy-npm.sh major      # bump major (1.0.0 -> 2.0.0) then publish
#
set -e

cd "$(dirname "$0")/.."
ROOT=$(pwd)

echo "==> fix-my-shit – npm deploy"
echo ""

# Optional version bump
BUMP="${1:-}"
if [[ -n "$BUMP" ]]; then
  if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
    echo "Usage: $0 [patch|minor|major]"
    echo "  No arg = publish current version; patch/minor/major = bump then publish."
    exit 1
  fi
  echo "==> Bumping version ($BUMP)"
  npm version "$BUMP" --no-git-tag-version
  echo ""
fi

echo "==> Building"
npm run build
echo ""

echo "==> Checking npx readiness"
npm run check-npx-ready
echo ""

echo "==> Publishing to npm"
npm publish
echo ""

echo "==> Done. Install with: npx fix-my-shit"

# Publish as-is (e.g. 1.0.0)
# npm run deploy

# Bump patch and publish (1.0.0 → 1.0.1)
# npm run deploy:patch

# Or run the script directly with an argument
# ./scripts/deploy-npm.sh minor