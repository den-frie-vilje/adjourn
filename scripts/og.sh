#!/bin/sh
# Renders docs/og.html to docs/og.jpg (1200×630) and docs/readme-hero.html to docs/img/readme-hero.jpg (1760×760) with headless Chrome.
set -eu
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="$PWD/docs/og.png" "file://$PWD/docs/og.html" 2>/dev/null
sips -s format jpeg -s formatOptions 82 docs/og.png --out docs/og.jpg >/dev/null
rm docs/og.png
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1760,760 --screenshot="$PWD/docs/img/readme-hero.png" "file://$PWD/docs/readme-hero.html" 2>/dev/null
sips -s format jpeg -s formatOptions 82 docs/img/readme-hero.png --out docs/img/readme-hero.jpg >/dev/null
rm docs/img/readme-hero.png
echo docs/og.jpg docs/img/readme-hero.jpg
