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

// Get player game history
router.get('/history/:address', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to get game history' });
  }
});

export default router; 