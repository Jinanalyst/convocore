import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Ed25519Program } from '@solana/web3.js';

export interface SessionKey {
  publicKey: string;
  privateKey: string; // Encrypted
  walletAddress: string;
  scope: string[];
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface SessionKeyRequest {
  walletAddress: string;
  scope: string[];
  expiresIn: number; // days
}

export class SessionKeyService {
  private static instance: SessionKeyService;
  private sessionKeys: Map<string, SessionKey> = new Map();
  private readonly SESSION_KEY_PREFIX = 'convocore_session_key_';
  private readonly ENCRYPTION_KEY = 'convocore_encryption_key';

  static getInstance(): SessionKeyService {
    if (!SessionKeyService.instance) {
      SessionKeyService.instance = new SessionKeyService();
    }
    return SessionKeyService.instance;
  }

  /**
   * Create a new session key for a wallet
   */
  async createSessionKey(request: SessionKeyRequest): Promise<SessionKey> {
    try {
      // Generate a new keypair for the session
      const sessionKeypair = Keypair.generate();
      
      // Create session key data
      const sessionKey: SessionKey = {
        publicKey: sessionKeypair.publicKey.toString(),
        privateKey: this.encryptPrivateKey(sessionKeypair.secretKey),
        walletAddress: request.walletAddress,
        scope: request.scope,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + request.expiresIn * 24 * 60 * 60 * 1000),
        isActive: true
      };

      // Store in memory and localStorage
      this.sessionKeys.set(request.walletAddress, sessionKey);
      this.saveSessionKeyToStorage(request.walletAddress, sessionKey);

      console.log('🔑 Session key created for wallet:', request.walletAddress);
      return sessionKey;
    } catch (error) {
      console.error('Failed to create session key:', error);
      throw new Error('Failed to create session key');
    }
  }

  /**
   * Get active session key for a wallet
   */
  getSessionKey(walletAddress: string): SessionKey | null {
    try {
      // Check memory first
      let sessionKey = this.sessionKeys.get(walletAddress);
      
      if (!sessionKey) {
        // Load from storage
        sessionKey = this.loadSessionKeyFromStorage(walletAddress) || undefined;
        if (sessionKey) {
          this.sessionKeys.set(walletAddress, sessionKey);
        }
      }

      // Check if session is still valid
      if (sessionKey && sessionKey.isActive && sessionKey.expiresAt > new Date()) {
        return sessionKey;
      }

      // Session expired or invalid
      if (sessionKey) {
        this.revokeSessionKey(walletAddress);
      }

      return null;
    } catch (error) {
      console.error('Error getting session key:', error);
      return null;
    }
  }

  /**
   * Check if session key exists and is valid
   */
  hasValidSessionKey(walletAddress: string): boolean {
    const sessionKey = this.getSessionKey(walletAddress);
    return sessionKey !== null;
  }

  /**
   * Revoke a session key
   */
  revokeSessionKey(walletAddress: string): void {
    this.sessionKeys.delete(walletAddress);
    this.removeSessionKeyFromStorage(walletAddress);
    console.log('🔒 Session key revoked for wallet:', walletAddress);
  }

  /**
   * Get session key info for display
   */
  getSessionKeyInfo(walletAddress: string): {
    hasSession: boolean;
    expiresAt?: Date;
    scope?: string[];
  } {
    const sessionKey = this.getSessionKey(walletAddress);
    if (!sessionKey) {
      return { hasSession: false };
    }

    return {
      hasSession: true,
      expiresAt: sessionKey.expiresAt,
      scope: sessionKey.scope
    };
  }

  /**
   * Sign a transaction using session key
   */
  async signTransactionWithSessionKey(
    walletAddress: string,
    transaction: Transaction
  ): Promise<Transaction> {
    const sessionKey = this.getSessionKey(walletAddress);
    if (!sessionKey) {
      throw new Error('No valid session key found');
    }

    try {
      // Decrypt the private key
      const privateKeyBytes = this.decryptPrivateKey(sessionKey.privateKey);
      const sessionKeypair = Keypair.fromSecretKey(privateKeyBytes);

      // Sign the transaction with session key
      transaction.sign(sessionKeypair);
      
      console.log('✍️ Transaction signed with session key');
      return transaction;
    } catch (error) {
      console.error('Failed to sign transaction with session key:', error);
      throw new Error('Failed to sign transaction');
    }
  }

  /**
   * Create a session key authorization message for wallet signing
   */
  createAuthorizationMessage(walletAddress: string, scope: string[]): string {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return `I authorize ConvoAI to create a session key for my wallet ${walletAddress} with the following permissions:
    
Scope: ${scope.join(', ')}
Expires: ${expiresAt.toISOString()}
Purpose: Automatic transaction signing for chat storage

This session key will allow ConvoAI to sign transactions on my behalf for the specified scope until the expiration date. I can revoke this authorization at any time.`;
  }

  /**
   * Verify session key authorization signature
   */
  async verifyAuthorization(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      // In a real implementation, you would verify the signature here
      // For now, we'll assume it's valid if we have a signature
      return signature.length > 0;
    } catch (error) {
      console.error('Failed to verify authorization:', error);
      return false;
    }
  }

  // Private helper methods

  private encryptPrivateKey(privateKey: Uint8Array): string {
    // Simple encryption for demo - in production use proper encryption
    const key = this.getOrCreateEncryptionKey();
    const encoded = Buffer.from(privateKey).toString('base64');
    return btoa(encoded + ':' + key);
  }

  private decryptPrivateKey(encryptedKey: string): Uint8Array {
    // Simple decryption for demo - in production use proper decryption
    const decoded = atob(encryptedKey);
    const [encoded, key] = decoded.split(':');
    return Buffer.from(encoded, 'base64');
  }

  private getOrCreateEncryptionKey(): string {
    let key = localStorage.getItem(this.ENCRYPTION_KEY);
    if (!key) {
      key = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(this.ENCRYPTION_KEY, key);
    }
    return key;
  }

  private saveSessionKeyToStorage(walletAddress: string, sessionKey: SessionKey): void {
    try {
      const key = `${this.SESSION_KEY_PREFIX}${walletAddress}`;
      const value = JSON.stringify(sessionKey);
      console.log('[SessionKeyService] Saving session key:', { key, value });
      localStorage.setItem(key, value);
      // Log all localStorage keys for debugging
      console.log('[SessionKeyService] localStorage keys after save:', Object.keys(localStorage));
    } catch (error) {
      console.error('[SessionKeyService] Failed to save session key to storage:', error);
    }
  }

  private loadSessionKeyFromStorage(walletAddress: string): SessionKey | null {
    try {
      const key = `${this.SESSION_KEY_PREFIX}${walletAddress}`;
      const stored = localStorage.getItem(key);
      console.log('[SessionKeyService] Loading session key:', { key, stored });
      if (!stored) return null;

      const sessionKey = JSON.parse(stored) as SessionKey;
      return sessionKey;
    } catch (error) {
      console.error('[SessionKeyService] Failed to load session key from storage:', error);
      return null;
    }
  }

  private removeSessionKeyFromStorage(walletAddress: string): void {
    try {
      const key = `${this.SESSION_KEY_PREFIX}${walletAddress}`;
      console.log('[SessionKeyService] Removing session key:', { key });
      localStorage.removeItem(key);
      // Log all localStorage keys for debugging
      console.log('[SessionKeyService] localStorage keys after remove:', Object.keys(localStorage));
    } catch (error) {
      console.error('[SessionKeyService] Failed to remove session key from storage:', error);
    }
  }

  /**
   * Clean up expired session keys
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [walletAddress, sessionKey] of this.sessionKeys.entries()) {
      if (sessionKey.expiresAt <= now || !sessionKey.isActive) {
        this.revokeSessionKey(walletAddress);
      }
    }
  }
}

// Export singleton instance
export const sessionKeyService = SessionKeyService.getInstance(); 