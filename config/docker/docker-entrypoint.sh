#!/bin/sh
set -e

# Fix data directory permissions after volume mount
if [ "$(id -u)" = "0" ]; then
    # Running as root, fix permissions and switch to astro user
    echo "Fixing permissions for /app/data..."
    chown -R astro:nodejs /app/data
    chmod -R 775 /app/data
    echo "Starting application as astro user..."
    exec su-exec astro "$@"
else
    # Already running as astro user, just ensure we can write to data
    if [ ! -w /app/data ]; then
        echo "Warning: Cannot write to /app/data directory"
        # Try to fix permissions if possible
        chmod -R 775 /app/data 2>/dev/null || true
    fi
    exec "$@"
fi