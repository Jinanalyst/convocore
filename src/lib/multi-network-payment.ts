"use client";

export interface NetworkConfig {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  recipientAddress: string;
  usdtContractAddress?: string;
  rpcUrl: string;
  chainId?: number;
  blockExplorer: string;
  type: 'evm' | 'tron' | 'solana' | 'paypal' | 'ton';
  paypalUrl?: string;
}

export interface PaymentRequest {
  networkId: string;
  amount: number;
  plan: 'pro' | 'premium';
  userId: string;
  userAddress: string;
}

export interface PaymentStatus {
  id: string;
  networkId: string;
  amount: number;
  plan: 'pro' | 'premium';
  userId: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  createdAt: Date;
  confirmedAt?: Date;
  expiresAt: Date;
}

// PayPal payment URLs
export const PAYPAL_URLS = {
  pro: 'https://www.paypal.com/ncp/payment/ZVNF5H9PJAJRL',
  premium: 'https://www.paypal.com/ncp/payment/QL3NEJLQHX3LW'
};

// Network configurations with your provided addresses
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: '🌅',
    recipientAddress: '2zmewxtyL83t6WLkSPpQtdDiK5Nmd5KSn71HKC7TEGcU',
    usdtContractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://solscan.io',
    type: 'solana'
  },
  {
    id: 'convoai',
    name: 'ConvoAI Token',
    symbol: 'CONVO',
    icon: '🤖',
    recipientAddress: 'DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon',
    usdtContractAddress: 'DHyRK8gue96rB8QxAg7d16ghDjxvRERJramcGCFNmoon',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://solscan.io',
    type: 'solana'
  },
  {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    icon: '🔵',
    recipientAddress: 'EQD5mxRgCuRNLxKxeOjG6r14iSroLF5FtomPnet-sgP5xNJb',
    rpcUrl: 'https://toncenter.com/api/v2',
    blockExplorer: 'https://tonscan.org',
    type: 'ton'
  }
];

export class MultiNetworkPaymentService {
  private static instance: MultiNetworkPaymentService;
  private payments: Map<string, PaymentStatus> = new Map();

  static getInstance(): MultiNetworkPaymentService {
    if (!MultiNetworkPaymentService.instance) {
      MultiNetworkPaymentService.instance = new MultiNetworkPaymentService();
    }
    return MultiNetworkPaymentService.instance;
  }

  // Get network configuration
  getNetwork(networkId: string): NetworkConfig | null {
    return SUPPORTED_NETWORKS.find(n => n.id === networkId) || null;
  }

  // Get all supported networks
  getSupportedNetworks(): NetworkConfig[] {
    return SUPPORTED_NETWORKS;
  }

  // Create payment request
  createPaymentRequest(request: PaymentRequest): PaymentStatus {
    const paymentId = this.generatePaymentId();
    const payment: PaymentStatus = {
      id: paymentId,
      networkId: request.networkId,
      amount: request.amount,
      plan: request.plan,
      userId: request.userId,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    this.payments.set(paymentId, payment);
    return payment;
  }

  // Process payment based on network type
  async processPayment(paymentId: string, userAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'pending') {
      return { success: false, error: 'Payment already processed' };
    }

    if (new Date() > payment.expiresAt) {
      payment.status = 'expired';
      return { success: false, error: 'Payment expired' };
    }

    const network = this.getNetwork(payment.networkId);
    if (!network) {
      return { success: false, error: 'Network not supported' };
    }

    try {
      let txHash: string | null = null;
      // Only allow solana-type networks
      switch (network.type) {
        case 'solana':
          txHash = await this.processSolanaPayment(payment, userAddress, network);
          break;
        default:
          return { success: false, error: 'Network type not supported' };
      }

      if (txHash) {
        payment.txHash = txHash;
        payment.status = 'confirmed';
        payment.confirmedAt = new Date();
        return { success: true, txHash };
      } else {
        payment.status = 'failed';
        return { success: false, error: 'Transaction failed' };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      payment.status = 'failed';
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Process Solana payment
  private async processSolanaPayment(payment: PaymentStatus, userAddress: string, network: NetworkConfig): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).solana) {
      throw new Error('Solana wallet not available');
    }

    const { Connection, PublicKey, Transaction } = await import("@solana/web3.js");
    const { getAssociatedTokenAddress, createTransferInstruction } = await import("@solana/spl-token");

    const connection = new Connection(network.rpcUrl, "confirmed");

    const payer = new PublicKey(userAddress);
    const recipient = new PublicKey(network.recipientAddress);
    const usdtMint = new PublicKey(network.usdtContractAddress!);

    // Derive associated token accounts
    const senderAta = await getAssociatedTokenAddress(usdtMint, payer);
    const recipientAta = await getAssociatedTokenAddress(usdtMint, recipient);

    // Amount in smallest units (USDT has 6 decimals)
    const amount = BigInt(payment.amount * 1_000_000);

    const transferIx = createTransferInstruction(
      senderAta,
      recipientAta,
      payer,
      amount
    );

    const transaction = new Transaction().add(transferIx);
    transaction.feePayer = payer;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const solana = (window as any).solana;
    const signed = await solana.signAndSendTransaction(transaction);

    // Wait for confirmation
    await connection.confirmTransaction(signed.signature, "confirmed");

    return signed.signature as string;
  }

  // Verify payment on blockchain
  async verifyPayment(paymentId: string): Promise<{ verified: boolean; confirmations?: number }> {
    const payment = this.payments.get(paymentId);
    if (!payment || !payment.txHash) {
      return { verified: false };
    }

    const network = this.getNetwork(payment.networkId);
    if (!network) {
      return { verified: false };
    }

    try {
      switch (network.type) {
        case 'solana':
          return await this.verifySolanaTransaction(payment.txHash);
        default:
          return { verified: false };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return { verified: false };
    }
  }

  // Verify Solana transaction
  private async verifySolanaTransaction(txHash: string): Promise<{ verified: boolean; confirmations?: number }> {
    try {
      const response = await fetch(SUPPORTED_NETWORKS.find(n => n.id === 'solana')!.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [txHash, 'json']
        })
      });

      const data = await response.json();
      return { verified: !!data.result, confirmations: data.result?.meta?.status?.Ok ? 1 : 0 };
    } catch (error) {
      console.error('Solana verification error:', error);
      return { verified: false };
    }
  }

  // Get payment status
  getPaymentStatus(paymentId: string): PaymentStatus | null {
    return this.payments.get(paymentId) || null;
  }

  // Get user payments
  getUserPayments(userId: string): PaymentStatus[] {
    return Array.from(this.payments.values()).filter(p => p.userId === userId);
  }

  // Generate payment ID
  private generatePaymentId(): string {
    return 'pay_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // Get plan price
  getPlanPrice(plan: 'pro' | 'premium'): number {
    return plan === 'pro' ? 150 : 200;
  }

  getPayPalUrl(plan: 'pro' | 'premium'): string | null {
    return plan === 'pro' ? PAYPAL_URLS.pro : PAYPAL_URLS.premium;
  }

  // Format address for display
  formatAddress(address: string, network: NetworkConfig): string {
    if (network.type === 'solana') {
      return address.slice(0, 8) + '...' + address.slice(-8);
    }
    return address.slice(0, 6) + '...' + address.slice(-4);
  }

  // Get transaction URL
  getTransactionUrl(txHash: string, network: NetworkConfig): string {
    switch (network.type) {
      case 'solana':
        return `${network.blockExplorer}/tx/${txHash}`;
      default:
        return '';
    }
  }
}

export const multiNetworkPaymentService = MultiNetworkPaymentService.getInstance();

// Add TON verification logic
export async function verifyTonPayment(txHash: string, expectedAddress: string, expectedMemo: string, expectedAmount: number): Promise<boolean> {
  // Example using tonapi.io (replace with your preferred TON API)
  try {
    const res = await fetch(`https://tonapi.io/v2/blockchain/transactions/${txHash}`);
    if (!res.ok) return false;
    const tx = await res.json();
    // Check destination, memo, and amount
    const to = tx.in_msg.destination;
    const memo = tx.in_msg.comment || tx.in_msg.payload || '';
    const amount = parseFloat(tx.in_msg.value) / 1e9; // TON has 9 decimals
    return (
      to === expectedAddress &&
      memo.includes(expectedMemo) &&
      amount >= expectedAmount
    );
  } catch (e) {
    return false;
  }
} 