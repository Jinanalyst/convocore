#!/usr/bin/env node

/**
 * Test Script for ConvoAI Premium Plan Reward Payout
 * 
 * This script demonstrates the reward payout function for the specific requirements:
 * - User wallet: 6U7WS5pGJX6DGHdR8RC5QbXBx1n3Q6HupaeQtZEpsCoM
 * - Total reward: 100,000 CONVO tokens
 * - 90,000 CONVO to user, 10,000 CONVO burned
 * 
 * Run with: node test-convoai-payout.js
 */

const { PublicKey, Keypair } = require('@solana/web3.js');

// Mock the payout function for testing (in real usage, import from the actual service)
class MockConvoAIRewardPayout {
  constructor() {
    this.transactionCount = 0;
  }

  async processConvoAIRewardPayout(request) {
    const logs = [];
    const startTime = Date.now();

    try {
      logs.push(`🚀 Starting ConvoAI reward payout process`);
      logs.push(`📊 Total reward amount: ${request.totalRewardAmount} CONVO (${request.totalRewardAmount / Math.pow(10, 6)} tokens)`);
      logs.push(`👤 User wallet: ${request.userWalletAddress.toString()}`);
      logs.push(`🏦 Treasury wallet: ${request.treasuryWallet.publicKey.toString()}`);

      // Step 1: Validate request parameters
      logs.push(`\n🔍 Step 1: Validating request parameters`);
      const validation = this.validateRewardRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          userRewardAmount: 0,
          burnAmount: 0,
          error: validation.error,
          logs: [...logs, `❌ Validation failed: ${validation.error}`]
        };
      }
      logs.push(`✅ Request validation passed`);

      // Step 2: Simulate Solana connection
      logs.push(`\n🔗 Step 2: Initializing Solana connection`);
      logs.push(`✅ Connected to Solana mainnet (version: 1.17.0)`);

      // Step 3: Validate treasury wallet
      logs.push(`\n🏦 Step 3: Validating treasury wallet`);
      logs.push(`✅ Treasury wallet validated`);
      logs.push(`   SOL balance: 1.5 SOL`);
      logs.push(`   CONVO balance: 500000000 CONVO`);

      // Step 4: Calculate reward amounts
      logs.push(`\n💰 Step 4: Calculating reward distribution`);
      const userRewardAmount = Math.floor(request.totalRewardAmount * 0.90);
      const burnAmount = Math.floor(request.totalRewardAmount * 0.10);
      
      logs.push(`   User reward: ${userRewardAmount} CONVO (${userRewardAmount / Math.pow(10, 6)} tokens)`);
      logs.push(`   Burn amount: ${burnAmount} CONVO (${burnAmount / Math.pow(10, 6)} tokens)`);

      // Step 5: Setup user token account
      logs.push(`\n🏦 Step 5: Setting up user token account`);
      const userTokenAccount = new PublicKey('TokenAccount' + Math.random().toString(36).substr(2, 9));
      logs.push(`✅ User token account ready: ${userTokenAccount.toString()}`);
      logs.push(`   Created new associated token account`);

      // Step 6: Execute reward transaction
      logs.push(`\n📝 Step 6: Executing reward transaction`);
      const transactionSignature = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logs.push(`✅ Transaction executed successfully`);
      logs.push(`   Transaction signature: ${transactionSignature}`);
      logs.push(`   Block time: ${new Date().toISOString()}`);

      // Step 7: Verify transaction
      logs.push(`\n🔍 Step 7: Verifying transaction`);
      logs.push(`✅ Transaction verified successfully`);

      // Step 8: Final balance check
      logs.push(`\n💰 Step 8: Final balance verification`);
      logs.push(`   User final balance: ${userRewardAmount} CONVO`);

      const endTime = Date.now();
      const duration = endTime - startTime;
      logs.push(`\n🎉 Reward payout completed successfully in ${duration}ms`);

      return {
        success: true,
        userRewardAmount,
        burnAmount,
        userRewardTx: transactionSignature,
        burnTx: transactionSignature,
        userTokenAccount: userTokenAccount.toString(),
        logs
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logs.push(`\n❌ Reward payout failed: ${errorMessage}`);
      
      return {
        success: false,
        userRewardAmount: 0,
        burnAmount: 0,
        error: errorMessage,
        logs
      };
    }
  }

  validateRewardRequest(request) {
    if (!request.userWalletAddress) {
      return { valid: false, error: 'User wallet address is required' };
    }

    if (!request.treasuryWallet) {
      return { valid: false, error: 'Treasury wallet keypair is required' };
    }

    if (request.totalRewardAmount <= 0) {
      return { valid: false, error: 'Reward amount must be greater than 0' };
    }

    if (!request.conversationId || request.conversationId.trim() === '') {
      return { valid: false, error: 'Conversation ID is required' };
    }

    return { valid: true };
  }

  getTransactionUrl(signature) {
    return `https://explorer.solana.com/tx/${signature}`;
  }
}

// Test the specific ConvoAI reward payout scenario
async function testConvoAIRewardPayout() {
  console.log('🎯 ConvoAI Premium Plan Reward Payout Test\n');
  console.log('📋 Test Parameters:');
  console.log('   Token: CONVO (SPL token)');
  console.log('   Mint Address: DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon');
  console.log('   User Wallet: 6U7WS5pGJX6DGHdR8RC5QbXBx1n3Q6HupaeQtZEpsCoM');
  console.log('   Total Reward: 100,000 CONVO tokens');
  console.log('   Distribution: 90,000 CONVO to user, 10,000 CONVO burned\n');

  // Create mock payout service
  const payoutService = new MockConvoAIRewardPayout();

  // Create treasury wallet (in production, load from secure storage)
  const treasuryWallet = Keypair.generate();
  
  // User wallet from the requirements
  const userWallet = new PublicKey('6U7WS5pGJX6DGHdR8RC5QbXBx1n3Q6HupaeQtZEpsCoM');
  
  // 100,000 CONVO tokens (in base units with 6 decimals)
  const totalRewardAmount = 100000 * Math.pow(10, 6); // 100,000 * 10^6 = 100,000,000,000

  const request = {
    userWalletAddress: userWallet,
    totalRewardAmount,
    conversationId: 'premium-conversation-123',
    treasuryWallet,
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  };

  try {
    console.log('🚀 Processing reward payout...\n');
    const result = await payoutService.processConvoAIRewardPayout(request);

    if (result.success) {
      console.log('✅ Reward payout successful!');
      console.log('\n📊 Results:');
      console.log(`   User received: ${result.userRewardAmount / Math.pow(10, 6)} CONVO tokens`);
      console.log(`   Burned: ${result.burnAmount / Math.pow(10, 6)} CONVO tokens`);
      console.log(`   Transaction: ${payoutService.getTransactionUrl(result.userRewardTx)}`);
      console.log(`   User token account: ${result.userTokenAccount}`);
      
      console.log('\n🔍 Verification:');
      console.log(`   Total distributed: ${(result.userRewardAmount + result.burnAmount) / Math.pow(10, 6)} CONVO`);
      console.log(`   User percentage: ${((result.userRewardAmount / totalRewardAmount) * 100).toFixed(1)}%`);
      console.log(`   Burn percentage: ${((result.burnAmount / totalRewardAmount) * 100).toFixed(1)}%`);
    } else {
      console.log('❌ Reward payout failed:', result.error);
    }

    console.log('\n📋 Detailed Process Logs:');
    result.logs.forEach(log => console.log(log));

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Production usage example
function showProductionUsage() {
  console.log('\n🔧 Production Usage Example:\n');
  
  console.log('// Import the actual function');
  console.log("import { processConvoAIRewardPayout } from './src/lib/convoai-reward-payout';");
  console.log("import { PublicKey, Keypair } from '@solana/web3.js';");
  console.log('');
  
  console.log('// Load treasury wallet from secure storage');
  console.log('const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;');
  console.log('const treasuryWallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(treasuryPrivateKey)));');
  console.log('');
  
  console.log('// User wallet from your application');
  console.log("const userWallet = new PublicKey('6U7WS5pGJX6DGHdR8RC5QbXBx1n3Q6HupaeQtZEpsCoM');");
  console.log('');
  
  console.log('// 100,000 CONVO tokens (with 6 decimals)');
  console.log('const totalRewardAmount = 100000 * Math.pow(10, 6);');
  console.log('');
  
  console.log('const request = {');
  console.log('  userWalletAddress: userWallet,');
  console.log('  totalRewardAmount,');
  console.log('  conversationId: "premium-conversation-123",');
  console.log('  treasuryWallet,');
  console.log('  rpcUrl: "https://api.mainnet-beta.solana.com"');
  console.log('};');
  console.log('');
  
  console.log('const result = await processConvoAIRewardPayout(request);');
  console.log('');
  
  console.log('if (result.success) {');
  console.log('  console.log("Reward paid:", result.userRewardAmount / Math.pow(10, 6), "CONVO");');
  console.log('  console.log("Burned:", result.burnAmount / Math.pow(10, 6), "CONVO");');
  console.log('  console.log("Transaction:", result.userRewardTx);');
  console.log('}');
}

// Main execution
if (require.main === module) {
  testConvoAIRewardPayout().then(() => {
    showProductionUsage();
  }).catch(console.error);
}

module.exports = { MockConvoAIRewardPayout }; 