import { BrowserProvider, Contract, formatEther, parseUnits, getAddress } from 'ethers';
import { WalletInfo, WalletState } from '../types';
import { TESTNET_CONFIG, USDT_CONTRACT_ADDRESS } from '../config/constants';

// ERC-20 USDT ABI (simplified)
const USDT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// Comprehensive wallet detection with proper provider identification
export const detectWallets = (): WalletInfo[] => {
  try {
    const wallets: WalletInfo[] = [];
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      return wallets;
    }

    // Check for MetaMask
    if (ethereum.isMetaMask) {
      wallets.push({
        name: 'MetaMask',
        icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
        installed: true,
        provider: ethereum
      });
    }

    // Check for Trust Wallet
    if (ethereum.isTrust) {
      wallets.push({
        name: 'Trust Wallet',
        icon: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
        installed: true,
        provider: ethereum
      });
    }

    // Check for Coinbase Wallet
    if (ethereum.isCoinbaseWallet || ethereum.selectedProvider?.isCoinbaseWallet) {
      wallets.push({
        name: 'Coinbase Wallet',
        icon: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4',
        installed: true,
        provider: ethereum
      });
    }

    // Check for SafePal
    if (ethereum.isSafePal) {
      wallets.push({
        name: 'SafePal',
        icon: 'https://safepal.io/static/media/logo.d1c1c4c4.svg',
        installed: true,
        provider: ethereum
      });
    }

    // Check for Exodus
    if (ethereum.isExodus) {
      wallets.push({
        name: 'Exodus',
        icon: 'https://www.exodus.com/img/logo/exodus-logo-blue.svg',
        installed: true,
        provider: ethereum
      });
    }

    // Check for XDEFI
    if (ethereum.isXDEFI) {
      wallets.push({
        name: 'XDEFI Wallet',
        icon: 'https://xdefi.io/static/media/logo.b0b4c8b4.svg',
        installed: true,
        provider: ethereum
      });
    }

    // Check for Keplr (though it's primarily for Cosmos)
    if ((window as any).keplr) {
      wallets.push({
        name: 'Keplr Wallet',
        icon: 'https://wallet.keplr.app/assets/icon-512.png',
        installed: true,
        provider: ethereum
      });
    }

    // Check for Trezor
    if (ethereum.isTrezor) {
      wallets.push({
        name: 'Trezor',
        icon: 'https://trezor.io/static/images/trezor-logo-h.svg',
        installed: true,
        provider: ethereum
      });
    }

    // Check for Ledger
    if (ethereum.isLedger) {
      wallets.push({
        name: 'Ledger',
        icon: 'https://www.ledger.com/wp-content/themes/ledger-v2/public/images/ledger-logo-long.svg',
        installed: true,
        provider: ethereum
      });
    }

    // Check for multiple providers (when user has multiple wallets)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      ethereum.providers.forEach((provider: any) => {
        if (provider.isMetaMask && !wallets.find(w => w.name === 'MetaMask')) {
          wallets.push({
            name: 'MetaMask',
            icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
            installed: true,
            provider: provider
          });
        }
        if (provider.isTrust && !wallets.find(w => w.name === 'Trust Wallet')) {
          wallets.push({
            name: 'Trust Wallet',
            icon: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
            installed: true,
            provider: provider
          });
        }
        if (provider.isCoinbaseWallet && !wallets.find(w => w.name === 'Coinbase Wallet')) {
          wallets.push({
            name: 'Coinbase Wallet',
            icon: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4',
            installed: true,
            provider: provider
          });
        }
        if (provider.isSafePal && !wallets.find(w => w.name === 'SafePal')) {
          wallets.push({
            name: 'SafePal',
            icon: 'https://safepal.io/static/media/logo.d1c1c4c4.svg',
            installed: true,
            provider: provider
          });
        }
        if (provider.isExodus && !wallets.find(w => w.name === 'Exodus')) {
          wallets.push({
            name: 'Exodus',
            icon: 'https://www.exodus.com/img/logo/exodus-logo-blue.svg',
            installed: true,
            provider: provider
          });
        }
        if (provider.isXDEFI && !wallets.find(w => w.name === 'XDEFI Wallet')) {
          wallets.push({
            name: 'XDEFI Wallet',
            icon: 'https://xdefi.io/static/media/logo.b0b4c8b4.svg',
            installed: true,
            provider: provider
          });
        }
      });
    }

    // If no specific wallet detected but ethereum exists, add as generic wallet
    if (wallets.length === 0 && ethereum) {
      wallets.push({
        name: 'Web3 Wallet',
        icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
        installed: true,
        provider: ethereum
      });
    }

    return wallets;
  } catch (error: any) {
    // Handle SecurityError from cross-origin frame access in restricted environments
    if (error.name === 'SecurityError' || error.message?.includes('cross-origin')) {
      console.warn('Wallet detection blocked due to cross-origin restrictions:', error.message);
      return [];
    }
    
    // Log other unexpected errors but don't crash the app
    console.error('Unexpected error during wallet detection:', error);
    return [];
  }
};

export const connectWallet = async (wallet: WalletInfo): Promise<WalletState> => {
  if (!wallet.installed || !wallet.provider) {
    throw new Error(`${wallet.name} is not installed`);
  }

  try {
    // For multiple providers, ensure we're using the correct one
    let provider = wallet.provider;
    
    // If there are multiple providers, select the specific one
    if (wallet.provider.providers && Array.isArray(wallet.provider.providers)) {
      if (wallet.name === 'MetaMask') {
        provider = wallet.provider.providers.find((p: any) => p.isMetaMask) || wallet.provider;
      } else if (wallet.name === 'Trust Wallet') {
        provider = wallet.provider.providers.find((p: any) => p.isTrust) || wallet.provider;
      } else if (wallet.name === 'Coinbase Wallet') {
        provider = wallet.provider.providers.find((p: any) => p.isCoinbaseWallet) || wallet.provider;
      } else if (wallet.name === 'SafePal') {
        provider = wallet.provider.providers.find((p: any) => p.isSafePal) || wallet.provider;
      } else if (wallet.name === 'Exodus') {
        provider = wallet.provider.providers.find((p: any) => p.isExodus) || wallet.provider;
      } else if (wallet.name === 'XDEFI Wallet') {
        provider = wallet.provider.providers.find((p: any) => p.isXDEFI) || wallet.provider;
      }
    }

    // Request account access from the specific provider
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Switch to BSC Testnet
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TESTNET_CONFIG.chainId }]
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [TESTNET_CONFIG]
          });
        } catch (addError: any) {
          throw new Error(`Failed to add BSC Testnet: ${addError.message || 'Network addition rejected'}`);
        }
      } else if (switchError.code === 4001) {
        throw new Error('User rejected network switch to BSC Testnet');
      } else {
        throw new Error(`Failed to switch to BSC Testnet: ${switchError.message || 'Unknown network error'}`);
      }
    }

    const browserProvider = new BrowserProvider(provider);
    const signer = await browserProvider.getSigner();
    const address = await signer.getAddress();
    
    // Get BNB balance
    const balance = await browserProvider.getBalance(address);
    const balanceInBNB = formatEther(balance);
    
    // Verify we're on the correct network
    const network = await browserProvider.getNetwork();
    if (network.chainId !== 97n) { // BSC Testnet chain ID as BigInt
      throw new Error('Please switch to BSC Testnet network in your wallet.');
    }

    return {
      connected: true,
      address,
      balance: balanceInBNB,
      chainId: network.chainId.toString(),
      provider: browserProvider,
      walletName: wallet.name
    };
  } catch (error: any) {
    console.error('Failed to connect wallet:', error);
    
    // Handle specific error codes
    if (error.code === 4001) {
      throw new Error('Connection rejected by user');
    } else if (error.code === -32002) {
      throw new Error('Connection request already pending. Please check your wallet.');
    } else if (error.message) {
      throw error;
    } else {
      throw new Error('Failed to connect wallet. Please try again.');
    }
  }
};

export const getUSDTBalance = async (provider: any, address: string): Promise<string> => {
  try {
    const contract = new Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return formatEther(balance * BigInt(10) ** (18n - BigInt(decimals)));
  } catch (error) {
    console.error('Failed to get USDT balance:', error);
    // Return 0 instead of throwing to prevent blocking the UI
    return '0';
  }
};

export const executePayment = async (
  provider: any,
  distributions: { address: string; amount: string }[]
): Promise<any[]> => {
  try {
    // Validate provider
    if (!provider) {
      throw new Error('Wallet provider not available');
    }

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Check if signer is available
    if (!signerAddress) {
      throw new Error('Unable to get wallet address. Please reconnect your wallet.');
    }

    const contract = new Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer);
    
    // Validate contract
    try {
      await contract.symbol();
    } catch (contractError) {
      throw new Error('Unable to connect to USDT contract. Please check your network connection.');
    }

    const transactions = [];
    
    for (let i = 0; i < distributions.length; i++) {
      const distribution = distributions[i];
      
      // Validate and checksum the address
      let checksummedAddress: string;
      try {
        // Clean the address and ensure proper format
        const cleanAddress = distribution.address.trim();
        if (!cleanAddress.startsWith('0x') || cleanAddress.length !== 42) {
          throw new Error(`Invalid address format: ${cleanAddress}`);
        }
        checksummedAddress = getAddress(cleanAddress);
      } catch (addressError) {
        console.error(`Address validation error for ${distribution.address}:`, addressError);
        throw new Error(`Invalid recipient address #${i + 1}: ${distribution.address}. Please check the address format.`);
      }

      // Validate amount
      let amount: bigint;
      try {
        amount = parseUnits(distribution.amount, 18);
        if (amount <= 0) {
          throw new Error(`Invalid amount for recipient #${i + 1}: ${distribution.amount}`);
        }
      } catch (amountError) {
        throw new Error(`Invalid amount format for recipient #${i + 1}: ${distribution.amount}`);
      }

      // Check balance before each transaction
      try {
        const balance = await contract.balanceOf(signerAddress);
        if (balance < amount) {
          throw new Error(`Insufficient USDT balance for transaction #${i + 1}. Required: ${distribution.amount} USDT`);
        }
      } catch (balanceError: any) {
        if (balanceError.message.includes('Insufficient USDT balance')) {
          throw balanceError;
        }
        throw new Error(`Failed to check USDT balance: ${balanceError.message || 'Unknown error'}`);
      }
      
      console.log(`Sending ${distribution.amount} USDT to ${checksummedAddress}`);
      
      // Execute transaction
      let tx;
      try {
        tx = await contract.transfer(checksummedAddress, amount);
        console.log(`Transaction #${i + 1} submitted:`, tx.hash);
      } catch (txError: any) {
        if (txError.code === 4001) {
          throw new Error(`Transaction #${i + 1} rejected by user`);
        } else if (txError.code === -32000) {
          throw new Error(`Transaction #${i + 1} failed: Insufficient gas or network error`);
        } else if (txError.message?.includes('insufficient funds')) {
          throw new Error(`Transaction #${i + 1} failed: Insufficient BNB for gas fees`);
        } else {
          throw new Error(`Transaction #${i + 1} failed: ${txError.message || 'Unknown transaction error'}`);
        }
      }

      // Wait for confirmation
      try {
        const receipt = await tx.wait();
        if (receipt.status === 0) {
          throw new Error(`Transaction #${i + 1} failed during execution`);
        }
        console.log(`Transaction #${i + 1} confirmed:`, receipt.hash);
      } catch (waitError: any) {
        if (waitError.message.includes('failed during execution')) {
          throw waitError;
        }
        // Don't fail if we can't wait for confirmation, the transaction might still succeed
        console.warn(`Transaction #${i + 1} confirmation timeout:`, waitError);
      }
      
      transactions.push(tx);
    }
    
    return transactions;
  } catch (error: any) {
    console.error('Payment execution failed:', error);
    
    // Re-throw our custom errors as-is
    if (error.message && (
      error.message.includes('Invalid recipient address') ||
      error.message.includes('Invalid amount') ||
      error.message.includes('Insufficient USDT balance') ||
      error.message.includes('Transaction') ||
      error.message.includes('rejected by user') ||
      error.message.includes('Wallet provider not available') ||
      error.message.includes('Unable to connect to USDT contract')
    )) {
      throw error;
    }
    
    // Handle other specific errors
    if (error.code === 4001) {
      throw new Error('Payment cancelled by user');
    } else if (error.code === -32603) {
      throw new Error('Internal wallet error. Please try again.');
    } else if (error.message?.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message?.includes('bad address checksum')) {
      throw new Error('Invalid address format detected. Please contact support.');
    } else {
      throw new Error(`Payment failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
};