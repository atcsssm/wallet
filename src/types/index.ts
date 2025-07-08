export interface WalletInfo {
  name: string;
  icon: string;
  installed: boolean;
  provider?: any;
}

export interface PaymentDistribution {
  address: string;
  amount: string;
  percentage: string;
}

export interface TransactionDetails {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: Date;
  distributions: PaymentDistribution[];
}

export interface WalletState {
  connected: boolean;
  address: string;
  balance: string;
  chainId: string;
  provider?: any;
}