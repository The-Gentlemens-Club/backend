import { Router } from 'express';
import { ContractService } from '../services/contractService';
import { UserService } from '../services/userService';
import { NotificationService } from '../services/notificationService';
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

// Get player stats
router.get('/player/:address', async (req, res) => {
  try {
    const stats = await contractService.getPlayerStats(req.params.address);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player stats' });
  }
});

// Get player game history
router.get('/:address/history', async (req, res) => {
  try {
    const { address } = req.params;
    const { offset = '0', limit = '10' } = req.query;
    const history = await contractService.getPlayerHistory(
      address,
      Number(offset),
      Number(limit)
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get player history' });
  }
});

// Get leaderboard
router.get('/leaderboard/global', async (req, res) => {
  try {
    // This would need to be implemented in the smart contract
    // For now, we'll return a 501 Not Implemented
    res.status(501).json({ error: 'Leaderboard not implemented yet' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router; 