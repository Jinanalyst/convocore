# ConvoAI Premium Plan Reward Payout System

## Overview

This system provides a production-ready Solana blockchain integration for ConvoAI's premium plan reward payouts. It handles token distribution with automatic burning, ensuring secure and efficient reward processing on Solana mainnet.

## System Features

- **Token Distribution**: 90% to user, 10% automatically burned
- **Mainnet Ready**: Full Solana mainnet integration
- **Security**: Comprehensive validation and error handling
- **Logging**: Detailed transaction logs and monitoring
- **Flexible**: Configurable reward amounts and distribution ratios

## Token Configuration

- **Token**: CONVO (SPL token)
- **Mint Address**: `DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon`
- **Decimals**: 6
- **Burn Address**: `11111111111111111111111111111111` (Solana null address)

## Quick Start

### 1. Installation

The system uses existing dependencies in your project:
- `@solana/web3.js`
- `@solana/spl-token`

### 2. Basic Usage

```typescript
import { processConvoAIRewardPayout } from './src/lib/convoai-reward-payout';
import { PublicKey, Keypair } from '@solana/web3.js';

// Load treasury wallet from secure storage
const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
const treasuryWallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(treasuryPrivateKey)));

// User wallet
const userWallet = new PublicKey('6U7WS5pGJX6DGHdR8RC5QbXBx1n3Q6HupaeQtZEpsCoM');

// 100,000 CONVO tokens (with 6 decimals)
const totalRewardAmount = 100000 * Math.pow(10, 6);

const request = {
  userWalletAddress: userWallet,
  totalRewardAmount,
  conversationId: 'premium-conversation-123',
  treasuryWallet,
  rpcUrl: 'https://api.mainnet-beta.solana.com'
};

const result = await processConvoAIRewardPayout(request);

if (result.success) {
  console.log('Reward paid:', result.userRewardAmount / Math.pow(10, 6), 'CONVO');
  console.log('Burned:', result.burnAmount / Math.pow(10, 6), 'CONVO');
  console.log('Transaction:', result.userRewardTx);
} else {
  console.error('Payout failed:', result.error);
}
```

## API Reference

### `processConvoAIRewardPayout(request: RewardPayoutRequest): Promise<RewardPayoutResult>`

Main function for processing reward payouts.

#### Parameters

```typescript
interface RewardPayoutRequest {
  userWalletAddress: PublicKey;    // User's wallet address
  totalRewardAmount: number;       // Total reward in base units (with decimals)
  conversationId: string;          // Unique conversation identifier
  treasuryWallet: Keypair;         // Treasury wallet keypair
  rpcUrl?: string;                 // Optional custom RPC URL
}
```

#### Returns

```typescript
interface RewardPayoutResult {
  success: boolean;                // Whether the payout was successful
  userRewardAmount: number;        // Amount sent to user (base units)
  burnAmount: number;              // Amount burned (base units)
  userRewardTx?: string;           // Transaction signature
  burnTx?: string;                 // Burn transaction signature
  userTokenAccount?: string;       // User's token account address
  error?: string;                  // Error message if failed
  logs: string[];                  // Detailed process logs
}
```

## Configuration

### Environment Variables

```bash
# Required
TREASURY_PRIVATE_KEY=[JSON array of private key numbers]

# Optional
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
DEBUG_SOLANA_REWARDS=false
```

### Token Configuration

```typescript
export const CONVOAI_TOKEN_CONFIG = {
  MINT_ADDRESS: new PublicKey('DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon'),
  DECIMALS: 6,
  SYMBOL: 'CONVO',
  NAME: 'ConvoAI Token',
};
```

### Distribution Ratios

```typescript
export const REWARD_DISTRIBUTION = {
  USER_PERCENTAGE: 0.90,  // 90% to user
  BURN_PERCENTAGE: 0.10,  // 10% burned
};
```

## Process Flow

### 1. Validation
- Validates user wallet address
- Checks treasury wallet keypair
- Verifies reward amount limits
- Validates conversation ID

### 2. Connection Setup
- Establishes Solana mainnet connection
- Tests RPC endpoint connectivity
- Validates network version

### 3. Treasury Validation
- Checks SOL balance for transaction fees
- Verifies CONVO token balance
- Ensures sufficient funds for payout

### 4. Token Account Setup
- Gets or creates user's associated token account
- Handles account creation if needed
- Validates account permissions

### 5. Transaction Execution
- Creates transaction with multiple instructions
- Transfers 90% to user account
- Burns 10% by sending to null address
- Confirms transaction on mainnet

### 6. Verification
- Verifies transaction success
- Checks final balances
- Logs all operations

## Error Handling

The system includes comprehensive error handling for:

- **Network Issues**: RPC connection failures
- **Insufficient Funds**: Low SOL or token balances
- **Invalid Addresses**: Malformed wallet addresses
- **Transaction Failures**: Network congestion, invalid instructions
- **Account Issues**: Missing or invalid token accounts

### Common Error Scenarios

```typescript
// Insufficient SOL balance
{
  success: false,
  error: "Insufficient SOL balance. Required: 0.01 SOL, Current: 0.005 SOL"
}

// Invalid wallet address
{
  success: false,
  error: "User wallet address is required"
}

// Transaction failure
{
  success: false,
  error: "Transaction execution failed: Blockhash not found"
}
```

## Security Considerations

### Treasury Wallet Security

1. **Secure Storage**: Store private keys in environment variables or secure key management systems
2. **Hardware Wallets**: Use hardware wallets for production deployments
3. **Key Rotation**: Regularly rotate treasury wallet keys
4. **Multi-signature**: Consider multi-signature wallets for large operations

### Rate Limiting

Implement rate limiting in your application layer:

```typescript
// Example rate limiting
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userData = rateLimiter.get(userId);
  
  if (!userData || now > userData.resetTime) {
    rateLimiter.set(userId, { count: 1, resetTime: now + 60000 });
    return false;
  }
  
  if (userData.count >= 10) return true;
  userData.count++;
  return false;
}
```

### Monitoring

Monitor key metrics:

```typescript
// Example monitoring
const metrics = {
  totalPayouts: 0,
  totalBurned: 0,
  failedTransactions: 0,
  averageProcessingTime: 0
};

// Update metrics after each payout
if (result.success) {
  metrics.totalPayouts++;
  metrics.totalBurned += result.burnAmount;
} else {
  metrics.failedTransactions++;
}
```

## Testing

### Run Test Script

```bash
node test-convoai-payout.js
```

### Test Output Example

```
🎯 ConvoAI Premium Plan Reward Payout Test

📋 Test Parameters:
   Token: CONVO (SPL token)
   Mint Address: DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon
   User Wallet: 6U7WS5pGJX6DGHdR8RC5QbXBx1n3Q6HupaeQtZEpsCoM
   Total Reward: 100,000 CONVO tokens
   Distribution: 90,000 CONVO to user, 10,000 CONVO burned

🚀 Processing reward payout...

✅ Reward payout successful!

📊 Results:
   User received: 90000 CONVO tokens
   Burned: 10000 CONVO tokens
   Transaction: https://explorer.solana.com/tx/tx_1234567890_abc123
   User token account: TokenAccountxyz789

🔍 Verification:
   Total distributed: 100000 CONVO
   User percentage: 90.0%
   Burn percentage: 10.0%
```

## Production Deployment

### 1. Environment Setup

```bash
# Production environment variables
export SOLANA_NETWORK=mainnet-beta
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
export TREASURY_PRIVATE_KEY=[your-secure-private-key]
export DEBUG_SOLANA_REWARDS=false
```

### 2. Treasury Wallet Preparation

1. **Generate Treasury Wallet**:
   ```bash
   solana-keygen new --outfile treasury-keypair.json
   ```

2. **Fund with SOL**:
   ```bash
   solana transfer [TREASURY_ADDRESS] 1 --url mainnet-beta
   ```

3. **Fund with CONVO Tokens**:
   ```bash
   spl-token transfer [CONVO_MINT] [TREASURY_ADDRESS] 1000000 --url mainnet-beta
   ```

### 3. Monitoring Setup

```typescript
// Example monitoring integration
import { processConvoAIRewardPayout } from './src/lib/convoai-reward-payout';

// Monitor treasury balance
async function monitorTreasuryBalance() {
  const connection = new Connection(SOLANA_CONFIG.MAINNET_RPC_URL);
  const treasuryWallet = Keypair.fromSecretKey(/* your key */);
  
  const solBalance = await connection.getBalance(treasuryWallet.publicKey);
  const tokenAccount = await getAssociatedTokenAddress(CONVOAI_TOKEN_CONFIG.MINT_ADDRESS, treasuryWallet.publicKey);
  const tokenBalance = await getAccount(connection, tokenAccount);
  
  if (solBalance < 0.01 * LAMPORTS_PER_SOL) {
    console.warn('⚠️ Low SOL balance in treasury');
  }
  
  if (Number(tokenBalance.amount) < 1000000) {
    console.warn('⚠️ Low CONVO balance in treasury');
  }
}
```

## Troubleshooting

### Common Issues

1. **"Insufficient SOL balance"**
   - Fund treasury wallet with more SOL for transaction fees
   - Minimum recommended: 0.01 SOL

2. **"Treasury wallet does not have an associated token account"**
   - Create associated token account for CONVO tokens
   - Use SPL Token CLI: `spl-token create-account [MINT_ADDRESS]`

3. **"Transaction failed: Blockhash not found"**
   - Network congestion issue
   - Retry with new blockhash
   - Consider using higher priority fees

4. **"User wallet address is required"**
   - Ensure user wallet address is properly formatted
   - Validate PublicKey creation

### Debug Mode

Enable debug logging:

```bash
export DEBUG_SOLANA_REWARDS=true
```

This provides detailed transaction logs and error information.

## Integration Examples

### Express.js API Endpoint

```typescript
import express from 'express';
import { processConvoAIRewardPayout } from './src/lib/convoai-reward-payout';

const app = express();
app.use(express.json());

app.post('/api/rewards/payout', async (req, res) => {
  try {
    const { userWalletAddress, rewardAmount, conversationId } = req.body;
    
    const treasuryWallet = Keypair.fromSecretKey(/* your key */);
    const userWallet = new PublicKey(userWalletAddress);
    
    const request = {
      userWalletAddress: userWallet,
      totalRewardAmount: rewardAmount * Math.pow(10, 6),
      conversationId,
      treasuryWallet
    };
    
    const result = await processConvoAIRewardPayout(request);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          userReward: result.userRewardAmount / Math.pow(10, 6),
          burned: result.burnAmount / Math.pow(10, 6),
          transaction: result.userRewardTx
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

### Next.js API Route

```typescript
// pages/api/rewards/payout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { processConvoAIRewardPayout } from '../../../src/lib/convoai-reward-payout';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userWalletAddress, rewardAmount, conversationId } = req.body;
    
    // Your implementation here
    const result = await processConvoAIRewardPayout(/* your request */);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the detailed logs in debug mode
3. Verify environment configuration
4. Test with smaller amounts first

## License

This system is part of the ConvoAI platform and follows the same licensing terms.

---

**Important**: Always test thoroughly on devnet before deploying to mainnet. This system handles real financial transactions and should be used with proper security measures. 