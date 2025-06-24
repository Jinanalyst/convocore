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
  type: 'evm' | 'tron' | 'solana' | 'paypal';
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
    id: 'paypal',
    name: 'PayPal',
    symbol: 'USD',
    icon: '💳',
    recipientAddress: 'PayPal Checkout',
    rpcUrl: '',
    blockExplorer: '',
    type: 'paypal',
    paypalUrl: PAYPAL_URLS.pro // Default to pro, will be dynamically selected in payment processing
  },
  {
    id: 'tron',
    name: 'TRON',
    symbol: 'TRX',
    icon: '🔗',
    recipientAddress: 'TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ',
    usdtContractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    rpcUrl: 'https://api.trongrid.io',
    blockExplorer: 'https://tronscan.org',
    type: 'tron'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    recipientAddress: '0x7a459149d910087d358cb46a9f70fd650738f446',
    usdtContractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 1,
    blockExplorer: 'https://etherscan.io',
    type: 'evm'
  },
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    icon: '🟡',
    recipientAddress: '0x7a459149d910087d358cb46a9f70fd650738f446',
    usdtContractAddress: '0x55d398326f99059fF775485246999027B3197955',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    blockExplorer: 'https://bscscan.com',
    type: 'evm'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '🟣',
    recipientAddress: '0x7a459149d910087d358cb46a9f70fd650738f446',
    usdtContractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    blockExplorer: 'https://polygonscan.com',
    type: 'evm'
  },
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

      switch (network.type) {
        case 'paypal':
          return await this.processPayPalPayment(payment, network);
        case 'tron':
          txHash = await this.processTronPayment(payment, userAddress, network);
          break;
        case 'evm':
          txHash = await this.processEVMPayment(payment, userAddress, network);
          break;
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

  // Process PayPal payment
  private async processPayPalPayment(payment: PaymentStatus, network: NetworkConfig): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const paypalUrl = payment.plan === 'pro' ? PAYPAL_URLS.pro : PAYPAL_URLS.premium;
      
      if (!paypalUrl) {
        return { success: false, error: 'PayPal URL not configured for this plan' };
      }

      // Open PayPal checkout in a new window
      const paypalWindow = window.open(paypalUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      if (!paypalWindow) {
        return { success: false, error: 'Please allow popups for PayPal checkout' };
      }

      // Set payment as pending - it will be confirmed manually or via webhook
      payment.status = 'pending';
      payment.txHash = `paypal_${payment.id}_${Date.now()}`;
      
      return { 
        success: true, 
        txHash: payment.txHash,
        error: 'PayPal checkout opened. Please complete your payment and return to this page.'
      };
    } catch (error) {
      console.error('PayPal payment error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'PayPal payment failed' };
    }
  }

  // Process TRON payment
  private async processTronPayment(payment: PaymentStatus, userAddress: string, network: NetworkConfig): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).tronLink) {
      throw new Error('TronLink wallet not available');
    }

    const tronWeb = (window as any).tronLink.tronWeb;
    if (!tronWeb) {
      throw new Error('TronWeb not initialized');
    }

    const contract = await tronWeb.contract().at(network.usdtContractAddress);
    const amountInUnits = payment.amount * 1000000; // USDT has 6 decimals

    const transaction = await contract.transfer(network.recipientAddress, amountInUnits).send({
      from: userAddress,
      shouldPollResponse: true
    });

    return transaction;
  }

  // Process EVM payment (Ethereum, BSC, Polygon)
  private async processEVMPayment(payment: PaymentStatus, userAddress: string, network: NetworkConfig): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Ethereum wallet not available');
    }

    // Switch to correct network if needed
    if (network.chainId) {
      await this.switchEVMNetwork(network.chainId);
    }

    const ethereum = (window as any).ethereum;
    
    // USDT transfer function signature and data
    const transferFunction = '0xa9059cbb'; // transfer(address,uint256)
    const recipientAddress = network.recipientAddress.slice(2).padStart(64, '0');
    const amountInUnits = (payment.amount * 1000000).toString(16).padStart(64, '0'); // USDT has 6 decimals
    const data = transferFunction + recipientAddress + amountInUnits;

    const transactionParameters = {
      from: userAddress,
      to: network.usdtContractAddress,
      data: data,
      gas: '0x15F90', // 90000 gas limit
    };

    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });

    return txHash;
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

  // Switch EVM network
  private async switchEVMNetwork(chainId: number): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Ethereum wallet not available');
    }

    const ethereum = (window as any).ethereum;
    const chainIdHex = '0x' + chainId.toString(16);

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        const network = SUPPORTED_NETWORKS.find(n => n.chainId === chainId);
        if (network) {
          await this.addEVMNetwork(network);
        }
      } else {
        throw switchError;
      }
    }
  }

  // Add EVM network to wallet
  private async addEVMNetwork(network: NetworkConfig): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Ethereum wallet not available');
    }

    const ethereum = (window as any).ethereum;
    const chainIdHex = '0x' + network.chainId!.toString(16);

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex,
        chainName: network.name,
        nativeCurrency: {
          name: network.symbol,
          symbol: network.symbol,
          decimals: 18
        },
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.blockExplorer]
      }],
    });
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
        case 'tron':
          return await this.verifyTronTransaction(payment.txHash);
        case 'evm':
          return await this.verifyEVMTransaction(payment.txHash, network);
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

  // Verify TRON transaction
  private async verifyTronTransaction(txHash: string): Promise<{ verified: boolean; confirmations?: number }> {
    try {
      const response = await fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`);
      const data = await response.json();
      
      if (data.contractRet === 'SUCCESS' && data.confirmed) {
        return { verified: true, confirmations: data.block ? 1 : 0 };
      }
      
      return { verified: false };
    } catch (error) {
      console.error('TRON verification error:', error);
      return { verified: false };
    }
  }

  // Verify EVM transaction
  private async verifyEVMTransaction(txHash: string, network: NetworkConfig): Promise<{ verified: boolean; confirmations?: number }> {
    // This would require API keys for different networks
    // For now, return a basic verification
    console.log('EVM transaction verification for', network.name, txHash);
    return { verified: false }; // Implement with proper RPC calls
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
    return plan === 'pro' ? 20 : 40;
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
      case 'tron':
        return `${network.blockExplorer}/#/transaction/${txHash}`;
      case 'evm':
        return `${network.blockExplorer}/tx/${txHash}`;
      case 'solana':
        return `${network.blockExplorer}/tx/${txHash}`;
      default:
        return '';
    }
  }
}

export const multiNetworkPaymentService = MultiNetworkPaymentService.getInstance(); 