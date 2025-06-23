import { chatStorageService, type ChatSession } from '@/lib/chat-storage-service';
import { createClientComponentClient } from '@/lib/supabase';

class ChatMigrationService {
  private supabase = createClientComponentClient();

  // Check if user has local data that needs migrating
  async hasLocalDataToMigrate(): Promise<boolean> {
    try {
      const localData = localStorage.getItem('convocore-chat-sessions');
      return !!localData && JSON.parse(localData).length > 0;
    } catch {
      return false;
    }
  }

  // Migrate localStorage data to Supabase for authenticated user
  async migrateLocalDataToDatabase(): Promise<{ success: boolean; migratedCount: number; error?: string }> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, migratedCount: 0, error: 'User not authenticated' };
      }

      // Get local data
      const localData = localStorage.getItem('convocore-chat-sessions');
      if (!localData) {
        return { success: true, migratedCount: 0 };
      }

      const localSessions: any[] = JSON.parse(localData);
      if (localSessions.length === 0) {
        return { success: true, migratedCount: 0 };
      }

      // Convert local data to proper format
      const sessions: ChatSession[] = localSessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));

      // Check what's already in the database to avoid duplicates
      const { data: existingConversations } = await this.supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      const existingIds = new Set((existingConversations || []).map(conv => conv.id));
      const sessionsToMigrate = sessions.filter(session => !existingIds.has(session.id));

      if (sessionsToMigrate.length === 0) {
        return { success: true, migratedCount: 0 };
      }

      // Migrate each session
      let migratedCount = 0;
      for (const session of sessionsToMigrate) {
        try {
          await this.migrateSession(session, user.id);
          migratedCount++;
        } catch (error) {
          console.error('Failed to migrate session:', session.id, error);
        }
      }

      // Clear localStorage after successful migration
      if (migratedCount > 0) {
        localStorage.removeItem('convocore-chat-sessions');
        // Trigger update to refresh UI
        window.dispatchEvent(new CustomEvent('chat-sessions-updated'));
      }

      return { success: true, migratedCount };

    } catch (error) {
      console.error('Migration failed:', error);
      return { 
        success: false, 
        migratedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Migrate a single session to database
  private async migrateSession(session: ChatSession, userId: string): Promise<void> {
    // Insert conversation
    await this.supabase
      .from('conversations')
      .insert({
        id: session.id,
        user_id: userId,
        title: session.title,
        model: session.model,
        created_at: session.createdAt.toISOString(),
        updated_at: session.updatedAt.toISOString()
      });

    // Insert messages
    if (session.messages.length > 0) {
      await this.supabase
        .from('messages')
        .insert(
          session.messages.map(msg => ({
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

  // Check if user should be prompted for migration
  async shouldPromptMigration(): Promise<boolean> {
    try {
      // Only prompt if user is authenticated and has local data
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return false;

      return await this.hasLocalDataToMigrate();
    } catch {
      return false;
    }
  }

  // Get migration info for user prompt
  async getMigrationInfo(): Promise<{ sessionCount: number; messageCount: number }> {
    try {
      const localData = localStorage.getItem('convocore-chat-sessions');
      if (!localData) return { sessionCount: 0, messageCount: 0 };

      const sessions = JSON.parse(localData);
      const sessionCount = sessions.length;
      const messageCount = sessions.reduce((total: number, session: any) => total + session.messages.length, 0);

      return { sessionCount, messageCount };
    } catch {
      return { sessionCount: 0, messageCount: 0 };
    }
  }
}

// Export singleton instance
export const chatMigrationService = new ChatMigrationService(); 