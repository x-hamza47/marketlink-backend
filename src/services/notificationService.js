import Notification from '../models/Notification.js';

export const createNotification = async ({ userId, type, message, link = '' }) => {
  try {
    await Notification.create({ userId, type, message, link });
  } catch (e) {
    console.error('Notification failed', e.message);
  }
};