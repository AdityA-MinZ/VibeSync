const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'session_invite'], default: 'text' },
  sessionData: {
    sessionId: { type: String },
    songName: { type: String },
    songUrl: { type: String }
  },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', schema);
