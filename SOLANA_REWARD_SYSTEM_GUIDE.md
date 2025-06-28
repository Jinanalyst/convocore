# ConvoAI Solana Token Reward System Guide

## Overview

This guide covers the complete implementation of a Solana-based token reward system for ConvoAI, including token distribution with automatic burning, security measures, testing procedures, and deployment instructions.

## System Architecture

### Core Components

1. **SolanaRewardService** (`src/lib/solana-reward-service.ts`)
   - Handles token distribution and burning
   - Manages rate limiting and daily limits
   - Provides utility methods for balance checking

2. **RewardSecurityService** (`src/lib/reward-security-service.ts`)
   - Fraud detection and prevention
   - User activity monitoring
   - Security event logging

3. **API Routes** (`src/app/api/rewards/route.ts`)
   - RESTful endpoints for reward processing
   - Balance and transaction history queries

### Token Configuration

- **Token Mint**: `DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon`
- **Burn Address**: `11111111111111111111111111111111` (Solana null address)
- **Distribution**: 90% to user, 10% burned automatically

## Environment Setup

### Required Environment Variables

```bash
# Solana Configuration
SOLANA_NETWORK=devnet  # or mainnet-beta
SOLANA_RPC_URL=https://api.devnet.solana.com  # or your preferred RPC

# Treasury Wallet (JSON array of numbers)
TREASURY_PRIVATE_KEY=[123,456,789,...]  # 64 numbers representing private key

# Security (Optional)
BLOCKED_WALLET_ADDRESSES=address1,address2,address3
```

### Treasury Wallet Setup

1. **Generate a new wallet for treasury operations:**
   ```bash
   # Using Solana CLI
   solana-keygen new --outfile treasury-keypair.json
   ```

2. **Convert private key to environment variable format:**
   ```javascript
   const fs = require('fs');
   const keypair = JSON.parse(fs.readFileSync('treasury-keypair.json', 'utf8'));
   console.log(JSON.stringify(keypair));
   ```

3. **Fund the treasury wallet:**
   - Transfer SOL for transaction fees (minimum 0.01 SOL)
   - Transfer ConvoAI tokens for distribution

## Testing on Devnet

### 1. Setup Devnet Environment

```bash
# Set environment variables for devnet
export SOLANA_NETWORK=devnet
export SOLANA_RPC_URL=https://api.devnet.solana.com
export TREASURY_PRIVATE_KEY=[your-treasury-private-key]
```

### 2. Create Test Token on Devnet

```bash
# Create a test SPL token
spl-token create-token --url devnet

# Create token account for treasury
spl-token create-account [TOKEN_MINT_ADDRESS] --url devnet

# Mint test tokens to treasury
spl-token mint [TOKEN_MINT_ADDRESS] 1000000 --url devnet
```

### 3. Test Reward Function

```javascript
// Test script: test-reward-system.js
const { PublicKey } = require('@solana/web3.js');
const { getSolanaRewardService } = require('./src/lib/solana-reward-service');

async function testRewardSystem() {
  const rewardService = getSolanaRewardService();
  
  // Test user wallet (replace with actual test wallet)
  const testUserWallet = new PublicKey('YOUR_TEST_WALLET_ADDRESS');
  
  const rewardRequest = {
    userWalletAddress: testUserWallet,
    rewardAmount: 100,
    conversationId: 'test-conversation-1',
    conversationLength: 150,
    timestamp: Date.now(),
  };
  
  try {
    console.log('Processing test reward...');
    const result = await rewardService.processReward(rewardRequest);
    
    if (result.success) {
      console.log('✅ Reward processed successfully!');
      console.log('User reward amount:', result.userRewardAmount);
      console.log('Burn amount:', result.burnAmount);
      console.log('Transaction signature:', result.userRewardTx);
    } else {
      console.log('❌ Reward processing failed:', result.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRewardSystem();
```

### 4. Test API Endpoints

```bash
# Test reward processing
curl -X POST http://localhost:3000/api/rewards \
  -H "Content-Type: application/json" \
  -d '{
    "userWalletAddress": "YOUR_TEST_WALLET_ADDRESS",
    "rewardAmount": 100,
    "conversationId": "test-conv-1",
    "conversationLength": 150
  }'

# Test balance query
curl "http://localhost:3000/api/rewards?userWalletAddress=YOUR_TEST_WALLET_ADDRESS&action=balance"

# Test daily limit query
curl "http://localhost:3000/api/rewards?userWalletAddress=YOUR_TEST_WALLET_ADDRESS&action=daily-limit"
```

## Security Best Practices

### 1. Treasury Wallet Security

**Critical Security Measures:**
- Store private key securely (use hardware wallets for production)
- Use environment variables, never commit private keys to code
- Implement multi-signature wallets for large operations
- Regular key rotation and monitoring

**Recommended Setup:**
```bash
# Use hardware wallet or secure key management
# Example with Ledger:
solana config set --keypair usb://ledger

# Or use secure environment variable management
# (AWS Secrets Manager, HashiCorp Vault, etc.)
```

### 2. Rate Limiting and Abuse Prevention

The system includes multiple layers of protection:

- **Rate Limiting**: Max 10 requests per minute per user
- **Daily Limits**: Configurable maximum rewards per day
- **Fraud Detection**: Pattern analysis and risk scoring
- **IP Monitoring**: Track suspicious IP addresses
- **Wallet History**: Analyze transaction patterns

### 3. Monitoring and Alerting

```javascript
// Example monitoring setup
const { getRewardSecurityService } = require('./src/lib/reward-security-service');

// Monitor security events
setInterval(() => {
  const securityService = getRewardSecurityService();
  const stats = securityService.getSecurityStats();
  
  if (stats.fraudRate > 5) {
    // Send alert
    console.log('🚨 High fraud rate detected:', stats.fraudRate + '%');
  }
  
  if (stats.blockedAddresses > 10) {
    console.log('⚠️ Multiple addresses blocked:', stats.blockedAddresses);
  }
}, 60000); // Check every minute
```

### 4. Transaction Monitoring

```javascript
// Monitor treasury balance
async function monitorTreasuryBalance() {
  const rewardService = getSolanaRewardService();
  const balance = await rewardService.getTreasuryBalance();
  
  if (balance.sol < 0.005) { // Less than 0.005 SOL
    console.log('⚠️ Low SOL balance in treasury:', balance.sol);
  }
  
  if (balance.tokens < 1000) { // Less than 1000 tokens
    console.log('⚠️ Low token balance in treasury:', balance.tokens);
  }
}

// Run monitoring every 5 minutes
setInterval(monitorTreasuryBalance, 5 * 60 * 1000);
```

## Production Deployment

### 1. Pre-deployment Checklist

- [ ] Treasury wallet funded with sufficient SOL and tokens
- [ ] Environment variables configured for mainnet
- [ ] Security monitoring set up
- [ ] Backup and recovery procedures established
- [ ] Rate limiting configured appropriately
- [ ] Logging and alerting systems active

### 2. Deployment Steps

```bash
# 1. Set production environment variables
export SOLANA_NETWORK=mainnet-beta
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
export TREASURY_PRIVATE_KEY=[production-private-key]

# 2. Build and deploy
npm run build
npm start

# 3. Verify deployment
curl "https://your-domain.com/api/rewards?action=treasury-balance"
```

### 3. Production Monitoring

**Essential Metrics to Monitor:**
- Treasury SOL and token balances
- Reward transaction success rates
- Fraud detection alerts
- API response times
- Error rates and types

**Recommended Tools:**
- Application Performance Monitoring (APM)
- Log aggregation (ELK stack, Datadog)
- Alert management (PagerDuty, OpsGenie)
- Blockchain monitoring (Solana Beach, Solscan)

## API Reference

### POST /api/rewards

Process a token reward for a user.

**Request Body:**
```json
{
  "userWalletAddress": "string",
  "rewardAmount": "number",
  "conversationId": "string",
  "conversationLength": "number",
  "timestamp": "number (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reward processed successfully",
  "data": {
    "userRewardAmount": 90,
    "burnAmount": 10,
    "userRewardTx": "transaction_signature",
    "burnTx": "transaction_signature"
  }
}
```

### GET /api/rewards

Query reward-related information.

**Query Parameters:**
- `userWalletAddress` (required): User's wallet address
- `action` (required): One of `balance`, `daily-limit`, `treasury-balance`, `transaction-history`
- `limit` (optional): Number of transactions to return (default: 10)

**Example:**
```bash
GET /api/rewards?userWalletAddress=ABC123&action=balance
```

## Troubleshooting

### Common Issues

1. **Insufficient SOL Balance**
   - Error: "Treasury wallet has insufficient SOL balance"
   - Solution: Fund treasury wallet with more SOL for transaction fees

2. **Token Account Not Found**
   - Error: "Treasury wallet does not have an associated token account"
   - Solution: Create associated token account for ConvoAI tokens

3. **Rate Limiting**
   - Error: "Rate limit exceeded"
   - Solution: Wait before making another request or adjust rate limits

4. **Daily Limit Exceeded**
   - Error: "Daily reward limit exceeded"
   - Solution: Wait until next day or adjust daily limits

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG_SOLANA_REWARDS=true
```

This will provide detailed transaction logs and error information.

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Weekly:**
   - Review security events and blocked addresses
   - Monitor treasury balance and refill if needed
   - Check fraud detection statistics

2. **Monthly:**
   - Review and update rate limiting rules
   - Analyze user activity patterns
   - Update blocked address list

3. **Quarterly:**
   - Security audit and penetration testing
   - Update dependencies and security patches
   - Review and optimize gas usage

### Emergency Procedures

1. **Treasury Compromise:**
   - Immediately block all reward processing
   - Transfer remaining funds to new secure wallet
   - Update environment variables
   - Notify stakeholders

2. **System Overload:**
   - Temporarily reduce rate limits
   - Scale up infrastructure
   - Monitor for abuse patterns

3. **Token Supply Issues:**
   - Pause reward distribution
   - Assess treasury token balance
   - Implement emergency token minting if authorized

## Support and Resources

- **Solana Documentation**: https://docs.solana.com/
- **SPL Token Documentation**: https://spl.solana.com/token
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Community Support**: Solana Discord, Stack Overflow

---

**Important Security Note**: This system handles real financial transactions. Always test thoroughly on devnet before deploying to mainnet, and implement proper security measures for production use. 