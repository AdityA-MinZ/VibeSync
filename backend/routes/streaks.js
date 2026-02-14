const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const streakService = require('../services/streakService');

/**
 * @route   GET /api/streaks/me
 * @desc    Get current user's streak info
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const streakInfo = await streakService.getStreakInfo(req.user.id);
    res.json(streakInfo);
  } catch (error) {
    console.error('Get my streak error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get streak info',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/streaks/update
 * @desc    Update user's streak (call when they listen to music)
 * @access  Private
 */
router.post('/update', auth, async (req, res) => {
  try {
    const result = await streakService.updateStreak(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Update streak error:', error.message);
    res.status(500).json({ 
      error: 'Failed to update streak',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/streaks/:userId
 * @desc    Get streak info for a specific user
 * @access  Private
 */
router.get('/:userId', auth, async (req, res) => {
  try {
    const streakInfo = await streakService.getStreakInfo(req.params.userId);
    res.json(streakInfo);
  } catch (error) {
    console.error('Get user streak error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get user streak info',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/streaks/leaderboard/top
 * @desc    Get top streaks leaderboard
 * @access  Private
 */
router.get('/leaderboard/top', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await streakService.getLeaderboard(limit);
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get leaderboard',
      message: error.message 
    });
  }
});

/**
 * @route   POST /api/streaks/reset
 * @desc    Reset user's streak (admin only)
 * @access  Private (Admin)
 */
router.post('/reset', auth, async (req, res) => {
  try {
    // TODO: Add admin check here
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }
    
    const result = await streakService.resetStreak(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Reset streak error:', error.message);
    res.status(500).json({ 
      error: 'Failed to reset streak',
      message: error.message 
    });
  }
});

module.exports = router;
