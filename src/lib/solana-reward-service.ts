import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
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
} from '@solana/spl-token';

// ConvoAI Token Configuration
export const CONVOAI_TOKEN_MINT = new PublicKey('DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon');
export const BURN_ADDRESS = new PublicKey('11111111111111111111111111111111');
export const SOLANA_NULL_ADDRESS = new PublicKey('11111111111111111111111111111111');

// Network Configuration
export const SOLANA_NETWORK = process.env.SOLANA_NETWORK === 'devnet' ? 'devnet' : 'mainnet-beta';
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 
  (SOLANA_NETWORK === 'devnet' 
    ? 'https://api.devnet.solana.com' 
    : 'https://api.mainnet-beta.solana.com');

// Reward Configuration
export const REWARD_CONFIG = {
  MAX_DAILY_REWARDS: 1000, // Maximum tokens per user per day
  MIN_CONVERSATION_LENGTH: 50, // Minimum characters for meaningful conversation
  BURN_PERCENTAGE: 0.10, // 10% burn
  USER_REWARD_PERCENTAGE: 0.90, // 90% to user
  RATE_LIMIT_WINDOW: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Types
export interface RewardRequest {
  userWalletAddress: PublicKey;
  rewardAmount: number;
  conversationId: string;
  conversationLength: number;
  timestamp: number;
}

export interface RewardResult {
  success: boolean;
  userRewardTx?: string;
  burnTx?: string;
  error?: string;
  userRewardAmount: number;
  burnAmount: number;
}

export interface DailyRewardLimit {
  userId: string;
  totalRewarded: number;
  lastRewardTime: number;
  dailyLimit: number;
}

// Rate limiting and abuse prevention
class RateLimiter {
  private dailyRewards: Map<string, DailyRewardLimit> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId);
    
    if (!userRequests || now > userRequests.resetTime) {
      this.requestCounts.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return false;
    }
    
    if (userRequests.count >= 10) { // Max 10 requests per minute
      return true;
    }
    
    userRequests.count++;
    return false;
  }

  checkDailyLimit(userId: string, requestedAmount: number): boolean {
    const now = Date.now();
    const dailyReward = this.dailyRewards.get(userId);
    
    if (!dailyReward || now - dailyReward.lastRewardTime > REWARD_CONFIG.RATE_LIMIT_WINDOW) {
      this.dailyRewards.set(userId, {
        userId,
        totalRewarded: requestedAmount,
        lastRewardTime: now,
        dailyLimit: REWARD_CONFIG.MAX_DAILY_REWARDS,
      });
      return true;
    }
    
    if (dailyReward.totalRewarded + requestedAmount > dailyReward.dailyLimit) {
      return false;
    }
    
    dailyReward.totalRewarded += requestedAmount;
    dailyReward.lastRewardTime = now;
    return true;
  }

  getDailyRewardInfo(userId: string): DailyRewardLimit | null {
    return this.dailyRewards.get(userId) || null;
  }
}

// Main Solana Reward Service
export class SolanaRewardService {
  private connection: Connection;
  private treasuryWallet: Keypair;
  private rateLimiter: RateLimiter;
  private isInitialized: boolean = false;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    this.rateLimiter = new RateLimiter();
    
    // Initialize treasury wallet from environment
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!treasuryPrivateKey) {
      throw new Error('TREASURY_PRIVATE_KEY environment variable is required');
    }
    
    try {
      const privateKeyArray = JSON.parse(treasuryPrivateKey);
      this.treasuryWallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } catch (error) {
      throw new Error('Invalid TREASURY_PRIVATE_KEY format. Expected JSON array of numbers.');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verify treasury wallet has sufficient SOL for transactions
      const balance = await this.connection.getBalance(this.treasuryWallet.publicKey);
      const minBalance = 0.01 * LAMPORTS_PER_SOL; // Minimum 0.01 SOL for fees
      
      if (balance < minBalance) {
        throw new Error(`Treasury wallet has insufficient SOL balance. Required: ${minBalance / LAMPORTS_PER_SOL} SOL, Current: ${balance / LAMPORTS_PER_SOL} SOL`);
      }

      // Verify treasury wallet has ConvoAI tokens
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        CONVOAI_TOKEN_MINT,
        this.treasuryWallet.publicKey
      );
      
      try {
        const tokenAccount = await getAccount(this.connection, treasuryTokenAccount);
        console.log(`Treasury token balance: ${tokenAccount.amount}`);
      } catch (error) {
        throw new Error('Treasury wallet does not have an associated token account for ConvoAI tokens');
      }

      this.isInitialized = true;
      console.log('SolanaRewardService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SolanaRewardService:', error);
      throw error;
    }
  }

  async processReward(request: RewardRequest): Promise<RewardResult> {
    try {
      await this.initialize();

      // Validate request
      const validation = this.validateRewardRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          userRewardAmount: 0,
          burnAmount: 0,
        };
      }

      // Rate limiting and abuse prevention
      const userId = request.userWalletAddress.toString();
      
      if (this.rateLimiter.isRateLimited(userId)) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please wait before requesting another reward.',
          userRewardAmount: 0,
          burnAmount: 0,
        };
      }

      if (!this.rateLimiter.checkDailyLimit(userId, request.rewardAmount)) {
        return {
          success: false,
          error: 'Daily reward limit exceeded.',
          userRewardAmount: 0,
          burnAmount: 0,
        };
      }

      // Calculate reward amounts
      const userRewardAmount = Math.floor(request.rewardAmount * REWARD_CONFIG.USER_REWARD_PERCENTAGE);
      const burnAmount = Math.floor(request.rewardAmount * REWARD_CONFIG.BURN_PERCENTAGE);

      // Log the reward attempt
      console.log(`Processing reward for user ${userId}:`, {
        totalAmount: request.rewardAmount,
        userReward: userRewardAmount,
        burnAmount: burnAmount,
        conversationId: request.conversationId,
      });

      // Process the reward transaction
      const result = await this.executeRewardTransaction(
        request.userWalletAddress,
        userRewardAmount,
        burnAmount
      );

      // Log successful transaction
      if (result.success) {
        console.log(`Reward processed successfully for user ${userId}:`, {
          userRewardTx: result.userRewardTx,
          burnTx: result.burnTx,
          userRewardAmount: result.userRewardAmount,
          burnAmount: result.burnAmount,
        });
      }

      return result;
    } catch (error) {
      console.error('Error processing reward:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        userRewardAmount: 0,
        burnAmount: 0,
      };
    }
  }

  private validateRewardRequest(request: RewardRequest): { valid: boolean; error?: string } {
    if (!request.userWalletAddress) {
      return { valid: false, error: 'User wallet address is required' };
    }

    if (request.rewardAmount <= 0) {
      return { valid: false, error: 'Reward amount must be greater than 0' };
    }

    if (request.rewardAmount > REWARD_CONFIG.MAX_DAILY_REWARDS) {
      return { valid: false, error: `Reward amount exceeds maximum daily limit of ${REWARD_CONFIG.MAX_DAILY_REWARDS}` };
    }

    if (request.conversationLength < REWARD_CONFIG.MIN_CONVERSATION_LENGTH) {
      return { valid: false, error: `Conversation too short. Minimum ${REWARD_CONFIG.MIN_CONVERSATION_LENGTH} characters required` };
    }

    return { valid: true };
  }

  private async executeRewardTransaction(
    userWalletAddress: PublicKey,
    userRewardAmount: number,
    burnAmount: number
  ): Promise<RewardResult> {
    try {
      // Get treasury token account
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        CONVOAI_TOKEN_MINT,
        this.treasuryWallet.publicKey
      );

      // Get or create user token account
      const userTokenAccount = await getAssociatedTokenAddress(
        CONVOAI_TOKEN_MINT,
        userWalletAddress
      );

      // Create transaction
      const transaction = new Transaction();

      // Check if user token account exists
      try {
        await getAccount(this.connection, userTokenAccount);
      } catch (error) {
        // Create associated token account for user
        const createAtaInstruction = createAssociatedTokenAccountInstruction(
          this.treasuryWallet.publicKey,
          userTokenAccount,
          userWalletAddress,
          CONVOAI_TOKEN_MINT
        );
        transaction.add(createAtaInstruction);
      }

      // Transfer tokens to user (90%)
      if (userRewardAmount > 0) {
        const userTransferInstruction = createTransferInstruction(
          treasuryTokenAccount,
          userTokenAccount,
          this.treasuryWallet.publicKey,
          BigInt(userRewardAmount)
        );
        transaction.add(userTransferInstruction);
      }

      // Transfer tokens to burn address (10%)
      if (burnAmount > 0) {
        const burnTransferInstruction = createTransferInstruction(
          treasuryTokenAccount,
          SOLANA_NULL_ADDRESS,
          this.treasuryWallet.publicKey,
          BigInt(burnAmount)
        );
        transaction.add(burnTransferInstruction);
      }

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.treasuryWallet],
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
        }
      );

      return {
        success: true,
        userRewardTx: signature,
        burnTx: signature, // Same transaction contains both transfers
        userRewardAmount,
        burnAmount,
      };
    } catch (error) {
      console.error('Transaction execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
        userRewardAmount,
        burnAmount,
      };
    }
  }

  // Utility methods
  async getTreasuryBalance(): Promise<{ sol: number; tokens: number }> {
    try {
      const solBalance = await this.connection.getBalance(this.treasuryWallet.publicKey);
      const tokenAccount = await getAssociatedTokenAddress(
        CONVOAI_TOKEN_MINT,
        this.treasuryWallet.publicKey
      );
      
      const tokenBalance = await getAccount(this.connection, tokenAccount);
      
      return {
        sol: solBalance / LAMPORTS_PER_SOL,
        tokens: Number(tokenBalance.amount),
      };
    } catch (error) {
      console.error('Failed to get treasury balance:', error);
      return { sol: 0, tokens: 0 };
    }
  }

  async getUserTokenBalance(userWalletAddress: PublicKey): Promise<number> {
    try {
      const userTokenAccount = await getAssociatedTokenAddress(
        CONVOAI_TOKEN_MINT,
        userWalletAddress
      );
      
      const tokenAccount = await getAccount(this.connection, userTokenAccount);
      return Number(tokenAccount.amount);
    } catch (error) {
      // User doesn't have a token account yet
      return 0;
    }
  }

  getDailyRewardInfo(userId: string): DailyRewardLimit | null {
    return this.rateLimiter.getDailyRewardInfo(userId);
  }

  // Security and monitoring methods
  async validateTreasuryWallet(): Promise<boolean> {
    try {
      const balance = await this.connection.getBalance(this.treasuryWallet.publicKey);
      return balance > 0.01 * LAMPORTS_PER_SOL; // At least 0.01 SOL for fees
    } catch (error) {
      console.error('Treasury wallet validation failed:', error);
      return false;
    }
  }

  async getTransactionHistory(userWalletAddress: PublicKey, limit: number = 10): Promise<any[]> {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        userWalletAddress,
        { limit }
      );
      
      return signatures.map(sig => ({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime,
        err: sig.err,
      }));
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }
}

// Singleton instance
let rewardServiceInstance: SolanaRewardService | null = null;

export function getSolanaRewardService(): SolanaRewardService {
  if (!rewardServiceInstance) {
    rewardServiceInstance = new SolanaRewardService();
  }
  return rewardServiceInstance;
}

// Export configuration for external use
export { REWARD_CONFIG, SOLANA_NETWORK, SOLANA_RPC_URL }; 