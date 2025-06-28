#!/usr/bin/env node

/**
 * Setup Script for ConvoAI Solana Reward System
 * 
 * This script helps configure the environment and validate the setup.
 * Run with: node setup-solana-rewards.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if Solana CLI is installed
function checkSolanaCLI() {
  try {
    const version = execSync('solana --version', { encoding: 'utf8' });
    logSuccess(`Solana CLI found: ${version.trim()}`);
    return true;
  } catch (error) {
    logError('Solana CLI not found. Please install it first:');
    logInfo('Visit: https://docs.solana.com/cli/install-solana-cli-tools');
    return false;
  }
}

// Check if SPL Token CLI is installed
function checkSPLTokenCLI() {
  try {
    const version = execSync('spl-token --version', { encoding: 'utf8' });
    logSuccess(`SPL Token CLI found: ${version.trim()}`);
    return true;
  } catch (error) {
    logError('SPL Token CLI not found. Please install it first:');
    logInfo('Run: sh -c "$(curl -sSfL https://release.solana.com/stable/install)"');
    return false;
  }
}

// Generate a new keypair
function generateKeypair() {
  try {
    logInfo('Generating new treasury keypair...');
    execSync('solana-keygen new --outfile treasury-keypair.json --no-bip39-passphrase', { stdio: 'inherit' });
    
    const keypairData = JSON.parse(fs.readFileSync('treasury-keypair.json', 'utf8'));
    const publicKey = keypairData[1]; // The public key is the second element
    
    logSuccess(`Treasury keypair generated successfully!`);
    logInfo(`Public key: ${publicKey}`);
    logInfo(`Private key saved to: treasury-keypair.json`);
    
    return { keypairData, publicKey };
  } catch (error) {
    logError('Failed to generate keypair:', error.message);
    return null;
  }
}

// Convert keypair to environment variable format
function convertKeypairToEnvFormat(keypairData) {
  return JSON.stringify(keypairData);
}

// Create .env file
function createEnvFile(keypairString, network = 'devnet') {
  const envContent = `# Solana Reward System Configuration

# Network Configuration
SOLANA_NETWORK=${network}
SOLANA_RPC_URL=https://api.${network}.solana.com

# Treasury Wallet (JSON array of numbers)
TREASURY_PRIVATE_KEY=${keypairString}

# Security Configuration (Optional)
BLOCKED_WALLET_ADDRESSES=

# Debug Mode (Optional)
DEBUG_SOLANA_REWARDS=false

# Rate Limiting Configuration (Optional)
MAX_REWARDS_PER_HOUR=50
MAX_REWARDS_PER_DAY=1000
MIN_CONVERSATION_LENGTH=50

# ConvoAI Token Configuration
CONVOAI_TOKEN_MINT=DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon
`;

  try {
    fs.writeFileSync('.env', envContent);
    logSuccess('.env file created successfully!');
    return true;
  } catch (error) {
    logError('Failed to create .env file:', error.message);
    return false;
  }
}

// Check if .env file exists
function checkEnvFile() {
  if (fs.existsSync('.env')) {
    logSuccess('.env file found');
    return true;
  } else {
    logWarning('.env file not found');
    return false;
  }
}

// Validate environment variables
function validateEnvVariables() {
  const requiredVars = ['SOLANA_NETWORK', 'SOLANA_RPC_URL', 'TREASURY_PRIVATE_KEY'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('All required environment variables are set');
  return true;
}

// Test Solana connection
async function testSolanaConnection() {
  try {
    logInfo('Testing Solana connection...');
    
    // Test basic connection
    const clusterInfo = execSync('solana cluster-version', { encoding: 'utf8' });
    logSuccess(`Connected to Solana cluster: ${clusterInfo.trim()}`);
    
    // Test RPC endpoint
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    logInfo(`RPC URL: ${rpcUrl}`);
    
    return true;
  } catch (error) {
    logError('Failed to connect to Solana:', error.message);
    return false;
  }
}

// Check treasury wallet balance
async function checkTreasuryBalance() {
  try {
    if (!fs.existsSync('treasury-keypair.json')) {
      logWarning('Treasury keypair file not found. Skipping balance check.');
      return false;
    }
    
    const keypairData = JSON.parse(fs.readFileSync('treasury-keypair.json', 'utf8'));
    const publicKey = keypairData[1];
    
    logInfo(`Checking balance for treasury wallet: ${publicKey}`);
    
    const balance = execSync(`solana balance ${publicKey}`, { encoding: 'utf8' });
    logSuccess(`Treasury balance: ${balance.trim()}`);
    
    const solBalance = parseFloat(balance.replace(' SOL', ''));
    if (solBalance < 0.01) {
      logWarning('Treasury wallet has low SOL balance. Consider funding it for transaction fees.');
    }
    
    return true;
  } catch (error) {
    logError('Failed to check treasury balance:', error.message);
    return false;
  }
}

// Create test token on devnet
async function createTestToken() {
  try {
    logInfo('Creating test SPL token on devnet...');
    
    // Create token
    const createOutput = execSync('spl-token create-token --url devnet', { encoding: 'utf8' });
    const tokenMint = createOutput.match(/Creating token ([A-Za-z0-9]+)/)?.[1];
    
    if (!tokenMint) {
      throw new Error('Failed to extract token mint address');
    }
    
    logSuccess(`Test token created: ${tokenMint}`);
    
    // Create token account
    execSync(`spl-token create-account ${tokenMint} --url devnet`, { stdio: 'inherit' });
    logSuccess('Token account created');
    
    // Mint tokens
    execSync(`spl-token mint ${tokenMint} 1000000 --url devnet`, { stdio: 'inherit' });
    logSuccess('Test tokens minted');
    
    // Update .env file with test token
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedContent = envContent.replace(
      /CONVOAI_TOKEN_MINT=.*/,
      `CONVOAI_TOKEN_MINT=${tokenMint}`
    );
    fs.writeFileSync('.env', updatedContent);
    
    logSuccess('Updated .env file with test token mint address');
    logInfo(`Test token mint: ${tokenMint}`);
    
    return tokenMint;
  } catch (error) {
    logError('Failed to create test token:', error.message);
    return null;
  }
}

// Main setup function
async function runSetup() {
  log('🚀 ConvoAI Solana Reward System Setup', 'bright');
  log('=====================================\n', 'bright');
  
  // Step 1: Check prerequisites
  logStep(1, 'Checking prerequisites');
  const solanaCLI = checkSolanaCLI();
  const splTokenCLI = checkSPLTokenCLI();
  
  if (!solanaCLI || !splTokenCLI) {
    logError('Please install the required CLI tools before continuing.');
    process.exit(1);
  }
  
  // Step 2: Generate keypair
  logStep(2, 'Setting up treasury wallet');
  const keypairResult = generateKeypair();
  if (!keypairResult) {
    logError('Failed to generate keypair. Exiting.');
    process.exit(1);
  }
  
  // Step 3: Create environment file
  logStep(3, 'Creating environment configuration');
  const keypairString = convertKeypairToEnvFormat(keypairResult.keypairData);
  const envCreated = createEnvFile(keypairString, 'devnet');
  
  if (!envCreated) {
    logError('Failed to create environment file. Exiting.');
    process.exit(1);
  }
  
  // Step 4: Test connection
  logStep(4, 'Testing Solana connection');
  const connectionTest = await testSolanaConnection();
  if (!connectionTest) {
    logError('Failed to connect to Solana. Please check your network connection.');
    process.exit(1);
  }
  
  // Step 5: Check balance
  logStep(5, 'Checking treasury wallet balance');
  await checkTreasuryBalance();
  
  // Step 6: Create test token (optional)
  logStep(6, 'Creating test token (optional)');
  const createToken = process.argv.includes('--create-token');
  
  if (createToken) {
    const testToken = await createTestToken();
    if (testToken) {
      logSuccess('Test token setup completed!');
    }
  } else {
    logInfo('Skipping test token creation. Use --create-token flag to create one.');
  }
  
  // Step 7: Final instructions
  logStep(7, 'Setup complete!');
  logSuccess('Your Solana reward system is ready for testing!');
  
  log('\n📋 Next steps:', 'bright');
  log('1. Fund your treasury wallet with SOL for transaction fees');
  log('2. If using mainnet, transfer ConvoAI tokens to treasury wallet');
  log('3. Test the system: node test-solana-rewards.js');
  log('4. Start your application: npm run dev');
  
  log('\n🔧 Configuration files:', 'bright');
  log('• .env - Environment variables');
  log('• treasury-keypair.json - Treasury wallet keypair');
  
  log('\n⚠️  Security notes:', 'yellow');
  log('• Keep your treasury keypair secure');
  log('• Never commit private keys to version control');
  log('• Use hardware wallets for production');
  
  log('\n📚 Documentation:', 'bright');
  log('• See SOLANA_REWARD_SYSTEM_GUIDE.md for detailed instructions');
  log('• API documentation in the guide');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('ConvoAI Solana Reward System Setup', 'bright');
  log('\nUsage: node setup-solana-rewards.js [options]', 'cyan');
  log('\nOptions:', 'bright');
  log('  --create-token    Create a test SPL token on devnet');
  log('  --help, -h        Show this help message');
  log('\nExamples:', 'bright');
  log('  node setup-solana-rewards.js');
  log('  node setup-solana-rewards.js --create-token');
} else {
  runSetup().catch(error => {
    logError('Setup failed:', error.message);
    process.exit(1);
  });
} 