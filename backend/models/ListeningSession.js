const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  songName: { type: String, required: true },
  songUrl: { type: String },
  platform: { type: String, enum: ['youtube', 'local'], default: 'youtube' },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  currentTime: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ListeningSession', schema);
