import { Router } from 'express';
import { AchievementService } from '../services/achievementService';
import { NotificationService } from '../services/notificationService';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { authenticate } from '../middleware/auth';
import { config } from '../config';

const router = Router();

const notificationService = new NotificationService();
const userService = new UserService(notificationService);
const contractService = new ContractService(
  config.rpcUrl,
  config.tournamentContractAddress,
  config.gameContractAddress,
  userService,
  notificationService,
  config.jwtSecret
);
const achievementService = new AchievementService(userService, contractService, notificationService);

// Get all available achievements
router.get('/', async (req, res) => {
  try {
    res.json(achievementService.achievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// Get player achievements
router.get('/player/:address', authenticate(userService), async (req, res) => {
  try {
    const achievements = await achievementService.getPlayerAchievements(req.params.address);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player achievements' });
  }
});

// Check for new achievements
router.post('/check/:address', authenticate(userService), async (req, res) => {
  try {
    await achievementService.checkAchievements(req.params.address);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

// Get achievement leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await achievementService.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get achievement leaderboard' });
  }
});

export default router; 