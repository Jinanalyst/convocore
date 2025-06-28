import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token';

// CONVO Token Configuration
const CONVO_TOKEN_CONFIG = {
  MINT_ADDRESS: new PublicKey('DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon'),
  DECIMALS: 6,
  SYMBOL: 'CONVO',
  NAME: 'ConvoAI Token',
};

// Solana Network Configuration
const SOLANA_CONFIG = {
  MAINNET_RPC_URL: 'https://api.mainnet-beta.solana.com',
  COMMITMENT: 'confirmed',
  PREFLIGHT_COMMITMENT: 'confirmed',
  FINALITY: 'confirmed',
};

// Burn Address (Solana null address)
const BURN_ADDRESS = new PublicKey('11111111111111111111111111111111');

// Reward Distribution Configuration
const REWARD_DISTRIBUTION = {
  BURN_PERCENTAGE: 0.001, // 0.1% burned
  USER_PERCENTAGE: 0.999, // 99.9% to user
};

// Types
export interface ConvoRewardRequest {
  userWalletAddress: PublicKey;
  totalRewardAmount: number; // Amount in base units (considering decimals)
  treasuryWallet: Keypair;
  rpcUrl?: string;
  conversationId?: string; // Optional identifier for logging
}

export interface ConvoRewardResult {
  success: boolean;
  userRewardAmount: number;
  burnAmount: number;
  transactionSignature?: string;
  userTokenAccount?: string;
  error?: string;
  logs: string[];
}

/**
 * Distributes CONVO tokens to a user with automatic burning of 0.1%
 * 
 * This function performs the following operations on Solana mainnet:
 * 1. Validates the request and treasury wallet
 * 2. Creates user's associated token account if needed
 * 3. Transfers 99.9% of tokens to user
 * 4. Burns 0.1% of tokens by sending to null address
 * 5. Confirms transaction on Solana mainnet
 * 
 * @param request - Reward distribution request containing user wallet, amount, and treasury keypair
 * @returns Promise<ConvoRewardResult> - Result of the distribution operation
 */
export async function distributeConvoReward(
  request: ConvoRewardRequest
): Promise<ConvoRewardResult> {
  const logs: string[] = [];
  const startTime = Date.now();

  try {
    // Log the start of the distribution process
    logs.push(`🚀 Starting CONVO token reward distribution`);
    logs.push(`📊 Total reward amount: ${request.totalRewardAmount} CONVO (${request.totalRewardAmount / Math.pow(10, CONVO_TOKEN_CONFIG.DECIMALS)} tokens)`);
    logs.push(`👤 User wallet: ${request.userWalletAddress.toString()}`);
    logs.push(`🏦 Treasury wallet: ${request.treasuryWallet.publicKey.toString()}`);
    if (request.conversationId) {
      logs.push(`💬 Conversation ID: ${request.conversationId}`);
    }

    // Step 1: Validate request parameters
    logs.push(`\n🔍 Step 1: Validating request parameters`);
    const validation = validateRewardRequest(request);
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

    // Step 2: Initialize Solana connection
    logs.push(`\n🔗 Step 2: Initializing Solana connection`);
    // @ts-ignore
    const connection = new Connection(
      request.rpcUrl || SOLANA_CONFIG.MAINNET_RPC_URL,
      SOLANA_CONFIG.COMMITMENT
    );
    
    // Test connection to ensure we can reach Solana mainnet
    try {
      const version = await connection.getVersion();
      logs.push(`✅ Connected to Solana mainnet (version: ${version['solana-core']})`);
    } catch (error) {
      throw new Error(`Failed to connect to Solana: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 3: Validate treasury wallet
    logs.push(`\n🏦 Step 3: Validating treasury wallet`);
    const treasuryValidation = await validateTreasuryWallet(connection, request.treasuryWallet);
    if (!treasuryValidation.valid) {
      return {
        success: false,
        userRewardAmount: 0,
        burnAmount: 0,
        error: treasuryValidation.error,
        logs: [...logs, `❌ Treasury validation failed: ${treasuryValidation.error}`]
      };
    }
    logs.push(`✅ Treasury wallet validated`);
    logs.push(`   SOL balance: ${treasuryValidation.solBalance} SOL`);
    logs.push(`   CONVO balance: ${treasuryValidation.convoBalance} CONVO`);

    // Step 4: Calculate reward distribution amounts
    logs.push(`\n💰 Step 4: Calculating reward distribution`);
    const userRewardAmount = Math.floor(request.totalRewardAmount * REWARD_DISTRIBUTION.USER_PERCENTAGE);
    const burnAmount = Math.floor(request.totalRewardAmount * REWARD_DISTRIBUTION.BURN_PERCENTAGE);
    
    logs.push(`   User reward: ${userRewardAmount} CONVO (${userRewardAmount / Math.pow(10, CONVO_TOKEN_CONFIG.DECIMALS)} tokens)`);
    logs.push(`   Burn amount: ${burnAmount} CONVO (${burnAmount / Math.pow(10, CONVO_TOKEN_CONFIG.DECIMALS)} tokens)`);
    logs.push(`   Burn percentage: ${(REWARD_DISTRIBUTION.BURN_PERCENTAGE * 100).toFixed(3)}%`);

    // Step 5: Setup user's associated token account
    logs.push(`\n🏦 Step 5: Setting up user token account`);
    const userTokenAccountInfo = await setupUserTokenAccount(
      connection,
      request.userWalletAddress,
      request.treasuryWallet
    );
    
    if (!userTokenAccountInfo.success) {
      return {
        success: false,
        userRewardAmount: 0,
        burnAmount: 0,
        error: userTokenAccountInfo.error,
        logs: [...logs, `❌ Failed to setup user token account: ${userTokenAccountInfo.error}`]
      };
    }
    
    logs.push(`✅ User token account ready: ${userTokenAccountInfo.address.toString()}`);
    if (userTokenAccountInfo.created) {
      logs.push(`   Created new associated token account`);
    } else {
      logs.push(`   Using existing associated token account`);
    }

    // Step 6: Execute the reward distribution transaction
    logs.push(`\n📝 Step 6: Executing reward distribution transaction`);
    const transactionResult = await executeRewardTransaction(
      connection,
      request.treasuryWallet,
      userTokenAccountInfo.address,
      userRewardAmount,
      burnAmount
    );

    if (!transactionResult.success) {
      return {
        success: false,
        userRewardAmount: 0,
        burnAmount: 0,
        error: transactionResult.error,
        logs: [...logs, `❌ Transaction failed: ${transactionResult.error}`]
      };
    }

    logs.push(`✅ Transaction executed successfully`);
    logs.push(`   Transaction signature: ${transactionResult.signature}`);
    if (transactionResult.blockTime) {
      logs.push(`   Block time: ${new Date(transactionResult.blockTime * 1000).toISOString()}`);
    }

    // Step 7: Verify transaction success
    logs.push(`\n🔍 Step 7: Verifying transaction`);
    if (transactionResult.signature) {
      const verificationResult = await verifyTransaction(connection, transactionResult.signature);
      if (!verificationResult.success) {
        logs.push(`⚠️ Transaction verification warning: ${verificationResult.warning}`);
      } else {
        logs.push(`✅ Transaction verified successfully`);
      }
    }

    // Step 8: Final balance verification
    logs.push(`\n💰 Step 8: Final balance verification`);
    const finalBalance = await getUserTokenBalance(connection, userTokenAccountInfo.address);
    logs.push(`   User final balance: ${finalBalance} CONVO`);

    // Calculate and log processing time
    const endTime = Date.now();
    const duration = endTime - startTime;
    logs.push(`\n🎉 CONVO reward distribution completed successfully in ${duration}ms`);

    return {
      success: true,
      userRewardAmount,
      burnAmount,
      transactionSignature: transactionResult.signature,
      userTokenAccount: userTokenAccountInfo.address.toString(),
      logs
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logs.push(`\n❌ CONVO reward distribution failed: ${errorMessage}`);
    
    return {
      success: false,
      userRewardAmount: 0,
      burnAmount: 0,
      error: errorMessage,
      logs
    };
  }
}

/**
 * Validates the reward distribution request
 */
function validateRewardRequest(request: ConvoRewardRequest): { valid: boolean; error?: string } {
  // Check if user wallet address is provided
  if (!request.userWalletAddress) {
    return { valid: false, error: 'User wallet address is required' };
  }

  // Check if treasury wallet keypair is provided
  if (!request.treasuryWallet) {
    return { valid: false, error: 'Treasury wallet keypair is required' };
  }

  // Check if reward amount is positive
  if (request.totalRewardAmount <= 0) {
    return { valid: false, error: 'Reward amount must be greater than 0' };
  }

  // Check if reward amount is within reasonable limits (1 billion CONVO max)
  if (request.totalRewardAmount > 1000000000000) {
    return { valid: false, error: 'Reward amount exceeds maximum limit of 1 billion CONVO' };
  }

  return { valid: true };
}

/**
 * Validates the treasury wallet has sufficient balances for the operation
 */
async function validateTreasuryWallet(
  connection: Connection,
  treasuryWallet: Keypair
): Promise<{ valid: boolean; error?: string; solBalance?: number; convoBalance?: number }> {
  try {
    // Check SOL balance for transaction fees (minimum 0.01 SOL recommended)
    const solBalance = await connection.getBalance(treasuryWallet.publicKey);
    const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
    
    if (solBalanceInSol < 0.01) {
      return {
        valid: false,
        error: `Insufficient SOL balance. Required: 0.01 SOL, Current: ${solBalanceInSol.toFixed(4)} SOL`
      };
    }

    // Check CONVO token balance in treasury wallet
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      CONVO_TOKEN_CONFIG.MINT_ADDRESS,
      treasuryWallet.publicKey
    );

    try {
      const tokenAccount = await getAccount(connection, treasuryTokenAccount);
      const convoBalance = Number(tokenAccount.amount);
      
      return {
        valid: true,
        solBalance: solBalanceInSol,
        convoBalance
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Treasury wallet does not have an associated token account for CONVO tokens'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate treasury wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Sets up the user's associated token account for CONVO tokens
 */
async function setupUserTokenAccount(
  connection: Connection,
  userWalletAddress: PublicKey,
  treasuryWallet: Keypair
): Promise<{ success: boolean; address: PublicKey; created: boolean; error?: string }> {
  try {
    // Get the associated token account address for the user
    const userTokenAccount = await getAssociatedTokenAddress(
      CONVO_TOKEN_CONFIG.MINT_ADDRESS,
      userWalletAddress
    );

    // Check if the associated token account already exists
    try {
      await getAccount(connection, userTokenAccount);
      return {
        success: true,
        address: userTokenAccount,
        created: false // Account already exists
      };
    } catch (error) {
      // Account doesn't exist, we'll create it in the transaction
      return {
        success: true,
        address: userTokenAccount,
        created: true // Will be created in transaction
      };
    }
  } catch (error) {
    return {
      success: false,
      address: PublicKey.default,
      created: false,
      error: `Failed to setup user token account: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Executes the reward distribution transaction with user payout and token burning
 */
async function executeRewardTransaction(
  connection: Connection,
  treasuryWallet: Keypair,
  userTokenAccount: PublicKey,
  userRewardAmount: number,
  burnAmount: number
): Promise<{ success: boolean; signature?: string; blockTime?: number; error?: string }> {
  try {
    // Get treasury's associated token account address
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      CONVO_TOKEN_CONFIG.MINT_ADDRESS,
      treasuryWallet.publicKey
    );

    // Create a new transaction
    const transaction = new Transaction();

    // Check if user's associated token account exists, if not add creation instruction
    try {
      await getAccount(connection, userTokenAccount);
    } catch (error) {
      // User's associated token account doesn't exist, add creation instruction
      const createAtaInstruction = createAssociatedTokenAccountInstruction(
        treasuryWallet.publicKey, // payer (treasury pays for account creation)
        userTokenAccount, // associated token account address
        userTokenAccount, // owner (same as user wallet address)
        CONVO_TOKEN_CONFIG.MINT_ADDRESS // mint address
      );
      transaction.add(createAtaInstruction);
    }

    // Add instruction to transfer tokens to user (99.9%)
    if (userRewardAmount > 0) {
      const userTransferInstruction = createTransferInstruction(
        treasuryTokenAccount, // source (treasury token account)
        userTokenAccount, // destination (user token account)
        treasuryWallet.publicKey, // authority (treasury wallet)
        BigInt(userRewardAmount) // amount to transfer
      );
      transaction.add(userTransferInstruction);
    }

    // Add instruction to burn tokens (0.1%) by sending to null address
    if (burnAmount > 0) {
      const burnTransferInstruction = createTransferInstruction(
        treasuryTokenAccount, // source (treasury token account)
        BURN_ADDRESS, // destination (null address for burning)
        treasuryWallet.publicKey, // authority (treasury wallet)
        BigInt(burnAmount) // amount to burn
      );
      transaction.add(burnTransferInstruction);
    }

    // Send and confirm the transaction on Solana mainnet
    logs.push(`\n📝 Step 6: Executing reward distribution transaction`);
    // @ts-ignore
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryWallet], // signers (treasury wallet)
      {
        // @ts-ignore
        commitment: SOLANA_CONFIG.COMMITMENT,
        // @ts-ignore
        preflightCommitment: SOLANA_CONFIG.PREFLIGHT_COMMITMENT,
      }
    );

    // Get transaction details for logging
    // @ts-ignore
    const transactionInfo = await connection.getTransaction(signature, {
      // @ts-ignore
      commitment: SOLANA_CONFIG.FINALITY
    });

    return {
      success: true,
      signature,
      blockTime: transactionInfo?.blockTime || undefined
    };

  } catch (error) {
    return {
      success: false,
      error: `Transaction execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Verifies that the transaction was successful
 */
async function verifyTransaction(
  connection: Connection,
  signature: string
): Promise<{ success: boolean; warning?: string }> {
  try {
    // @ts-ignore
    const transaction = await connection.getTransaction(signature, {
      // @ts-ignore
      commitment: SOLANA_CONFIG.FINALITY
    });

    if (!transaction) {
      return { success: false, warning: 'Transaction not found' };
    }

    if (transaction.meta?.err) {
      return { success: false, warning: `Transaction failed: ${JSON.stringify(transaction.meta.err)}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      warning: `Failed to verify transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Gets the user's CONVO token balance
 */
async function getUserTokenBalance(
  connection: Connection,
  userTokenAccount: PublicKey
): Promise<number> {
  try {
    const account = await getAccount(connection, userTokenAccount);
    return Number(account.amount);
  } catch (error) {
    return 0;
  }
}

/**
 * Utility function to get transaction URL for Solana Explorer
 */
export function getTransactionUrl(signature: string, network: 'mainnet' | 'devnet' = 'mainnet'): string {
  const baseUrl = network === 'mainnet' ? 'https://explorer.solana.com' : 'https://explorer.solana.com/?cluster=devnet';
  return `${baseUrl}/tx/${signature}`;
}

/**
 * Example usage function demonstrating the CONVO reward distribution
 */
export async function exampleConvoRewardDistribution(): Promise<void> {
  console.log('🎯 CONVO Token Reward Distribution Example\n');

  // Create a treasury wallet (in production, load from secure storage)
  const treasuryWallet = Keypair.generate();
  
  // User wallet from the requirements
  const userWallet = new PublicKey('DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2');
  
  // 100,000 CONVO tokens (in base units with 6 decimals)
  const totalRewardAmount = 100000 * Math.pow(10, CONVO_TOKEN_CONFIG.DECIMALS);

  const request: ConvoRewardRequest = {
    userWalletAddress: userWallet,
    totalRewardAmount,
    treasuryWallet,
    rpcUrl: SOLANA_CONFIG.MAINNET_RPC_URL,
    conversationId: 'premium-conversation-456'
  };

  try {
    console.log('Processing CONVO reward distribution...\n');
    const result = await distributeConvoReward(request);

    if (result.success) {
      console.log('✅ CONVO reward distribution successful!');
      console.log(`User received: ${result.userRewardAmount / Math.pow(10, CONVO_TOKEN_CONFIG.DECIMALS)} CONVO`);
      console.log(`Burned: ${result.burnAmount / Math.pow(10, CONVO_TOKEN_CONFIG.DECIMALS)} CONVO`);
      if (result.transactionSignature) {
        console.log(`Transaction: ${getTransactionUrl(result.transactionSignature)}`);
      }
      console.log(`User token account: ${result.userTokenAccount}`);
    } else {
      console.log('❌ CONVO reward distribution failed:', result.error);
    }

    console.log('\n📋 Process logs:');
    result.logs.forEach(log => console.log(log));

  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export configuration for external use
export { CONVO_TOKEN_CONFIG, SOLANA_CONFIG, REWARD_DISTRIBUTION, BURN_ADDRESS };
