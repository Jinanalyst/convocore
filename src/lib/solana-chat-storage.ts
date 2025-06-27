import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createTransferCheckedInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { sessionKeyService } from './session-key-service';

export interface SolanaChat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  threadId?: string;
  signature?: string;
}

export interface SolanaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  signature?: string;
}

export class SolanaChatStorage {
  private connection: Connection;
  private rpcUrl: string;

  constructor(rpcUrl: string = 'https://api.devnet.solana.com') {
    this.rpcUrl = rpcUrl;
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Store a chat conversation on Solana using memo transactions with session key
   */
  async storeChat(walletAddress: string, chat: Omit<SolanaChat, 'signature'>): Promise<string> {
    try {
      const chatData = {
        type: 'chat',
        id: chat.id,
        title: chat.title,
        lastMessage: chat.lastMessage,
        timestamp: chat.timestamp.toISOString(),
        threadId: chat.threadId,
      };

      const memo = JSON.stringify(chatData);
      
      // Create a minimal transaction (0.000001 SOL transfer to self with memo)
      const transaction = new Transaction();
      const fromPubkey = new PublicKey(walletAddress);
      
      // Add a tiny transfer to self (this is just to create a transaction with memo)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: fromPubkey,
          lamports: 1, // 1 lamport = minimal amount
        })
      );

      // Add memo instruction
      const memoInstruction = {
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        keys: [],
        data: Buffer.from(memo, 'utf-8'),
      };
      transaction.add(memoInstruction);

      // Check if we have a session key for automatic signing
      if (sessionKeyService.hasValidSessionKey(walletAddress)) {
        // Use session key to sign and send transaction automatically
        const signedTransaction = await sessionKeyService.signTransactionWithSessionKey(walletAddress, transaction);
        const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed');
        
        console.log('✅ Chat stored on Solana with session key:', signature);
        return signature;
      } else {
        // Fallback: return transaction for manual signing (legacy behavior)
        console.log('⚠️ No session key found, returning transaction for manual signing');
        return transaction.serialize({ requireAllSignatures: false }).toString('base64');
      }
    } catch (error) {
      console.error('Error creating Solana chat transaction:', error);
      throw new Error('Failed to create chat transaction');
    }
  }

  /**
   * Store a message on Solana using memo transactions with session key
   */
  async storeMessage(walletAddress: string, conversationId: string, message: Omit<SolanaMessage, 'signature'>): Promise<string> {
    try {
      const messageData = {
        type: 'message',
        conversationId,
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
      };

      const memo = JSON.stringify(messageData);
      
      // Create a minimal transaction
      const transaction = new Transaction();
      const fromPubkey = new PublicKey(walletAddress);
      
      // Add a tiny transfer to self
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: fromPubkey,
          lamports: 1,
        })
      );

      // Add memo instruction
      const memoInstruction = {
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        keys: [],
        data: Buffer.from(memo, 'utf-8'),
      };
      transaction.add(memoInstruction);

      // Check if we have a session key for automatic signing
      if (sessionKeyService.hasValidSessionKey(walletAddress)) {
        // Use session key to sign and send transaction automatically
        const signedTransaction = await sessionKeyService.signTransactionWithSessionKey(walletAddress, transaction);
        const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed');
        
        console.log('✅ Message stored on Solana with session key:', signature);
        return signature;
      } else {
        // Fallback: return transaction for manual signing (legacy behavior)
        console.log('⚠️ No session key found, returning transaction for manual signing');
        return transaction.serialize({ requireAllSignatures: false }).toString('base64');
      }
    } catch (error) {
      console.error('Error creating Solana message transaction:', error);
      throw new Error('Failed to create message transaction');
    }
  }

  /**
   * Fetch all chats for a wallet address from Solana
   */
  async fetchChats(walletAddress: string): Promise<SolanaChat[]> {
    try {
      const pubkey = new PublicKey(walletAddress);
      
      // Get all signatures for the wallet
      const signatures = await this.connection.getSignaturesForAddress(pubkey, {
        limit: 1000,
      });

      const chats: SolanaChat[] = [];
      const chatMap = new Map<string, SolanaChat>();

      // Process transactions in parallel
      const transactionPromises = signatures.map(async (sig) => {
        try {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) return null;

          // Handle both legacy and versioned transactions
          const instructions = 'instructions' in tx.transaction.message 
            ? tx.transaction.message.instructions 
            : tx.transaction.message.compiledInstructions;

          // Look for memo instructions
          const memoInstructions = instructions.filter(
            (ix: any) => {
              const programId = 'programId' in ix ? ix.programId : tx.transaction.message.staticAccountKeys[ix.programIdIndex];
              return programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
            }
          );

          for (const memoIx of memoInstructions) {
            try {
              const data = 'data' in memoIx ? (memoIx as any).data : Buffer.from((memoIx as any).data);
              const memoData = data.toString('utf-8');
              const parsed = JSON.parse(memoData);

              if (parsed.type === 'chat') {
                const chat: SolanaChat = {
                  id: parsed.id,
                  title: parsed.title,
                  lastMessage: parsed.lastMessage,
                  timestamp: new Date(parsed.timestamp),
                  threadId: parsed.threadId,
                  signature: sig.signature,
                };

                // Use the most recent version of each chat
                if (!chatMap.has(chat.id) || chat.timestamp > chatMap.get(chat.id)!.timestamp) {
                  chatMap.set(chat.id, chat);
                }
              }
            } catch (parseError) {
              // Skip invalid JSON memos
              continue;
            }
          }
        } catch (error) {
          console.warn('Error processing transaction:', sig.signature, error);
        }
      });

      await Promise.all(transactionPromises);

      // Convert map to array and sort by timestamp
      return Array.from(chatMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching Solana chats:', error);
      throw new Error('Failed to fetch chats from Solana');
    }
  }

  /**
   * Fetch all messages for a specific conversation
   */
  async fetchMessages(walletAddress: string, conversationId: string): Promise<SolanaMessage[]> {
    try {
      const pubkey = new PublicKey(walletAddress);
      
      // Get all signatures for the wallet
      const signatures = await this.connection.getSignaturesForAddress(pubkey, {
        limit: 1000,
      });

      const messages: SolanaMessage[] = [];

      // Process transactions in parallel
      const transactionPromises = signatures.map(async (sig) => {
        try {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) return null;

          // Handle both legacy and versioned transactions
          const instructions = 'instructions' in tx.transaction.message 
            ? tx.transaction.message.instructions 
            : tx.transaction.message.compiledInstructions;

          // Look for memo instructions
          const memoInstructions = instructions.filter(
            (ix: any) => {
              const programId = 'programId' in ix ? ix.programId : tx.transaction.message.staticAccountKeys[ix.programIdIndex];
              return programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
            }
          );

          for (const memoIx of memoInstructions) {
            try {
              const data = 'data' in memoIx ? (memoIx as any).data : Buffer.from((memoIx as any).data);
              const memoData = data.toString('utf-8');
              const parsed = JSON.parse(memoData);

              if (parsed.type === 'message' && parsed.conversationId === conversationId) {
                const message: SolanaMessage = {
                  id: parsed.id,
                  role: parsed.role,
                  content: parsed.content,
                  timestamp: new Date(parsed.timestamp),
                  signature: sig.signature,
                };

                messages.push(message);
              }
            } catch (parseError) {
              // Skip invalid JSON memos
              continue;
            }
          }
        } catch (error) {
          console.warn('Error processing transaction:', sig.signature, error);
        }
      });

      await Promise.all(transactionPromises);

      // Sort messages by timestamp
      return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching Solana messages:', error);
      throw new Error('Failed to fetch messages from Solana');
    }
  }

  /**
   * Delete a chat by creating a deletion marker transaction
   */
  async deleteChat(walletAddress: string, chatId: string): Promise<string> {
    try {
      const deleteData = {
        type: 'delete_chat',
        chatId,
        timestamp: new Date().toISOString(),
      };

      const memo = JSON.stringify(deleteData);
      
      const transaction = new Transaction();
      const fromPubkey = new PublicKey(walletAddress);
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: fromPubkey,
          lamports: 1,
        })
      );

      const memoInstruction = {
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        keys: [],
        data: Buffer.from(memo, 'utf-8'),
      };
      transaction.add(memoInstruction);

      // Check if we have a session key for automatic signing
      if (sessionKeyService.hasValidSessionKey(walletAddress)) {
        // Use session key to sign and send transaction automatically
        const signedTransaction = await sessionKeyService.signTransactionWithSessionKey(walletAddress, transaction);
        const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed');
        
        console.log('✅ Chat deleted on Solana with session key:', signature);
        return signature;
      } else {
        // Fallback: return transaction for manual signing (legacy behavior)
        console.log('⚠️ No session key found, returning transaction for manual signing');
        return transaction.serialize({ requireAllSignatures: false }).toString('base64');
      }
    } catch (error) {
      console.error('Error creating delete chat transaction:', error);
      throw new Error('Failed to create delete transaction');
    }
  }

  /**
   * Get the current Solana balance for a wallet
   */
  async getBalance(walletAddress: string): Promise<number> {
    try {
      const pubkey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting Solana balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }
}

// Export singleton instance
export const solanaChatStorage = new SolanaChatStorage(); 