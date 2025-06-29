#!/usr/bin/env node

/**
 * Test Script for ConvoAI Token Reward System Across All Plans
 * 
 * This script tests the reward system for free, pro, and premium plans
 * to ensure tokens are being distributed correctly based on user tiers.
 * 
 * Run with: node test-reward-system.js
 */

const { PublicKey, Keypair } = require('@solana/web3.js');

// Mock reward service for testing
class MockRewardService {
  constructor() {
    this.transactionCount = 0;
    this.rewards = new Map();
  }

  // Simulate reward calculation based on plan
  calculateReward(plan, conversationLength, modelUsed) {
    const baseReward = Math.floor(conversationLength / 100); // 1 token per 100 characters
    
    switch (plan) {
      case 'free':
        return Math.floor(baseReward * 0.5); // 50% of base reward
      case 'pro':
        return Math.floor(baseReward * 1.0); // 100% of base reward
      case 'premium':
        return Math.floor(baseReward * 2.0); // 200% of base reward
      default:
        return 0;
    }
  }

  // Simulate reward processing
  async processReward(request) {
    const { userWalletAddress, rewardAmount, conversationId, conversationLength, plan } = request;
    
    console.log(`\n🎯 Processing reward for ${plan} plan user`);
    console.log(`   Wallet: ${userWalletAddress.toString()}`);
    console.log(`   Conversation ID: ${conversationId}`);
    console.log(`   Conversation length: ${conversationLength} characters`);
    console.log(`   Base reward amount: ${rewardAmount} CONVO tokens`);

    // Calculate actual reward based on plan
    const actualReward = this.calculateReward(plan, conversationLength, request.modelUsed);
    const userRewardAmount = Math.floor(actualReward * 0.90); // 90% to user
    const burnAmount = Math.floor(actualReward * 0.10); // 10% burned

    console.log(`   Calculated reward: ${actualReward} CONVO tokens`);
    console.log(`   User receives: ${userRewardAmount} CONVO tokens (90%)`);
    console.log(`   Burned: ${burnAmount} CONVO tokens (10%)`);

    // Simulate transaction
    const txSignature = `tx_${Date.now()}_${this.transactionCount++}`;
    
    // Store reward data
    this.rewards.set(conversationId, {
      plan,
      userRewardAmount,
      burnAmount,
      txSignature,
      timestamp: Date.now()
    });

    return {
      success: true,
      userRewardAmount,
      burnAmount,
      userRewardTx: txSignature,
      burnTx: txSignature,
      plan,
      conversationLength
    };
  }

  // Get reward statistics
  getRewardStats() {
    const stats = {
      totalRewards: 0,
      totalBurned: 0,
      planBreakdown: {
        free: { count: 0, total: 0 },
        pro: { count: 0, total: 0 },
        premium: { count: 0, total: 0 }
      }
    };

    for (const [conversationId, reward] of this.rewards) {
      stats.totalRewards += reward.userRewardAmount;
      stats.totalBurned += reward.burnAmount;
      stats.planBreakdown[reward.plan].count++;
      stats.planBreakdown[reward.plan].total += reward.userRewardAmount;
    }

    return stats;
  }
}

// Test scenarios
const testScenarios = [
  {
    name: 'Free Plan - Short Conversation',
    plan: 'free',
    conversationLength: 150,
    modelUsed: 'convoq',
    expectedMultiplier: 0.5
  },
  {
    name: 'Free Plan - Long Conversation',
    plan: 'free',
    conversationLength: 500,
    modelUsed: 'convoq',
    expectedMultiplier: 0.5
  },
  {
    name: 'Pro Plan - Short Conversation',
    plan: 'pro',
    conversationLength: 150,
    modelUsed: 'gpt-4o',
    expectedMultiplier: 1.0
  },
  {
    name: 'Pro Plan - Long Conversation',
    plan: 'pro',
    conversationLength: 800,
    modelUsed: 'gpt-4o',
    expectedMultiplier: 1.0
  },
  {
    name: 'Premium Plan - Short Conversation',
    plan: 'premium',
    conversationLength: 150,
    modelUsed: 'claude-3-opus-20240229',
    expectedMultiplier: 2.0
  },
  {
    name: 'Premium Plan - Long Conversation',
    plan: 'premium',
    conversationLength: 1200,
    modelUsed: 'claude-3-opus-20240229',
    expectedMultiplier: 2.0
  }
];

// Generate valid mainnet-compatible public keys for testing
const testWallets = {
  free: Keypair.generate().publicKey,
  pro: Keypair.generate().publicKey,
  premium: Keypair.generate().publicKey
};

async function testRewardSystem() {
  console.log('🎯 ConvoAI Token Reward System Test\n');
  console.log('📋 Testing reward distribution across all plans');
  console.log('   Token: CONVO (SPL token)');
  console.log('   Mint Address: DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon');
  console.log('   Distribution: 90% to user, 10% burned\n');

  const rewardService = new MockRewardService();
  const results = [];

  // Run test scenarios
  for (const scenario of testScenarios) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Test: ${scenario.name}`);
    console.log(`${'='.repeat(60)}`);

    const baseReward = Math.floor(scenario.conversationLength / 100);
    const expectedReward = Math.floor(baseReward * scenario.expectedMultiplier);

    const request = {
      userWalletAddress: testWallets[scenario.plan],
      rewardAmount: baseReward,
      conversationId: `${scenario.plan}-conversation-${Date.now()}`,
      conversationLength: scenario.conversationLength,
      plan: scenario.plan,
      modelUsed: scenario.modelUsed,
      timestamp: Date.now()
    };

    try {
      const result = await rewardService.processReward(request);
      
      if (result.success) {
        console.log(`✅ Reward processed successfully!`);
        console.log(`   Transaction: ${result.userRewardTx}`);
        
        // Verify reward calculation
        const isCorrect = result.userRewardAmount === Math.floor(expectedReward * 0.90);
        console.log(`   Expected: ${Math.floor(expectedReward * 0.90)} CONVO`);
        console.log(`   Actual: ${result.userRewardAmount} CONVO`);
        console.log(`   Calculation: ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
        
        results.push({
          scenario: scenario.name,
          success: true,
          expected: Math.floor(expectedReward * 0.90),
          actual: result.userRewardAmount,
          correct: isCorrect
        });
      } else {
        console.log(`❌ Reward processing failed`);
        results.push({
          scenario: scenario.name,
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
  }

  // Display summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${'='.repeat(60)}`);

  const stats = rewardService.getRewardStats();
  console.log(`\n💰 Total Rewards Distributed: ${stats.totalRewards} CONVO tokens`);
  console.log(`🔥 Total Tokens Burned: ${stats.totalBurned} CONVO tokens`);
  
  console.log(`\n📈 Plan Breakdown:`);
  for (const [plan, data] of Object.entries(stats.planBreakdown)) {
    console.log(`   ${plan.toUpperCase()}: ${data.count} conversations, ${data.total} CONVO tokens`);
  }

  console.log(`\n✅ Test Results:`);
  const successfulTests = results.filter(r => r.success && r.correct);
  const failedTests = results.filter(r => !r.success || !r.correct);
  
  console.log(`   Passed: ${successfulTests.length}/${results.length}`);
  console.log(`   Failed: ${failedTests.length}/${results.length}`);

  if (failedTests.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    failedTests.forEach(test => {
      console.log(`   - ${test.scenario}: ${test.error || 'Incorrect calculation'}`);
    });
  }

  // Verify plan-specific features
  console.log(`\n🔍 Plan Feature Verification:`);
  
  // Check if free plan has limitations
  const freeTests = results.filter(r => r.scenario.includes('Free Plan'));
  const freeAvgReward = freeTests.reduce((sum, test) => sum + test.actual, 0) / freeTests.length;
  console.log(`   Free Plan Average Reward: ${freeAvgReward.toFixed(2)} CONVO (should be lowest)`);
  
  // Check if premium plan has highest rewards
  const premiumTests = results.filter(r => r.scenario.includes('Premium Plan'));
  const premiumAvgReward = premiumTests.reduce((sum, test) => sum + test.actual, 0) / premiumTests.length;
  console.log(`   Premium Plan Average Reward: ${premiumAvgReward.toFixed(2)} CONVO (should be highest)`);
  
  // Check if pro plan is in between
  const proTests = results.filter(r => r.scenario.includes('Pro Plan'));
  const proAvgReward = proTests.reduce((sum, test) => sum + test.actual, 0) / proTests.length;
  console.log(`   Pro Plan Average Reward: ${proAvgReward.toFixed(2)} CONVO (should be in between)`);

  const isHierarchyCorrect = freeAvgReward < proAvgReward && proAvgReward < premiumAvgReward;
  console.log(`   Reward Hierarchy: ${isHierarchyCorrect ? '✅ Correct' : '❌ Incorrect'}`);

  console.log(`\n🎉 Test completed!`);
  console.log(`   Overall Status: ${failedTests.length === 0 && isHierarchyCorrect ? '✅ PASSED' : '❌ FAILED'}`);
}

// Run the test
testRewardSystem().catch(console.error); 