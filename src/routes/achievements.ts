import { Router } from 'express';
import { AchievementService } from '../services/achievementService';
import { authenticate } from '../middleware/auth';

export const achievementRouter = Router();
const achievementService = new AchievementService(
  new UserService(),
  new ContractService()
);

// Get player achievements
achievementRouter.get('/player/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const achievements = achievementService.getPlayerAchievements(address);
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player achievements' });
  }
});

// Check for new achievements
achievementRouter.post('/check/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const newAchievements = await achievementService.checkAchievements(address);
    res.json(newAchievements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

// Get achievement types
achievementRouter.get('/types', authenticate, async (req, res) => {
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
achievementRouter.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const leaderboard = await achievementService.getAchievementLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get achievement leaderboard' });
  }
}); 