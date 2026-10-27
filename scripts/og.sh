#!/bin/sh
# Renders docs/og.html to docs/og.png at 1200×630 with headless Chrome.
set -eu
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="$PWD/docs/og.png" "file://$PWD/docs/og.html" 2>/dev/null
echo docs/og.png
