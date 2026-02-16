const Comment = require('../models/Comment');

class CommentService {
  /**
   * Add a comment
   * 
   * @param {string} userId - User ID
   * @param {string} targetType - Type of target
   * @param {string} targetId - Target ID
   * @param {string} content - Comment content
   * @param {string} parentCommentId - Parent comment ID (for replies)
   * @returns {Promise<Object>} - Created comment
   */
  async addComment(userId, targetType, targetId, content, parentCommentId = null) {
    try {
      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Comment content is required');
      }
      
      if (content.length > 1000) {
        throw new Error('Comment cannot exceed 1000 characters');
      }
      
      const comment = new Comment({
        user: userId,
        targetType,
        targetId,
        content: content.trim(),
        parentComment: parentCommentId
      });
      
      await comment.save();
      
      // If it's a reply, add to parent's replies
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (parentComment) {
          await parentComment.addReply(comment._id);
        }
      }
      
      // Populate and return
      await comment.populate('user', 'username profileImage');
      
      return {
        success: true,
        comment: comment.toObject(),
        message: 'Comment added successfully'
      };
    } catch (error) {
      console.error('Add comment error:', error.message);
      throw error;
    }
  }

  /**
   * Get comments on a target
   * 
   * @param {string} targetType - Type of target
   * @param {string} targetId - Target ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Comments
   */
  async getComments(targetType, targetId, options = {}) {
    try {
      const { limit = 20, skip = 0, sortBy = 'newest' } = options;
      
      const comments = await Comment.getComments(targetType, targetId, {
        limit,
        skip,
        sortBy
      });
      
      const totalCount = await Comment.getCommentCount(targetType, targetId);
      
      return {
        success: true,
        comments: comments,
        totalCount: totalCount,
        hasMore: skip + comments.length < totalCount
      };
    } catch (error) {
      console.error('Get comments error:', error.message);
      throw error;
    }
  }

  /**
   * Get a single comment with replies
   * 
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} - Comment
   */
  async getComment(commentId) {
    try {
      const comment = await Comment.findById(commentId)
        .populate('user', 'username profileImage')
        .populate({
          path: 'replies',
          populate: {
            path: 'user',
            select: 'username profileImage'
          }
        });
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      return {
        success: true,
        comment: comment.toObject()
      };
    } catch (error) {
      console.error('Get comment error:', error.message);
      throw error;
    }
  }

  /**
   * Edit a comment
   * 
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID (must be comment owner)
   * @param {string} newContent - New content
   * @returns {Promise<Object>} - Updated comment
   */
  async editComment(commentId, userId, newContent) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Check ownership
      if (comment.user.toString() !== userId.toString()) {
        throw new Error('Not authorized to edit this comment');
      }
      
      // Validate content
      if (!newContent || newContent.trim().length === 0) {
        throw new Error('Comment content is required');
      }
      
      if (newContent.length > 1000) {
        throw new Error('Comment cannot exceed 1000 characters');
      }
      
      await comment.edit(newContent.trim());
      await comment.populate('user', 'username profileImage');
      
      return {
        success: true,
        comment: comment.toObject(),
        message: 'Comment edited successfully'
      };
    } catch (error) {
      console.error('Edit comment error:', error.message);
      throw error;
    }
  }

  /**
   * Delete a comment (soft delete)
   * 
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID (must be comment owner)
   * @returns {Promise<Object>} - Result
   */
  async deleteComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Check ownership
      if (comment.user.toString() !== userId.toString()) {
        throw new Error('Not authorized to delete this comment');
      }
      
      await comment.softDelete();
      
      return {
        success: true,
        message: 'Comment deleted successfully'
      };
    } catch (error) {
      console.error('Delete comment error:', error.message);
      throw error;
    }
  }

  /**
   * Get user's comments
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Number of results
   * @param {number} skip - Skip for pagination
   * @returns {Promise<Object>} - User's comments
   */
  async getUserComments(userId, limit = 20, skip = 0) {
    try {
      const comments = await Comment.getUserComments(userId, limit, skip);
      const totalCount = await Comment.countDocuments({ 
        user: userId,
        isDeleted: false 
      });
      
      return {
        success: true,
        comments: comments,
        totalCount: totalCount,
        hasMore: skip + comments.length < totalCount
      };
    } catch (error) {
      console.error('Get user comments error:', error.message);
      throw error;
    }
  }

  /**
   * Like a comment
   * 
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} - Result
   */
  async likeComment(commentId) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      comment.likes += 1;
      await comment.save();
      
      return {
        success: true,
        likes: comment.likes,
        message: 'Comment liked'
      };
    } catch (error) {
      console.error('Like comment error:', error.message);
      throw error;
    }
  }

  /**
   * Unlike a comment
   * 
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} - Result
   */
  async unlikeComment(commentId) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      if (comment.likes > 0) {
        comment.likes -= 1;
        await comment.save();
      }
      
      return {
        success: true,
        likes: comment.likes,
        message: 'Comment unliked'
      };
    } catch (error) {
      console.error('Unlike comment error:', error.message);
      throw error;
    }
  }
}

module.exports = new CommentService();
