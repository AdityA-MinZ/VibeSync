const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tracks: [{
    trackId: String,
    title: String,
    artist: String,
    album: String,
    image: String,
    duration: Number,
    durationMs: Number,
    source: String,
    sourceUrl: String,
    youtubeUrl: String,
    youtubeId: String,
    previewUrl: String
  }],
  isPublic: { type: Boolean, default: true },
  plays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', playlistSchema);
