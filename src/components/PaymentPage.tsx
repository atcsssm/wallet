import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, Loader2, DollarSign, Wallet, Copy, ExternalLink, Shield, Lock, Eye, Sparkles, CheckCircle, Zap, Settings } from 'lucide-react';
import { WalletInfo, WalletState, TransactionDetails } from '../types';
import { detectWallets, connectWallet, getUSDTBalance } from '../utils/wallet';
import { checkPaymentEligibility, approveUSDTSpending, executeSmartContractPayment } from '../utils/smartContract';
import { PAYMENT_DISTRIBUTIONS, TOTAL_PAYMENT_AMOUNT } from '../config/constants';
import PaymentSuccess from './PaymentSuccess';

const PaymentPage: React.FC = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'check' | 'approve' | 'execute'>('check');
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [paymentEligibility, setPaymentEligibility] = useState<{
    hasBalance: boolean;
    hasAllowance: boolean;
    currentBalance: string;
    currentAllowance: string;
    requiredAmount: string;
  } | null>(null);

  useEffect(() => {
    const detectedWallets = detectWallets();
    setWallets(detectedWallets);
    console.log('Detected wallets:', detectedWallets);
  }, []);

  useEffect(() => {
    if (walletState?.provider && walletState.address) {
      loadUSDTBalance();
      checkEligibility();
    }
  }, [walletState]);

  const loadUSDTBalance = async () => {
    if (!walletState?.provider || !walletState.address) return;
    
    try {
      const balance = await getUSDTBalance(walletState.provider, walletState.address);
      setUsdtBalance(balance);
    } catch (error) {
      console.error('Failed to load USDT balance:', error);
    }
  };

  const checkEligibility = async () => {
    if (!walletState?.provider || !walletState.address) return;
    
    try {
      const eligibility = await checkPaymentEligibility(walletState.provider, walletState.address);
      setPaymentEligibility(eligibility);
      
      // Determine payment step based on eligibility
      if (!eligibility.hasBalance) {
        setPaymentStep('check');
      } else if (!eligibility.hasAllowance) {
        setPaymentStep('approve');
      } else {
        setPaymentStep('execute');
      }
    } catch (error) {
      console.error('Failed to check payment eligibility:', error);
    }
  };

  const handleWalletConnect = async (wallet: WalletInfo) => {
    setConnectingWallet(wallet.name);
    setLoading(true);
    setError(null);
    
    try {
      const connected = await connectWallet(wallet);
      setWalletState(connected);
      setError(null);
    } catch (error: any) {
      let friendlyMessage = 'Unable to connect to your wallet. Please try again.';
      
      if (error.message.includes('rejected')) {
        friendlyMessage = 'Connection was cancelled. Please try connecting again when ready.';
      } else if (error.message.includes('not installed')) {
        friendlyMessage = `${wallet.name} is not installed. Please install it first and refresh the page.`;
      } else if (error.message.includes('network')) {
        friendlyMessage = 'Network connection issue. Please check your internet and try again.';
      } else if (error.message.includes('BSC Testnet')) {
        friendlyMessage = 'Please switch to BSC Testnet in your wallet and try again.';
      }
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
      setConnectingWallet(null);
    }
  };

  const handleDisconnect = () => {
    setWalletState(null);
    setUsdtBalance('0');
    setError(null);
    setPaymentEligibility(null);
    setPaymentStep('check');
    setApprovalHash(null);
  };

  const handleApproveUSDT = async () => {
    if (!walletState?.provider) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const txHash = await approveUSDTSpending(walletState.provider);
      setApprovalHash(txHash);
      
      // Wait a moment then recheck eligibility
      const checkEligibilityInterval = setInterval(async () => {
        checkEligibility();
        // If approval is confirmed, clear the interval
        if (paymentEligibility?.hasAllowance) {
          clearInterval(checkEligibilityInterval);
        }
      }, 2000);
      
      // Clear interval after 30 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkEligibilityInterval);
      }, 30000);
      
    } catch (error: any) {
      console.error('USDT approval error:', error);
      
      let errorMessage = 'Failed to approve USDT spending. Please try again.';
      
      if (error.message.includes('rejected')) {
        errorMessage = 'USDT approval was cancelled. You can try again when ready.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'You don\'t have enough BNB to pay for transaction fees.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartContractPayment = async () => {
    if (!walletState?.provider) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting smart contract payment...');
      const result = await executeSmartContractPayment(walletState.provider);
      console.log('Payment result:', result);
      
      const transactionDetails: TransactionDetails = {
        hash: result.transactionHash,
        from: walletState.address,
        to: 'Smart Contract Distribution',
        amount: result.totalAmount,
        timestamp: result.timestamp,
        distributions: result.recipients.map(r => ({
          address: r.address,
          amount: r.amount,
          percentage: r.label === 'Recipient 1' ? '16.7%' : r.label === 'Recipient 2' ? '33.3%' : '50%',
          label: r.label
        })),
        walletName: walletState.walletName || 'Unknown Wallet',
        isSmartContract: true,
        gasUsed: result.gasUsed,
        blockNumber: result.blockNumber
      };
      
      console.log('Setting transaction details:', transactionDetails);
      setTransactions([transactionDetails]);
      setShowSuccess(true);
      
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log('Payment success state set, should redirect now');
      
    } catch (error: any) {
      console.error('Smart contract payment error:', error);
      
      let errorMessage = `Payment failed: ${error.message || 'Unknown error'}`;
      
      if (error.code === 4001) {
        errorMessage = 'Payment cancelled by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient BNB for gas fees';
      } else if (error.message?.includes('Insufficient USDT balance')) {
        errorMessage = error.message;
      } else if (error.message?.includes('rejected')) {
        errorMessage = 'Transaction rejected by user';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPayment = () => {
    setShowSuccess(false);
    setTransactions([]);
    loadUSDTBalance();
    checkEligibility();
  };

  const copyAddress = () => {
    if (walletState?.address) {
      navigator.clipboard.writeText(walletState.address);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (showSuccess) {
    console.log('Rendering PaymentSuccess component with transactions:', transactions);
    return <PaymentSuccess transactions={transactions} onBackToPayment={handleBackToPayment} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Smart Contract Payment Portal
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Secure BEP-20 USDT payment distribution via smart contract on BSC Testnet
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-red-800 mb-2 text-lg">Transaction Error</h4>
                <p className="text-red-700">{error}</p>
                {error.includes('USDT') && (
                  <p className="text-red-600 text-sm mt-3 bg-red-100 p-3 rounded-lg">
                    💡 Tip: Make sure you have enough USDT and BNB for gas fees in your wallet.
                  </p>
                )}
                {error.includes('approve') && (
                  <p className="text-red-600 text-sm mt-3 bg-red-100 p-3 rounded-lg">
                    💡 Tip: You need to approve USDT spending before the smart contract can process your payment.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Payment Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="space-y-8">
            {/* Smart Contract Badge */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-full">
                <Settings className="w-4 h-4 text-purple-600" />
                <span className="text-purple-800 font-bold text-sm">Smart Contract Powered</span>
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
            </div>

            {/* Payment Amount Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/50 rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-400/10 to-emerald-400/10 rounded-full translate-y-10 -translate-x-10"></div>
              
              <div className="relative text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-800 bg-clip-text text-transparent">
                    Smart Contract Payment
                  </h3>
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                
                <div className="relative">
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">
                    {TOTAL_PAYMENT_AMOUNT}
                  </div>
                  <div className="text-xl font-bold text-green-700 tracking-wide">
                    BEP-20 USDT
                  </div>
                </div>
                
                <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-800 font-medium text-sm">Atomic Distribution</span>
                </div>
              </div>
            </div>

            {/* Payment Distribution Details */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Smart Contract Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PAYMENT_DISTRIBUTIONS.map((dist, index) => (
                  <div key={index} className="bg-white/80 p-4 rounded-xl border border-blue-200/30">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{dist.amount} USDT</div>
                      <div className="text-sm text-blue-700 font-medium">{dist.label}</div>
                      <div className="text-xs text-blue-600 mt-1">{dist.percentage}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                ⚡ Both payments executed in a single transaction via smart contract
              </div>
            </div>

            {/* Connected Wallet Details */}
            {walletState && (
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/50 rounded-2xl p-6 shadow-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full -translate-y-10 translate-x-10"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-bold text-purple-900 text-lg">Connected to {walletState.walletName}</span>
                        <div className="text-sm text-purple-700">Ready for smart contract payment</div>
                      </div>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/60 p-4 rounded-xl">
                      <div className="text-sm font-medium text-gray-700 mb-2">Wallet Address</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                          {truncateAddress(walletState.address)}
                        </span>
                        <button
                          onClick={copyAddress}
                          className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Copy address"
                        >
                          <Copy className="w-4 h-4 text-purple-600" />
                        </button>
                        <a
                          href={`https://testnet.bscscan.com/address/${walletState.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                          title="View on BSCScan"
                        >
                          <ExternalLink className="w-4 h-4 text-purple-600" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-white/60 p-4 rounded-xl">
                      <div className="text-sm font-medium text-gray-700 mb-2">BNB Balance</div>
                      <span className="text-lg font-bold text-gray-900 bg-yellow-100 px-3 py-1 rounded-lg">
                        {parseFloat(walletState.balance).toFixed(4)} BNB
                      </span>
                    </div>
                    
                    <div className="bg-white/60 p-4 rounded-xl">
                      <div className="text-sm font-medium text-gray-700 mb-2">USDT Balance</div>
                      <span className="text-lg font-bold text-gray-900 bg-green-100 px-3 py-1 rounded-lg">
                        {usdtBalance} USDT
                      </span>
                    </div>
                  </div>

                  {/* Payment Eligibility Status */}
                  {paymentEligibility && (
                    <div className="mt-4 p-4 bg-white/60 rounded-xl">
                      <div className="text-sm font-medium text-gray-700 mb-3">Smart Contract Status</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className={`flex items-center space-x-2 p-2 rounded-lg ${paymentEligibility.hasBalance ? 'bg-green-100' : 'bg-red-100'}`}>
                          <div className={`w-3 h-3 rounded-full ${paymentEligibility.hasBalance ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-sm font-medium ${paymentEligibility.hasBalance ? 'text-green-800' : 'text-red-800'}`}>
                            Balance: {paymentEligibility.hasBalance ? 'Sufficient' : 'Insufficient'}
                          </span>
                        </div>
                        <div className={`flex items-center space-x-2 p-2 rounded-lg ${paymentEligibility.hasAllowance ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          <div className={`w-3 h-3 rounded-full ${paymentEligibility.hasAllowance ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className={`text-sm font-medium ${paymentEligibility.hasAllowance ? 'text-green-800' : 'text-yellow-800'}`}>
                            Approval: {paymentEligibility.hasAllowance ? 'Ready' : 'Required'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wallet Connection or Payment Section */}
            {!walletState ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-30"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg w-fit mx-auto">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-3">
                    Connect Your Wallet
                  </h3>
                  <p className="text-gray-600 text-lg">Choose from your available wallets to connect and make payment</p>
                </div>

                {wallets.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg text-center">
                      {wallets.length} Wallet{wallets.length > 1 ? 's' : ''} Detected
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wallets.map((wallet, index) => (
                        <button
                          key={`${wallet.name}-${index}`}
                          onClick={() => handleWalletConnect(wallet)}
                          disabled={loading}
                          className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center p-2">
                              <img 
                                src={wallet.icon} 
                                alt={`${wallet.name} logo`}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = wallet.name.includes('MetaMask') ? '🦊' : 
                                                     wallet.name.includes('Trust') ? '🛡️' :
                                                     wallet.name.includes('Coinbase') ? '🔵' :
                                                     wallet.name.includes('SafePal') ? '🔐' :
                                                     wallet.name.includes('Exodus') ? '🚀' :
                                                     wallet.name.includes('XDEFI') ? '⚡' :
                                                     wallet.name.includes('Keplr') ? '🌌' :
                                                     wallet.name.includes('Trezor') ? '🔒' :
                                                     wallet.name.includes('Ledger') ? '📱' : '💼';
                                    parent.className = parent.className.replace('p-2', '');
                                    parent.style.fontSize = '24px';
                                  }
                                }}
                              />
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-gray-900 text-lg">{wallet.name}</div>
                              <div className="text-sm text-gray-600">Click to connect</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {connectingWallet === wallet.name && loading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-medium text-blue-600">Connecting...</span>
                              </div>
                            ) : (
                              <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-colors">
                                Connect
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl shadow-lg">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className="font-bold text-yellow-800 mb-3 text-xl">No Wallet Detected</h4>
                    <p className="text-yellow-700 text-lg mb-4">
                      Please install a crypto wallet to continue with the payment.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <span>Install MetaMask</span>
                      </a>
                      <a
                        href="https://trustwallet.com/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <span>Install Trust Wallet</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Contract Payment</h3>
                  <p className="text-gray-600 text-lg">Execute secure payment distribution via smart contract</p>
                </div>
                
                {/* Simplified Payment Buttons - Always Show When Connected */}
                <div className="space-y-4">
                  {/* Balance Check Message */}
                  {parseFloat(usdtBalance) < parseFloat(TOTAL_PAYMENT_AMOUNT) ? (
                    <div className="text-center p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-bold text-red-800">Insufficient USDT Balance</h4>
                      </div>
                      <p className="text-red-700 text-sm">
                        You have {usdtBalance} USDT but need {TOTAL_PAYMENT_AMOUNT} USDT for this payment.
                      </p>
                      <p className="text-red-600 text-xs mt-2">
                        Please add more USDT to your wallet and refresh the page.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Status Message */}
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                        <h4 className="font-bold text-blue-800 mb-2">
                          {paymentEligibility?.hasAllowance ? '✅ Ready for Payment' : '🔄 Approval Required'}
                        </h4>
                        <p className="text-blue-700 text-sm">
                          {paymentEligibility?.hasAllowance 
                            ? 'Your wallet is approved and ready to execute the smart contract payment.'
                            : `First, approve the smart contract to spend ${TOTAL_PAYMENT_AMOUNT} USDT from your wallet.`
                          }
                        </p>
                      </div>
                      
                      {/* Single Smart Payment Button */}
                      <button
                        onClick={paymentEligibility?.hasAllowance ? handleSmartContractPayment : handleApproveUSDT}
                        disabled={loading}
                        className={`w-full relative overflow-hidden flex items-center justify-center space-x-3 px-8 py-5 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                          paymentEligibility?.hasAllowance 
                            ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700'
                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        {loading ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>
                              {paymentEligibility?.hasAllowance ? 'Executing Payment...' : 'Approving USDT...'}
                            </span>
                          </>
                        ) : (
                          <>
                            {paymentEligibility?.hasAllowance ? (
                              <>
                                <Zap className="w-6 h-6" />
                                <span>Execute Payment ({TOTAL_PAYMENT_AMOUNT} USDT)</span>
                              </>
                            ) : (
                              <>
                                <Settings className="w-6 h-6" />
                                <span>Approve & Pay ({TOTAL_PAYMENT_AMOUNT} USDT)</span>
                              </>
                            )}
                          </>
                        )}
                      </button>
                      
                      {/* Approval Success Message */}
                      {approvalHash && !paymentEligibility?.hasAllowance && (
                        <div className="text-center p-3 bg-green-100 rounded-lg">
                          <p className="text-green-800 text-sm">
                            ✅ Approval transaction submitted! Checking status...
                            <a 
                              href={`https://testnet.bscscan.com/tx/${approvalHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 underline hover:text-green-900"
                            >
                              View on BSCScan
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Badge */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/50 rounded-2xl p-6 shadow-lg">
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full -translate-y-10 -translate-x-10"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-emerald-400/10 to-teal-400/10 rounded-full translate-y-8 translate-x-8"></div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800">Smart Contract</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800">BEP-20 USDT</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800">Atomic Execution</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-emerald-700 font-bold text-lg bg-emerald-100 px-4 py-2 rounded-full inline-block">
                🔒 Smart Contract Security • BSC Testnet • Atomic Distribution
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;