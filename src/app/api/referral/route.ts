import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

// In-memory mock DB (replace with real DB integration)
const referrals: Record<string, any[]> = {};
const payouts: Record<string, { amount: number; paid: boolean; txHash?: string }[]> = {};

// Commission structure
const COMMISSION = {
  pro: 50,
  premium: 100,
};

type PlanType = 'pro' | 'premium';

function isPlanType(plan: any): plan is PlanType {
  return plan === 'pro' || plan === 'premium';
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { wallet, user, event, plan, action } = body;
  if (!wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });

  // Handle payout automation
  if (action === 'payout') {
    const partnerPayouts = payouts[wallet] || [];
    const pending = partnerPayouts.filter(p => !p.paid);
    const pendingEarnings = pending.reduce((sum, p) => sum + p.amount, 0);
    if (pendingEarnings < 200) {
      return NextResponse.json({ error: 'Minimum payout is 200 USDT' }, { status: 400 });
    }
    // Real USDT payout logic
    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.PAYOUT_PRIVATE_KEY!)));
      const recipient = new PublicKey(wallet);
      const usdtMint = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
      const payerAta = await getAssociatedTokenAddress(usdtMint, payer.publicKey);
      const recipientAta = await getAssociatedTokenAddress(usdtMint, recipient);
      const amount = pendingEarnings * 1_000_000; // USDT has 6 decimals
      const transferIx = createTransferInstruction(
        payerAta,
        recipientAta,
        payer.publicKey,
        BigInt(amount)
      );
      const tx = new Transaction().add(transferIx);
      tx.feePayer = payer.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signature = await sendAndConfirmTransaction(connection, tx, [payer]);
      pending.forEach(p => { p.paid = true; p.txHash = signature; });
      return NextResponse.json({ success: true, txHash: signature, paidAmount: pendingEarnings });
    } catch (err) {
      return NextResponse.json({ error: 'Blockchain payout failed', details: String(err) }, { status: 500 });
    }
  }

  // Track referral event
  if (!referrals[wallet]) referrals[wallet] = [];
  referrals[wallet].push({ user, event, plan, date: new Date().toISOString() });

  // On payment event, add payout
  if (event === 'payment' && isPlanType(plan)) {
    if (!payouts[wallet]) payouts[wallet] = [];
    payouts[wallet].push({ amount: COMMISSION[plan], paid: false });
  }

  // TODO: Persist to DB
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });

  // Aggregate stats
  const partnerReferrals = referrals[wallet] || [];
  const partnerPayouts = payouts[wallet] || [];
  const totalReferrals = partnerReferrals.length;
  const paidReferrals = partnerPayouts.filter(p => p.paid).length;
  const pendingPayouts = partnerPayouts.filter(p => !p.paid).length;
  const totalEarnings = partnerPayouts.reduce((sum, p) => sum + p.amount, 0);
  const paidEarnings = partnerPayouts.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const pendingEarnings = partnerPayouts.filter(p => !p.paid).reduce((sum, p) => sum + p.amount, 0);

  // TODO: Fetch from DB
  return NextResponse.json({
    totalReferrals,
    paidReferrals,
    pendingPayouts,
    totalEarnings,
    paidEarnings,
    pendingEarnings,
    referrals: partnerReferrals,
    payouts: partnerPayouts,
  });
}

// TODO: Add payout automation endpoint (e.g., POST /api/referral/payout) to trigger USDT transfer to partner wallet when threshold is met. 