import { Router } from 'express';
import { ContractService } from '../services/contracts';

const router = Router();
const contractService = new ContractService();

// Get token balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await contractService.getBalance(address);
    res.json({ balance: balance.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Approve token spending
router.post('/approve', async (req, res) => {
  try {
    const { spender, amount } = req.body;
    const txHash = await contractService.approve(spender, BigInt(amount));
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve tokens' });
  }
});

export default router; 