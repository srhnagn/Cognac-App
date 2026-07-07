#!/bin/bash
# ─── Cognac Mac App Build Script ───────────────────────────────
set -e

APP_NAME="Cognac"
APP_DIR="/Applications/${APP_NAME}.app"
BUILD_DIR="/Users/serhanagan/Developer/Cognac App/CognacMacApp"
SRC_DIR="/Users/serhanagan/Developer/Cognac App"
ICON_SRC="${SRC_DIR}/public/icon-512.png"
BINARY="${APP_DIR}/Contents/MacOS/${APP_NAME}"

echo "🥃 Cognac Mac App derleniyor..."

# 1. App bundle dizin yapısı
rm -rf "${APP_DIR}"
mkdir -p "${APP_DIR}/Contents/MacOS"
mkdir -p "${APP_DIR}/Contents/Resources"

# 2. Swift kaynak kodlarını derle
echo "⚙️  Swift derleniyor..."
swiftc \
  "${BUILD_DIR}/main.swift" \
  "${BUILD_DIR}/AppDelegate.swift" \
  -o "${BINARY}" \
  -framework AppKit \
  -framework WebKit \
  -framework Foundation \
  -target arm64-apple-macos13.0 \
  -O

echo "✅ Derleme tamamlandı."

# 3. Info.plist oluştur
cat > "${APP_DIR}/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>Cognac</string>
    <key>CFBundleDisplayName</key>
    <string>Cognac</string>
    <key>CFBundleIdentifier</key>
    <string>com.cognac.music</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleExecutable</key>
    <string>Cognac</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsLocalNetworking</key>
        <true/>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>NSMicrophoneUsageDescription</key>
    <string>Cognac müzik kontrolü için mikrofon erişimine ihtiyaç duyabilir.</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.music</string>
</dict>
</plist>
PLIST

echo "📄 Info.plist oluşturuldu."

# 4. İkonu dönüştür (JPG → PNG → ICNS)
ICON_JPG="${SRC_DIR}/public/icon-512.png"   # actually a jpg, rename step below
ICON_PNG="${BUILD_DIR}/icon_tmp.png"
ICONSET="${BUILD_DIR}/AppIcon.iconset"

if [ -f "${ICON_JPG}" ]; then
    # Convert to true PNG via sips
    sips -s format png "${ICON_JPG}" --out "${ICON_PNG}" > /dev/null 2>&1
    mkdir -p "${ICONSET}"
    for size in 16 32 64 128 256 512; do
        sips -z $size $size "${ICON_PNG}" --out "${ICONSET}/icon_${size}x${size}.png"    > /dev/null 2>&1
        sips -z $((size*2)) $((size*2)) "${ICON_PNG}" --out "${ICONSET}/icon_${size}x${size}@2x.png" > /dev/null 2>&1
    done
    iconutil -c icns "${ICONSET}" -o "${APP_DIR}/Contents/Resources/AppIcon.icns"
    rm -rf "${ICONSET}" "${ICON_PNG}"
    echo "🎨 İkon oluşturuldu."
fi

# 5. Karantinadan çıkar (Gatekeeper bypass)
xattr -cr "${APP_DIR}" 2>/dev/null || true
chmod +x "${BINARY}"

echo ""
echo "✅ Cognac.app başarıyla /Applications klasörüne kuruldu!"
echo "🚀 Uygulamayı şimdi açıyoruz..."
echo ""

open "${APP_DIR}"
