import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  Account,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

// ConvoAI Token Configuration
export const CONVOAI_TOKEN_CONFIG = {
  MINT_ADDRESS: new PublicKey('DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon'),
  DECIMALS: 6,
  SYMBOL: 'CONVO',
  NAME: 'ConvoAI Token',
};

// Solana Network Configuration
export const SOLANA_CONFIG = {
  MAINNET_RPC_URL: 'https://api.mainnet-beta.solana.com',
  COMMITMENT: 'confirmed' as const,
  PREFLIGHT_COMMITMENT: 'confirmed' as const,
};

// Burn Address (Solana null address)
export const BURN_ADDRESS = new PublicKey('11111111111111111111111111111111');

// Reward Distribution Configuration
export const REWARD_DISTRIBUTION = {
  USER_PERCENTAGE: 0.90, // 90% to user
  BURN_PERCENTAGE: 0.10, // 10% burned
};

// Helper function to derive keypair from seed phrase (same as solana-reward-service.ts)
function deriveKeypairFromSeedPhrase(seedPhrase: string, derivationPath: string = "m/44'/501'/0'/0'"): Keypair {
  try {
    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
    return Keypair.fromSeed(derivedSeed);
  } catch (error) {
    throw new Error('Invalid seed phrase provided');
  }
}

// Types
export interface RewardPayoutRequest {
  userWalletAddress: PublicKey;
  totalRewardAmount: number; // Amount in base units (considering decimals)
  conversationId: string;
  rpcUrl?: string;
}

export interface RewardPayoutResult {
  success: boolean;
  userRewardAmount: number;
  burnAmount: number;
  userRewardTx?: string;
  burnTx?: string;
  userTokenAccount?: string;
  error?: string;
  logs: string[];
}

export interface TokenAccountInfo {
  address: PublicKey;
  balance: number;
  exists: boolean;
}

/**
 * ConvoAI Premium Plan Reward Payout Function
 * 
 * This function processes a reward payout for ConvoAI users by:
 * 1. Validating the request and treasury wallet
 * 2. Creating user's associated token account if needed
 * 3. Distributing 90% of tokens to user
 * 4. Burning 10% of tokens by sending to null address
 * 5. Confirming transaction on Solana mainnet
 * 
 * @param request - Reward payout request containing user wallet and amount
 * @returns Promise<RewardPayoutResult> - Result of the payout operation
 */
export async function processConvoAIRewardPayout(
  request: RewardPayoutRequest
): Promise<RewardPayoutResult> {
  const logs: string[] = [];
  const startTime = Date.now();

  try {
    logs.push(`🚀 Starting ConvoAI reward payout process`);
    logs.push(`📊 Total reward amount: ${request.totalRewardAmount} CONVO (${request.totalRewardAmount / Math.pow(10, CONVOAI_TOKEN_CONFIG.DECIMALS)} tokens)`);
    logs.push(`👤 User wallet: ${request.userWalletAddress.toString()}`);

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

    // Step 2: Initialize Solana connection and treasury wallet
    logs.push(`\n🔗 Step 2: Initializing Solana connection and treasury wallet`);
    const connection = new Connection(
      request.rpcUrl || SOLANA_CONFIG.MAINNET_RPC_URL,
      SOLANA_CONFIG.COMMITMENT
    );
    
    // Test connection
    try {
      const version = await connection.getVersion();
      logs.push(`✅ Connected to Solana mainnet (version: ${version['solana-core']})`);
    } catch (error) {
      throw new Error(`Failed to connect to Solana: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Initialize treasury wallet from seed phrase
    const treasurySeedPhrase = process.env.TREASURY_SEED_PHRASE;
    if (!treasurySeedPhrase) {
      throw new Error('TREASURY_SEED_PHRASE environment variable is required');
    }
    
    let treasuryWallet: Keypair;
    try {
      treasuryWallet = deriveKeypairFromSeedPhrase(treasurySeedPhrase);
      logs.push(`🏦 Treasury wallet: ${treasuryWallet.publicKey.toString()}`);
    } catch (error) {
      throw new Error('Invalid TREASURY_SEED_PHRASE provided');
    }

    // Step 3: Validate treasury wallet
    logs.push(`\n🏦 Step 3: Validating treasury wallet`);
    const treasuryValidation = await validateTreasuryWallet(connection, treasuryWallet);
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

    // Step 4: Calculate reward amounts
    logs.push(`\n💰 Step 4: Calculating reward distribution`);
    const userRewardAmount = Math.floor(request.totalRewardAmount * REWARD_DISTRIBUTION.USER_PERCENTAGE);
    const burnAmount = Math.floor(request.totalRewardAmount * REWARD_DISTRIBUTION.BURN_PERCENTAGE);
    
    logs.push(`   User reward: ${userRewardAmount} CONVO (${userRewardAmount / Math.pow(10, CONVOAI_TOKEN_CONFIG.DECIMALS)} tokens)`);
    logs.push(`   Burn amount: ${burnAmount} CONVO (${burnAmount / Math.pow(10, CONVOAI_TOKEN_CONFIG.DECIMALS)} tokens)`);

    // Step 5: Get or create user's associated token account
    logs.push(`\n🏦 Step 5: Setting up user token account`);
    const userTokenAccountInfo = await setupUserTokenAccount(
      connection,
      request.userWalletAddress,
      treasuryWallet
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
    }

    // Step 6: Execute reward transaction
    logs.push(`\n📝 Step 6: Executing reward transaction`);
    const transactionResult = await executeRewardTransaction(
      connection,
      treasuryWallet,
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

    // Step 7: Verify transaction
    logs.push(`\n🔍 Step 7: Verifying transaction`);
    if (transactionResult.signature) {
      const verificationResult = await verifyTransaction(connection, transactionResult.signature);
      if (!verificationResult.success) {
        logs.push(`⚠️ Transaction verification warning: ${verificationResult.warning}`);
      } else {
        logs.push(`✅ Transaction verified successfully`);
      }
    }

    // Step 8: Final balance check
    logs.push(`\n💰 Step 8: Final balance verification`);
    const finalBalance = await getUserTokenBalance(connection, userTokenAccountInfo.address);
    logs.push(`   User final balance: ${finalBalance} CONVO`);

    const endTime = Date.now();
    const duration = endTime - startTime;
    logs.push(`\n🎉 Reward payout completed successfully in ${duration}ms`);

    return {
      success: true,
      userRewardAmount,
      burnAmount,
      userRewardTx: transactionResult.signature,
      burnTx: transactionResult.signature, // Same transaction contains both transfers
      userTokenAccount: userTokenAccountInfo.address.toString(),
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

function validateRewardRequest(request: RewardPayoutRequest): { valid: boolean; error?: string } {
  if (!request.userWalletAddress) {
    return { valid: false, error: 'User wallet address is required' };
  }

  if (request.totalRewardAmount <= 0) {
    return { valid: false, error: 'Total reward amount must be greater than 0' };
  }

  if (!request.conversationId) {
    return { valid: false, error: 'Conversation ID is required' };
  }

  return { valid: true };
}

/**
 * Validates the treasury wallet has sufficient balances
 */
async function validateTreasuryWallet(
  connection: Connection,
  treasuryWallet: Keypair
): Promise<{ valid: boolean; error?: string; solBalance?: number; convoBalance?: number }> {
  try {
    // Check SOL balance for transaction fees
    const solBalance = await connection.getBalance(treasuryWallet.publicKey);
    const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
    
    if (solBalanceInSol < 0.01) {
      return {
        valid: false,
        error: `Insufficient SOL balance. Required: 0.01 SOL, Current: ${solBalanceInSol.toFixed(4)} SOL`
      };
    }

    // Check CONVO token balance
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      CONVOAI_TOKEN_CONFIG.MINT_ADDRESS,
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
 * Sets up user's associated token account
 */
async function setupUserTokenAccount(
  connection: Connection,
  userWalletAddress: PublicKey,
  treasuryWallet: Keypair
): Promise<{ success: boolean; address: PublicKey; created: boolean; error?: string }> {
  try {
    const userTokenAccount = await getAssociatedTokenAddress(
      CONVOAI_TOKEN_CONFIG.MINT_ADDRESS,
      userWalletAddress
    );

    try {
      await getAccount(connection, userTokenAccount);
      return { success: true, address: userTokenAccount, created: false };
    } catch (error) {
      // Account doesn't exist, create it
      const transaction = new Transaction();
      const createAtaInstruction = createAssociatedTokenAccountInstruction(
        treasuryWallet.publicKey, // payer
        userTokenAccount, // associated token account
        userWalletAddress, // owner
        CONVOAI_TOKEN_CONFIG.MINT_ADDRESS // mint
      );
      transaction.add(createAtaInstruction);

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [treasuryWallet],
        {
          commitment: SOLANA_CONFIG.COMMITMENT,
          preflightCommitment: SOLANA_CONFIG.PREFLIGHT_COMMITMENT,
        }
      );

      return { success: true, address: userTokenAccount, created: true };
    }
  } catch (error) {
    return {
      success: false,
      address: new PublicKey('11111111111111111111111111111111'),
      created: false,
      error: `Failed to setup user token account: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Executes the reward transaction
 */
async function executeRewardTransaction(
  connection: Connection,
  treasuryWallet: Keypair,
  userTokenAccount: PublicKey,
  userRewardAmount: number,
  burnAmount: number
): Promise<{ success: boolean; signature?: string; blockTime?: number; error?: string }> {
  try {
    // Get treasury token account
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      CONVOAI_TOKEN_CONFIG.MINT_ADDRESS,
      treasuryWallet.publicKey
    );

    // Create transaction
    const transaction = new Transaction();

    // Transfer tokens to user (90%)
    if (userRewardAmount > 0) {
      const userTransferInstruction = createTransferInstruction(
        treasuryTokenAccount, // source
        userTokenAccount, // destination
        treasuryWallet.publicKey, // authority
        BigInt(userRewardAmount) // amount
      );
      transaction.add(userTransferInstruction);
    }

    // Transfer tokens to burn address (10%)
    if (burnAmount > 0) {
      const burnTransferInstruction = createTransferInstruction(
        treasuryTokenAccount, // source
        BURN_ADDRESS, // destination (null address for burning)
        treasuryWallet.publicKey, // authority
        BigInt(burnAmount) // amount
      );
      transaction.add(burnTransferInstruction);
    }

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [treasuryWallet],
      {
        commitment: SOLANA_CONFIG.COMMITMENT,
        preflightCommitment: SOLANA_CONFIG.PREFLIGHT_COMMITMENT,
      }
    );

    // Get transaction details
    const transactionDetails = await connection.getTransaction(signature, {
      commitment: SOLANA_CONFIG.COMMITMENT,
    });

    return {
      success: true,
      signature,
      blockTime: transactionDetails?.blockTime || undefined
    };

  } catch (error) {
    return {
      success: false,
      error: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Verifies the transaction was successful
 */
async function verifyTransaction(
  connection: Connection,
  signature: string
): Promise<{ success: boolean; warning?: string }> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: SOLANA_CONFIG.COMMITMENT
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
 * Gets the user's token balance
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
 * Example usage function
 */
export async function exampleConvoAIRewardPayout(): Promise<void> {
  console.log('🎯 ConvoAI Premium Plan Reward Payout Example\n');

  // Example user wallet
  const userWallet = new PublicKey('6U7WS5pGJX6DGHdR8RC5QbXBx1n3Q6HupaeQtZEpsCoM');
  
  // 100,000 CONVO tokens (in base units with 6 decimals)
  const totalRewardAmount = 100000 * Math.pow(10, CONVOAI_TOKEN_CONFIG.DECIMALS);

  const request: RewardPayoutRequest = {
    userWalletAddress: userWallet,
    totalRewardAmount,
    conversationId: 'premium-conversation-123',
    rpcUrl: SOLANA_CONFIG.MAINNET_RPC_URL
  };

  try {
    console.log('Processing reward payout...\n');
    const result = await processConvoAIRewardPayout(request);

    if (result.success) {
      console.log('✅ Reward payout successful!');
      console.log(`User received: ${result.userRewardAmount / Math.pow(10, CONVOAI_TOKEN_CONFIG.DECIMALS)} CONVO`);
      console.log(`Burned: ${result.burnAmount / Math.pow(10, CONVOAI_TOKEN_CONFIG.DECIMALS)} CONVO`);
      if (result.userRewardTx) {
        console.log(`Transaction: ${getTransactionUrl(result.userRewardTx)}`);
      }
      console.log(`User token account: ${result.userTokenAccount}`);
    } else {
      console.log('❌ Reward payout failed:', result.error);
    }

    console.log('\n📋 Process logs:');
    result.logs.forEach(log => console.log(log));

  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export configuration for external use
export { CONVOAI_TOKEN_CONFIG, SOLANA_CONFIG, REWARD_DISTRIBUTION, BURN_ADDRESS };