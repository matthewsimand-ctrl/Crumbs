#!/usr/bin/env bash
set -euo pipefail

BRANCH="${GH_PAGES_BRANCH:-gh-pages}"
BASE_PATH="${GH_PAGES_BASE_PATH:-/Crumbs/}"
BUILD_DIR="dist"

npm run build -- --base="$BASE_PATH"

if [ ! -d "$BUILD_DIR" ]; then
  echo "Build output directory '$BUILD_DIR' does not exist."
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cp -R "$BUILD_DIR"/. "$TMP_DIR"/

git -C "$TMP_DIR" init >/dev/null
# Keep Pages from running Jekyll processing.
touch "$TMP_DIR/.nojekyll"

cat > "$TMP_DIR/README.md" <<MSG
# gh-pages

This branch is auto-generated from the main branch build output.
Do not edit files here manually.
MSG

git -C "$TMP_DIR" add .
git -C "$TMP_DIR" commit -m "Deploy $(git rev-parse --short HEAD)" >/dev/null

git -C "$TMP_DIR" remote add origin "$(git config --get remote.origin.url)"
git -C "$TMP_DIR" push --force origin HEAD:"$BRANCH"

echo "Deployment complete: pushed '$BUILD_DIR' to '$BRANCH' with base path '$BASE_PATH'."
