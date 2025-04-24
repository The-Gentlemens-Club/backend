import { Router } from 'express';
import { AchievementService } from '../services/achievementService';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { NotificationService } from '../services/notificationService';
import { config } from '../config';

const router = Router();

const notificationService = new NotificationService();
const userService = new UserService(notificationService);
const contractService = new ContractService(
  config.rpcUrl,
  config.tournamentContractAddress,
  config.gameContractAddress,
  userService,
  notificationService
);

const achievementService = new AchievementService(
  userService,
  contractService,
  notificationService
);

// Get player achievements
router.get('/player/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const achievements = await achievementService.getPlayerAchievements(address);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player achievements' });
  }
});

// Check for new achievements
router.post('/check/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const newAchievements = await achievementService.checkAchievements(address);
    res.json(newAchievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

// Get achievement types
router.get('/types', async (req, res) => {
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
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await achievementService.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get achievement leaderboard' });
  }
});

export default router; 