const Notification = require('../models/Notification');

async function createNotification(user, title, message, type = 'info', meta = {}) {
  if (!user) return null;
  return Notification.create({ user, title, message, type, meta });
}

module.exports = { createNotification };
