#!/usr/bin/env bash
set -euo pipefail

TEMPLATE="${1:-}"
TARGET_DIR="$HOME/.vscode"
TARGET_FILE="$TARGET_DIR/settings.json"

mkdir -p "$TARGET_DIR"

if [[ -n "$TEMPLATE" && -f "$TEMPLATE" ]]; then
  if command -v envsubst >/dev/null 2>&1; then
    sed -E 's/\{\{[[:space:]]*env\.([A-Z0-9_\[\]\.]*)[[:space:]]*\}\}/\$\{\1\}/g' "$TEMPLATE" > /tmp/vscode-settings-for-envsubst.json
    envsubst < /tmp/vscode-settings-for-envsubst.json > "$TARGET_FILE"
  else
    cp "$TEMPLATE" "$TARGET_FILE"
  fi
else
  cat > "$TARGET_FILE" <<'JSON'
{
  "editor.fontFamily": "Monaco",
  "editor.fontSize": 12,
  "editor.fontWeight": "normal",
  "workbench.colorTheme": "monokai",
  "editor.rulers": [120],
  "files.eol": "\n",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.wordWrap": "off"
}
JSON
fi

chmod 0644 "$TARGET_FILE"
