// TRON blockchain integration for USDT payments
// TronWeb is only available in browser environment

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

// Initialize TronWeb (client-side only)
let tronWeb: any = null;

function getTronWeb() {
  if (typeof window !== 'undefined') {
    if ((window as any).tronLink && (window as any).tronLink.tronWeb) {
      return (window as any).tronLink.tronWeb;
    }
  }
  return null;
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
      const tronWeb = getTronWeb();
      if (!tronWeb) {
        throw new Error('TronWeb not available');
      }

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
      const tronWeb = getTronWeb();
      if (!tronWeb) {
        throw new Error('TronWeb not available');
      }

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
      const tronWeb = getTronWeb();
      if (!tronWeb) {
        throw new Error('TronWeb not available');
      }

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

  // New method to verify and process incoming payment
  async verifyAndProcessIncomingPayment(txHash: string): Promise<{
    success: boolean;
    plan?: 'pro' | 'premium';
    amount?: number;
    error?: string;
  }> {
    try {
      const tronWeb = getTronWeb();
      if (!tronWeb) {
        throw new Error('TronWeb not available');
      }

      // Get transaction details
      const transaction = await tronWeb.trx.getTransaction(txHash);
      
      if (!transaction || !transaction.ret || transaction.ret[0].contractRet !== 'SUCCESS') {
        return { success: false, error: 'Transaction not found or failed' };
      }

      // Check if it's a USDT transfer to our recipient address
      const contract = transaction.raw_data.contract[0];
      if (contract.type === 'TriggerSmartContract') {
        const parameter = contract.parameter.value;
        
        // Decode the USDT transfer data
        const contractAddress = tronWeb.address.fromHex(parameter.contract_address);
        if (contractAddress === USDT_CONTRACT_ADDRESS) {
          // This is a USDT transaction
          const recipientAddress = process.env.NEXT_PUBLIC_TRON_RECIPIENT_ADDRESS || CONVO_AI_RECIPIENT_ADDRESS;
          
          // Decode transfer amount (simplified - in real implementation you'd decode the data field)
          // For now, we'll use the transaction info from TronScan API
          const amount = await this.getTransactionAmount(txHash);
                     const plan = detectPlanFromAmount(amount);
          
          if (plan) {
            return {
              success: true,
              plan,
              amount
            };
          } else {
            return {
              success: false,
              error: `Amount ${amount} USDT doesn't match any subscription plan`
            };
          }
        }
      }
      
      return { success: false, error: 'Not a USDT transaction to our address' };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: 'Failed to verify transaction' };
    }
  }

  // Helper method to get transaction amount (simplified)
  private async getTransactionAmount(txHash: string): Promise<number> {
    try {
      // In a real implementation, you would:
      // 1. Use TronScan API to get transaction details
      // 2. Decode the smart contract data to get the exact amount
      // For now, we'll return a placeholder
      
      // This is a simplified version - you'd need to implement proper USDT transaction parsing
      const response = await fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`);
      const data = await response.json();
      
      if (data.trc20TransferInfo && data.trc20TransferInfo.length > 0) {
        const transfer = data.trc20TransferInfo[0];
        return parseFloat(transfer.amount_str) / Math.pow(10, transfer.decimals);
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting transaction amount:', error);
      return 0;
    }
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

// New function to detect plan based on USDT amount
export function detectPlanFromAmount(amount: number): 'pro' | 'premium' | null {
  if (amount >= 35 && amount <= 45) {
    return 'premium'; // 40 USDT ± 5 USDT tolerance
  } else if (amount >= 15 && amount <= 25) {
    return 'pro'; // 20 USDT ± 5 USDT tolerance
  }
  return null; // Amount doesn't match any plan
}

// New function to monitor incoming transactions
export async function monitorIncomingPayments(
  recipientAddress: string,
  onPaymentReceived: (payment: {
    amount: number;
    plan: 'pro' | 'premium' | null;
    txHash: string;
    fromAddress: string;
    timestamp: Date;
  }) => void
): Promise<void> {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    // Get recent transactions for the recipient address
    const transactions = await tronWeb.trx.getTransactionsFromAddress(recipientAddress, 10);
    
    for (const tx of transactions) {
      if (tx.raw_data && tx.raw_data.contract && tx.raw_data.contract[0]) {
        const contract = tx.raw_data.contract[0];
        
        // Check if it's a USDT transfer
        if (contract.type === 'TransferContract' && 
            contract.parameter && 
            contract.parameter.value) {
          
          const value = contract.parameter.value;
          if (value.to_address === recipientAddress) {
            // This is an incoming transaction
            const amount = value.amount / 1000000; // Convert from USDT units
            const plan = detectPlanFromAmount(amount);
            
            onPaymentReceived({
              amount,
              plan,
              txHash: tx.txID,
              fromAddress: value.owner_address,
              timestamp: new Date(tx.raw_data.timestamp)
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error monitoring payments:', error);
  }
}

// Export singleton instance
export const tronPaymentService = TronPaymentService.getInstance(); 