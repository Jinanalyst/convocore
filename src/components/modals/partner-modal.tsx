import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Wallet, BarChart2, Link2, QrCode, RefreshCw, LogIn } from 'lucide-react';
import phantomLogo from '/phantom.svg';
import solflareLogo from '/solflare.svg';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerModal({ open, onOpenChange }: PartnerModalProps) {
  const { publicKey, connected } = useWallet();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);

  // Update wallet state when wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      setWalletConnected(true);
      setWalletAddress(publicKey.toBase58());
    } else {
      setWalletConnected(false);
      setWalletAddress('');
    }
  }, [connected, publicKey]);

  // Placeholder: Solana wallet connect logic
  const handleConnectWallet = () => {
    // The wallet connection is now handled by the WalletMultiButton
    // This function is kept for backward compatibility
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://convocore.site/ref/${walletAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch referral stats
  useEffect(() => {
    if (walletConnected && walletAddress) {
      setLoadingStats(true);
      fetch(`/api/referral?wallet=${walletAddress}`)
        .then(res => res.json())
        .then(data => setStats(data))
        .finally(() => setLoadingStats(false));
    }
  }, [walletConnected, walletAddress, payoutStatus]);

  // Handle payout request
  const handlePayout = async () => {
    setPayoutLoading(true);
    setPayoutStatus(null);
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, action: 'payout' }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutStatus(`Payout successful! TX: ${data.txHash}`);
      } else {
        setPayoutStatus(data.error || 'Payout failed');
      }
    } catch (err) {
      setPayoutStatus('Payout failed');
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Partner Dashboard
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 space-y-8">
          {/* Wallet Login Section */}
          {!walletConnected ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Wallet className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Solana Wallet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">Login as a partner using your Solana wallet to access your affiliate dashboard.</p>
              <WalletMultiButton className="w-full max-w-xs bg-black text-white hover:bg-gray-800 flex items-center gap-2" />
              <div className="flex gap-4 mt-4">
                <img src="/phantom.svg" alt="Phantom" className="w-8 h-8" />
                <img src="/solflare.svg" alt="Solflare" className="w-8 h-8" />
              </div>
            </div>
          ) : (
            <>
              {/* Earnings Overview */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Total Earnings</h4>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {loadingStats || !stats ? '--' : `$${stats.totalEarnings} USDT`}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {loadingStats || !stats ? '--' : `Current Month: $${stats.paidEarnings} • Pending: $${stats.pendingEarnings}`}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">Wallet: {walletAddress}</Badge>
                  <WalletMultiButton className="mt-2" />
                </div>
              </div>

              {/* Payout Button */}
              {stats && stats.pendingEarnings >= 200 && (
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handlePayout}
                    disabled={payoutLoading}
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    {payoutLoading ? 'Processing Payout...' : 'Request Payout'}
                  </Button>
                  {payoutStatus && (
                    <span className="text-sm text-green-600 dark:text-green-400">{payoutStatus}</span>
                  )}
                </div>
              )}
              {stats && stats.pendingEarnings < 200 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Minimum payout is 200 USDT. Pending: ${stats.pendingEarnings}
                </div>
              )}

              {/* Referral Link Generation */}
              <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Your Referral Link</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://convocore.site/ref/${walletAddress}`}
                      className="w-full px-3 py-2 rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-sm font-mono"
                    />
                    <Button size="icon" variant="outline" onClick={handleCopy}>
                      {copied ? <Copy className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">QR code coming soon</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" /> Track Link Performance
                  </Button>
                </div>
              </div>

              {/* Referral Statistics */}
              <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" /> Referral Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats ? stats.totalReferrals : '--'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats ? stats.paidReferrals : '--'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Paid Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats && stats.totalReferrals ? `${Math.round((stats.paidReferrals / stats.totalReferrals) * 100)}%` : '--'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Conversion Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats ? stats.pendingPayouts : '--'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Pending Payouts</div>
                  </div>
                </div>
                <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <span>Referral trends chart coming soon</span>
                </div>
              </div>

              {/* Commission Structure */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Commission Structure</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                  <li>Pro Plan: <span className="font-bold text-blue-700">50 USDT</span> per successful referral</li>
                  <li>Premium Plan: <span className="font-bold text-yellow-700">100 USDT</span> per successful referral</li>
                </ul>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Earnings breakdown by plan type coming soon</div>
              </div>

              {/* Payment History Table */}
              <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" /> Payment History
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-zinc-900">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats && stats.payouts && stats.payouts.length > 0 ? (
                        stats.payouts.map((p: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-2">{p.paid ? (p.txHash ? 'Paid' : 'Paid') : 'Pending'}</td>
                            <td className="px-4 py-2">${p.amount}</td>
                            <td className="px-4 py-2">{p.paid ? 'Paid' : 'Pending'}</td>
                            <td className="px-4 py-2">{p.txHash ? <span className="text-xs font-mono">{p.txHash}</span> : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-2">-</td>
                          <td className="px-4 py-2">-</td>
                          <td className="px-4 py-2">-</td>
                          <td className="px-4 py-2">-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">On-chain payout tracking coming soon</div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 