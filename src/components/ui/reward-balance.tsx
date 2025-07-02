import React, { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Coins, RefreshCw } from 'lucide-react';

interface RewardBalanceProps {
  walletAddress?: string;
  className?: string;
}

export function RewardBalance({ walletAddress, className = '' }: RewardBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/rewards?userWalletAddress=${walletAddress}&action=balance`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.data.balance);
      } else {
        setError(data.error || 'Failed to fetch balance');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching reward balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Coins className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">CONVO Balance:</span>
      </div>
      
      {loading ? (
        <div className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-1">
          <span className="text-sm text-red-500">{error}</span>
          <button
            onClick={fetchBalance}
            className="text-blue-500 hover:text-blue-600 text-xs"
          >
            Retry
          </button>
        </div>
      ) : (
        <Badge variant="secondary" className="text-xs">
          {balance !== null ? `${balance.toFixed(2)} CONVO` : '0.00 CONVO'}
        </Badge>
      )}
      
      {!loading && !error && (
        <button
          onClick={fetchBalance}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh balance"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
} 