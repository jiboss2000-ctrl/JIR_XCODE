#!/usr/bin/env bash
set -euo pipefail

TEMPLATE="${1:-}" 
TARGET_DIR="$HOME/.vscode"
TARGET_FILE="$TARGET_DIR/settings.json"

mkdir -p "$TARGET_DIR"

if [[ -n "$TEMPLATE" && -f "$TEMPLATE" ]]; then
  if command -v envsubst >/dev/null 2>&1; then
    # Convert simple {{ env.VAR }} occurrences to ${VAR} for envsubst
    sed -E 's/\{\{[[:space:]]*env\.([A-Z0-9_\[\]\.]*)[[:space:]]*\}\}/\$\{\1\}/g' "$TEMPLATE" > /tmp/vscode-settings-for-envsubst.json
    # Export any newline-containing env vars as needed (user responsibility)
    envsubst < /tmp/vscode-settings-for-envsubst.json > "$TARGET_FILE"
  else
    cp "$TEMPLATE" "$TARGET_FILE"
  fi
else
  cat > "$TARGET_FILE" <<'JSON'
{
  "editor.fontFamily": "Fira Code, Monaco, Menlo, \"Courier New\", monospace",
  "editor.fontSize": 12,
  "editor.fontWeight": "normal",
  "workbench.colorTheme": "Monokai",
  "editor.rulers": [120],
  "files.eol": "\n",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.wordWrap": "off"
}
JSON
fi

chmod 0644 "$TARGET_FILE"
