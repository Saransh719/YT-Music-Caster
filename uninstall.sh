#!/usr/bin/env bash

set -e

APP_NAME="yt-music-caster"
HOST_NAME="com.ytmusiccaster.host"

INSTALL_DIR="$HOME/.local/share/$APP_NAME"
HOST_MANIFEST="$HOME/.config/google-chrome/NativeMessagingHosts/$HOST_NAME.json"

echo
echo "======================================"
echo " Uninstalling YT Music Caster"
echo "======================================"
echo

if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "✓ Removed application:"
    echo "  $INSTALL_DIR"
else
    echo "Application installation not found."
fi

if [ -f "$HOST_MANIFEST" ]; then
    rm -f "$HOST_MANIFEST"
    echo "✓ Removed Chrome Native Messaging host:"
    echo "  $HOST_MANIFEST"
else
    echo "Native Messaging host not found."
fi

echo
echo "======================================"
echo " Uninstallation complete!"
echo "======================================"
echo
echo "You can also remove the unpacked extension"
echo "manually from chrome://extensions"
echo