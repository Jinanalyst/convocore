# Multi-Network USDT Payment System - Setup Guide

## Overview

ConvoCore now supports USDT payments across multiple blockchain networks, providing users with flexible payment options for subscription plans.

## Supported Payment Methods

### 1. PayPal
- **Payment Method**: PayPal Checkout
- **Supported**: Credit Cards, Debit Cards, PayPal Balance, Bank Transfers
- **Currency**: USD
- **Pro Plan**: $20 USD/month
- **Premium Plan**: $40 USD/month
- **Processing**: Instant
- **Status**: ✅ Active

### 2. TRON Network
- **Network**: TRON
- **Token**: USDT (TRC20)
- **Recipient Address**: `TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ`
- **Contract Address**: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- **Wallet Support**: TronLink
- **Status**: ✅ Active

### 3. Ethereum Network
- **Network**: Ethereum Mainnet
- **Token**: USDT (ERC20)
- **Recipient Address**: `0x7a459149d910087d358cb46a9f70fd650738f446`
- **Contract Address**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Wallet Support**: MetaMask, Coinbase Wallet, WalletConnect
- **Status**: ✅ Active

### 4. BNB Smart Chain
- **Network**: BNB Smart Chain (BSC)
- **Token**: USDT (BEP20)
- **Recipient Address**: `0x7a459149d910087d358cb46a9f70fd650738f446`
- **Contract Address**: `0x55d398326f99059fF775485246999027B3197955`
- **Wallet Support**: MetaMask, Trust Wallet, Binance Wallet
- **Status**: ✅ Active

### 5. Polygon Network
- **Network**: Polygon (MATIC)
- **Token**: USDT (Polygon)
- **Recipient Address**: `0x7a459149d910087d358cb46a9f70fd650738f446`
- **Contract Address**: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- **Wallet Support**: MetaMask, Coinbase Wallet
- **Status**: ✅ Active

### 6. Solana Network
- **Network**: Solana
- **Token**: USDT (SPL)
- **Recipient Address**: `2zmewxtyL83t6WLkSPpQtdDiK5Nmd5KSn71HKC7TEGcU`
- **Contract Address**: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`
- **Wallet Support**: Phantom, Solflare
- **Status**: 🟡 Coming Soon

## Subscription Plans

### Pro Plan
- **PayPal Price**: $20 USD/month
- **USDT Price**: 20 USDT/month
- **Billing**: Monthly
- **Features**: Unlimited AI requests, API access, advanced models

### Premium Plan
- **PayPal Price**: $40 USD/month
- **USDT Price**: 40 USDT/month
- **Billing**: Monthly
- **Features**: Everything in Pro + priority support, custom agents

## Authentication & Payment Integration

### Google Users
ConvoCore fully supports Google authentication with USDT payments:

**Authentication Benefits:**
- Secure Google OAuth integration
- Easy account recovery and management
- Subscription linked to your Google account
- Access from any device with your Google account

**Payment Process for Google Users:**
1. **Sign in with Google** (if not already signed in)
2. **Access billing** from profile menu or pricing page
3. **Select your plan** (Pro or Premium)
4. **Choose payment method**:
   - **PayPal**: Credit cards, debit cards, PayPal balance
   - **USDT**: Choose network (TRON, Ethereum, BSC, or Polygon)
5. **Complete payment**:
   - **PayPal**: Redirected to secure PayPal checkout
   - **USDT**: Connect crypto wallet and confirm transaction
6. **Subscription activated** and linked to your Google account

**Key Features:**
- Your subscription is permanently linked to your Google account
- You can pay from any crypto wallet you own
- Access your subscription from any device after Google login
- Payment history is saved to your Google account profile

## Payment Process

### For Wallet Users
1. **Connect wallet** during login (TronLink, MetaMask, etc.)
2. **Select plan** from pricing page
3. **Choose network** and complete USDT payment
4. **Subscription activated** and linked to your wallet

### Automated Payment (General)
1. Visit the pricing page or billing modal
2. Select your desired plan (Pro or Premium)
3. Choose your preferred blockchain network
4. Connect your wallet (MetaMask, TronLink, etc.)
5. Confirm the payment transaction
6. Your subscription will be activated automatically

### Manual Payment (Alternative)
If you prefer to send USDT manually:

1. Send the exact amount to the recipient address for your chosen network
2. Include your user ID or email in the transaction memo (if supported)
3. Contact support with your transaction hash for manual verification

## Wallet Setup Instructions

### MetaMask (Ethereum, BSC, Polygon)
1. Install MetaMask browser extension
2. Create or import your wallet
3. Add the required network if not already present
4. Ensure you have USDT tokens and native tokens for gas fees

### TronLink (TRON)
1. Install TronLink browser extension
2. Create or import your wallet
3. Ensure you have USDT (TRC20) and TRX for energy/bandwidth

### Phantom (Solana - Coming Soon)
1. Install Phantom browser extension
2. Create or import your wallet
3. Ensure you have USDT (SPL) and SOL for transaction fees

## Network Configuration

### Adding Networks to MetaMask

#### BNB Smart Chain
- Network Name: BNB Smart Chain
- RPC URL: https://bsc-dataseed1.binance.org
- Chain ID: 56
- Symbol: BNB
- Block Explorer: https://bscscan.com

#### Polygon
- Network Name: Polygon
- RPC URL: https://polygon-rpc.com
- Chain ID: 137
- Symbol: MATIC
- Block Explorer: https://polygonscan.com

## Gas Fees & Requirements

### Ethereum
- Gas fees: Variable (typically $5-50 depending on network congestion)
- Required: ETH for gas fees + USDT for payment

### BNB Smart Chain
- Gas fees: ~$0.10-1.00
- Required: BNB for gas fees + USDT for payment

### Polygon
- Gas fees: ~$0.01-0.10
- Required: MATIC for gas fees + USDT for payment

### TRON
- Energy/Bandwidth: ~1-5 TRX
- Required: TRX for energy + USDT for payment

## Security Features

- **Multi-signature**: All recipient addresses are secured
- **Transaction verification**: Automatic blockchain verification
- **Payment tracking**: Complete transaction history
- **Refund protection**: Payments are tracked and verifiable

## Troubleshooting

### Common Issues

1. **Transaction Failed**
   - Check you have sufficient gas/energy
   - Verify the recipient address is correct
   - Ensure you're on the correct network

2. **Payment Not Recognized**
   - Wait for blockchain confirmation (1-10 minutes)
   - Check transaction status on block explorer
   - Contact support with transaction hash

3. **Wallet Not Connecting**
   - Refresh the page and try again
   - Check wallet extension is unlocked
   - Ensure you're on the correct network

### Support

For payment issues:
- Email: support@convocore.site
- Include: Transaction hash, wallet address, network used
- Response time: 1-4 hours

## Development Notes

### Environment Variables
```env
# TRON
NEXT_PUBLIC_TRON_RECIPIENT_ADDRESS=TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ

# Ethereum/BSC/Polygon
NEXT_PUBLIC_EVM_RECIPIENT_ADDRESS=0x7a459149d910087d358cb46a9f70fd650738f446

# Solana
NEXT_PUBLIC_SOLANA_RECIPIENT_ADDRESS=2zmewxtyL83t6WLkSPpQtdDiK5Nmd5KSn71HKC7TEGcU
```

### API Integration
The payment system includes:
- Real-time transaction monitoring
- Automatic subscription activation
- Payment history tracking
- Multi-network support
- Wallet integration

## Roadmap

### Phase 1 (Current)
- ✅ TRON Network
- ✅ Ethereum Network
- ✅ BNB Smart Chain
- ✅ Polygon Network

### Phase 2 (Coming Soon)
- 🟡 Solana Network
- 🟡 Arbitrum Network
- 🟡 Optimism Network

### Phase 3 (Future)
- 🔄 Avalanche Network
- 🔄 Fantom Network
- 🔄 Automatic recurring payments
- 🔄 Subscription management API

## Compliance

- All payments are tracked for compliance
- Transaction records are maintained
- KYC/AML procedures may apply for large transactions
- Tax reporting assistance available upon request

---

**Note**: This payment system is designed for subscription payments only. For refunds or disputes, please contact our support team with your transaction details. 