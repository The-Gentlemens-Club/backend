import { Router } from 'express';
import { WebSocketServer } from 'ws';
import { NotificationService } from '../services/notificationService';
import { authenticate } from '../middleware/auth';

const router = Router();
const notificationService = new NotificationService();

// Initialize WebSocket server
export const initWebSocket = (server: any) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    // Extract player address from query parameters
    const playerAddress = req.url?.split('?')[1]?.split('=')[1];
    
    if (!playerAddress) {
      ws.close(1008, 'Player address required');
      return;
    }

    // Register WebSocket connection
    notificationService.registerWebSocket(playerAddress, ws);

    // Send initial unread notifications
    notificationService.getNotifications(playerAddress, { unreadOnly: true })
      .then(({ notifications }) => {
        ws.send(JSON.stringify({ type: 'initial_notifications', notifications }));
      })
      .catch(error => {
        console.error('Error sending initial notifications:', error);
      });
  });
};

// Get notifications with pagination and filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 10, offset = 0, unreadOnly, types } = req.query;
    const playerAddress = req.user.address;

    const result = await notificationService.getNotifications(playerAddress, {
      limit: Number(limit),
      offset: Number(offset),
      unreadOnly: unreadOnly === 'true',
      types: types ? (types as string).split(',') as any[] : undefined
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notifications as read
router.post('/read', authenticate, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const playerAddress = req.user.address;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds must be an array' });
    }

    await notificationService.markAsRead(playerAddress, notificationIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Update notification preferences
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { preferences } = req.body;
    const playerAddress = req.user.address;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'preferences must be an array' });
    }

    await notificationService.updatePreferences(playerAddress, preferences);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req, res) => {
  try {
    const playerAddress = req.user.address;
    const preferences = await notificationService.getPlayerPreferences(playerAddress);
    res.json(preferences);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

export default router; 