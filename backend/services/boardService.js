const Board = require('../models/Board');

class BoardService {
  /**
   * Create a new board
   * 
   * @param {string} userId - Owner user ID
   * @param {Object} boardData - Board data
   * @returns {Promise<Object>} - Created board
   */
  async createBoard(userId, boardData) {
    try {
      const board = new Board({
        name: boardData.name,
        description: boardData.description || '',
        owner: userId,
        type: boardData.type || 'mixed',
        isPublic: boardData.isPublic !== false,
        coverImage: boardData.coverImage || null,
        tags: boardData.tags || []
      });
      
      await board.save();
      await board.populate('owner', 'username profileImage');
      
      return {
        success: true,
        board: board.toObject(),
        message: 'Board created successfully'
      };
    } catch (error) {
      console.error('Create board error:', error.message);
      throw error;
    }
  }

  /**
   * Get a board by ID
   * 
   * @param {string} boardId - Board ID
   * @param {string} userId - Requesting user ID (for permission check)
   * @returns {Promise<Object>} - Board
   */
  async getBoard(boardId, userId) {
    try {
      const board = await Board.findById(boardId)
        .populate('owner', 'username profileImage')
        .populate('collaborators.user', 'username profileImage')
        .populate('items.addedBy', 'username');
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      // Check visibility
      if (!board.canView(userId)) {
        throw new Error('Not authorized to view this board');
      }
      
      // Increment views for public boards
      if (board.isPublic && board.owner.toString() !== userId) {
        await board.incrementViews();
      }
      
      return {
        success: true,
        board: board.toObject(),
        canEdit: board.canEdit(userId)
      };
    } catch (error) {
      console.error('Get board error:', error.message);
      throw error;
    }
  }

  /**
   * Get user's boards
   * 
   * @param {string} userId - User ID
   * @param {string} ownerId - Owner ID (if viewing another user's boards)
   * @returns {Promise<Object>} - Boards
   */
  async getUserBoards(userId, ownerId = null) {
    try {
      const targetId = ownerId || userId;
      const includePrivate = targetId === userId;
      
      const boards = await Board.getUserBoards(targetId, includePrivate);
      
      return {
        success: true,
        boards: boards.map(b => ({
          ...b.toObject(),
          itemCount: b.items.length
        })),
        isOwner: targetId === userId
      };
    } catch (error) {
      console.error('Get user boards error:', error.message);
      throw error;
    }
  }

  /**
   * Get public boards
   * 
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Public boards
   */
  async getPublicBoards(options = {}) {
    try {
      const boards = await Board.getPublicBoards(options);
      
      return {
        success: true,
        boards: boards,
        totalCount: await Board.countDocuments({ isPublic: true })
      };
    } catch (error) {
      console.error('Get public boards error:', error.message);
      throw error;
    }
  }

  /**
   * Update a board
   * 
   * @param {string} boardId - Board ID
   * @param {string} userId - User ID (must be owner)
   * @param {Object} updates - Updates
   * @returns {Promise<Object>} - Updated board
   */
  async updateBoard(boardId, userId, updates) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      if (board.owner.toString() !== userId.toString()) {
        throw new Error('Only the owner can update the board');
      }
      
      // Update allowed fields
      if (updates.name !== undefined) board.name = updates.name;
      if (updates.description !== undefined) board.description = updates.description;
      if (updates.isPublic !== undefined) board.isPublic = updates.isPublic;
      if (updates.coverImage !== undefined) board.coverImage = updates.coverImage;
      if (updates.tags !== undefined) board.tags = updates.tags;
      if (updates.type !== undefined) board.type = updates.type;
      
      await board.save();
      await board.populate('owner', 'username profileImage');
      
      return {
        success: true,
        board: board.toObject(),
        message: 'Board updated successfully'
      };
    } catch (error) {
      console.error('Update board error:', error.message);
      throw error;
    }
  }

  /**
   * Delete a board
   * 
   * @param {string} boardId - Board ID
   * @param {string} userId - User ID (must be owner)
   * @returns {Promise<Object>} - Result
   */
  async deleteBoard(boardId, userId) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      if (board.owner.toString() !== userId.toString()) {
        throw new Error('Only the owner can delete the board');
      }
      
      await Board.findByIdAndDelete(boardId);
      
      return {
        success: true,
        message: 'Board deleted successfully'
      };
    } catch (error) {
      console.error('Delete board error:', error.message);
      throw error;
    }
  }

  /**
   * Add item to board
   * 
   * @param {string} boardId - Board ID
   * @param {string} userId - User ID
   * @param {Object} item - Item data
   * @returns {Promise<Object>} - Result
   */
  async addItem(boardId, userId, item) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      if (!board.canEdit(userId)) {
        throw new Error('Not authorized to add items to this board');
      }
      
      await board.addItem(item, userId);
      
      return {
        success: true,
        message: 'Item added to board',
        itemCount: board.items.length
      };
    } catch (error) {
      console.error('Add item error:', error.message);
      throw error;
    }
  }

  /**
   * Remove item from board
   * 
   * @param {string} boardId - Board ID
   * @param {string} itemId - Item ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async removeItem(boardId, itemId, userId) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      await board.removeItem(itemId, userId);
      
      return {
        success: true,
        message: 'Item removed from board',
        itemCount: board.items.length
      };
    } catch (error) {
      console.error('Remove item error:', error.message);
      throw error;
    }
  }

  /**
   * Add collaborator to board
   * 
   * @param {string} boardId - Board ID
   * @param {string} ownerId - Owner ID
   * @param {string} collaboratorId - Collaborator user ID
   * @returns {Promise<Object>} - Result
   */
  async addCollaborator(boardId, ownerId, collaboratorId) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      if (board.owner.toString() !== ownerId.toString()) {
        throw new Error('Only the owner can add collaborators');
      }
      
      await board.addCollaborator(collaboratorId);
      
      return {
        success: true,
        message: 'Collaborator added successfully'
      };
    } catch (error) {
      console.error('Add collaborator error:', error.message);
      throw error;
    }
  }

  /**
   * Remove collaborator from board
   * 
   * @param {string} boardId - Board ID
   * @param {string} ownerId - Owner ID
   * @param {string} collaboratorId - Collaborator user ID
   * @returns {Promise<Object>} - Result
   */
  async removeCollaborator(boardId, ownerId, collaboratorId) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      if (board.owner.toString() !== ownerId.toString()) {
        throw new Error('Only the owner can remove collaborators');
      }
      
      await board.removeCollaborator(collaboratorId);
      
      return {
        success: true,
        message: 'Collaborator removed successfully'
      };
    } catch (error) {
      console.error('Remove collaborator error:', error.message);
      throw error;
    }
  }

  /**
   * Search boards
   * 
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Search results
   */
  async searchBoards(query, options = {}) {
    try {
      const boards = await Board.searchBoards(query, options);
      
      return {
        success: true,
        boards: boards
      };
    } catch (error) {
      console.error('Search boards error:', error.message);
      throw error;
    }
  }

  /**
   * Follow a board (save to user's collection)
   * 
   * @param {string} boardId - Board ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async followBoard(boardId, userId) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      if (!board.isPublic) {
        throw new Error('Cannot follow private boards');
      }
      
      // Check if already following
      if (board.followers.includes(userId)) {
        throw new Error('Already following this board');
      }
      
      board.followers.push(userId);
      await board.save();
      
      return {
        success: true,
        message: 'Board followed successfully'
      };
    } catch (error) {
      console.error('Follow board error:', error.message);
      throw error;
    }
  }

  /**
   * Unfollow a board
   * 
   * @param {string} boardId - Board ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async unfollowBoard(boardId, userId) {
    try {
      const board = await Board.findById(boardId);
      
      if (!board) {
        throw new Error('Board not found');
      }
      
      board.followers = board.followers.filter(
        id => id.toString() !== userId.toString()
      );
      await board.save();
      
      return {
        success: true,
        message: 'Board unfollowed successfully'
      };
    } catch (error) {
      console.error('Unfollow board error:', error.message);
      throw error;
    }
  }
}

module.exports = new BoardService();
