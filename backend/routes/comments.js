const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const commentService = require('../services/commentService');

/**
 * @route   POST /api/social/comments
 * @desc    Add a comment
 * @access  Private
 */
router.post('/comments', auth, async (req, res) => {
  try {
    const { targetType, targetId, content, parentCommentId } = req.body;
    
    if (!targetType || !targetId || !content) {
      return res.status(400).json({ 
        error: 'Target type, target ID, and content are required' 
      });
    }
    
    const result = await commentService.addComment(
      req.user.id,
      targetType,
      targetId,
      content,
      parentCommentId
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Add comment error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/comments
 * @desc    Get comments on a target
 * @access  Private
 */
router.get('/comments', auth, async (req, res) => {
  try {
    const { targetType, targetId, limit = 20, skip = 0, sortBy = 'newest' } = req.query;
    
    if (!targetType || !targetId) {
      return res.status(400).json({ error: 'Target type and ID are required' });
    }
    
    const result = await commentService.getComments(targetType, targetId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get comments error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/comments/:commentId
 * @desc    Get a single comment with replies
 * @access  Private
 */
router.get('/comments/:commentId', auth, async (req, res) => {
  try {
    const result = await commentService.getComment(req.params.commentId);
    res.json(result);
  } catch (error) {
    console.error('Get comment error:', error.message);
    res.status(404).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/social/comments/:commentId
 * @desc    Edit a comment
 * @access  Private
 */
router.put('/comments/:commentId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await commentService.editComment(
      req.params.commentId,
      req.user.id,
      content
    );
    
    res.json(result);
  } catch (error) {
    console.error('Edit comment error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/social/comments/:commentId
 * @desc    Delete a comment (soft delete)
 * @access  Private
 */
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const result = await commentService.deleteComment(
      req.params.commentId,
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Delete comment error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/comments/user/:userId?
 * @desc    Get user's comments
 * @access  Private
 */
router.get('/comments/user/:userId?', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    const { limit = 20, skip = 0 } = req.query;
    
    const result = await commentService.getUserComments(
      targetUserId,
      parseInt(limit),
      parseInt(skip)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Get user comments error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/comments/:commentId/like
 * @desc    Like a comment
 * @access  Private
 */
router.post('/comments/:commentId/like', auth, async (req, res) => {
  try {
    const result = await commentService.likeComment(req.params.commentId);
    res.json(result);
  } catch (error) {
    console.error('Like comment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/comments/:commentId/unlike
 * @desc    Unlike a comment
 * @access  Private
 */
router.post('/comments/:commentId/unlike', auth, async (req, res) => {
  try {
    const result = await commentService.unlikeComment(req.params.commentId);
    res.json(result);
  } catch (error) {
    console.error('Unlike comment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
