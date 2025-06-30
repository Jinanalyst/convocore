const { Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');

// Helper function to derive keypair from seed phrase (same as both services)
function deriveKeypairFromSeedPhrase(seedPhrase, derivationPath = "m/44'/501'/0'/0'") {
  try {
    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
    return Keypair.fromSeed(derivedSeed);
  } catch (error) {
    throw new Error('Invalid seed phrase provided');
  }
}

// Target address
const TARGET_ADDRESS = 'DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2';

console.log('🔍 Verifying Treasury Wallet Address Configuration');
console.log('==================================================\n');

console.log('Target Address:', TARGET_ADDRESS);
console.log('');

// Check if TREASURY_SEED_PHRASE is set
const treasurySeedPhrase = process.env.TREASURY_SEED_PHRASE;

if (!treasurySeedPhrase) {
  console.log('❌ TREASURY_SEED_PHRASE environment variable is not set');
  console.log('');
  console.log('To set it up:');
  console.log('1. Add TREASURY_SEED_PHRASE=your_seed_phrase_here to your .env.local file');
  console.log('2. Make sure the seed phrase derives to address:', TARGET_ADDRESS);
  console.log('');
  console.log('Example:');
  console.log('TREASURY_SEED_PHRASE="your twelve or twenty four word seed phrase here"');
  process.exit(1);
}

try {
  // Derive the wallet from seed phrase
  const treasuryWallet = deriveKeypairFromSeedPhrase(treasurySeedPhrase);
  const derivedAddress = treasuryWallet.publicKey.toBase58();
  
  console.log('✅ TREASURY_SEED_PHRASE is set');
  console.log('Derived Address:', derivedAddress);
  console.log('');
  
  if (derivedAddress === TARGET_ADDRESS) {
    console.log('🎉 SUCCESS: Treasury and payout addresses match!');
    console.log('Both solana-reward-service.ts and convoai-reward-payout.ts will use the same wallet.');
  } else {
    console.log('❌ MISMATCH: Derived address does not match target address');
    console.log('');
    console.log('To fix this:');
    console.log('1. Update your TREASURY_SEED_PHRASE to derive to:', TARGET_ADDRESS);
    console.log('2. Or update the target address in your configuration');
    console.log('');
    console.log('Current derived address:', derivedAddress);
    console.log('Expected address:', TARGET_ADDRESS);
  }
  
} catch (error) {
  console.log('❌ Error deriving wallet from seed phrase:', error.message);
  console.log('');
  console.log('Please check that your TREASURY_SEED_PHRASE is valid.');
}

console.log('');
console.log('📋 Configuration Summary:');
console.log('- solana-reward-service.ts: Uses TREASURY_SEED_PHRASE environment variable');
console.log('- convoai-reward-payout.ts: Uses TREASURY_SEED_PHRASE environment variable');
console.log('- Both services derive the same wallet address from the same seed phrase');
console.log('- Target address:', TARGET_ADDRESS); 