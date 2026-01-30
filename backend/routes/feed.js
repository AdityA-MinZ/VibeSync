const router = require('express').Router();
const auth = require('../middleware/auth'); // Your JWT middleware
const Playlist = require('../models/Playlist');
const User = require('../models/User');

// GET /api/feed — Paginated feed of friends' public playlists + search
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Get user's followings
    const user = await User.findById(req.user.id).populate('followings');
    const followingIds = user.followings.map(f => f._id);

    // Query: Public playlists from followings, search by name, paginated
    const query = {
      owner: { $in: followingIds },
      isPublic: true,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    };

    const playlists = await Playlist.find(query)
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Playlist.countDocuments(query);

    res.json({
      playlists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: skip + playlists.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
