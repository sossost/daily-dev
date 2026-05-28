#!/usr/bin/env bash
# Generate Capacitor + PWA app assets from SVG masters in assets/.
#
# Inputs (source of truth):
#   assets/icon.svg              1024x1024 full composed icon
#   assets/icon-foreground.svg   1024x1024 Android adaptive foreground
#   assets/icon-background.svg   1024x1024 Android adaptive background
#   assets/splash.svg            2732x2732 light splash
#   assets/splash-dark.svg       2732x2732 dark splash
#
# Outputs:
#   assets/icon-only.png         feeds @capacitor/assets (iOS + PWA icon)
#   assets/icon-foreground.png   feeds @capacitor/assets (Android adaptive fg)
#   assets/icon-background.png   feeds @capacitor/assets (Android adaptive bg)
#   assets/splash.png            feeds @capacitor/assets (light splash)
#   assets/splash-dark.png       feeds @capacitor/assets (dark splash)
#   public/android-chrome-192x192.png    PWA manifest icon
#   public/android-chrome-512x512.png    PWA manifest icon
#   public/apple-touch-icon.png          iOS home-screen (180x180)
#   public/favicon-32x32.png
#   public/favicon-16x16.png
#
# After running, package the iOS/Android projects with:
#   npx @capacitor/assets generate \
#     --assetPath assets \
#     --iconBackgroundColor    "#3b82f6" \
#     --iconBackgroundColorDark "#3b82f6" \
#     --splashBackgroundColor      "#ffffff" \
#     --splashBackgroundColorDark  "#0a0a0a"
#
# Uses npx --yes sharp-cli so no new packages are added to package.json.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/assets"
PUBLIC="$ROOT/public"

SHARP=(npx --yes sharp-cli)

render() {
  local src="$1" out="$2" size="$3"
  echo "  → $(basename "$out")  (${size}x${size})"
  "${SHARP[@]}" --input "$src" --output "$out" \
    -f png resize "$size" "$size" --fit cover > /dev/null
}

echo "▸ Capacitor source PNGs (1024 / 2732)"
render "$ASSETS/icon.svg"            "$ASSETS/icon-only.png"        1024
render "$ASSETS/icon-foreground.svg" "$ASSETS/icon-foreground.png"  1024
render "$ASSETS/icon-background.svg" "$ASSETS/icon-background.png"  1024
render "$ASSETS/splash.svg"          "$ASSETS/splash.png"           2732
render "$ASSETS/splash-dark.svg"     "$ASSETS/splash-dark.png"      2732

echo "▸ PWA / web icons (public/)"
render "$ASSETS/icon.svg" "$PUBLIC/android-chrome-512x512.png" 512
render "$ASSETS/icon.svg" "$PUBLIC/android-chrome-192x192.png" 192
render "$ASSETS/icon.svg" "$PUBLIC/apple-touch-icon.png"       180
render "$ASSETS/icon.svg" "$PUBLIC/favicon-32x32.png"           32
render "$ASSETS/icon.svg" "$PUBLIC/favicon-16x16.png"           16

echo "✓ Done. Next: npx @capacitor/assets generate --assetPath assets"
