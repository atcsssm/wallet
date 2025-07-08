// Testnet BNB Smart Chain configuration
export const TESTNET_CONFIG = {
  chainId: '0x61', // 97 in hex (BSC Testnet)
  chainName: 'Binance Smart Chain Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: [
    'https://data-seed-prebsc-1-s1.binance.org:8545/',
    'https://data-seed-prebsc-2-s1.binance.org:8545/',
    'https://data-seed-prebsc-1-s2.binance.org:8545/'
  ],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
};

// USDT contract address on BSC Testnet (official testnet USDT)
export const USDT_CONTRACT_ADDRESS = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';

// Payment distribution addresses with proper checksums
export const PAYMENT_DISTRIBUTIONS = [
  {
    address: '0x742d35Cc6634C0532925a3b8D4C23E7F7A7D4A4b',
    amount: '0.00002',
    percentage: '33.3%'
  },
  {
    address: '0x8ba1f109551bD432803012645Hac136c22C177ec',
    amount: '0.00003',
    percentage: '50%'
  },
  {
    address: '0x1aE0EA4a72D944a8C7603FfB3eC30a6669E454C8',
    amount: '0.00001',
    percentage: '16.7%'
  }
];

export const TOTAL_PAYMENT_AMOUNT = '0.06';