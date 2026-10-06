#!/usr/bin/env bash

set -e

APP_NAME="yt-music-caster"
HOST_NAME="com.ytmusiccaster.host"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

EXTENSION_ID="$1"

if [ -z "$EXTENSION_ID" ]; then
    echo "Usage: ./install.sh <chrome-extension-id>"
    exit 1
fi

INSTALL_DIR="$HOME/.local/share/$APP_NAME"
HOST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"

echo "Installing YT Music Caster..."

# Install complete prebuilt application
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

cp -r "$ROOT/release/$APP_NAME/"* \
      "$INSTALL_DIR/"

chmod +x "$INSTALL_DIR/node"
chmod +x "$INSTALL_DIR/host-launcher.sh"

# Install Chrome Native Messaging manifest
mkdir -p "$HOST_DIR"

cat > "$HOST_DIR/$HOST_NAME.json" <<EOF
{
  "name": "$HOST_NAME",
  "description": "YT Music Caster native host",
  "path": "$INSTALL_DIR/host-launcher.sh",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo
echo "YT Music Caster installed successfully."
echo
echo "Application: $INSTALL_DIR"
echo "Native host: $HOST_DIR/$HOST_NAME.json"