import { Router } from 'express';
import { AchievementService } from '../services/achievementService';
import { NotificationService } from '../services/notificationService';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { TournamentService } from '../services/tournamentService';
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
const tournamentService = new TournamentService(contractService, userService, notificationService);
const achievementService = new AchievementService(userService, contractService, notificationService);

// Get all available achievements
router.get('/', async (req, res) => {
  try {
    const achievements = await achievementService.getPlayerAchievements('0x0'); // Using a dummy address to get all achievements
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// Get all achievements for a player
router.get('/player/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const achievements = await achievementService.getPlayerAchievements(address);
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching player achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Check for new achievements
router.post('/check/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const newAchievements = await achievementService.checkAchievements(address);
    res.json(newAchievements);
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

// Get achievement leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await achievementService.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching achievement leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get achievement progress for a player
router.get('/progress/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const progress = await achievementService.getAchievementProgress(address);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching achievement progress:', error);
    res.status(500).json({ error: 'Failed to fetch achievement progress' });
  }
});

export default router; 