#!/usr/bin/env node

/**
 * Test Script for ConvoAI Solana Reward System
 * 
 * This script demonstrates how to use the reward system for testing purposes.
 * Run with: node test-solana-rewards.js
 */

const { PublicKey } = require('@solana/web3.js');

// Mock the reward service for testing (in real usage, import from the actual service)
class MockSolanaRewardService {
  constructor() {
    this.dailyRewards = new Map();
    this.requestCounts = new Map();
  }

  async processReward(request) {
    console.log('🔍 Processing reward request:', {
      userWallet: request.userWalletAddress.toString(),
      amount: request.rewardAmount,
      conversationId: request.conversationId,
      conversationLength: request.conversationLength
    });

    // Simulate validation
    if (request.rewardAmount <= 0) {
      return {
        success: false,
        error: 'Reward amount must be greater than 0',
        userRewardAmount: 0,
        burnAmount: 0
      };
    }

    if (request.conversationLength < 50) {
      return {
        success: false,
        error: 'Conversation too short. Minimum 50 characters required',
        userRewardAmount: 0,
        burnAmount: 0
      };
    }

    // Simulate rate limiting
    const userId = request.userWalletAddress.toString();
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId);
    
    if (userRequests && now < userRequests.resetTime && userRequests.count >= 10) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait before requesting another reward.',
        userRewardAmount: 0,
        burnAmount: 0
      };
    }

    // Calculate reward amounts (90% to user, 10% burned)
    const userRewardAmount = Math.floor(request.rewardAmount * 0.90);
    const burnAmount = Math.floor(request.rewardAmount * 0.10);

    // Simulate transaction
    const transactionSignature = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update rate limiting
    if (!userRequests || now > userRequests.resetTime) {
      this.requestCounts.set(userId, { count: 1, resetTime: now + 60000 });
    } else {
      userRequests.count++;
    }

    // Update daily limits
    const dailyReward = this.dailyRewards.get(userId);
    if (!dailyReward || now - dailyReward.lastRewardTime > 24 * 60 * 60 * 1000) {
      this.dailyRewards.set(userId, {
        userId,
        totalRewarded: request.rewardAmount,
        lastRewardTime: now,
        dailyLimit: 1000
      });
    } else {
      dailyReward.totalRewarded += request.rewardAmount;
      dailyReward.lastRewardTime = now;
    }

    return {
      success: true,
      userRewardTx: transactionSignature,
      burnTx: transactionSignature,
      userRewardAmount,
      burnAmount
    };
  }

  async getUserTokenBalance(userWalletAddress) {
    // Mock balance - in real implementation, this would query the blockchain
    return Math.floor(Math.random() * 1000);
  }

  getDailyRewardInfo(userId) {
    return this.dailyRewards.get(userId) || null;
  }
}

// Test scenarios
async function runTests() {
  console.log('🚀 Starting ConvoAI Solana Reward System Tests\n');

  const rewardService = new MockSolanaRewardService();

  // Test 1: Valid reward request
  console.log('📝 Test 1: Valid reward request');
  const validRequest = {
    userWalletAddress: new PublicKey('11111111111111111111111111111111'),
    rewardAmount: 100,
    conversationId: 'test-conversation-1',
    conversationLength: 150,
    timestamp: Date.now()
  };

  const result1 = await rewardService.processReward(validRequest);
  if (result1.success) {
    console.log('✅ Success!');
    console.log(`   User reward: ${result1.userRewardAmount} tokens`);
    console.log(`   Burned: ${result1.burnAmount} tokens`);
    console.log(`   Transaction: ${result1.userRewardTx}\n`);
  } else {
    console.log('❌ Failed:', result1.error, '\n');
  }

  // Test 2: Invalid reward amount
  console.log('📝 Test 2: Invalid reward amount (0)');
  const invalidAmountRequest = {
    ...validRequest,
    rewardAmount: 0
  };

  const result2 = await rewardService.processReward(invalidAmountRequest);
  if (!result2.success) {
    console.log('✅ Correctly rejected:', result2.error, '\n');
  } else {
    console.log('❌ Should have been rejected\n');
  }

  // Test 3: Short conversation
  console.log('📝 Test 3: Short conversation');
  const shortConversationRequest = {
    ...validRequest,
    conversationLength: 10
  };

  const result3 = await rewardService.processReward(shortConversationRequest);
  if (!result3.success) {
    console.log('✅ Correctly rejected:', result3.error, '\n');
  } else {
    console.log('❌ Should have been rejected\n');
  }

  // Test 4: Rate limiting simulation
  console.log('📝 Test 4: Rate limiting simulation');
  const rateLimitRequests = [];
  for (let i = 0; i < 12; i++) {
    rateLimitRequests.push({
      ...validRequest,
      conversationId: `test-conversation-${i + 1}`,
      timestamp: Date.now()
    });
  }

  let successCount = 0;
  for (const request of rateLimitRequests) {
    const result = await rewardService.processReward(request);
    if (result.success) {
      successCount++;
    } else if (result.error.includes('Rate limit')) {
      console.log(`✅ Rate limiting kicked in after ${successCount} requests`);
      break;
    }
  }
  console.log('');

  // Test 5: Balance query
  console.log('📝 Test 5: Balance query');
  const balance = await rewardService.getUserTokenBalance(validRequest.userWalletAddress);
  console.log(`✅ User balance: ${balance} tokens\n`);

  // Test 6: Daily limit query
  console.log('📝 Test 6: Daily limit query');
  const dailyInfo = rewardService.getDailyRewardInfo(validRequest.userWalletAddress.toString());
  if (dailyInfo) {
    console.log('✅ Daily reward info:');
    console.log(`   Total rewarded today: ${dailyInfo.totalRewarded} tokens`);
    console.log(`   Daily limit: ${dailyInfo.dailyLimit} tokens`);
    console.log(`   Last reward time: ${new Date(dailyInfo.lastRewardTime).toLocaleString()}\n`);
  } else {
    console.log('❌ No daily reward info found\n');
  }

  console.log('🎉 All tests completed!');
}

// API endpoint simulation
function simulateAPIEndpoint() {
  console.log('\n🌐 API Endpoint Simulation\n');

  const express = require('express');
  const app = express();
  app.use(express.json());

  const rewardService = new MockSolanaRewardService();

  // POST /api/rewards
  app.post('/api/rewards', async (req, res) => {
    try {
      const { userWalletAddress, rewardAmount, conversationId, conversationLength } = req.body;

      if (!userWalletAddress || !rewardAmount || !conversationId || !conversationLength) {
        return res.status(400).json({
          error: 'Missing required fields: userWalletAddress, rewardAmount, conversationId, conversationLength'
        });
      }

      const rewardRequest = {
        userWalletAddress: new PublicKey(userWalletAddress),
        rewardAmount,
        conversationId,
        conversationLength,
        timestamp: Date.now()
      };

      const result = await rewardService.processReward(rewardRequest);

      if (result.success) {
        res.json({
          success: true,
          message: 'Reward processed successfully',
          data: {
            userRewardAmount: result.userRewardAmount,
            burnAmount: result.burnAmount,
            userRewardTx: result.userRewardTx,
            burnTx: result.burnTx
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

  // GET /api/rewards
  app.get('/api/rewards', async (req, res) => {
    try {
      const { userWalletAddress, action } = req.query;

      if (!userWalletAddress || !action) {
        return res.status(400).json({
          error: 'userWalletAddress and action parameters are required'
        });
      }

      const publicKey = new PublicKey(userWalletAddress);

      switch (action) {
        case 'balance':
          const balance = await rewardService.getUserTokenBalance(publicKey);
          res.json({
            success: true,
            data: { balance }
          });
          break;

        case 'daily-limit':
          const dailyInfo = rewardService.getDailyRewardInfo(userWalletAddress);
          res.json({
            success: true,
            data: dailyInfo
          });
          break;

        default:
          res.status(400).json({
            error: 'Invalid action. Supported actions: balance, daily-limit'
          });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`✅ API server running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   POST /api/rewards - Process a reward');
    console.log('   GET  /api/rewards?userWalletAddress=...&action=balance - Get user balance');
    console.log('   GET  /api/rewards?userWalletAddress=...&action=daily-limit - Get daily limit info');
    console.log('\n💡 Test with curl:');
    console.log(`   curl -X POST http://localhost:${PORT}/api/rewards \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"userWalletAddress":"11111111111111111111111111111111","rewardAmount":100,"conversationId":"test","conversationLength":150}\'');
  });
}

// Main execution
if (require.main === module) {
  runTests().then(() => {
    // Uncomment the line below to start the API server
    // simulateAPIEndpoint();
  }).catch(console.error);
}

module.exports = { MockSolanaRewardService }; 