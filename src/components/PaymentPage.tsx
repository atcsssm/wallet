import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, Loader2, DollarSign, Wallet, Copy, ExternalLink, Shield, Lock, Eye, Sparkles } from 'lucide-react';
import { WalletInfo, WalletState, TransactionDetails } from '../types';
import { detectWallets, connectWallet, getUSDTBalance, executePayment } from '../utils/wallet';
import { PAYMENT_DISTRIBUTIONS, TOTAL_PAYMENT_AMOUNT } from '../config/constants';
import PaymentSuccess from './PaymentSuccess';

const PaymentPage: React.FC = () => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const detectedWallets = detectWallets();
    setWallets(detectedWallets);
  }, []);

  useEffect(() => {
    if (walletState?.provider && walletState.address) {
      loadUSDTBalance();
    }
  }, [walletState]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);
  const loadUSDTBalance = async () => {
    if (!walletState?.provider || !walletState.address) return;
    
    try {
      const balance = await getUSDTBalance(walletState.provider, walletState.address);
      setUsdtBalance(balance);
    } catch (error) {
      console.error('Failed to load USDT balance:', error);
    }
  };

  const handleWalletConnect = async (wallet: WalletInfo) => {
    setLoading(true);
    setError(null);
    
    try {
      const connected = await connectWallet(wallet);
      setWalletState(connected);
    } catch (error: any) {
      // User-friendly error messages
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
    }
  };

  const handleDisconnect = () => {
    setWalletState(null);
    setUsdtBalance('0');
    setError(null);
  };

  const handlePayment = async () => {
    if (!walletState?.provider) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if user has enough USDT balance
      const currentBalance = parseFloat(usdtBalance);
      const requiredAmount = parseFloat(TOTAL_PAYMENT_AMOUNT);
      
      if (currentBalance < requiredAmount) {
        throw new Error(`You need ${TOTAL_PAYMENT_AMOUNT} USDT to complete this payment. Your current balance is ${usdtBalance} USDT.`);
      }

      // Additional validation
      if (!walletState.address) {
        throw new Error('Your wallet connection was lost. Please reconnect and try again.');
      }

      // Check if still connected to correct network
      try {
        const network = await walletState.provider.getNetwork();
        if (network.chainId !== 97n) { // BSC Testnet chain ID as BigInt
          throw new Error('Please switch to BSC Testnet network in your wallet and try again.');
        }
      } catch (networkError: any) {
        if (networkError.message.includes('switch to BSC Testnet')) {
          throw networkError;
        }
        console.warn('Could not verify network:', networkError);
      }
      
      const txs = await executePayment(walletState.provider, PAYMENT_DISTRIBUTIONS);
      
      const transactionDetails: TransactionDetails[] = txs.map((tx, index) => ({
        hash: tx.hash,
        from: walletState.address,
        to: PAYMENT_DISTRIBUTIONS[index].address,
        amount: PAYMENT_DISTRIBUTIONS[index].amount,
        timestamp: new Date(),
        distributions: PAYMENT_DISTRIBUTIONS
      }));
      
      setTransactions(transactionDetails);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Payment could not be completed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('You need') || error.message.includes('Your wallet connection') || error.message.includes('Please switch to BSC Testnet')) {
          errorMessage = error.message;
        } else if (error.message.includes('rejected') || error.message.includes('cancelled')) {
          errorMessage = 'Payment was cancelled. You can try again when ready.';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'You don\'t have enough BNB to pay for transaction fees. Please add some BNB to your wallet.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        }
      } else if (error.code === 4001) {
        errorMessage = 'Payment was cancelled. You can try again when ready.';
      } else if (error.code === -32002) {
        errorMessage = 'A payment request is already pending in your wallet. Please check your wallet app.';
      } else if (error.code === -32603) {
        errorMessage = 'Wallet error occurred. Please refresh the page and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPayment = () => {
    setShowSuccess(false);
    setTransactions([]);
    loadUSDTBalance(); // Refresh balance after payment
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
    return <PaymentSuccess transactions={transactions} onBackToPayment={handleBackToPayment} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      {/* Fixed Position Error Message */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-2xl p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-red-800 text-lg">Oops! Something went wrong</h4>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-800 font-bold text-xl leading-none"
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                <p className="text-red-700">{error}</p>
                {error.includes('USDT') && (
                  <p className="text-red-600 text-sm mt-3 bg-red-100 p-3 rounded-lg">
                    💡 Tip: Make sure you have enough USDT and BNB for gas fees in your wallet.
                  </p>
                )}
                {error.includes('network') && (
                  <p className="text-red-600 text-sm mt-3 bg-red-100 p-3 rounded-lg">
                    💡 Tip: Check your internet connection and wallet network settings.
                  </p>
                )}
                {error.includes('rejected') && (
                  <p className="text-red-600 text-sm mt-3 bg-red-100 p-3 rounded-lg">
                    💡 Tip: You can try the payment again when ready.
                  </p>
                )}
                <div className="mt-3 text-xs text-red-500">
                  This message will disappear in 5 seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Secure Payment Portal
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Complete your cryptocurrency payment with enterprise-grade security
          </p>
        </div>


        {/* Main Payment Card - Single Grid */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Payment Amount */}
            <div className="space-y-6">
              {/* Payment Amount Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/50 rounded-2xl p-6 shadow-lg">
                {/* Background decoration */}
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
                      Payment Amount
                    </h3>
                    <Sparkles className="w-4 h-4 text-green-600" />
                  </div>
                  
                  <div className="relative">
                    <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">
                      {TOTAL_PAYMENT_AMOUNT}
                    </div>
                    <div className="text-xl font-bold text-green-700 tracking-wide">
                      USDT
                    </div>
                  </div>
                  
                  <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-800 font-medium text-sm">Smart Contract Payment</span>
                  </div>
                </div>
              </div>

              {/* Connected Wallet Details */}
              {walletState && (
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-2xl p-6 shadow-lg">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-10 translate-x-10"></div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-blue-900 text-lg">Wallet Connected</span>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                      >
                        Disconnect
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Address:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                            {truncateAddress(walletState.address)}
                          </span>
                          <button
                            onClick={copyAddress}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Copy address"
                          >
                            <Copy className="w-4 h-4 text-blue-600" />
                          </button>
                          <a
                            href={`https://testnet.bscscan.com/address/${walletState.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View on BSCScan"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">BNB Balance:</span>
                        <span className="text-sm font-bold text-gray-900 bg-yellow-100 px-2 py-1 rounded-lg">
                          {parseFloat(walletState.balance).toFixed(4)} BNB
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">USDT Balance:</span>
                        <span className="text-sm font-bold text-gray-900 bg-green-100 px-2 py-1 rounded-lg">
                          {usdtBalance} USDT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Wallet Connection */}
            <div className="space-y-6">
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
                    <p className="text-gray-600 text-lg">Choose a wallet to connect and make your payment</p>
                  </div>

                  {wallets.filter(w => w.installed).length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 text-lg">Available Wallets</h4>
                      {wallets.filter(w => w.installed).map((wallet) => (
                        <button
                          key={wallet.name}
                          onClick={() => handleWalletConnect(wallet)}
                          disabled={loading}
                          className="w-full flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center p-2">
                              <img 
                                src={wallet.icon} 
                                alt={`${wallet.name} logo`}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  // Fallback to emoji if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = wallet.name === 'MetaMask' ? '🦊' : '🛡️';
                                    parent.className = parent.className.replace('p-2', '');
                                    parent.style.fontSize = '24px';
                                  }
                                }}
                              />
                            </div>
                            <span className="font-bold text-gray-900 text-lg">{wallet.name}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                              <span className="text-sm font-bold">Connect</span>
                            </div>
                            {loading && (
                              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl shadow-lg">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h4 className="font-bold text-yellow-800 mb-3 text-xl">No Wallet Detected</h4>
                      <p className="text-yellow-700 text-lg mb-4">
                        Please install a crypto wallet like MetaMask or Trust Wallet to continue.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                          href="https://metamask.io/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <img 
                            src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
                            alt="MetaMask"
                            className="w-5 h-5"
                          />
                          <span>Install MetaMask</span>
                        </a>
                        <a
                          href="https://trustwallet.com/download"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <img 
                            src="https://trustwallet.com/assets/images/media/assets/trust_platform.svg" 
                            alt="Trust Wallet"
                            className="w-5 h-5"
                          />
                          <span>Install Trust Wallet</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Pay</h3>
                    <p className="text-gray-600 text-lg">Review the payment details and confirm your transaction</p>
                  </div>
                  
                  <button
                    onClick={handlePayment}
                    disabled={loading || parseFloat(usdtBalance) < parseFloat(TOTAL_PAYMENT_AMOUNT)}
                    className="w-full relative overflow-hidden flex items-center justify-center space-x-3 px-8 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-6 h-6" />
                        <span>Pay {TOTAL_PAYMENT_AMOUNT} USDT</span>
                      </>
                    )}
                  </button>
                  
                  {parseFloat(usdtBalance) < parseFloat(TOTAL_PAYMENT_AMOUNT) && (
                    <div className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-800 font-medium">Insufficient USDT balance</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Badge - Fixed Mobile Issue */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/50 rounded-2xl p-6 shadow-lg">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full -translate-y-16 -translate-x-8 sm:-translate-x-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-emerald-400/10 to-teal-400/10 rounded-full translate-y-12 translate-x-8 sm:translate-x-12"></div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800">SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800">Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-emerald-800">VPN Protected</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-emerald-700 font-bold text-lg bg-emerald-100 px-4 py-2 rounded-full inline-block">
                🔒 Enterprise-Grade Security • VPN Protected • 100% Safe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;