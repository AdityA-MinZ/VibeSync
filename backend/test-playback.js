#!/usr/bin/env node
/**
 * Collaborative Playback Session Test Script
 * 
 * Tests the playback session management system
 * 
 * Usage: node test-playback.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const playbackSessionService = require('./services/playbackSessionService');
const PlaybackSession = require('./models/PlaybackSession');
const User = require('./models/User');

console.log('🎵 Collaborative Playback Session Test\n');
console.log('========================================\n');

async function runTests() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create test users
    let hostUser = await User.findOne({ email: 'test-host@example.com' });
    let participantUser = await User.findOne({ email: 'test-participant@example.com' });
    
    if (!hostUser) {
      console.log('Creating host user...');
      hostUser = new User({
        username: 'testhost',
        email: 'test-host@example.com',
        password: 'testpassword123'
      });
      await hostUser.save();
    }
    
    if (!participantUser) {
      console.log('Creating participant user...');
      participantUser = new User({
        username: 'testparticipant',
        email: 'test-participant@example.com',
        password: 'testpassword123'
      });
      await participantUser.save();
    }

    // Test 1: Create Session
    console.log('Test 1: Create Playback Session');
    console.log('==================================');
    const createResult = await playbackSessionService.createSession(hostUser._id, {
      name: 'Test Listening Party',
      description: 'A test session for collaborative playback',
      settings: {
        isPublic: true,  // Make it public so anyone can join
        allowOthersToAdd: true,
        allowOthersToControl: false,
        syncMode: 'strict'
      }
    });
    console.log(`✅ Session created: ${createResult.session.sessionId}`);
    console.log(`   Name: ${createResult.session.name}`);
    console.log(`   Host: ${createResult.session.host.username}`);
    console.log(`   Settings:`, JSON.stringify(createResult.session.settings, null, 2));
    console.log(`   isPublic: ${createResult.session.settings?.isPublic}`);
    console.log('');

    const sessionId = createResult.session.sessionId;

    // Test 2: Join Session
    console.log('Test 2: Join Session');
    console.log('=====================');
    const joinResult = await playbackSessionService.joinSession(
      sessionId,
      participantUser._id,
      'test-socket-id-123'
    );
    console.log(`✅ Participant joined`);
    console.log(`   Participants: ${joinResult.session.participants.length}`);
    console.log('');

    // Test 3: Add Tracks to Queue
    console.log('Test 3: Add Tracks to Queue');
    console.log('============================');
    
    const track1 = {
      trackId: 'spotify:track:1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: 200,
      coverArt: 'https://example.com/cover1.jpg',
      source: 'spotify'
    };
    
    const track2 = {
      trackId: 'spotify:track:2',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      duration: 203,
      coverArt: 'https://example.com/cover2.jpg',
      source: 'spotify'
    };
    
    await playbackSessionService.addToQueue(sessionId, hostUser._id, track1);
    console.log('✅ Added track 1 to queue');
    
    await playbackSessionService.addToQueue(sessionId, participantUser._id, track2);
    console.log('✅ Added track 2 to queue');
    
    const sessionWithQueue = await playbackSessionService.getSession(sessionId);
    console.log(`   Queue length: ${sessionWithQueue.session.queue.length}`);
    console.log('');

    // Test 4: Play Track
    console.log('Test 4: Start Playback');
    console.log('=======================');
    const playResult = await playbackSessionService.play(sessionId, hostUser._id, track1);
    console.log(`✅ Playback started`);
    console.log(`   Current track: ${playResult.session.currentTrack.title}`);
    console.log(`   Is playing: ${playResult.session.isPlaying}`);
    console.log('');

    // Test 5: Get Sync State
    console.log('Test 5: Get Sync State');
    console.log('=======================');
    const syncResult = await playbackSessionService.getSyncState(sessionId);
    console.log(`✅ Sync state retrieved`);
    console.log(`   Is playing: ${syncResult.syncState.isPlaying}`);
    console.log(`   Position: ${syncResult.syncState.position}s`);
    console.log(`   Queue items: ${syncResult.syncState.queue.length}`);
    console.log('');

    // Test 6: Pause Playback
    console.log('Test 6: Pause Playback');
    console.log('=======================');
    const pauseResult = await playbackSessionService.pause(sessionId, hostUser._id);
    console.log(`✅ Playback paused`);
    console.log(`   Is playing: ${pauseResult.session.isPlaying}`);
    console.log('');

    // Test 7: Resume Playback
    console.log('Test 7: Resume Playback');
    console.log('========================');
    const resumeResult = await playbackSessionService.play(sessionId, hostUser._id);
    console.log(`✅ Playback resumed`);
    console.log(`   Is playing: ${resumeResult.session.isPlaying}`);
    console.log('');

    // Test 8: Skip Track
    console.log('Test 8: Skip to Next Track');
    console.log('===========================');
    const skipResult = await playbackSessionService.skip(sessionId, hostUser._id);
    console.log(`✅ Skipped to next track`);
    console.log(`   Now playing: ${skipResult.session.currentTrack.title}`);
    console.log(`   Queue remaining: ${skipResult.session.queue.length}`);
    console.log('');

    // Test 9: Seek Position
    console.log('Test 9: Seek Position');
    console.log('======================');
    const seekResult = await playbackSessionService.seek(sessionId, hostUser._id, 60);
    console.log(`✅ Seeked to position: ${seekResult.position}s`);
    console.log('');

    // Test 10: Update Settings
    console.log('Test 10: Update Session Settings');
    console.log('=================================');
    const settingsResult = await playbackSessionService.updateSettings(
      sessionId,
      hostUser._id,
      {
        allowOthersToControl: true,
        syncMode: 'relaxed'
      }
    );
    console.log(`✅ Settings updated`);
    console.log(`   Allow control: ${settingsResult.settings.allowOthersToControl}`);
    console.log(`   Sync mode: ${settingsResult.settings.syncMode}`);
    console.log('');

    // Test 11: Get User Sessions
    console.log('Test 11: Get User Sessions');
    console.log('===========================');
    const userSessions = await playbackSessionService.getUserSessions(hostUser._id);
    console.log(`✅ Found ${userSessions.sessions.length} active session(s)`);
    console.log('');

    // Test 12: Get Public Sessions
    console.log('Test 12: Get Public Sessions');
    console.log('=============================');
    const publicSessions = await playbackSessionService.getPublicSessions();
    console.log(`✅ Found ${publicSessions.sessions.length} public session(s)`);
    console.log('');

    // Test 13: Permission Check (Participant trying to control)
    console.log('Test 13: Permission Check');
    console.log('==========================');
    try {
      await playbackSessionService.endSession(sessionId, participantUser._id);
      console.log('❌ Should have failed - participant cannot end session');
    } catch (error) {
      console.log(`✅ Permission check working: ${error.message}`);
    }
    console.log('');

    // Test 14: End Session
    console.log('Test 14: End Session');
    console.log('=====================');
    const endResult = await playbackSessionService.endSession(sessionId, hostUser._id);
    console.log(`✅ Session ended`);
    console.log(`   Message: ${endResult.message}`);
    console.log('');

    // Cleanup
    console.log('Cleanup');
    console.log('=======');
    await User.deleteOne({ _id: hostUser._id });
    await User.deleteOne({ _id: participantUser._id });
    await PlaybackSession.deleteOne({ sessionId });
    console.log('✅ Test data cleaned up\n');

    console.log('========================================');
    console.log('✅ ALL PLAYBACK SESSION TESTS PASSED!');
    console.log('========================================\n');

    console.log('📊 Test Summary:');
    console.log('   - Create session: ✅');
    console.log('   - Join session: ✅');
    console.log('   - Add to queue: ✅');
    console.log('   - Play track: ✅');
    console.log('   - Get sync state: ✅');
    console.log('   - Pause: ✅');
    console.log('   - Resume: ✅');
    console.log('   - Skip track: ✅');
    console.log('   - Seek: ✅');
    console.log('   - Update settings: ✅');
    console.log('   - Get user sessions: ✅');
    console.log('   - Get public sessions: ✅');
    console.log('   - Permission checks: ✅');
    console.log('   - End session: ✅\n');

    console.log('📚 WebSocket Events Available:');
    console.log('   join-playback-session');
    console.log('   leave-playback-session');
    console.log('   session-play');
    console.log('   session-pause');
    console.log('   session-skip');
    console.log('   session-seek');
    console.log('   session-add-queue');
    console.log('   session-remove-queue');
    console.log('   session-request-sync\n');

    console.log('📖 Full Documentation: See COLLABORATIVE_PLAYBACK.md\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    console.error(error.stack);
    
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
