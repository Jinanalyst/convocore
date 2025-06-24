"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { multiNetworkPaymentService, NetworkConfig, PaymentStatus } from '@/lib/multi-network-payment';
import { usageService, type UserUsage, type SubscriptionInfo } from '@/lib/usage-service';
import { 
  CreditCard, 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle,
  Star,
  Zap,
  Crown,
  ChevronRight,
  RefreshCw,
  History,
  Network,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan?: 'pro' | 'premium';
}

type ModalView = 'overview' | 'payment' | 'history' | 'success';

export function BillingModal({ open, onOpenChange, selectedPlan }: BillingModalProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ModalView>('overview');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<'pro' | 'premium'>(selectedPlan || 'pro');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentStatus[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const networks = multiNetworkPaymentService.getSupportedNetworks();
  const planPrice = multiNetworkPaymentService.getPlanPrice(selectedPlanType);

  useEffect(() => {
    if (open) {
      loadPaymentHistory();
      setCurrentView(selectedPlan ? 'payment' : 'overview');
    }
  }, [open, selectedPlan]);

  useEffect(() => {
    if (selectedPlan) {
      setSelectedPlanType(selectedPlan);
    }
  }, [selectedPlan]);

  const loadPaymentHistory = () => {
    if (user?.id) {
      const history = multiNetworkPaymentService.getUserPayments(user.id);
      setPaymentHistory(history);
      
      // Load real usage data
      const userUsage = usageService.getUserUsage(user.id);
      const userSubscription = usageService.getUserSubscription(user.id);
      setUsage(userUsage);
      setSubscription(userSubscription);
    }
  };

  const handleNetworkSelect = (network: NetworkConfig) => {
    setSelectedNetwork(network);
    setError(null);
  };

  const connectWallet = async (network: NetworkConfig) => {
    try {
      setError(null);
      let address: string | null = null;

      switch (network.type) {
        case 'tron':
          if (typeof window !== 'undefined' && (window as any).tronLink) {
            const accounts = await (window as any).tronLink.request({ method: 'tron_requestAccounts' });
            address = accounts[0] || null;
          }
          break;
        case 'evm':
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            address = accounts[0] || null;
          }
          break;
        case 'solana':
          if (typeof window !== 'undefined' && (window as any).solana) {
            const response = await (window as any).solana.connect();
            address = response.publicKey.toString();
          }
          break;
      }

      if (address) {
        setConnectedWallet(address);
      } else {
        setError(`Failed to connect to ${network.name} wallet`);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const initiatePayment = async () => {
    if (!selectedNetwork || !user?.id) {
      setError('Please select a network');
      return;
    }

    if (selectedNetwork.type !== 'paypal' && !connectedWallet) {
      setError('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment request
      const userAddress = connectedWallet || 'paypal_user';
      const payment = multiNetworkPaymentService.createPaymentRequest({
        networkId: selectedNetwork.id,
        amount: planPrice,
        plan: selectedPlanType,
        userId: user.id,
        userAddress: userAddress
      });

      setPaymentStatus(payment);

      // Process payment
      const result = await multiNetworkPaymentService.processPayment(payment.id, userAddress);

      if (result.success) {
        // Update subscription when payment is successful
        if (user?.id) {
          usageService.updateSubscription(user.id, selectedPlanType);
        }
        setCurrentView('success');
        loadPaymentHistory();
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: PaymentStatus['status']) => {
    switch (status) {
      case 'confirmed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: PaymentStatus['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* User Info for Google Users */}
      {user?.authType === 'supabase' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Google Account</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              <p className="text-xs text-green-700 dark:text-green-300">Ready to pay with USDT</p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet User Info */}
      {user?.authType === 'wallet' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Wallet Connected</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {user.walletType} • Ready to pay
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Current Plan</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription?.tier === 'free' ? 'Free Tier' : `${subscription?.tier} Plan`}
              </p>
            </div>
          </div>
          <Badge variant="outline">{subscription?.status === 'active' ? 'Active' : 'Inactive'}</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-white dark:bg-zinc-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{usage?.requestsUsed || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Requests Used</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-zinc-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{usage?.requestsLimit || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {subscription?.tier === 'free' ? 'Daily Limit' : 'Monthly Limit'}
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${usage ? Math.round((usage.requestsUsed / usage.requestsLimit) * 100) : 0}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Upgrade to unlock unlimited requests and advanced features
        </p>
      </div>

      {/* Available Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Plans</h3>
        
        <div className="grid gap-4">
          {/* Pro Plan */}
          <div className={cn(
            "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
            selectedPlanType === 'pro' 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-gray-200 dark:border-zinc-700"
          )} onClick={() => setSelectedPlanType('pro')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Pro Plan</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for developers</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">20 USDT</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">per month</div>
              </div>
            </div>
          </div>

          {/* Premium Plan */}
          <div className={cn(
            "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
            selectedPlanType === 'premium' 
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" 
              : "border-gray-200 dark:border-zinc-700"
          )} onClick={() => setSelectedPlanType('premium')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Premium Plan</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">For power users</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">40 USDT</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">per month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setCurrentView('payment')}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Subscribe Now
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('history')}
          className="flex-1"
        >
          <History className="w-4 h-4 mr-2" />
          Payment History
        </Button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              selectedPlanType === 'premium' 
                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                : "bg-gradient-to-r from-blue-500 to-purple-600"
            )}>
              {selectedPlanType === 'premium' ? (
                <Crown className="w-5 h-5 text-white" />
              ) : (
                <Zap className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                {selectedPlanType} Plan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly subscription</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{planPrice} USDT</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">per month</div>
          </div>
        </div>
      </div>

      {/* Google User Payment Info */}
      {user?.authType === 'supabase' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Payment with Google Account
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You're signed in with Google ({user.email}). To pay with USDT, you'll need to connect a crypto wallet below. 
                This allows you to make secure blockchain payments while keeping your Google account for easy access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Network Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Network className="w-5 h-5" />
          Select Payment Network
        </h3>
        
        <div className="grid gap-3">
          {networks.map((network) => (
            <div
              key={network.id}
              className={cn(
                "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                selectedNetwork?.id === network.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-zinc-700"
              )}
              onClick={() => handleNetworkSelect(network)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{network.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{network.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {network.type === 'paypal' 
                        ? `Pay $${planPrice} USD with PayPal`
                        : `Pay with USDT on ${network.name}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {network.symbol}
                  </Badge>
                  {/* Solana no longer marked as Coming Soon */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Connection / PayPal Info */}
      {selectedNetwork && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {selectedNetwork.type === 'paypal' ? (
              <CreditCard className="w-5 h-5" />
            ) : (
              <Wallet className="w-5 h-5" />
            )}
            {selectedNetwork.type === 'paypal' ? 'PayPal Checkout' : 'Connect Wallet'}
          </h3>
          
          {selectedNetwork.type === 'paypal' ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">PayPal Payment</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Secure payment with PayPal - supports credit cards, debit cards, and PayPal balance
                  </p>
                </div>
              </div>
            </div>
          ) : connectedWallet ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Wallet Connected</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                      {multiNetworkPaymentService.formatAddress(connectedWallet, selectedNetwork)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(connectedWallet)}
                  className="border-green-300 dark:border-green-700"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => connectWallet(selectedNetwork)}
              className="w-full"
              variant="outline"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect {selectedNetwork.name} Wallet
            </Button>
          )}
        </div>
      )}

      {/* Payment Button */}
      {selectedNetwork && (selectedNetwork.type === 'paypal' || connectedWallet) && (
        <div className="space-y-4">
          <Button
            onClick={initiatePayment}
            disabled={isProcessing}
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : selectedNetwork.type === 'paypal' ? (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${planPrice} USD with PayPal
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Pay {planPrice} USDT
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => setCurrentView('overview')}
        className="w-full"
      >
        Back to Overview
      </Button>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5" />
          Payment History
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPaymentHistory}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {paymentHistory.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Payment History</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Your payment history will appear here after making your first payment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentHistory.map((payment) => {
            const network = multiNetworkPaymentService.getNetwork(payment.networkId);
            return (
              <div
                key={payment.id}
                className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {payment.plan} Plan
                      </span>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {network?.type === 'paypal' 
                        ? `$${payment.amount} USD`
                        : `${payment.amount} USDT`
                      }
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {network?.name}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {payment.createdAt.toLocaleDateString()} at {payment.createdAt.toLocaleTimeString()}
                </div>
                
                {payment.txHash && network && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Transaction:</span>
                    <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono">
                      {payment.txHash.slice(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(
                        multiNetworkPaymentService.getTransactionUrl(payment.txHash!, network),
                        '_blank'
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => setCurrentView('overview')}
        className="w-full"
      >
        Back to Overview
      </Button>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Your {selectedPlanType} plan subscription has been activated.
        </p>
        {user?.authType === 'supabase' && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Subscription linked to your Google account: {user.email}
          </p>
        )}
        {user?.authType === 'wallet' && (
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Subscription linked to your wallet: {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
          </p>
        )}
      </div>

      {paymentStatus && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Plan:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {paymentStatus.plan}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedNetwork?.type === 'paypal' 
                  ? `$${paymentStatus.amount} USD`
                  : `${paymentStatus.amount} USDT`
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Network:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedNetwork?.name}
              </span>
            </div>
            {paymentStatus.txHash && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Transaction:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono">
                    {paymentStatus.txHash.slice(0, 10)}...
                  </code>
                  {selectedNetwork && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(
                        multiNetworkPaymentService.getTransactionUrl(paymentStatus.txHash!, selectedNetwork),
                        '_blank'
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => {
            setCurrentView('overview');
            setPaymentStatus(null);
            setSelectedNetwork(null);
            setConnectedWallet(null);
          }}
          className="flex-1"
          variant="outline"
        >
          Back to Overview
        </Button>
        <Button
          onClick={() => onOpenChange(false)}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          Continue to Chat
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {currentView === 'overview' && 'Billing & Subscription'}
            {currentView === 'payment' && (selectedNetwork?.type === 'paypal' ? 'Subscribe with PayPal' : 'Subscribe with USDT')}
            {currentView === 'history' && 'Payment History'}
            {currentView === 'success' && 'Payment Complete'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          {currentView === 'overview' && renderOverview()}
          {currentView === 'payment' && renderPayment()}
          {currentView === 'history' && renderHistory()}
          {currentView === 'success' && renderSuccess()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

