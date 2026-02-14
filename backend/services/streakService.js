const User = require('../models/User');

class StreakService {
  /**
   * Update a user's streak when they listen to music
   * Call this whenever a listening session starts
   * 
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - Updated streak info
   */
  async updateStreak(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Initialize streak object if it doesn't exist
      if (!user.streak) {
        user.streak = {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null
        };
      }
      
      // Update streak using the method defined in User model
      await user.updateStreak();
      
      return {
        success: true,
        currentStreak: user.streak.currentStreak,
        longestStreak: user.streak.longestStreak,
        lastActiveDate: user.streak.lastActiveDate,
        message: 'Streak updated successfully'
      };
      
    } catch (error) {
      console.error('Streak update error:', error.message);
      throw error;
    }
  }

  /**
   * Get streak information for a user
   * 
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - Streak info
   */
  async getStreakInfo(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Initialize if needed
      if (!user.streak) {
        user.streak = {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null
        };
        await user.save();
      }
      
      const streakInfo = user.getStreakInfo();
      
      return {
        success: true,
        ...streakInfo
      };
      
    } catch (error) {
      console.error('Get streak info error:', error.message);
      throw error;
    }
  }

  /**
   * Get leaderboard of top streaks
   * 
   * @param {number} limit - Number of users to return
   * @returns {Promise<Array>} - Array of users with highest streaks
   */
  async getLeaderboard(limit = 10) {
    try {
      const users = await User.find({
        'streak.longestStreak': { $gt: 0 }
      })
      .select('username streak')
      .sort({ 'streak.longestStreak': -1 })
      .limit(limit);
      
      return users.map(user => ({
        userId: user._id,
        username: user.username,
        longestStreak: user.streak?.longestStreak || 0,
        currentStreak: user.streak?.currentStreak || 0
      }));
      
    } catch (error) {
      console.error('Get leaderboard error:', error.message);
      throw error;
    }
  }

  /**
   * Reset a user's streak (admin only)
   * 
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} - Result
   */
  async resetStreak(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      user.streak = {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null
      };
      
      await user.save();
      
      return {
        success: true,
        message: 'Streak reset successfully'
      };
      
    } catch (error) {
      console.error('Reset streak error:', error.message);
      throw error;
    }
  }
}

module.exports = new StreakService();
