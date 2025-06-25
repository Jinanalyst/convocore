import { createClientComponentClient } from '@/lib/supabase';

export interface ConversationMemory {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export class MemoryService {
  private supabase = createClientComponentClient();

  /**
   * Save a message to conversation history
   */
  async saveMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('convo_history')
        .insert({
          user_id: userId,
          role,
          content
        });

      if (error) {
        console.error('Error saving message to history:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save message:', error);
      // Don't throw - let the conversation continue even if memory fails
    }
  }

  /**
   * Get recent conversation history for a user
   */
  async getRecentHistory(userId: string, limit: number = 10): Promise<ConversationMemory[]> {
    try {
      const { data, error } = await this.supabase
        .from('convo_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      // Return in chronological order (oldest first)
      return (data || []).reverse();
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
      return [];
    }
  }

  /**
   * Get conversation context for AI prompt
   */
  async getConversationContext(userId: string, maxMessages: number = 6): Promise<string> {
    try {
      const history = await this.getRecentHistory(userId, maxMessages);
      
      if (history.length === 0) {
        return '';
      }

      // Format history for AI context
      const contextMessages = history.map(msg => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        return `${role}: ${msg.content}`;
      }).join('\n');

      return `Previous conversation context:\n${contextMessages}\n\nCurrent conversation:`;
    } catch (error) {
      console.error('Failed to get conversation context:', error);
      return '';
    }
  }

  /**
   * Clear conversation history for a user
   */
  async clearHistory(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('convo_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing conversation history:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      throw error;
    }
  }

  /**
   * Get conversation summary for a user
   */
  async getConversationSummary(userId: string): Promise<{
    totalMessages: number;
    lastActivity: string | null;
    topicsDiscussed: string[];
  }> {
    try {
      const { data, error } = await this.supabase
        .from('convo_history')
        .select('content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversation summary:', error);
        return {
          totalMessages: 0,
          lastActivity: null,
          topicsDiscussed: []
        };
      }

      const messages = data || [];
      const totalMessages = messages.length;
      const lastActivity = messages.length > 0 ? messages[0].created_at : null;

      // Extract potential topics (simple keyword extraction)
      const allContent = messages.map(m => m.content).join(' ');
      const words = allContent.toLowerCase().split(/\s+/);
      const topicWords = words.filter(word => 
        word.length > 4 && 
        !['what', 'when', 'where', 'how', 'why', 'can', 'could', 'would', 'should'].includes(word)
      );
      
      // Get unique topics (simple approach)
      const topicsDiscussed = [...new Set(topicWords)].slice(0, 5);

      return {
        totalMessages,
        lastActivity,
        topicsDiscussed
      };
    } catch (error) {
      console.error('Failed to get conversation summary:', error);
      return {
        totalMessages: 0,
        lastActivity: null,
        topicsDiscussed: []
      };
    }
  }

  /**
   * Check if user has conversation history
   */
  async hasHistory(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('convo_history')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('Error checking conversation history:', error);
        return false;
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('Failed to check conversation history:', error);
      return false;
    }
  }

  /**
   * Get user recognition info for personalized greetings
   */
  async getUserRecognition(userId: string): Promise<{
    isReturningUser: boolean;
    lastSeen: string | null;
    messageCount: number;
    preferredTopics: string[];
  }> {
    try {
      const summary = await this.getConversationSummary(userId);
      const isReturningUser = summary.totalMessages > 0;

      return {
        isReturningUser,
        lastSeen: summary.lastActivity,
        messageCount: summary.totalMessages,
        preferredTopics: summary.topicsDiscussed
      };
    } catch (error) {
      console.error('Failed to get user recognition info:', error);
      return {
        isReturningUser: false,
        lastSeen: null,
        messageCount: 0,
        preferredTopics: []
      };
    }
  }
}

// Create singleton instance
export const memoryService = new MemoryService(); 