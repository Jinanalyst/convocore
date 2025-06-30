// TEMPORARILY DISABLED - Solana dependencies removed
// import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
// import { createTransferCheckedInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
// import { sessionKeyService } from './session-key-service';

// // Solana Chat Storage Service
// // This service handles storing chat data on Solana blockchain
// // and managing payments for chat services

// export interface ChatMessage {
//   id: string;
//   content: string;
//   timestamp: number;
//   sender: string;
//   conversationId: string;
// }

// export interface ChatTransaction {
//   signature: string;
//   conversationId: string;
//   messages: ChatMessage[];
//   timestamp: number;
//   cost: number;
// }

// class SolanaChatStorage {
//   private connection: Connection;
//   private sessionKeyService: typeof sessionKeyService;

//   constructor() {
//     this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
//     this.sessionKeyService = sessionKeyService;
//   }

//   async storeChatData(
//     conversationId: string,
//     messages: ChatMessage[],
//     userWalletAddress: string,
//     cost: number
//   ): Promise<ChatTransaction> {
//     try {
//       // Create a new transaction
//       const transaction = new Transaction();
//       const userPublicKey = new PublicKey(userWalletAddress);

//       // Add payment instruction
//       const paymentInstruction = SystemProgram.transfer({
//         fromPubkey: userPublicKey,
//         toPubkey: new PublicKey(process.env.TREASURY_WALLET_ADDRESS || ''),
//         lamports: cost * LAMPORTS_PER_SOL,
//       });

//       transaction.add(paymentInstruction);

//       // Get session key for signing
//       const sessionKey = await this.sessionKeyService.getSessionKey(userWalletAddress);
//       if (!sessionKey) {
//         throw new Error('No valid session key found');
//       }

//       // Sign and send transaction
//       const signature = await this.connection.sendTransaction(transaction, [sessionKey], {
//         preflightCommitment: 'confirmed',
//       });

//       // Wait for confirmation
//       await this.connection.confirmTransaction(signature, 'confirmed');

//       return {
//         signature,
//         conversationId,
//         messages,
//         timestamp: Date.now(),
//         cost,
//       };
//     } catch (error) {
//       console.error('Failed to store chat data on Solana:', error);
//       throw error;
//     }
//   }

//   async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
//     try {
//       // This would typically query the blockchain for stored chat data
//       // For now, return empty array as placeholder
//       return [];
//     } catch (error) {
//       console.error('Failed to get chat history:', error);
//       return [];
//     }
//   }

//   async getTransactionHistory(userWalletAddress: string): Promise<ChatTransaction[]> {
//     try {
//       const publicKey = new PublicKey(userWalletAddress);
//       const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 20 });

//       // This would typically parse transaction data to extract chat information
//       // For now, return empty array as placeholder
//       return [];
//     } catch (error) {
//       console.error('Failed to get transaction history:', error);
//       return [];
//     }
//   }
// }

// export const solanaChatStorage = new SolanaChatStorage();

// export interface SolanaChat {
//   id: string;
//   title: string;
//   lastMessage: string;
//   timestamp: Date;
//   threadId?: string;
//   signature?: string;
// }

// export interface SolanaMessage {
//   id: string;
//   role: 'user' | 'assistant';
//   content: string;
//   timestamp: Date;
//   signature?: string;
// }

// export class SolanaChatStorage {
//   private connection: Connection;
//   private rpcUrl: string;

//   constructor(rpcUrl: string = 'https://api.devnet.solana.com') {
//     this.rpcUrl = rpcUrl;
//     this.connection = new Connection(rpcUrl, 'confirmed');
//   }

//   /**
//    * Store a chat conversation on Solana using memo transactions with session key
//    */
//   async storeChat(walletAddress: string, chat: Omit<SolanaChat, 'signature'>): Promise<string> {
//     try {
//       const chatData = {
//         type: 'chat',
//         id: chat.id,
//         title: chat.title,
//         lastMessage: chat.lastMessage,
//         timestamp: chat.timestamp.toISOString(),
//         threadId: chat.threadId,
//       };

//       const memo = JSON.stringify(chatData);
      
//       // Create a minimal transaction (0.000001 SOL transfer to self with memo)
//       const transaction = new Transaction();
//       const fromPubkey = new PublicKey(walletAddress);
      
//       // Add a tiny transfer to self (this is just to create a transaction with memo)
//       transaction.add(
//         SystemProgram.transfer({
//           fromPubkey,
//           toPubkey: fromPubkey,
//           lamports: 1, // 1 lamport = minimal amount
//         })
//       );

//       // Add memo instruction
//       const memoInstruction = {
//         programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
//         keys: [],
//         data: Buffer.from(memo, 'utf-8'),
//       };
//       transaction.add(memoInstruction);

//       // Check if we have a session key for automatic signing
//       if (sessionKeyService.hasValidSessionKey(walletAddress)) {
//         // Use session key to sign and send transaction automatically
//         const signedTransaction = await sessionKeyService.signTransactionWithSessionKey(walletAddress, transaction);
//         const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
//         // Wait for confirmation
//         await this.connection.confirmTransaction(signature, 'confirmed');
        
//         console.log('✅ Chat stored on Solana with session key:', signature);
//         return signature;
//       } else {
//         // Fallback: return transaction for manual signing (legacy behavior)
//         console.log('⚠️ No session key found, returning transaction for manual signing');
//         return transaction.serialize({ requireAllSignatures: false }).toString('base64');
//       }
//     } catch (error) {
//       console.error('Error creating Solana chat transaction:', error);
//       throw new Error('Failed to create chat transaction');
//     }
//   }

//   /**
//    * Store a message on Solana using memo transactions with session key
//    */
//   async storeMessage(walletAddress: string, conversationId: string, message: Omit<SolanaMessage, 'signature'>): Promise<string> {
//     try {
//       const messageData = {
//         type: 'message',
//         conversationId,
//         id: message.id,
//         role: message.role,
//         content: message.content,
//         timestamp: message.timestamp.toISOString(),
//       };

//       const memo = JSON.stringify(messageData);
      
//       // Create a minimal transaction (0.000001 SOL transfer to self with memo)
//       const transaction = new Transaction();
//       const fromPubkey = new PublicKey(walletAddress);
      
//       // Add a tiny transfer to self (this is just to create a transaction with memo)
//       transaction.add(
//         SystemProgram.transfer({
//           fromPubkey,
//           toPubkey: fromPubkey,
//           lamports: 1, // 1 lamport = minimal amount
//         })
//       );

//       // Add memo instruction
//       const memoInstruction = {
//         programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
//         keys: [],
//         data: Buffer.from(memo, 'utf-8'),
//       };
//       transaction.add(memoInstruction);

//       // Check if we have a session key for automatic signing
//       if (sessionKeyService.hasValidSessionKey(walletAddress)) {
//         // Use session key to sign and send transaction automatically
//         const signedTransaction = await sessionKeyService.signTransactionWithSessionKey(walletAddress, transaction);
//         const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
//         // Wait for confirmation
//         await this.connection.confirmTransaction(signature, 'confirmed');
        
//         console.log('✅ Message stored on Solana with session key:', signature);
//         return signature;
//       } else {
//         // Fallback: return transaction for manual signing (legacy behavior)
//         console.log('⚠️ No session key found, returning transaction for manual signing');
//         return transaction.serialize({ requireAllSignatures: false }).toString('base64');
//       }
//     } catch (error) {
//       console.error('Error creating Solana message transaction:', error);
//       throw new Error('Failed to create message transaction');
//     }
//   }

//   /**
//    * Fetch all chats for a wallet address
//    */
//   async fetchChats(walletAddress: string): Promise<SolanaChat[]> {
//     try {
//       const publicKey = new PublicKey(walletAddress);
//       const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 100 });
      
//       const chats: SolanaChat[] = [];
      
//       for (const sig of signatures) {
//         try {
//           const transaction = await this.connection.getTransaction(sig.signature, {
//             commitment: 'confirmed',
//             maxSupportedTransactionVersion: 0,
//           });
          
//           if (transaction?.meta?.logMessages) {
//             // Look for memo instructions in the transaction
//             for (const log of transaction.meta.logMessages) {
//               if (log.includes('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')) {
//                 // This transaction contains a memo, try to parse it
//                 try {
//                   // Extract memo data from transaction
//                   const memoData = this.extractMemoFromTransaction(transaction);
//                   if (memoData && memoData.type === 'chat') {
//                     chats.push({
//                       id: memoData.id,
//                       title: memoData.title,
//                       lastMessage: memoData.lastMessage,
//                       timestamp: new Date(memoData.timestamp),
//                       threadId: memoData.threadId,
//                       signature: sig.signature,
//                     });
//                   }
//                 } catch (parseError) {
//                   console.log('Failed to parse memo data:', parseError);
//                 }
//               }
//             }
//           }
//         } catch (txError) {
//           console.log('Failed to fetch transaction:', txError);
//         }
//       }
      
//       // Sort by timestamp (newest first)
//       return chats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
//     } catch (error) {
//       console.error('Error fetching chats from Solana:', error);
//       return [];
//     }
//   }

//   /**
//    * Fetch all messages for a specific conversation
//    */
//   async fetchMessages(walletAddress: string, conversationId: string): Promise<SolanaMessage[]> {
//     try {
//       const publicKey = new PublicKey(walletAddress);
//       const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 100 });
      
//       const messages: SolanaMessage[] = [];
      
//       for (const sig of signatures) {
//         try {
//           const transaction = await this.connection.getTransaction(sig.signature, {
//             commitment: 'confirmed',
//             maxSupportedTransactionVersion: 0,
//           });
          
//           if (transaction?.meta?.logMessages) {
//             // Look for memo instructions in the transaction
//             for (const log of transaction.meta.logMessages) {
//               if (log.includes('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')) {
//                 // This transaction contains a memo, try to parse it
//                 try {
//                   // Extract memo data from transaction
//                   const memoData = this.extractMemoFromTransaction(transaction);
//                   if (memoData && memoData.type === 'message' && memoData.conversationId === conversationId) {
//                     messages.push({
//                       id: memoData.id,
//                       role: memoData.role,
//                       content: memoData.content,
//                       timestamp: new Date(memoData.timestamp),
//                       signature: sig.signature,
//                     });
//                   }
//                 } catch (parseError) {
//                   console.log('Failed to parse memo data:', parseError);
//                 }
//               }
//             }
//           }
//         } catch (txError) {
//           console.log('Failed to fetch transaction:', txError);
//         }
//       }
      
//       // Sort by timestamp (oldest first for messages)
//       return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
//     } catch (error) {
//       console.error('Error fetching messages from Solana:', error);
//       return [];
//     }
//   }

//   /**
//    * Delete a chat (mark as deleted with a memo transaction)
//    */
//   async deleteChat(walletAddress: string, chatId: string): Promise<string> {
//     try {
//       const deleteData = {
//         type: 'delete_chat',
//         chatId,
//         timestamp: new Date().toISOString(),
//       };

//       const memo = JSON.stringify(deleteData);
      
//       // Create a minimal transaction (0.000001 SOL transfer to self with memo)
//       const transaction = new Transaction();
//       const fromPubkey = new PublicKey(walletAddress);
      
//       // Add a tiny transfer to self (this is just to create a transaction with memo)
//       transaction.add(
//         SystemProgram.transfer({
//           fromPubkey,
//           toPubkey: fromPubkey,
//           lamports: 1, // 1 lamport = minimal amount
//         })
//       );

//       // Add memo instruction
//       const memoInstruction = {
//         programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
//         keys: [],
//         data: Buffer.from(memo, 'utf-8'),
//       };
//       transaction.add(memoInstruction);

//       // Check if we have a session key for automatic signing
//       if (sessionKeyService.hasValidSessionKey(walletAddress)) {
//         // Use session key to sign and send transaction automatically
//         const signedTransaction = await sessionKeyService.signTransactionWithSessionKey(walletAddress, transaction);
//         const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
//         // Wait for confirmation
//         await this.connection.confirmTransaction(signature, 'confirmed');
        
//         console.log('✅ Chat deletion recorded on Solana with session key:', signature);
//         return signature;
//       } else {
//         // Fallback: return transaction for manual signing (legacy behavior)
//         console.log('⚠️ No session key found, returning transaction for manual signing');
//         return transaction.serialize({ requireAllSignatures: false }).toString('base64');
//       }
//     } catch (error) {
//       console.error('Error creating Solana delete transaction:', error);
//       throw new Error('Failed to create delete transaction');
//     }
//   }

//   /**
//    * Get SOL balance for a wallet address
//    */
//   async getBalance(walletAddress: string): Promise<number> {
//     try {
//       const publicKey = new PublicKey(walletAddress);
//       const balance = await this.connection.getBalance(publicKey);
//       return balance / LAMPORTS_PER_SOL;
//     } catch (error) {
//       console.error('Error getting balance:', error);
//       return 0;
//     }
//   }

//   /**
//    * Extract memo data from a transaction
//    */
//   private extractMemoFromTransaction(transaction: any): any {
//     try {
//       // This is a simplified implementation
//       // In a real implementation, you would parse the transaction instructions
//       // and extract the memo data from the memo instruction
//       return null;
//     } catch (error) {
//       console.error('Error extracting memo from transaction:', error);
//       return null;
//     }
//   }
// }

// export const solanaChatStorage = new SolanaChatStorage();

// Placeholder exports to prevent import errors
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
  constructor() {
    console.log('SolanaChatStorage disabled - Solana dependencies removed');
  }

  async storeChat(): Promise<string> {
    throw new Error('SolanaChatStorage disabled - Solana dependencies removed');
  }

  async storeMessage(): Promise<string> {
    throw new Error('SolanaChatStorage disabled - Solana dependencies removed');
  }

  async fetchChats(): Promise<SolanaChat[]> {
    return [];
  }

  async fetchMessages(): Promise<SolanaMessage[]> {
    return [];
  }

  async deleteChat(): Promise<string> {
    throw new Error('SolanaChatStorage disabled - Solana dependencies removed');
  }

  async getBalance(): Promise<number> {
    return 0;
  }
}

export const solanaChatStorage = new SolanaChatStorage(); 