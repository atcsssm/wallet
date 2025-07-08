import React from 'react';
import { CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import { TransactionDetails } from '../types';

interface PaymentSuccessProps {
  transactions: TransactionDetails[];
  onBackToPayment: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ transactions, onBackToPayment }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
          <div className="text-center mb-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 text-xl">Your payment has been processed successfully and securely.</p>
        </div>
        
          <div className="space-y-6 mb-10">
          {transactions.map((tx, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span>Transaction {index + 1}</span>
                  </h3>
                <a
                  href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 rounded-xl transition-colors font-medium"
                >
                    <span className="text-sm">View on BSCScan</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-xl">
                    <span className="text-gray-600 font-medium block mb-1">Hash:</span>
                    <span className="font-mono text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </span>
                </div>
                  <div className="bg-white p-3 rounded-xl">
                    <span className="text-gray-600 font-medium block mb-1">From:</span>
                    <span className="font-mono text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded">
                      {tx.from.slice(0, 10)}...{tx.from.slice(-8)}
                    </span>
                </div>
                  <div className="bg-white p-3 rounded-xl">
                    <span className="text-gray-600 font-medium block mb-1">To:</span>
                    <span className="font-mono text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded">
                      {tx.to.slice(0, 10)}...{tx.to.slice(-8)}
                    </span>
                </div>
                  <div className="bg-white p-3 rounded-xl">
                    <span className="text-gray-600 font-medium block mb-1">Amount:</span>
                    <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                      {tx.amount} USDT
                    </span>
                </div>
                  <div className="bg-white p-3 rounded-xl md:col-span-2">
                    <span className="text-gray-600 font-medium block mb-1">Time:</span>
                    <span className="text-gray-900 font-medium">{tx.timestamp.toLocaleString()}</span>
                  </div>
                </div>
              </div>
          ))}
        </div>
        
          <div className="text-center">
          <button
            onClick={onBackToPayment}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
              <ArrowLeft className="w-5 h-5" />
            <span>Back to Payment</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;