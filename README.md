# Smart Contract Payment Portal

A secure BEP-20 USDT payment distribution system built with React, TypeScript, and Solidity smart contracts on Binance Smart Chain Testnet.

## 🚀 Features

### Smart Contract Integration
- **Atomic Payment Distribution**: Single transaction distributes 6 USDT to 3 recipients
- **BEP-20 USDT Support**: Native support for Binance Smart Chain USDT tokens
- **Gas Optimization**: Efficient smart contract execution reduces transaction costs
- **Security**: Immutable payment logic with built-in safety checks

### Multi-Wallet Support
- **Comprehensive Detection**: Supports MetaMask, Trust Wallet, Coinbase Wallet, SafePal, Exodus, XDEFI, Keplr, Trezor, Ledger, and more
- **Individual Connection**: Each wallet has its own connect button
- **Provider Selection**: Intelligent provider selection for multiple wallet scenarios
- **Network Management**: Automatic BSC Testnet switching and addition

### Payment Distribution
- **Fixed Distribution**: 6 USDT total split as:
  - Recipient 1: 1 USDT (16.7%)
  - Recipient 2: 2 USDT (33.3%)
  - Recipient 3: 3 USDT (50%)
- **Two-Step Process**: USDT approval followed by smart contract execution
- **Real-time Validation**: Balance and allowance checking before execution

### User Experience
- **Professional UI**: Modern gradient design with responsive layout
- **Step-by-Step Flow**: Clear guidance through approval and payment process
- **Transaction Details**: Comprehensive success page with BSCScan links
- **Error Handling**: User-friendly error messages and recovery suggestions

## 🛠 Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Blockchain**: Ethers.js v6, Binance Smart Chain Testnet
- **Smart Contract**: Solidity ^0.8.19
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js 16+ and npm
- Crypto wallet (MetaMask, Trust Wallet, etc.)
- BSC Testnet BNB for gas fees
- BSC Testnet USDT tokens

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd smart-contract-payment-portal
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Deploy Smart Contract**
   - Deploy `PaymentDistributor.sol` to BSC Testnet
   - Update `PAYMENT_DISTRIBUTOR_ADDRESS` in `src/config/constants.ts`

4. **Connect Wallet**
   - Install a supported wallet extension
   - Switch to BSC Testnet
   - Ensure you have BNB and USDT

## 🔧 Smart Contract

### PaymentDistributor.sol
```solidity
// Key features:
- Fixed recipient addresses and amounts
- USDT allowance validation
- Atomic distribution execution
- Event emission for tracking
- Owner-only recipient updates
```

### Contract Functions
- `distributePayment()`: Execute payment distribution
- `getRecipients()`: Get recipient details
- `canUserPay()`: Check user eligibility
- `getTotalAmount()`: Get required payment amount

## 🌐 Network Configuration

### BSC Testnet
- **Chain ID**: 97
- **RPC URLs**: 
  - https://data-seed-prebsc-1-s1.binance.org:8545/
  - https://data-seed-prebsc-2-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com/
- **USDT Contract**: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd

## 💳 Payment Flow

1. **Wallet Connection**: User connects their preferred wallet
2. **Network Check**: Automatic BSC Testnet switching
3. **Balance Validation**: Check USDT balance and BNB for gas
4. **USDT Approval**: User approves smart contract spending
5. **Payment Execution**: Smart contract distributes to all recipients
6. **Success Confirmation**: Transaction details and BSCScan links

## 🔒 Security Features

- **Smart Contract Validation**: Pre-execution balance and allowance checks
- **Network Verification**: Ensures BSC Testnet connection
- **Error Handling**: Comprehensive error catching and user feedback
- **Transaction Confirmation**: Wait for blockchain confirmation
- **Address Validation**: Checksum validation for all addresses

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Perfect layout for tablets
- **Desktop Enhanced**: Full-featured desktop experience
- **Cross-Browser**: Compatible with all modern browsers

## 🎨 UI Components

- **Gradient Backgrounds**: Modern visual appeal
- **Interactive Elements**: Hover states and micro-interactions
- **Loading States**: Clear feedback during operations
- **Status Indicators**: Real-time payment eligibility status
- **Professional Typography**: Readable fonts with proper hierarchy

## 🚀 Deployment

The application is deployed on Netlify and can be accessed at:
https://scintillating-rugelach-65d309.netlify.app

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the smart contract code

---

**Note**: This is a testnet application. Do not use real funds or deploy to mainnet without proper security audits.