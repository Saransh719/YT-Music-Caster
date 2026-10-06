#!/bin/sh

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

exec "$SCRIPT_DIR/node" "$SCRIPT_DIR/host.js"