# Gentlemen's Club Gaming Platform

A decentralized gaming platform built with React, TypeScript, and Ethereum smart contracts.

## Features

- **Game System**
  - Multiple game types (Roulette, Blackjack, Poker)
  - Real-time game state management
  - Secure betting system
  - Game history tracking

- **Tournament System**
  - Tournament creation and management
  - Prize pool distribution
  - Player rankings
  - Tournament history and analytics

- **Achievement System**
  - Multiple achievement types
  - Achievement rewards
  - Player progress tracking
  - Global leaderboard

- **User Management**
  - Profile management
  - Session handling
  - Role-based access control
  - User statistics

- **Analytics**
  - Tournament analytics
  - Player performance metrics
  - Revenue tracking
  - Activity trends

## Tech Stack

- **Frontend**
  - React
  - TypeScript
  - SCSS
  - Web3.js

- **Backend**
  - Node.js
  - Express
  - TypeScript
  - WebSocket

- **Smart Contracts**
  - Solidity
  - Hardhat
  - OpenZeppelin

## Project Structure

```
project/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and contract services
│   │   └── styles/        # SCSS styles
│   └── public/            # Static assets
│
├── backend/               # Node.js backend server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── types/         # TypeScript types
│   └── contracts/         # Smart contracts
│
└── contracts/             # Smart contract development
    ├── contracts/         # Solidity contracts
    ├── scripts/           # Deployment scripts
    └── test/              # Contract tests
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn
- Hardhat
- MetaMask or similar wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gentlemensclub.git
   cd gentlemensclub
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   yarn install

   # Install backend dependencies
   cd ../backend
   yarn install

   # Install contract dependencies
   cd ../contracts
   yarn install
   ```

3. Set up environment variables:
   ```bash
   # In backend/.env
   PORT=3001
   ETHEREUM_RPC_URL=your_rpc_url
   PRIVATE_KEY=your_private_key

   # In frontend/.env
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_CONTRACT_ADDRESS=your_contract_address
   ```

### Development

1. Start the backend server:
   ```bash
   cd backend
   yarn dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   yarn start
   ```

3. Deploy smart contracts (local development):
   ```bash
   cd contracts
   yarn hardhat node
   yarn hardhat deploy --network localhost
   ```

## API Documentation

### Game Endpoints

- `POST /api/game/play` - Start a new game
- `GET /api/game/history/:address` - Get game history
- `GET /api/game/stats/:address` - Get player stats

### Tournament Endpoints

- `POST /api/tournaments` - Create a tournament
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `POST /api/tournaments/:id/join` - Join a tournament

### Achievement Endpoints

- `GET /api/achievements/player/:address` - Get player achievements
- `POST /api/achievements/check/:address` - Check for new achievements
- `GET /api/achievements/types` - Get achievement types
- `GET /api/achievements/leaderboard` - Get achievement leaderboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

- All smart contracts are audited
- Secure session management
- Role-based access control
- Input validation and sanitization
- Rate limiting on API endpoints

## Support

For support, email support@gentlemensclub.com or join our Discord community. 