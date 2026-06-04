const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    return res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
