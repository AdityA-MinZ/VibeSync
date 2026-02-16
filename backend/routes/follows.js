const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const followService = require('../services/followService');

/**
 * @route   POST /api/social/follow/:userId
 * @desc    Follow a user
 * @access  Private
 */
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const result = await followService.followUser(req.user.id, req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Follow user error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/unfollow/:userId
 * @desc    Unfollow a user
 * @access  Private
 */
router.post('/unfollow/:userId', auth, async (req, res) => {
  try {
    const result = await followService.unfollowUser(req.user.id, req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Unfollow user error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/follow/status/:userId
 * @desc    Check follow status with a user
 * @access  Private
 */
router.get('/follow/status/:userId', auth, async (req, res) => {
  try {
    const result = await followService.checkFollowStatus(req.user.id, req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Check follow status error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/followers/:userId?
 * @desc    Get user's followers
 * @access  Private
 */
router.get('/followers/:userId?', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    const { limit = 20, skip = 0 } = req.query;
    
    const result = await followService.getFollowers(
      targetUserId, 
      parseInt(limit), 
      parseInt(skip)
    );
    res.json(result);
  } catch (error) {
    console.error('Get followers error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/following/:userId?
 * @desc    Get users that a user is following
 * @access  Private
 */
router.get('/following/:userId?', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    const { limit = 20, skip = 0 } = req.query;
    
    const result = await followService.getFollowing(
      targetUserId, 
      parseInt(limit), 
      parseInt(skip)
    );
    res.json(result);
  } catch (error) {
    console.error('Get following error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/follow/counts/:userId?
 * @desc    Get follow counts for a user
 * @access  Private
 */
router.get('/follow/counts/:userId?', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    const result = await followService.getFollowCounts(targetUserId);
    res.json(result);
  } catch (error) {
    console.error('Get follow counts error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/follow/suggestions
 * @desc    Get suggested users to follow
 * @access  Private
 */
router.get('/follow/suggestions', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await followService.getSuggestions(req.user.id, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Get suggestions error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/users/search', auth, async (req, res) => {
  try {
    const { q, limit = 20, skip = 0 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const result = await followService.searchUsers(q, parseInt(limit), parseInt(skip));
    res.json(result);
  } catch (error) {
    console.error('Search users error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
