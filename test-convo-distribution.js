const { Keypair, PublicKey } = require('@solana/web3.js');
const { distributeConvoReward, getTransactionUrl } = require('./src/lib/convo-reward-distribution.ts');

/**
 * Test script for CONVO token reward distribution
 * 
 * This script demonstrates the distribution of 100,000 CONVO tokens to a user wallet
 * with automatic burning of 0.1% (100 tokens) and distribution of 99.9% (99,900 tokens) to the user.
 * 
 * IMPORTANT: This is a demonstration script. In production:
 * - Use a real treasury wallet with sufficient CONVO and SOL balances
 * - Implement proper security measures for private key management
 * - Add rate limiting and abuse prevention
 * - Use environment variables for sensitive data
 */

async function testConvoRewardDistribution() {
  console.log('🎯 CONVO Token Reward Distribution Test\n');
  console.log('=' .repeat(60));

  try {
    // Configuration
    const USER_WALLET_ADDRESS = 'DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2';
    const TOTAL_REWARD_AMOUNT = 100000; // 100,000 CONVO tokens
    const DECIMALS = 6;
    const TOTAL_REWARD_BASE_UNITS = TOTAL_REWARD_AMOUNT * Math.pow(10, DECIMALS);

    console.log('📋 Test Configuration:');
    console.log(`   User Wallet: ${USER_WALLET_ADDRESS}`);
    console.log(`   Total Reward: ${TOTAL_REWARD_AMOUNT.toLocaleString()} CONVO tokens`);
    console.log(`   Base Units: ${TOTAL_REWARD_BASE_UNITS.toLocaleString()}`);
    console.log(`   Burn Percentage: 0.1%`);
    console.log(`   User Percentage: 99.9%`);
    console.log('');

    // Calculate expected amounts
    const expectedUserReward = Math.floor(TOTAL_REWARD_BASE_UNITS * 0.999);
    const expectedBurnAmount = Math.floor(TOTAL_REWARD_BASE_UNITS * 0.001);

    console.log('💰 Expected Distribution:');
    console.log(`   User Reward: ${expectedUserReward.toLocaleString()} base units (${expectedUserReward / Math.pow(10, DECIMALS)} CONVO)`);
    console.log(`   Burn Amount: ${expectedBurnAmount.toLocaleString()} base units (${expectedBurnAmount / Math.pow(10, DECIMALS)} CONVO)`);
    console.log('');

    // Create a treasury wallet (in production, load from secure storage)
    console.log('🏦 Creating treasury wallet...');
    const treasuryWallet = Keypair.generate();
    console.log(`   Treasury Public Key: ${treasuryWallet.publicKey.toString()}`);
    console.log(`   Treasury Private Key: [REDACTED FOR SECURITY]`);
    console.log('');

    // Prepare the reward request
    const rewardRequest = {
      userWalletAddress: new PublicKey(USER_WALLET_ADDRESS),
      totalRewardAmount: TOTAL_REWARD_BASE_UNITS,
      treasuryWallet: treasuryWallet,
      rpcUrl: 'https://api.mainnet-beta.solana.com',
      conversationId: 'test-conversation-123'
    };

    console.log('🚀 Starting CONVO reward distribution...');
    console.log('');

    // Execute the reward distribution
    const startTime = Date.now();
    const result = await distributeConvoReward(rewardRequest);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('=' .repeat(60));
    console.log('📊 DISTRIBUTION RESULTS');
    console.log('=' .repeat(60));

    if (result.success) {
      console.log('✅ CONVO Reward Distribution Successful!');
      console.log('');
      
      console.log('💰 Token Distribution:');
      console.log(`   User Received: ${result.userRewardAmount.toLocaleString()} base units`);
      console.log(`   User Received: ${(result.userRewardAmount / Math.pow(10, DECIMALS)).toFixed(6)} CONVO tokens`);
      console.log(`   Burned: ${result.burnAmount.toLocaleString()} base units`);
      console.log(`   Burned: ${(result.burnAmount / Math.pow(10, DECIMALS)).toFixed(6)} CONVO tokens`);
      console.log('');

      console.log('🔗 Transaction Details:');
      console.log(`   Transaction Signature: ${result.transactionSignature}`);
      console.log(`   Solana Explorer: ${getTransactionUrl(result.transactionSignature)}`);
      console.log(`   User Token Account: ${result.userTokenAccount}`);
      console.log('');

      console.log('⏱️ Performance:');
      console.log(`   Processing Time: ${duration}ms`);
      console.log('');

      // Verify the amounts match expectations
      const userAmountCorrect = result.userRewardAmount === expectedUserReward;
      const burnAmountCorrect = result.burnAmount === expectedBurnAmount;
      
      console.log('✅ Amount Verification:');
      console.log(`   User Amount Correct: ${userAmountCorrect ? '✅' : '❌'}`);
      console.log(`   Burn Amount Correct: ${burnAmountCorrect ? '✅' : '❌'}`);
      
      if (!userAmountCorrect || !burnAmountCorrect) {
        console.log('⚠️ Warning: Amounts do not match expected values!');
      }

    } else {
      console.log('❌ CONVO Reward Distribution Failed!');
      console.log(`   Error: ${result.error}`);
      console.log('');
    }

    console.log('📋 Process Logs:');
    console.log('-' .repeat(40));
    result.logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test function to validate the reward calculation logic
 */
function testRewardCalculations() {
  console.log('\n🧮 Testing Reward Calculations\n');
  console.log('=' .repeat(40));

  const testAmounts = [100000, 50000, 10000, 1000, 100];
  const decimals = 6;

  testAmounts.forEach(amount => {
    const baseUnits = amount * Math.pow(10, decimals);
    const userReward = Math.floor(baseUnits * 0.999);
    const burnAmount = Math.floor(baseUnits * 0.001);
    
    console.log(`Input: ${amount.toLocaleString()} CONVO tokens`);
    console.log(`  Base Units: ${baseUnits.toLocaleString()}`);
    console.log(`  User Reward: ${userReward.toLocaleString()} (${(userReward / Math.pow(10, decimals)).toFixed(6)} CONVO)`);
    console.log(`  Burn Amount: ${burnAmount.toLocaleString()} (${(burnAmount / Math.pow(10, decimals)).toFixed(6)} CONVO)`);
    console.log(`  Total: ${(userReward + burnAmount).toLocaleString()} base units`);
    console.log(`  Verification: ${userReward + burnAmount === baseUnits ? '✅' : '❌'}`);
    console.log('');
  });
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎯 CONVO Token Reward Distribution System');
  console.log('Built for Solana Mainnet');
  console.log('Token: CONVO (DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon)');
  console.log('');

  // Test calculations first
  testRewardCalculations();

  // Test the actual distribution (will fail without real treasury wallet)
  console.log('⚠️ Note: This test will fail because the treasury wallet has no CONVO tokens.');
  console.log('   To test successfully, you need a treasury wallet with sufficient CONVO and SOL balances.');
  console.log('');

  const runTest = process.argv.includes('--run-test');
  if (runTest) {
    await testConvoRewardDistribution();
  } else {
    console.log('To run the full test, use: node test-convo-distribution.js --run-test');
    console.log('');
    console.log('📝 Usage Instructions:');
    console.log('1. Ensure you have a treasury wallet with CONVO tokens and SOL for fees');
    console.log('2. Update the treasury wallet in the test function');
    console.log('3. Run: node test-convo-distribution.js --run-test');
    console.log('');
    console.log('🔒 Security Notes:');
    console.log('- Never commit private keys to version control');
    console.log('- Use environment variables for sensitive data');
    console.log('- Implement proper key management in production');
    console.log('- Add rate limiting and abuse prevention');
  }
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testConvoRewardDistribution,
  testRewardCalculations
}; 