import { createClientComponentClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  messageCount: number;
}

export interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

class ChatStorageService {
  private supabase = createClientComponentClient();

  // Check if user is authenticated
  private async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load chat sessions (from database if authenticated, localStorage if not)
  async loadChatSessions(): Promise<ChatSession[]> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        return await this.loadFromDatabase();
      } else {
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      // Fallback to localStorage
      return this.loadFromLocalStorage();
    }
  }

  // Save chat session (to database if authenticated, localStorage if not)
  async saveChatSession(session: ChatSession): Promise<void> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        await this.saveToDatabase(session);
      } else {
        await this.saveToLocalStorage(session);
      }

      // Trigger update event
      window.dispatchEvent(new CustomEvent('chat-sessions-updated'));
    } catch (error) {
      console.error('Failed to save chat session:', error);
      // Fallback to localStorage
      await this.saveToLocalStorage(session);
      window.dispatchEvent(new CustomEvent('chat-sessions-updated'));
    }
  }

  // Delete chat session
  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        await this.deleteFromDatabase(sessionId);
      } else {
        await this.deleteFromLocalStorage(sessionId);
      }

      // Trigger update event
      window.dispatchEvent(new CustomEvent('chat-sessions-updated'));
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      // Fallback to localStorage
      await this.deleteFromLocalStorage(sessionId);
      window.dispatchEvent(new CustomEvent('chat-sessions-updated'));
    }
  }

  // Update session title
  async updateSessionTitle(sessionId: string, newTitle: string): Promise<void> {
    try {
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        await this.updateTitleInDatabase(sessionId, newTitle);
      } else {
        await this.updateTitleInLocalStorage(sessionId, newTitle);
      }

      // Trigger update event
      window.dispatchEvent(new CustomEvent('chat-sessions-updated'));
    } catch (error) {
      console.error('Failed to update session title:', error);
      // Fallback to localStorage
      await this.updateTitleInLocalStorage(sessionId, newTitle);
      window.dispatchEvent(new CustomEvent('chat-sessions-updated'));
    }
  }

  // DATABASE METHODS
  private async loadFromDatabase(): Promise<ChatSession[]> {
    const { data: conversations, error: convError } = await this.supabase
      .from('conversations')
      .select(`
        id,
        title,
        model,
        created_at,
        updated_at,
        messages (
          id,
          role,
          content,
          model,
          tokens_used,
          created_at
        )
      `)
      .order('updated_at', { ascending: false });

    if (convError) {
      throw new Error(`Database error: ${convError.message}`);
    }

    return (conversations || []).map(conv => ({
      id: conv.id,
      title: conv.title,
      model: conv.model,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      messageCount: conv.messages.length,
      messages: conv.messages
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          tokens: msg.tokens_used || undefined,
          model: msg.model || undefined
        }))
    }));
  }

  private async saveToDatabase(session: ChatSession): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if conversation exists
    const { data: existingConv } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('id', session.id)
      .single();

    if (existingConv) {
      // Update existing conversation
      await this.supabase
        .from('conversations')
        .update({
          title: session.title,
          model: session.model,
          updated_at: session.updatedAt.toISOString()
        })
        .eq('id', session.id);
    } else {
      // Create new conversation
      await this.supabase
        .from('conversations')
        .insert({
          id: session.id,
          user_id: user.id,
          title: session.title,
          model: session.model,
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString()
        });
    }

    // Save messages (only new ones to avoid duplicates)
    const { data: existingMessages } = await this.supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', session.id);

    const existingMessageIds = new Set((existingMessages || []).map(m => m.id));
    const newMessages = session.messages.filter(msg => !existingMessageIds.has(msg.id));

    if (newMessages.length > 0) {
      await this.supabase
        .from('messages')
        .insert(
          newMessages.map(msg => ({
            id: msg.id,
            conversation_id: session.id,
            role: msg.role,
            content: msg.content,
            model: msg.model || null,
            tokens_used: msg.tokens || null,
            created_at: msg.timestamp.toISOString()
          }))
        );
    }
  }

  private async deleteFromDatabase(sessionId: string): Promise<void> {
    // Delete conversation (messages will be cascade deleted)
    await this.supabase
      .from('conversations')
      .delete()
      .eq('id', sessionId);
  }

  private async updateTitleInDatabase(sessionId: string, newTitle: string): Promise<void> {
    await this.supabase
      .from('conversations')
      .update({
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }

  // LOCALSTORAGE METHODS
  private loadFromLocalStorage(): ChatSession[] {
    try {
      const savedSessions = localStorage.getItem('convocore-chat-sessions');
      if (!savedSessions) return [];

      return JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return [];
    }
  }

  private async saveToLocalStorage(session: ChatSession): Promise<void> {
    try {
      const sessions = this.loadFromLocalStorage();
      const existingIndex = sessions.findIndex(s => s.id === session.id);

      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }

      localStorage.setItem('convocore-chat-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private async deleteFromLocalStorage(sessionId: string): Promise<void> {
    try {
      const sessions = this.loadFromLocalStorage();
      const updatedSessions = sessions.filter(s => s.id !== sessionId);

      if (updatedSessions.length === 0) {
        localStorage.removeItem('convocore-chat-sessions');
      } else {
        localStorage.setItem('convocore-chat-sessions', JSON.stringify(updatedSessions));
      }
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
    }
  }

  private async updateTitleInLocalStorage(sessionId: string, newTitle: string): Promise<void> {
    try {
      const sessions = this.loadFromLocalStorage();
      const updatedSessions = sessions.map(session =>
        session.id === sessionId
          ? { ...session, title: newTitle, updatedAt: new Date() }
          : session
      );

      localStorage.setItem('convocore-chat-sessions', JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Failed to update title in localStorage:', error);
    }
  }

  // Convert sessions to chat format for sidebar
  sessionsToChats(sessions: ChatSession[]): Chat[] {
    return sessions.map(session => {
      const lastMessage = session.messages.length > 0
        ? session.messages[session.messages.length - 1].content.substring(0, 60) + (session.messages[session.messages.length - 1].content.length > 60 ? '...' : '')
        : 'No messages yet';

      return {
        id: session.id,
        title: session.title,
        lastMessage,
        timestamp: session.updatedAt
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Export singleton instance
export const chatStorageService = new ChatStorageService(); 