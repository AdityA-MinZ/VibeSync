const User = require('../models/User');
const Like = require('../models/Like');

class CompatibilityService {
  async calculateCompatibility(userId1, userId2) {
    try {
      if (userId1.toString() === userId2.toString()) {
        return {
          success: true,
          compatibility: 100,
          matchScore: 100,
          level: 'perfect',
          message: 'Same user',
          factors: {
            musicTaste: 100,
            commonLikes: 100,
            genreMatch: 100,
            listeningPatterns: 100
          }
        };
      }

      const factors = await Promise.all([
        this.calculateMusicTasteCompatibility(userId1, userId2),
        this.calculateCommonLikesCompatibility(userId1, userId2),
        this.calculateGenreCompatibility(userId1, userId2),
        this.calculateStreakCompatibility(userId1, userId2)
      ]);

      const weights = {
        musicTaste: 0.35,
        commonLikes: 0.30,
        genreMatch: 0.20,
        streakMatch: 0.15
      };

      let totalScore = 0;
      totalScore += factors[0].score * weights.musicTaste;
      totalScore += factors[1].score * weights.commonLikes;
      totalScore += factors[2].score * weights.genreMatch;
      totalScore += factors[3].score * weights.streakMatch;

      const compatibilityScore = Math.round(totalScore * 100);

      let level = 'low';
      let message = 'Low compatibility';
      
      if (compatibilityScore >= 80) {
        level = 'high';
        message = 'Excellent music taste match!';
      } else if (compatibilityScore >= 60) {
        level = 'good';
        message = 'Good compatibility';
      } else if (compatibilityScore >= 40) {
        level = 'moderate';
        message = 'Moderate compatibility';
      }

      return {
        success: true,
        compatibility: compatibilityScore,
        level: level,
        message: message,
        factors: {
          musicTaste: Math.round(factors[0].score * 100),
          commonLikes: Math.round(factors[1].score * 100),
          genreMatch: Math.round(factors[2].score * 100),
          streakMatch: Math.round(factors[3].score * 100)
        },
        details: {
          commonTracks: factors[1].commonTracks || [],
          commonArtists: factors[1].commonArtists || [],
          commonGenres: factors[2].commonGenres || []
        }
      };

    } catch (error) {
      console.error('Calculate compatibility error:', error.message);
      throw error;
    }
  }

  async calculateMusicTasteCompatibility(userId1, userId2) {
    try {
      const [user1Likes, user2Likes] = await Promise.all([
        Like.find({ user: userId1 }),
        Like.find({ user: userId2 })
      ]);

      if (user1Likes.length === 0 || user2Likes.length === 0) {
        return { score: 0.5 };
      }

      const set1 = new Set(user1Likes.map(l => `${l.targetType}:${l.targetId}`));
      const set2 = new Set(user2Likes.map(l => `${l.targetType}:${l.targetId}`));
      
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      const jaccardSimilarity = intersection.size / union.size;
      const overlapBoost = intersection.size >= 10 ? 0.1 : 0;
      
      return {
        score: Math.min(1, jaccardSimilarity + overlapBoost),
        commonLikes: intersection.size
      };

    } catch (error) {
      return { score: 0.5 };
    }
  }

  async calculateCommonLikesCompatibility(userId1, userId2) {
    try {
      const [user1Likes, user2Likes] = await Promise.all([
        Like.find({ user: userId1 }).limit(100),
        Like.find({ user: userId2 }).limit(100)
      ]);

      const user1Tracks = user1Likes.filter(l => l.targetType === 'track');
      const user2Tracks = user2Likes.filter(l => l.targetType === 'track');
      
      const commonTracks = [];
      let commonTrackCount = 0;
      
      user1Tracks.forEach(track => {
        if (user2Tracks.some(t => t.targetId === track.targetId)) {
          commonTrackCount++;
          if (commonTracks.length < 5) commonTracks.push(track.targetId);
        }
      });

      const user1Artists = user1Likes.filter(l => l.targetType === 'artist');
      const user2Artists = user2Likes.filter(l => l.targetType === 'artist');
      
      const commonArtists = [];
      let commonArtistCount = 0;
      
      user1Artists.forEach(artist => {
        if (user2Artists.some(a => a.targetId === artist.targetId)) {
          commonArtistCount++;
          if (commonArtists.length < 5) commonArtists.push(artist.targetId);
        }
      });

      const totalCommon = commonTrackCount + commonArtistCount;
      const score = Math.min(1, totalCommon / 15);

      return {
        score: score,
        commonTracks: commonTracks,
        commonArtists: commonArtists,
        commonTrackCount: commonTrackCount,
        commonArtistCount: commonArtistCount
      };

    } catch (error) {
      return { score: 0.5, commonTracks: [], commonArtists: [] };
    }
  }

  async calculateGenreCompatibility(userId1, userId2) {
    try {
      const [user1, user2] = await Promise.all([
        User.findById(userId1).select('spotifyStats.topGenres'),
        User.findById(userId2).select('spotifyStats.topGenres')
      ]);

      const genres1 = user1?.spotifyStats?.topGenres || [];
      const genres2 = user2?.spotifyStats?.topGenres || [];

      if (genres1.length === 0 || genres2.length === 0) {
        return { score: 0.5, commonGenres: [] };
      }

      const commonGenres = genres1.filter(g => 
        genres2.some(g2 => g2.toLowerCase() === g.toLowerCase())
      );

      const totalUniqueGenres = new Set([...genres1, ...genres2]).size;
      const score = totalUniqueGenres > 0 ? (commonGenres.length / totalUniqueGenres) * 1.5 : 0;

      return {
        score: Math.min(1, score),
        commonGenres: commonGenres.slice(0, 5)
      };

    } catch (error) {
      return { score: 0.5, commonGenres: [] };
    }
  }

  async calculateStreakCompatibility(userId1, userId2) {
    try {
      const [user1, user2] = await Promise.all([
        User.findById(userId1).select('streak'),
        User.findById(userId2).select('streak')
      ]);

      const streak1 = user1?.streak?.currentStreak || 0;
      const streak2 = user2?.streak?.currentStreak || 0;

      const bothActive = streak1 > 0 && streak2 > 0;
      const avgStreak = (streak1 + streak2) / 2;
      const score = Math.min(1, avgStreak / 20);

      return {
        score: bothActive ? Math.max(0.5, score) : score,
        bothActive: bothActive,
        user1Streak: streak1,
        user2Streak: streak2
      };

    } catch (error) {
      return { score: 0.5, bothActive: false };
    }
  }

  async findCompatibleUsers(userId, limit = 10) {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser) throw new Error('User not found');

      const allUsers = await User.find({
        _id: { $ne: userId },
        'streak.currentStreak': { $gt: 0 }
      }).limit(100);

      const compatibilityPromises = allUsers.map(async (otherUser) => {
        const compat = await this.calculateCompatibility(userId, otherUser._id);
        return {
          user: {
            _id: otherUser._id,
            username: otherUser.username,
            profileImage: otherUser.profileImage
          },
          compatibility: compat.compatibility,
          level: compat.level,
          message: compat.message
        };
      });

      const results = await Promise.all(compatibilityPromises);
      
      return results
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, limit);

    } catch (error) {
      console.error('Find compatible users error:', error.message);
      throw error;
    }
  }
}

module.exports = new CompatibilityService();
