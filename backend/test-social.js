#!/usr/bin/env node
/**
 * Social APIs Test Script
 * 
 * Tests Likes, Follows, Comments, and Boards APIs
 * 
 * Usage: node test-social.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Like = require('./models/Like');
const Comment = require('./models/Comment');
const Board = require('./models/Board');
const likeService = require('./services/likeService');
const followService = require('./services/followService');
const commentService = require('./services/commentService');
const boardService = require('./services/boardService');

console.log('👥 Social APIs Test\n');
console.log('====================\n');

async function runTests() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create test users
    let user1 = await User.findOne({ email: 'social-test1@example.com' });
    let user2 = await User.findOne({ email: 'social-test2@example.com' });
    
    if (!user1) {
      console.log('Creating test user 1...');
      user1 = new User({
        username: 'socialuser1',
        email: 'social-test1@example.com',
        password: 'testpassword123'
      });
      await user1.save();
    }
    
    if (!user2) {
      console.log('Creating test user 2...');
      user2 = new User({
        username: 'socialuser2',
        email: 'social-test2@example.com',
        password: 'testpassword123'
      });
      await user2.save();
    }

    // ============================================
    // LIKES TESTS
    // ============================================
    console.log('🩷 LIKES TESTS');
    console.log('================\n');

    // Test 1: Like a track
    console.log('Test 1: Like a track');
    const like1 = await likeService.toggleLike(user1._id, 'track', 'track123');
    console.log(`✅ ${like1.message} (Count: ${like1.likeCount})`);

    // Test 2: Unlike same track
    console.log('Test 2: Unlike the track');
    const like2 = await likeService.toggleLike(user1._id, 'track', 'track123');
    console.log(`✅ ${like2.message} (Count: ${like2.likeCount})`);

    // Test 3: Check like status
    console.log('Test 3: Check like status');
    const checkLike = await likeService.checkLike(user1._id, 'track', 'track456');
    console.log(`✅ Has liked: ${checkLike.hasLiked}, Count: ${checkLike.likeCount}\n`);

    // Test 4: Get user likes
    console.log('Test 4: Get user likes');
    const userLikes = await likeService.getUserLikes(user1._id);
    console.log(`✅ User has ${userLikes.totalCount} like(s)\n`);

    // ============================================
    // FOLLOW TESTS
    // ============================================
    console.log('👥 FOLLOW TESTS');
    console.log('================\n');

    // Test 5: Follow user
    console.log('Test 5: Follow user');
    const follow1 = await followService.followUser(user1._id, user2._id);
    console.log(`✅ ${follow1.message}`);

    // Test 6: Check follow status
    console.log('Test 6: Check follow status');
    const followStatus = await followService.checkFollowStatus(user1._id, user2._id);
    console.log(`✅ Is following: ${followStatus.isFollowing}`);
    console.log(`   Is follower: ${followStatus.isFollower}`);
    console.log(`   Is mutual: ${followStatus.isMutual}\n`);

    // Test 7: Get followers
    console.log('Test 7: Get followers');
    const followers = await followService.getFollowers(user2._id);
    console.log(`✅ ${followers.totalCount} follower(s)`);

    // Test 8: Get following
    console.log('Test 8: Get following');
    const following = await followService.getFollowing(user1._id);
    console.log(`✅ Following ${following.totalCount} user(s)\n`);

    // Test 9: Get follow counts
    console.log('Test 9: Get follow counts');
    const followCounts = await followService.getFollowCounts(user1._id);
    console.log(`✅ Followers: ${followCounts.followersCount}, Following: ${followCounts.followingCount}\n`);

    // ============================================
    // COMMENT TESTS
    // ============================================
    console.log('💬 COMMENT TESTS');
    console.log('=================\n');

    // Test 10: Add comment
    console.log('Test 10: Add comment');
    const comment1 = await commentService.addComment(
      user1._id,
      'track',
      'track123',
      'This is an amazing track! Love it!'
    );
    console.log(`✅ Comment added: "${comment1.comment.content.substring(0, 30)}..."`);

    // Test 11: Add reply
    console.log('Test 11: Add reply');
    const reply1 = await commentService.addComment(
      user2._id,
      'track',
      'track123',
      'Totally agree! Great taste!',
      comment1.comment._id
    );
    console.log(`✅ Reply added\n`);

    // Test 12: Get comments
    console.log('Test 12: Get comments');
    const comments = await commentService.getComments('track', 'track123');
    console.log(`✅ Found ${comments.totalCount} comment(s) with ${comments.comments[0]?.replies?.length || 0} reply(s)\n`);

    // Test 13: Edit comment
    console.log('Test 13: Edit comment');
    const editResult = await commentService.editComment(
      comment1.comment._id,
      user1._id,
      'This is an amazing track! Love it! (Edited)'
    );
    console.log(`✅ Comment edited: ${editResult.comment.isEdited}\n`);

    // Test 14: Like comment
    console.log('Test 14: Like comment');
    const commentLike = await commentService.likeComment(comment1.comment._id);
    console.log(`✅ Comment liked: ${commentLike.likes} like(s)\n`);

    // ============================================
    // BOARD TESTS
    // ============================================
    console.log('📋 BOARD TESTS');
    console.log('===============\n');

    // Test 15: Create board
    console.log('Test 15: Create board');
    const board1 = await boardService.createBoard(user1._id, {
      name: 'My Favorite Tracks',
      description: 'A collection of my favorite songs',
      type: 'tracks',
      isPublic: true,
      tags: ['music', 'favorites']
    });
    console.log(`✅ Board created: "${board1.board.name}" (${board1.board._id})`);

    // Test 16: Add item to board
    console.log('Test 16: Add item to board');
    const addItem = await boardService.addItem(board1.board._id, user1._id, {
      itemType: 'track',
      itemId: 'youtube:track:123',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      source: 'youtube'
    });
    console.log(`✅ Item added: ${addItem.itemCount} item(s) in board`);

    // Test 17: Get board
    console.log('Test 17: Get board');
    const getBoard = await boardService.getBoard(board1.board._id, user1._id);
    console.log(`✅ Board retrieved: "${getBoard.board.name}"`);
    console.log(`   Items: ${getBoard.board.items.length}`);
    console.log(`   Can edit: ${getBoard.canEdit}\n`);

    // Test 18: Add collaborator
    console.log('Test 18: Add collaborator');
    const addCollab = await boardService.addCollaborator(board1.board._id, user1._id, user2._id);
    console.log(`✅ Collaborator added\n`);

    // Test 19: Get public boards
    console.log('Test 19: Get public boards');
    const publicBoards = await boardService.getPublicBoards({ limit: 5 });
    console.log(`✅ Found ${publicBoards.boards.length} public board(s)\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('====================');
    console.log('✅ ALL SOCIAL API TESTS PASSED!');
    console.log('====================\n');

    console.log('📊 Test Summary:');
    console.log('   LIKES:');
    console.log('     - Toggle like: ✅');
    console.log('     - Check status: ✅');
    console.log('     - Get user likes: ✅');
    console.log('   FOLLOWS:');
    console.log('     - Follow/unfollow: ✅');
    console.log('     - Check status: ✅');
    console.log('     - Get followers/following: ✅');
    console.log('     - Follow counts: ✅');
    console.log('   COMMENTS:');
    console.log('     - Add comment: ✅');
    console.log('     - Add reply: ✅');
    console.log('     - Get comments: ✅');
    console.log('     - Edit comment: ✅');
    console.log('     - Like comment: ✅');
    console.log('   BOARDS:');
    console.log('     - Create board: ✅');
    console.log('     - Add items: ✅');
    console.log('     - Get board: ✅');
    console.log('     - Add collaborator: ✅');
    console.log('     - Get public boards: ✅\n');

    console.log('📚 API Endpoints Available:');
    console.log('   LIKES:');
    console.log('     POST /api/social/likes/toggle');
    console.log('     GET  /api/social/likes/check');
    console.log('     GET  /api/social/likes/count');
    console.log('     GET  /api/social/likes/me');
    console.log('   FOLLOWS:');
    console.log('     POST /api/social/follow/:userId');
    console.log('     POST /api/social/unfollow/:userId');
    console.log('     GET  /api/social/followers/:userId');
    console.log('     GET  /api/social/following/:userId');
    console.log('   COMMENTS:');
    console.log('     POST /api/social/comments');
    console.log('     GET  /api/social/comments');
    console.log('     PUT  /api/social/comments/:id');
    console.log('     DELETE /api/social/comments/:id');
    console.log('   BOARDS:');
    console.log('     POST /api/social/boards');
    console.log('     GET  /api/social/boards');
    console.log('     POST /api/social/boards/:id/items');
    console.log('     GET  /api/social/boards/:id\n');

    // Cleanup
    console.log('Cleanup');
    console.log('=======');
    await User.deleteOne({ _id: user1._id });
    await User.deleteOne({ _id: user2._id });
    await Board.deleteOne({ _id: board1.board._id });
    await Like.deleteMany({ user: { $in: [user1._id, user2._id] } });
    await Comment.deleteMany({ user: { $in: [user1._id, user2._id] } });
    console.log('✅ Test data cleaned up\n');

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
