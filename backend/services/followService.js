const User = require('../models/User');
const Notification = require('../models/Notification');

class FollowService {
  /**
   * Follow a user
   * 
   * @param {string} userId - User who wants to follow
   * @param {string} userIdToFollow - User to follow
   * @returns {Promise<Object>} - Result
   */
  async followUser(userId, userIdToFollow) {
    try {
      // Check if users exist
      const user = await User.findById(userId);
      const userToFollow = await User.findById(userIdToFollow);
      
      if (!user || !userToFollow) {
        throw new Error('User not found');
      }
      
      // Check if already following
      if (user.isFollowing(userIdToFollow)) {
        throw new Error('Already following this user');
      }
      
      // Follow
      await user.follow(userToFollow);
      
      // Create notification for the followed user
      try {
        const notification = new Notification({
          recipient: userIdToFollow,
          type: 'new_follower',
          title: 'New Follower',
          message: `${user.username} started following you`,
          data: {
            followerId: userId,
            followerUsername: user.username
          }
        });
        await notification.save();
      } catch (notifError) {
        console.log('Follow notification creation failed:', notifError.message);
      }
      
      return {
        success: true,
        message: `Now following ${userToFollow.username}`,
        following: {
          userId: userToFollow._id,
          username: userToFollow.username,
          profileImage: userToFollow.profileImage
        }
      };
    } catch (error) {
      console.error('Follow user error:', error.message);
      throw error;
    }
  }

  /**
   * Unfollow a user
   * 
   * @param {string} userId - User who wants to unfollow
   * @param {string} userIdToUnfollow - User to unfollow
   * @returns {Promise<Object>} - Result
   */
  async unfollowUser(userId, userIdToUnfollow) {
    try {
      const user = await User.findById(userId);
      const userToUnfollow = await User.findById(userIdToUnfollow);
      
      if (!user || !userToUnfollow) {
        throw new Error('User not found');
      }
      
      // Check if actually following
      if (!user.isFollowing(userIdToUnfollow)) {
        throw new Error('Not following this user');
      }
      
      // Unfollow
      await user.unfollow(userIdToUnfollow);
      
      return {
        success: true,
        message: `Unfollowed ${userToUnfollow.username}`
      };
    } catch (error) {
      console.error('Unfollow user error:', error.message);
      throw error;
    }
  }

  /**
   * Check follow status between two users
   * 
   * @param {string} userId - User ID
   * @param {string} targetUserId - Target user ID
   * @returns {Promise<Object>} - Follow status
   */
  async checkFollowStatus(userId, targetUserId) {
    try {
      const user = await User.findById(userId);
      const targetUser = await User.findById(targetUserId);
      
      if (!user || !targetUser) {
        throw new Error('User not found');
      }
      
      const isFollowing = user.isFollowing(targetUserId);
      const isFollower = targetUser.isFollowing(userId);
      
      return {
        success: true,
        isFollowing: isFollowing,
        isFollower: isFollower,
        isMutual: isFollowing && isFollower
      };
    } catch (error) {
      console.error('Check follow status error:', error.message);
      throw error;
    }
  }

  /**
   * Get user's followers
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Number of results
   * @param {number} skip - Skip for pagination
   * @returns {Promise<Object>} - Followers list
   */
  async getFollowers(userId, limit = 20, skip = 0) {
    try {
      const user = await User.findById(userId)
        .populate({
          path: 'followers',
          select: 'username profileImage createdAt',
          options: {
            skip: skip,
            limit: limit,
            sort: { createdAt: -1 }
          }
        });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const totalCount = user.getFollowersCount();
      
      return {
        success: true,
        followers: user.followers,
        totalCount: totalCount,
        hasMore: skip + user.followers.length < totalCount
      };
    } catch (error) {
      console.error('Get followers error:', error.message);
      throw error;
    }
  }

  /**
   * Get users that a user is following
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Number of results
   * @param {number} skip - Skip for pagination
   * @returns {Promise<Object>} - Following list
   */
  async getFollowing(userId, limit = 20, skip = 0) {
    try {
      const user = await User.findById(userId)
        .populate({
          path: 'followings',
          select: 'username profileImage createdAt',
          options: {
            skip: skip,
            limit: limit,
            sort: { createdAt: -1 }
          }
        });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const totalCount = user.getFollowingCount();
      
      return {
        success: true,
        following: user.followings,
        totalCount: totalCount,
        hasMore: skip + user.followings.length < totalCount
      };
    } catch (error) {
      console.error('Get following error:', error.message);
      throw error;
    }
  }

  /**
   * Get follow counts for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Follow counts
   */
  async getFollowCounts(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        success: true,
        followersCount: user.getFollowersCount(),
        followingCount: user.getFollowingCount()
      };
    } catch (error) {
      console.error('Get follow counts error:', error.message);
      throw error;
    }
  }

  /**
   * Get suggested users to follow
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Object>} - Suggested users
   */
  async getSuggestions(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get users that are followed by people user follows (friends of friends)
      const followingIds = user.followings.map(id => id.toString());
      
      const suggestions = await User.find({
        _id: { 
          $nin: [...followingIds, userId] // Exclude already following and self
        }
      })
      .select('username profileImage')
      .limit(limit);
      
      return {
        success: true,
        suggestions: suggestions
      };
    } catch (error) {
      console.error('Get suggestions error:', error.message);
      throw error;
    }
  }

  /**
   * Search users
   * 
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @param {number} skip - Skip for pagination
   * @returns {Promise<Object>} - Search results
   */
  async searchUsers(query, limit = 20, skip = 0) {
    try {
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .select('username profileImage followers followings')
      .skip(skip)
      .limit(limit);
      
      const totalCount = await User.countDocuments({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      });
      
      return {
        success: true,
        users: users.map(u => ({
          ...u.toObject(),
          followersCount: u.getFollowersCount(),
          followingCount: u.getFollowingCount()
        })),
        totalCount: totalCount,
        hasMore: skip + users.length < totalCount
      };
    } catch (error) {
      console.error('Search users error:', error.message);
      throw error;
    }
  }
}

module.exports = new FollowService();
