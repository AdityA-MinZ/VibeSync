const streakService = require('./services/streakService');

/**
 * Streak Integration Module
 * 
 * This module provides functions to automatically update user streaks
 * when they perform listening activities.
 */

class StreakIntegration {
  /**
   * Update streak when user listens to any track
   * Call this from:
   * - Spotify WebSocket events
   * - YouTube video play events
   * - Native track play events
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Streak update result
   */
  async onTrackPlay(userId) {
    try {
      // Only update if userId is valid
      if (!userId) {
        console.log('Streak update skipped: No userId provided');
        return null;
      }
      
      const result = await streakService.updateStreak(userId);
      console.log(`✅ Streak updated for user ${userId}: ${result.currentStreak} days`);
      return result;
    } catch (error) {
      console.error('Streak integration error:', error.message);
      // Don't throw - streak updates should not break the main functionality
      return null;
    }
  }

  /**
   * Socket.IO integration for real-time streak updates
   * Call this from your socket connection handler
   * 
   * @param {Object} io - Socket.io instance
   */
  setupSocketIntegration(io) {
    io.on('connection', (socket) => {
      console.log('Streak integration: Socket connected', socket.id);
      
      // Listen for playing-track events and update streaks
      socket.on('playing-track', async (data) => {
        if (data.userId) {
          try {
            const result = await this.onTrackPlay(data.userId);
            if (result) {
              // Emit streak update to the user
              socket.emit('streak-updated', {
                currentStreak: result.currentStreak,
                longestStreak: result.longestStreak,
                message: result.message
              });
            }
          } catch (error) {
            console.error('Socket streak update error:', error.message);
          }
        }
      });
    });
  }

  /**
   * Express middleware to update streak on track play
   * Use this in routes that handle track playback
   * 
   * Example usage:
   * router.post('/play', auth, streakIntegration.middleware(), trackController.play);
   */
  middleware() {
    return async (req, res, next) => {
      // Store original send function
      const originalSend = res.send;
      
      res.send = function(body) {
        // Restore original send
        res.send = originalSend;
        
        // Update streak if request was successful
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          // Update streak asynchronously (don't wait for it)
          streakService.updateStreak(req.user.id)
            .then(result => {
              console.log(`✅ Streak auto-updated for user ${req.user.id}`);
            })
            .catch(err => {
              console.error('Auto streak update error:', err.message);
            });
        }
        
        // Call original send
        return res.send(body);
      };
      
      next();
    };
  }
}

module.exports = new StreakIntegration();
