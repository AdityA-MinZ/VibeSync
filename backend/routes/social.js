const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const likeService = require('../services/likeService');

/**
 * @route   POST /api/social/likes/toggle
 * @desc    Toggle like on a target
 * @access  Private
 */
router.post('/likes/toggle', auth, async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    
    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'Target type and ID are required' });
    }
    
    const result = await likeService.toggleLike(req.user.id, targetType, targetId);
    res.json(result);
  } catch (error) {
    console.error('Toggle like error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/likes/check
 * @desc    Check if user liked a target
 * @access  Private
 */
router.get('/likes/check', auth, async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    
    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'Target type and ID are required' });
    }
    
    const result = await likeService.checkLike(req.user.id, targetType, targetId);
    res.json(result);
  } catch (error) {
    console.error('Check like error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/likes/count
 * @desc    Get like count for a target
 * @access  Private
 */
router.get('/likes/count', auth, async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    
    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'Target type and ID are required' });
    }
    
    const result = await likeService.getLikeCount(targetType, targetId);
    res.json(result);
  } catch (error) {
    console.error('Get like count error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/likes/me
 * @desc    Get current user's likes
 * @access  Private
 */
router.get('/likes/me', auth, async (req, res) => {
  try {
    const { targetType, limit = 20, skip = 0 } = req.query;
    
    const result = await likeService.getUserLikes(
      req.user.id, 
      targetType, 
      parseInt(limit), 
      parseInt(skip)
    );
    res.json(result);
  } catch (error) {
    console.error('Get user likes error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/likes/likers
 * @desc    Get users who liked a target
 * @access  Private
 */
router.get('/likes/likers', auth, async (req, res) => {
  try {
    const { targetType, targetId, limit = 20, skip = 0 } = req.query;
    
    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'Target type and ID are required' });
    }
    
    const result = await likeService.getLikers(
      targetType, 
      targetId, 
      parseInt(limit), 
      parseInt(skip)
    );
    res.json(result);
  } catch (error) {
    console.error('Get likers error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/likes/counts
 * @desc    Get multiple like counts at once
 * @access  Private
 */
router.post('/likes/counts', auth, async (req, res) => {
  try {
    const { targets } = req.body;
    
    if (!Array.isArray(targets)) {
      return res.status(400).json({ error: 'Targets array is required' });
    }
    
    const result = await likeService.getMultipleLikeCounts(targets);
    res.json(result);
  } catch (error) {
    console.error('Get multiple like counts error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
