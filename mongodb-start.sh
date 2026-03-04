#!/bin/bash

# MongoDB Start Script for VibeSync
echo "Starting MongoDB for VibeSync..."

# Set paths
MONGODB_DIR="/Users/adityaminz/Desktop/VibeSync/mongodb/mongodb-macos-aarch64-7.0.5"
DB_PATH="/Users/adityaminz/Desktop/VibeSync/data/db"
LOG_PATH="/Users/adityaminz/Desktop/VibeSync/mongodb.log"

# Create data directory if it doesn't exist
mkdir -p "$DB_PATH"

# Check if MongoDB is already running
if pgrep -f "mongod.*$DB_PATH" > /dev/null; then
    echo "MongoDB is already running!"
    exit 0
fi

# Start MongoDB
echo "Starting MongoDB server..."
cd "$MONGODB_DIR/bin"
./mongod --dbpath "$DB_PATH" --fork --logpath "$LOG_PATH"

# Check if it started successfully
sleep 2
if pgrep -f "mongod.*$DB_PATH" > /dev/null; then
    echo "✅ MongoDB started successfully!"
    echo "Database: $DB_PATH"
    echo "Logs: $LOG_PATH"
else
    echo "❌ Failed to start MongoDB"
    exit 1
fi
