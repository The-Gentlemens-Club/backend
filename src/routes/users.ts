import { Router } from 'express';
import { UserService } from '../services/userService';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

export const initUserRoutes = (userService: UserService) => {
  const auth = authenticate(userService);

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { address, username } = req.body;
      
      if (!address || !username) {
        return res.status(400).json({ error: 'Address and username are required' });
      }

      const profile = await userService.registerUser(address, username);
      const session = await userService.createSession(address, {
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip
      });

      res.status(201).json({
        profile,
        session: {
          token: session.token,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }

      const profile = await userService.getUserProfile(address);
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      const session = await userService.createSession(address, {
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip
      });

      res.json({
        profile,
        session: {
          token: session.token,
          expiresAt: session.expiresAt
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  });

  // Logout
  router.post('/logout', auth, async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await userService.endSession(token);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Get user profile
  router.get('/profile', auth, async (req, res) => {
    try {
      const profile = await userService.getUserProfile(req.user!.address);
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  // Update user profile
  router.put('/profile', auth, async (req, res) => {
    try {
      const updates = req.body;
      const profile = await userService.updateProfile(req.user!.address, updates);
      res.json(profile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update profile' });
    }
  });

  // Update user settings
  router.put('/settings', auth, async (req, res) => {
    try {
      const settings = req.body;
      const updatedSettings = await userService.updateSettings(req.user!.address, settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update settings' });
    }
  });

  // Get user stats
  router.get('/stats', auth, async (req, res) => {
    try {
      const profile = await userService.getUserProfile(req.user!.address);
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(profile.stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  // Update user stats (admin only)
  router.put('/stats/:address', auth, requireRole(['admin']), async (req, res) => {
    try {
      const { address } = req.params;
      const stats = req.body;
      const updatedStats = await userService.updateStats(address, stats);
      res.json(updatedStats);
    } catch (error) {
      console.error('Update stats error:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update stats' });
    }
  });

  // Get active sessions
  router.get('/sessions', auth, async (req, res) => {
    try {
      const sessions = await userService.getUserSessions(req.user!.address);
      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  });

  // End all sessions
  router.post('/sessions/end-all', auth, async (req, res) => {
    try {
      await userService.endAllSessions(req.user!.address);
      res.json({ success: true });
    } catch (error) {
      console.error('End sessions error:', error);
      res.status(500).json({ error: 'Failed to end sessions' });
    }
  });

  return router;
}; 