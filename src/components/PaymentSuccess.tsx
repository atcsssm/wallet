import React from 'react';
import { CheckCircle, ExternalLink, ArrowLeft, Copy, DollarSign, Hash, Clock, Wallet, Users, Zap } from 'lucide-react';
import { TransactionDetails } from '../types';

interface PaymentSuccessProps {
  transactions: TransactionDetails[];
  onBackToPayment: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ transactions, onBackToPayment }) => {
  const mainTransaction = transactions[0];
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const totalAmount = mainTransaction?.distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Payment Successful!
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 font-medium">
              Your {mainTransaction?.isSmartContract ? 'smart contract' : 'wallet'} payment has been processed successfully
            </p>
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-green-100 border border-green-300 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-bold text-lg">Transaction Confirmed</span>
            </div>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Summary</h2>
            <p className="text-gray-600 text-lg">Complete breakdown of your transaction</p>
          </div>

          {/* Total Amount */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-sm font-medium text-green-700 mb-2">Total Amount Paid</div>
              <div className="text-4xl md:text-5xl font-black text-green-600 mb-2">
                {totalAmount.toFixed(2)} USDT
              </div>
              <div className="text-green-700 font-medium">
                via {mainTransaction?.isSmartContract ? 'Smart Contract' : mainTransaction?.walletName || 'Wallet'}
              </div>
            </div>
          </div>

          {/* Distribution Breakdown */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Payment Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mainTransaction?.distributions.map((dist, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">{dist.amount} USDT</div>
                    <div className="text-sm font-medium text-blue-700 mb-2">{dist.label || `Recipient ${index + 1}`}</div>
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {dist.percentage}
                    </div>
                    <div className="mt-3 text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded">
                      {truncateAddress(dist.address)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Contract Badge */}
          {mainTransaction?.isSmartContract && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <Zap className="w-6 h-6 text-purple-600" />
                <span className="text-purple-800 font-bold text-lg">Smart Contract Execution</span>
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-center text-purple-700 text-sm mt-2">
                Both {mainTransaction.distributions.length} recipients paid atomically in a single transaction
              </div>
            </div>
          )}
        </div>

        {/* Transaction Details Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-2xl shadow-lg">
                  <Hash className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Transaction Details</h2>
            <p className="text-gray-600 text-lg">Complete transaction information</p>
          </div>

          <div className="space-y-6">
            {/* Transaction Hash */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Hash className="w-6 h-6 text-indigo-600" />
                  <span className="text-lg font-bold text-gray-900">Transaction Hash</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(mainTransaction?.hash || '')}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Copy hash"
                  >
                    <Copy className="w-4 h-4 text-indigo-600" />
                  </button>
                  <a
                    href={`https://testnet.bscscan.com/tx/${mainTransaction?.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 hover:text-indigo-800 rounded-lg transition-colors font-medium"
                  >
                    <span className="text-sm">View on BSCScan</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="font-mono text-sm bg-white p-4 rounded-lg border">
                <span className="text-gray-900 break-all">{mainTransaction?.hash}</span>
              </div>
            </div>

            {/* Transaction Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Address */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Wallet className="w-6 h-6 text-green-600" />
                  <span className="text-lg font-bold text-gray-900">From Address</span>
                </div>
                <div className="space-y-3">
                  <div className="font-mono text-sm bg-white p-3 rounded-lg border break-all">
                    {mainTransaction?.from}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-medium text-sm">
                      Wallet: {mainTransaction?.walletName || 'Unknown'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(mainTransaction?.from || '')}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      <Copy className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* To Address */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-bold text-gray-900">
                    {mainTransaction?.isSmartContract ? 'Smart Contract' : 'To Address'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="font-mono text-sm bg-white p-3 rounded-lg border break-all">
                    {mainTransaction?.isSmartContract ? 'Smart Contract Distribution' : mainTransaction?.to}
                  </div>
                  <div className="text-blue-700 font-medium text-sm">
                    {mainTransaction?.isSmartContract ? 
                      `${mainTransaction.distributions.length} Recipients` : 
                      'Direct Transfer'
                    }
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-600">
                    {totalAmount.toFixed(2)} USDT
                  </div>
                  <div className="text-purple-700 text-sm">
                    BEP-20 Token on BSC Testnet
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <span className="text-lg font-bold text-gray-900">Transaction Time</span>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-bold text-orange-600">
                    {mainTransaction?.timestamp.toLocaleString()}
                  </div>
                  <div className="text-orange-700 text-sm">
                    {mainTransaction?.timestamp.toLocaleDateString()} at {mainTransaction?.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Gas Information */}
            {mainTransaction?.gasUsed && (
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-6 h-6 text-teal-600" />
                  <span className="text-lg font-bold text-gray-900">Gas Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-teal-700 font-medium mb-1">Gas Used</div>
                    <div className="text-xl font-bold text-teal-600">
                      {parseInt(mainTransaction.gasUsed).toLocaleString()}
                    </div>
                  </div>
                  {mainTransaction.blockNumber && (
                    <div>
                      <div className="text-sm text-teal-700 font-medium mb-1">Block Number</div>
                      <div className="text-xl font-bold text-teal-600">
                        {mainTransaction.blockNumber.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={onBackToPayment}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Make Another Payment</span>
          </button>
          
          <div className="text-gray-600 text-sm">
            Need help? Contact our support team for assistance.
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="text-center">
            <div className="text-amber-800 font-bold text-lg mb-2">🔒 Transaction Security</div>
            <p className="text-amber-700 text-sm">
              This transaction has been permanently recorded on the Binance Smart Chain Testnet blockchain. 
              All payment distributions are immutable and verifiable through the BSCScan explorer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;