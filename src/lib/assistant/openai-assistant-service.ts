/**
 * This service handles communication with the OpenAI Assistant Supabase edge function.
 */

// You can get these from your Supabase project's API settings.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Invokes the 'openai-assistant' edge function.
 *
 * @param message The message from the user.
 * @param threadId The ID of the conversation thread (optional).
 * @returns An object containing the assistant's reply and the thread ID.
 */
export const invokeAssistant = async (message: string, threadId: string | null = null) => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/openai-assistant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message, threadId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call function');
    }

    const data = await response.json();
    console.log('Assistant reply:', data.reply);
    console.log('Thread ID:', data.threadId);
    
    // You should store the threadId somewhere in your application state
    // so you can continue the same conversation.
    return data;
  } catch (error) {
    console.error('Error invoking function:', error);
    throw error;
  }
};

/*
 * HOW TO USE THIS SERVICE:
 *
 * 1. Import the 'invokeAssistant' function into your component:
 *    import { invokeAssistant } from '@/lib/assistant/openai-assistant-service';
 *
 * 2. In your component, manage the 'threadId' in your state. It will be null initially.
 *    const [threadId, setThreadId] = useState<string | null>(null);
 *
 * 3. When the user sends a message, call the function:
 *    const handleSendMessage = async (message: string) => {
 *      try {
 *        const { reply, threadId: newThreadId } = await invokeAssistant(message, threadId);
 *        // Update your chat UI with the assistant's reply.
 *        // Save the new threadId to continue the conversation.
 *        setThreadId(newThreadId);
 *      } catch (error) {
 *        // Handle any errors, e.g., show a notification to the user.
 *      }
 *    };
 *
 * 4. Remember to replace '<your-project-ref>' and '<your-supabase-anon-key>'
 *    in this file with your actual Supabase project reference and anon key.
 */ 