#!/bin/sh
# Builds appPackage/adjourn.zip with CLIENT_ID and BOT_DOMAIN filled in from .env.
set -eu
cd "$(dirname "$0")/.."
[ -f .env ] || { echo ".env missing: see README" >&2; exit 1; }
set -a; . ./.env; set +a
: "${CLIENT_ID:?CLIENT_ID missing in .env}"; : "${BOT_DOMAIN:?BOT_DOMAIN missing in .env}"
rm -rf appPackage/build && mkdir -p appPackage/build
sed -e "s/\${{CLIENT_ID}}/$CLIENT_ID/g" -e "s/\${{BOT_DOMAIN}}/$BOT_DOMAIN/g" appPackage/manifest.json > appPackage/build/manifest.json
cp appPackage/color.png appPackage/outline.png appPackage/build/
(cd appPackage/build && zip -q ../adjourn.zip manifest.json color.png outline.png)
echo appPackage/adjourn.zip
