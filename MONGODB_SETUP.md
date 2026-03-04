# MongoDB Setup for VibeSync

## Overview
VibeSync uses MongoDB for data persistence. This guide explains how to set up and manage MongoDB for development.

## Current Status: ✅ FULLY CONFIGURED

MongoDB is now properly installed and configured for VibeSync!

## Quick Start Commands

### Start MongoDB
```bash
cd /Users/adityaminz/Desktop/VibeSync/backend
npm run mongo:start
```

### Stop MongoDB
```bash
cd /Users/adityaminz/Desktop/VibeSync/backend
npm run mongo:stop
```

### Check if MongoDB is running
```bash
ps aux | grep mongod
```

## Installation Details

### What was installed:
- **MongoDB Community Server 7.0.5** for Apple Silicon (ARM64)
- **Location**: `/Users/adityaminz/Desktop/VibeSync/mongodb/mongodb-macos-aarch64-7.0.5/`
- **Data Directory**: `/Users/adityaminz/Desktop/VibeSync/data/db`
- **Log File**: `/Users/adityaminz/Desktop/VibeSync/mongodb.log`

### Configuration:
- **Database Name**: `vibesync`
- **Connection String**: `mongodb://localhost:27017/vibesync`
- **Port**: 27017 (default)

## Backend Configuration

The backend `.env` file has been updated to use the local MongoDB instance:

```env
MONGODB_URI=mongodb://localhost:27017/vibesync
```

## Features Working with MongoDB

✅ **User Authentication** - Register, login, JWT tokens
✅ **Profile Management** - Edit profile, upload pictures
✅ **Data Persistence** - All user data saved in MongoDB
✅ **Real Database** - No more mock authentication

## Manual MongoDB Commands

If you need to manage MongoDB directly:

### Start MongoDB Manually
```bash
cd /Users/adityaminz/Desktop/VibeSync/mongodb/mongodb-macos-aarch64-7.0.5/bin
./mongod --dbpath /Users/adityaminz/Desktop/VibeSync/data/db --fork --logpath /Users/adityaminz/Desktop/VibeSync/mongodb.log
```

### Check MongoDB Status
```bash
# Check if running
ps aux | grep mongod

# Check logs
tail -f /Users/adityaminz/Desktop/VibeSync/mongodb.log
```

### Stop MongoDB Manually
```bash
# Find the process ID
ps aux | grep mongod

# Kill the process
kill <PID>
```

## Troubleshooting

### Port Already in Use
If port 27017 is already in use:
```bash
# Find what's using the port
lsof -ti:27017

# Kill the process
kill -9 <PID>
```

### Data Directory Issues
If the data directory has permission issues:
```bash
# Fix permissions
sudo chown -R $(whoami) /Users/adityaminz/Desktop/VibeSync/data/db
```

### MongoDB Won't Start
1. Check the log file: `tail /Users/adityaminz/Desktop/VibeSync/mongodb.log`
2. Make sure the data directory exists: `mkdir -p /Users/adityaminz/Desktop/VibeSync/data/db`
3. Check for other MongoDB processes: `ps aux | grep mongod`

## Production Considerations

For production deployment:
1. Use MongoDB Atlas (cloud service) instead of local instance
2. Enable authentication in MongoDB
3. Set up proper backups
4. Configure security settings
5. Use environment variables for connection strings

## Next Steps

The MongoDB setup is complete and working! You can now:
1. Start the MongoDB server using `npm run mongo:start`
2. Start the backend server using `npm start`
3. Register and login users with real data persistence
4. Use all profile features with database storage

🎉 **MongoDB Issue: RESOLVED!**
