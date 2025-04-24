import { Router } from 'express';
import { UserService } from '../services/userService';
import { NotificationService } from '../services/notificationService';
import { config } from '../config';
import { authenticate } from '../middleware/auth';

const router = Router();
const notificationService = new NotificationService();
const userService = new UserService(notificationService);

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { address, username } = req.body;
    const profile = await userService.createProfile(address);
    
    // Create session
    const session = await userService.createSession(address, {
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || ''
    });

    res.json({ profile, session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { address } = req.body;
    const profile = await userService.getUserProfile(address);
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create new session
    const session = await userService.createSession(address, {
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || ''
    });

    res.json({ profile, session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login user' });
  }
});

// Get user profile
router.get('/profile', authenticate(userService), async (req, res) => {
  try {
    const profile = await userService.getUserProfile(req.user!.address);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', authenticate(userService), async (req, res) => {
  try {
    const { username, email, avatarUrl, bio } = req.body;
    const profile = await userService.updateProfile(req.user!.address, {
      username,
      email,
      avatarUrl,
      bio
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Update user settings
router.put('/settings', authenticate(userService), async (req, res) => {
  try {
    const { settings } = req.body;
    const updatedSettings = await userService.updateSettings(req.user!.address, settings);
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Get user sessions
router.get('/sessions', authenticate(userService), async (req, res) => {
  try {
    const sessions = await userService.getAllSessions(req.user!.address);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user sessions' });
  }
});

// End session
router.delete('/sessions/:token', authenticate(userService), async (req, res) => {
  try {
    await userService.endSession(req.params.token);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// End all sessions
router.delete('/sessions', authenticate(userService), async (req, res) => {
  try {
    await userService.endAllSessions(req.user!.address);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end all sessions' });
  }
});

export const userRouter = router; 