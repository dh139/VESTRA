import Notification from '../models/Notification.js';

/**
 * Unified notification dispatcher
 * @param {string|null} userId - The target user ID (null for admin alerts)
 * @param {string} type - Notification enum type
 * @param {string} title - Heading
 * @param {string} message - Content body
 */
export const notify = async (userId, type, title, message) => {
  try {
    const notification = new Notification({
      userId: userId || null,
      type,
      title,
      message,
      isRead: false
    });
    await notification.save();
    console.log(`[Notification Dispatch] [${type}] To User: ${userId || 'ADMIN'} | ${title}: ${message}`);
    return notification;
  } catch (error) {
    console.error(`Failed to dispatch notification: ${error.message}`);
  }
};
