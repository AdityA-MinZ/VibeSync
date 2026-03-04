#!/bin/bash

# MongoDB Stop Script for VibeSync
echo "Stopping MongoDB for VibeSync..."

# Find and kill MongoDB processes
MONGODB_PIDS=$(pgrep -f "mongod.*VibeSync")

if [ -z "$MONGODB_PIDS" ]; then
    echo "MongoDB is not running!"
    exit 0
fi

# Kill all MongoDB processes
echo "Stopping MongoDB processes..."
echo "$MONGODB_PIDS" | xargs kill

# Wait a moment
sleep 2

# Verify it's stopped
if pgrep -f "mongod.*VibeSync" > /dev/null; then
    echo "❌ Failed to stop MongoDB"
    exit 1
else
    echo "✅ MongoDB stopped successfully!"
fi
