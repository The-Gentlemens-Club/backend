export const gameABI = [
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getGameState',
    outputs: [
      { name: 'isActive', type: 'bool' },
      { name: 'currentBet', type: 'uint256' },
      { name: 'playerBalance', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'startGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'maxPlayers', type: 'uint256' },
      { name: 'startTime', type: 'uint256' }
    ],
    name: 'createTournament',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tournamentId', type: 'uint256' }],
    name: 'joinTournament',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'tournamentId', type: 'uint256' }],
    name: 'getTournamentInfo',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'prizePool', type: 'uint256' },
      { name: 'maxPlayers', type: 'uint256' },
      { name: 'registeredPlayers', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'status', type: 'uint8' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerStats',
    outputs: [
      { name: 'totalGames', type: 'uint256' },
      { name: 'wins', type: 'uint256' },
      { name: 'losses', type: 'uint256' },
      { name: 'draws', type: 'uint256' },
      { name: 'totalBetAmount', type: 'uint256' },
      { name: 'totalWinAmount', type: 'uint256' },
      { name: 'highestWin', type: 'uint256' },
      { name: 'currentStreak', type: 'uint256' },
      { name: 'bestStreak', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' }
    ],
    name: 'getPlayerHistory',
    outputs: [
      {
        components: [
          { name: 'betAmount', type: 'uint256' },
          { name: 'outcome', type: 'uint8' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'txHash', type: 'bytes32' }
        ],
        name: '',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const; 