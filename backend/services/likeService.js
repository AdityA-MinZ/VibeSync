const Like = require('../models/Like');

class LikeService {
  /**
   * Toggle like on a target (like if not exists, unlike if exists)
   * 
   * @param {string} userId - User ID
   * @param {string} targetType - Type of target (track, playlist, etc.)
   * @param {string} targetId - Target ID
   * @returns {Promise<Object>} - Result with liked status and count
   */
  async toggleLike(userId, targetType, targetId) {
    try {
      const result = await Like.toggleLike(userId, targetType, targetId);
      const likeCount = await Like.getLikeCount(targetType, targetId);
      
      return {
        success: true,
        liked: result.liked,
        like: result.like,
        likeCount: likeCount,
        message: result.liked ? 'Liked successfully' : 'Unliked successfully'
      };
    } catch (error) {
      console.error('Toggle like error:', error.message);
      throw error;
    }
  }

  /**
   * Check if user has liked a target
   * 
   * @param {string} userId - User ID
   * @param {string} targetType - Type of target
   * @param {string} targetId - Target ID
   * @returns {Promise<Object>} - Like status
   */
  async checkLike(userId, targetType, targetId) {
    try {
      const hasLiked = await Like.hasLiked(userId, targetType, targetId);
      const likeCount = await Like.getLikeCount(targetType, targetId);
      
      return {
        success: true,
        hasLiked: hasLiked,
        likeCount: likeCount
      };
    } catch (error) {
      console.error('Check like error:', error.message);
      throw error;
    }
  }

  /**
   * Get like count for a target
   * 
   * @param {string} targetType - Type of target
   * @param {string} targetId - Target ID
   * @returns {Promise<Object>} - Like count
   */
  async getLikeCount(targetType, targetId) {
    try {
      const count = await Like.getLikeCount(targetType, targetId);
      
      return {
        success: true,
        targetType,
        targetId,
        likeCount: count
      };
    } catch (error) {
      console.error('Get like count error:', error.message);
      throw error;
    }
  }

  /**
   * Get user's likes
   * 
   * @param {string} userId - User ID
   * @param {string} targetType - Optional filter by type
   * @param {number} limit - Number of results
   * @param {number} skip - Skip for pagination
   * @returns {Promise<Object>} - User's likes
   */
  async getUserLikes(userId, targetType = null, limit = 20, skip = 0) {
    try {
      const likes = await Like.getUserLikes(userId, targetType, limit, skip);
      const totalCount = await Like.countDocuments({ 
        user: userId,
        ...(targetType && { targetType })
      });
      
      return {
        success: true,
        likes: likes,
        totalCount: totalCount,
        hasMore: skip + likes.length < totalCount
      };
    } catch (error) {
      console.error('Get user likes error:', error.message);
      throw error;
    }
  }

  /**
   * Get users who liked a target
   * 
   * @param {string} targetType - Type of target
   * @param {string} targetId - Target ID
   * @param {number} limit - Number of results
   * @param {number} skip - Skip for pagination
   * @returns {Promise<Object>} - Users who liked
   */
  async getLikers(targetType, targetId, limit = 20, skip = 0) {
    try {
      const likes = await Like.find({ targetType, targetId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username profileImage');
      
      const totalCount = await Like.countDocuments({ targetType, targetId });
      
      return {
        success: true,
        users: likes.map(like => like.user),
        totalCount: totalCount,
        hasMore: skip + likes.length < totalCount
      };
    } catch (error) {
      console.error('Get likers error:', error.message);
      throw error;
    }
  }

  /**
   * Get multiple like counts at once (for feed display)
   * 
   * @param {Array} targets - Array of {targetType, targetId} objects
   * @returns {Promise<Object>} - Like counts for all targets
   */
  async getMultipleLikeCounts(targets) {
    try {
      const results = await Promise.all(
        targets.map(async ({ targetType, targetId }) => ({
          targetType,
          targetId,
          likeCount: await Like.getLikeCount(targetType, targetId)
        }))
      );
      
      return {
        success: true,
        counts: results
      };
    } catch (error) {
      console.error('Get multiple like counts error:', error.message);
      throw error;
    }
  }
}

module.exports = new LikeService();
