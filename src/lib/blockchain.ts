// TRON blockchain integration for USDT payments
const TronWeb = require('tronweb');

export interface PaymentDetails {
  amount: number;
  currency: 'USDT';
  plan: 'pro' | 'premium';
  userId: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
}

export interface SubscriptionContract {
  address: string;
  userId: string;
  plan: 'pro' | 'premium';
  amount: number;
  interval: number; // in seconds (monthly = 30 * 24 * 60 * 60)
  nextPayment: Date;
  isActive: boolean;
}

// TRON network configuration
const TRON_CONFIG = {
  fullHost: process.env.TRON_FULL_HOST || 'https://api.trongrid.io',
  headers: { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY || '' },
  privateKey: process.env.TRON_PRIVATE_KEY || '',
};

// USDT contract address on TRON (TRC20)
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// ConvoAI USDT recipient address
export const CONVO_AI_RECIPIENT_ADDRESS = 'TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ';

// Initialize TronWeb
let tronWeb: any;
if (typeof window !== 'undefined' && (window as any).tronLink) {
  // Browser environment with TronLink
  tronWeb = (window as any).tronLink.tronWeb;
} else {
  // Server environment
  tronWeb = new TronWeb(
    TRON_CONFIG.fullHost,
    TRON_CONFIG.fullHost,
    TRON_CONFIG.fullHost,
    TRON_CONFIG.privateKey
  );
}

export class TronPaymentService {
  private static instance: TronPaymentService;
  private payments: PaymentDetails[] = [];
  private subscriptions: SubscriptionContract[] = [];

  static getInstance(): TronPaymentService {
    if (!TronPaymentService.instance) {
      TronPaymentService.instance = new TronPaymentService();
    }
    return TronPaymentService.instance;
  }

  // Connect to TronLink wallet
  async connectWallet(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && (window as any).tronLink) {
        const tronLink = (window as any).tronLink;
        
        if (!tronLink.ready) {
          await new Promise(resolve => {
            const interval = setInterval(() => {
              if (tronLink.ready) {
                clearInterval(interval);
                resolve(true);
              }
            }, 100);
          });
        }

        const accounts = await tronLink.request({ method: 'tron_requestAccounts' });
        return accounts[0] || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  // Get wallet balance
  async getWalletBalance(address: string): Promise<{ TRX: number; USDT: number }> {
    try {
      // Get TRX balance
      const trxBalance = await tronWeb.trx.getBalance(address);
      const trxAmount = tronWeb.fromSun(trxBalance);

      // Get USDT balance
      const contract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
      const usdtBalance = await contract.balanceOf(address).call();
      const usdtAmount = usdtBalance.toNumber() / 1000000; // USDT has 6 decimals

      return {
        TRX: parseFloat(trxAmount),
        USDT: usdtAmount
      };
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return { TRX: 0, USDT: 0 };
    }
  }

  // Create payment for subscription
  async createPayment(userId: string, plan: 'pro' | 'premium'): Promise<PaymentDetails> {
    const amount = plan === 'pro' ? 20 : 40;
    
    const payment: PaymentDetails = {
      amount,
      currency: 'USDT',
      plan,
      userId,
      status: 'pending',
      createdAt: new Date()
    };

    this.payments.push(payment);
    return payment;
  }

  // Process USDT payment
  async processPayment(
    fromAddress: string, 
    toAddress: string, 
    amount: number, 
    userId: string
  ): Promise<string | null> {
    try {
      const contract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
      
      // Convert amount to contract units (USDT has 6 decimals)
      const amountInUnits = amount * 1000000;

      // Send USDT transaction
      const transaction = await contract.transfer(toAddress, amountInUnits).send({
        from: fromAddress,
        shouldPollResponse: true
      });

      // Update payment status
      const payment = this.payments.find(p => p.userId === userId && p.status === 'pending');
      if (payment) {
        payment.transactionHash = transaction;
        payment.status = 'confirmed';
      }

      return transaction;
    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Update payment status to failed
      const payment = this.payments.find(p => p.userId === userId && p.status === 'pending');
      if (payment) {
        payment.status = 'failed';
      }
      
      return null;
    }
  }

  // Verify transaction on blockchain
  async verifyTransaction(txHash: string): Promise<boolean> {
    try {
      const transaction = await tronWeb.trx.getTransaction(txHash);
      return transaction && transaction.ret && transaction.ret[0].contractRet === 'SUCCESS';
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return false;
    }
  }

  // Create subscription smart contract (simplified version)
  async createSubscription(
    userId: string, 
    plan: 'pro' | 'premium', 
    userAddress: string
  ): Promise<SubscriptionContract | null> {
    try {
      const amount = plan === 'pro' ? 20 : 40;
      const interval = 30 * 24 * 60 * 60; // 30 days in seconds
      
      // In a real implementation, you would deploy a smart contract here
      // For now, we'll simulate the subscription
      const subscription: SubscriptionContract = {
        address: this.generateContractAddress(),
        userId,
        plan,
        amount,
        interval,
        nextPayment: new Date(Date.now() + interval * 1000),
        isActive: true
      };

      this.subscriptions.push(subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      return null;
    }
  }

  // Check and process recurring payments
  async processRecurringPayments(): Promise<void> {
    const now = new Date();
    
    for (const subscription of this.subscriptions) {
      if (subscription.isActive && subscription.nextPayment <= now) {
        // Process recurring payment
        console.log(`Processing recurring payment for user ${subscription.userId}`);
        
        // Update next payment date
        subscription.nextPayment = new Date(now.getTime() + subscription.interval * 1000);
      }
    }
  }

  // Get user's payment history
  getPaymentHistory(userId: string): PaymentDetails[] {
    return this.payments.filter(p => p.userId === userId);
  }

  // Get user's subscription status
  getSubscriptionStatus(userId: string): SubscriptionContract | null {
    return this.subscriptions.find(s => s.userId === userId && s.isActive) || null;
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<boolean> {
    const subscription = this.subscriptions.find(s => s.userId === userId && s.isActive);
    if (subscription) {
      subscription.isActive = false;
      return true;
    }
    return false;
  }

  private generateContractAddress(): string {
    return 'T' + Math.random().toString(36).substring(2, 34).toUpperCase();
  }
}

// Utility functions
export function formatTronAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function validateTronAddress(address: string): boolean {
  return address.length === 34 && address.startsWith('T');
}

export function getPlanPrice(plan: 'pro' | 'premium'): number {
  return plan === 'pro' ? 20 : 40;
}

// Export singleton instance
export const tronPaymentService = TronPaymentService.getInstance(); 