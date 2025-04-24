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

// Get token balance
router.get('/balance/:address', async (req, res) => {
  try {
    const balance = await contractService.getBalance(req.params.address);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Approve token spending
router.post('/approve', authenticate(userService), async (req, res) => {
  try {
    const { spender, amount } = req.body;
    const txHash = await contractService.approve(spender, BigInt(amount));
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve token spending' });
  }
});

export default router; 