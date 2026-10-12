#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
EXTENSION_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/com.jerseyengine.pro"

mkdir -p "$EXTENSION_DIR/CSXS"
cp "$SCRIPT_DIR/index.html" "$EXTENSION_DIR/index.html"
cp "$SCRIPT_DIR/core.jsx" "$EXTENSION_DIR/core.jsx"
cp "$SCRIPT_DIR/CSXS/manifest.xml" "$EXTENSION_DIR/CSXS/manifest.xml"

defaults write com.adobe.CSXS.12 PlayerDebugMode 1

printf 'Installed Jersey Engine Pro to:\n%s\n' "$EXTENSION_DIR"
printf 'Unsigned CEP panels are enabled for CSXS.12. Restart Illustrator, then open Window > Extensions (Legacy) > Jersey Engine Pro Nesting.\n'
