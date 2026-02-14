#!/usr/bin/env node
/**
 * Socket.io Integration Test Script
 * 
 * Tests WebSocket functionality for VibeSync
 * 
 * Usage: node test-socket.js
 */

const io = require('socket.io-client');

console.log('🔌 Socket.io Integration Test\n');
console.log('================================\n');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';

console.log(`Testing connection to: ${SERVER_URL}\n`);

// Test 1: Basic Connection
console.log('Test 1: Basic Connection');
console.log('-------------------------');

const socket1 = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  reconnection: false
});

let test1Passed = false;

socket1.on('connect', () => {
  console.log(`✅ Client 1 connected`);
  console.log(`   Socket ID: ${socket1.id}`);
  test1Passed = true;
  
  // Test 2: User Login Event
  console.log('\nTest 2: User Login Event');
  console.log('-------------------------');
  
  socket1.emit('user-login', { userId: 'test-user-1' });
  console.log('✅ Emitted user-login event');
});

socket1.on('user-online', (data) => {
  console.log(`✅ Received user-online event:`, data);
  
  // Test 3: Join Friends Room
  console.log('\nTest 3: Join Friends Room');
  console.log('--------------------------');
  
  socket1.emit('join-friends-room', 'test-user-1');
  console.log('✅ Joined friends room for user: test-user-1');
  
  // Test 4: Playing Track Event
  console.log('\nTest 4: Playing Track Event');
  console.log('----------------------------');
  
  setTimeout(() => {
    socket1.emit('playing-track', {
      userId: 'test-user-1',
      track: {
        title: 'Test Track',
        artist: 'Test Artist'
      }
    });
    console.log('✅ Emitted playing-track event');
    
    // Clean up test 1
    setTimeout(() => {
      socket1.disconnect();
      console.log('\n✅ Test 1-4 completed successfully');
      
      // Start Test 5: Multiple Clients
      testMultipleClients();
    }, 1000);
  }, 500);
});

socket1.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

socket1.on('disconnect', () => {
  console.log('   Client 1 disconnected');
});

// Test 5: Multiple Clients and Room Broadcasting
function testMultipleClients() {
  console.log('\n\nTest 5: Multiple Clients & Room Broadcasting');
  console.log('---------------------------------------------');
  
  const socket2 = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false
  });
  
  const socket3 = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false
  });
  
  let connectedCount = 0;
  let receivedEvent = false;
  
  function checkComplete() {
    if (connectedCount === 2 && receivedEvent) {
      console.log('\n✅ Test 5 completed successfully');
      
      socket2.disconnect();
      socket3.disconnect();
      
      setTimeout(() => {
        console.log('\n================================');
        console.log('✅ All Socket.io tests passed!');
        console.log('================================\n');
        console.log('📊 Summary:');
        console.log('   - Basic connection: ✅');
        console.log('   - User login event: ✅');
        console.log('   - Room management: ✅');
        console.log('   - Event broadcasting: ✅');
        console.log('   - Multiple clients: ✅\n');
        process.exit(0);
      }, 500);
    }
  }
  
  socket2.on('connect', () => {
    console.log(`✅ Client 2 connected: ${socket2.id}`);
    connectedCount++;
    
    // Client 2 joins room
    socket2.emit('join-friends-room', 'friend-user');
    
    checkComplete();
  });
  
  socket3.on('connect', () => {
    console.log(`✅ Client 3 connected: ${socket3.id}`);
    connectedCount++;
    
    // Client 3 will emit playing track
    setTimeout(() => {
      socket3.emit('playing-track', {
        userId: 'friend-user',
        track: {
          title: 'Shared Track',
          artist: 'Shared Artist'
        }
      });
      console.log('✅ Client 3 emitted playing-track to room: friends-friend-user');
    }, 500);
    
    checkComplete();
  });
  
  socket2.on('friend-playing', (data) => {
    console.log(`✅ Client 2 received friend-playing event:`, data);
    receivedEvent = true;
    checkComplete();
  });
  
  socket2.on('connect_error', (err) => {
    console.error('❌ Client 2 connection error:', err.message);
  });
  
  socket3.on('connect_error', (err) => {
    console.error('❌ Client 3 connection error:', err.message);
  });
}

// Timeout handler
setTimeout(() => {
  console.error('\n❌ Tests timed out after 10 seconds');
  process.exit(1);
}, 10000);
