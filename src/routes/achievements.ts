import { Router } from 'express';
import { AchievementService } from '../services/achievementService';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { NotificationService } from '../services/notificationService';
import { authenticate } from '../middleware/auth';

const router = Router();
const userService = new UserService();
const contractService = new ContractService();
const notificationService = new NotificationService();
const achievementService = new AchievementService(
  userService,
  contractService,
  notificationService
);

// Get player achievements
router.get('/player/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const achievements = await achievementService.getPlayerAchievements(address);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player achievements' });
  }
});

// Check for new achievements
router.post('/check/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const newAchievements = await achievementService.checkAchievements(address);
    res.json(newAchievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

// Get achievement types
router.get('/types', authenticate, async (req, res) => {
  try {
    const types = [
      'first_win',
      'tournament_victory',
      'streak_master',
      'high_roller',
      'loyal_player',
      'quick_learner',
      'risk_taker',
      'strategist'
    ];
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get achievement types' });
  }
});

// Get achievement leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const leaderboard = await achievementService.getAchievementLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get achievement leaderboard' });
  }
});

export default router; 