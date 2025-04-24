import dotenv from 'dotenv';

dotenv.config();

export const config = {
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  tournamentContractAddress: process.env.TOURNAMENT_CONTRACT_ADDRESS || '',
  gameContractAddress: process.env.GAME_CONTRACT_ADDRESS || '',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}; 