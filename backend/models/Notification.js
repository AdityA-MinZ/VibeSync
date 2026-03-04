const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'like',
      'comment',
      'follow',
      'playlist_share',
      'track_added',
      'achievement',
      'friend_request',
      'system'
    ]
  },
  message: {
    type: String,
    required: true
  },
  data: {
    targetId: mongoose.Schema.Types.ObjectId,
    targetType: String,
    targetTitle: String,
    targetImage: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification.populate('sender', 'username');
};

notificationSchema.statics.getNotifications = async function(userId, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;
  
  const query = { recipient: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const notifications = await this.find(query)
    .populate('sender', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await this.countDocuments(query);
  const unreadCount = await this.countDocuments({ recipient: userId, isRead: false });

  return { notifications, total, unreadCount };
};

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);
