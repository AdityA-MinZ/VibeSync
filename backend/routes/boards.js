const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const boardService = require('../services/boardService');

/**
 * @route   POST /api/social/boards
 * @desc    Create a new board
 * @access  Private
 */
router.post('/boards', auth, async (req, res) => {
  try {
    const { name, description, type, isPublic, coverImage, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Board name is required' });
    }
    
    const result = await boardService.createBoard(req.user.id, {
      name,
      description,
      type,
      isPublic,
      coverImage,
      tags
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Create board error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/boards
 * @desc    Get public boards
 * @access  Private
 */
router.get('/boards', auth, async (req, res) => {
  try {
    const { limit = 20, skip = 0, tag, sortBy = 'newest' } = req.query;
    
    const result = await boardService.getPublicBoards({
      limit: parseInt(limit),
      skip: parseInt(skip),
      tag,
      sortBy
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get public boards error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/boards/user/:userId?
 * @desc    Get user's boards
 * @access  Private
 */
router.get('/boards/user/:userId?', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId || null;
    const result = await boardService.getUserBoards(req.user.id, targetUserId);
    res.json(result);
  } catch (error) {
    console.error('Get user boards error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/boards/search
 * @desc    Search boards
 * @access  Private
 */
router.get('/boards/search', auth, async (req, res) => {
  try {
    const { q, limit = 20, skip = 0 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const result = await boardService.searchBoards(q, {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Search boards error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/social/boards/:boardId
 * @desc    Get a board by ID
 * @access  Private
 */
router.get('/boards/:boardId', auth, async (req, res) => {
  try {
    const result = await boardService.getBoard(req.params.boardId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get board error:', error.message);
    res.status(404).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/social/boards/:boardId
 * @desc    Update a board
 * @access  Private
 */
router.put('/boards/:boardId', auth, async (req, res) => {
  try {
    const { name, description, isPublic, coverImage, tags, type } = req.body;
    
    const result = await boardService.updateBoard(req.params.boardId, req.user.id, {
      name,
      description,
      isPublic,
      coverImage,
      tags,
      type
    });
    
    res.json(result);
  } catch (error) {
    console.error('Update board error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/social/boards/:boardId
 * @desc    Delete a board
 * @access  Private
 */
router.delete('/boards/:boardId', auth, async (req, res) => {
  try {
    const result = await boardService.deleteBoard(req.params.boardId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Delete board error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/boards/:boardId/items
 * @desc    Add item to board
 * @access  Private
 */
router.post('/boards/:boardId/items', auth, async (req, res) => {
  try {
    const { itemType, itemId, title, artist, album, coverArt, source, note } = req.body;
    
    if (!itemType || !itemId || !title) {
      return res.status(400).json({ 
        error: 'Item type, ID, and title are required' 
      });
    }
    
    const result = await boardService.addItem(req.params.boardId, req.user.id, {
      itemType,
      itemId,
      title,
      artist,
      album,
      coverArt,
      source,
      note
    });
    
    res.json(result);
  } catch (error) {
    console.error('Add item error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/social/boards/:boardId/items/:itemId
 * @desc    Remove item from board
 * @access  Private
 */
router.delete('/boards/:boardId/items/:itemId', auth, async (req, res) => {
  try {
    const result = await boardService.removeItem(
      req.params.boardId,
      req.params.itemId,
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Remove item error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/boards/:boardId/collaborators
 * @desc    Add collaborator to board
 * @access  Private
 */
router.post('/boards/:boardId/collaborators', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await boardService.addCollaborator(
      req.params.boardId,
      req.user.id,
      userId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Add collaborator error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/social/boards/:boardId/collaborators/:userId
 * @desc    Remove collaborator from board
 * @access  Private
 */
router.delete('/boards/:boardId/collaborators/:userId', auth, async (req, res) => {
  try {
    const result = await boardService.removeCollaborator(
      req.params.boardId,
      req.user.id,
      req.params.userId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Remove collaborator error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/boards/:boardId/follow
 * @desc    Follow a board
 * @access  Private
 */
router.post('/boards/:boardId/follow', auth, async (req, res) => {
  try {
    const result = await boardService.followBoard(req.params.boardId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Follow board error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/social/boards/:boardId/unfollow
 * @desc    Unfollow a board
 * @access  Private
 */
router.post('/boards/:boardId/unfollow', auth, async (req, res) => {
  try {
    const result = await boardService.unfollowBoard(req.params.boardId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Unfollow board error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
