#!/usr/bin/env bash
set -euo pipefail

TEMPLATE="${1:-}"
TARGET_DIR="$HOME/.vscode"
TARGET_FILE="$TARGET_DIR/settings.json"

if [[ -z "$TEMPLATE" ]]; then
  echo "Usage: $0 <template-file>" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

if command -v envsubst >/dev/null 2>&1; then
  sed -E 's/\{\{[[:space:]]*env\.([A-Z0-9_\[\]\.]*)[[:space:]]*\}\}/\$\{\1\}/g' "$TEMPLATE" > /tmp/vscode-settings-for-envsubst.json
  envsubst < /tmp/vscode-settings-for-envsubst.json > "$TARGET_FILE"
else
  cp "$TEMPLATE" "$TARGET_FILE"
fi

chmod 0644 "$TARGET_FILE"
