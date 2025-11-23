// DCA 合约配置
export const DCA_CONTRACT_ADDRESS = '0x7D0a62Ef1C43F28b70576390B0334c75D2CBE6D6' as const;
export const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Base 主网配置
export const BASE_MAINNET = {
  id: 8453,
  name: 'Base Mainnet',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
} as const;

// DCA 合约 ABI (简化版，包含主要函数)
export const DCA_CONTRACT_ABI = [
  // 查看函数
  {
    "inputs": [],
    "name": "getCurrentPrice",
    "outputs": [
      {"internalType": "int256", "name": "price", "type": "int256"},
      {"internalType": "uint256", "name": "updatedAt", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "thresholds",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "amounts",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "executed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // 写入函数
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "updatePriceAndMaybeInvest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // 事件
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "planId", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "thresholdIndex", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "usdcAmount", "type": "uint256"},
      {"indexed": false, "internalType": "int256", "name": "price", "type": "int256"},
      {"indexed": false, "internalType": "uint256", "name": "updatedAt", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "randomized", "type": "bool"}
    ],
    "name": "DCARequested",
    "type": "event"
  }
] as const;

// USDC 合约 ABI (ERC20)
export const USDC_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
