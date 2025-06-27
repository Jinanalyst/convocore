/**
 * This service handles communication with the local OpenAI Assistant API route.
 */

/**
 * Invokes the local OpenAI Assistant API route.
 *
 * @param message The message from the user.
 * @param threadId The ID of the conversation thread (optional).
 * @returns An object containing the assistant's reply and the thread ID.
 */
export const invokeAssistant = async (message: string, threadId: string | null = null) => {
  try {
    const response = await fetch(
      '/api/assistant/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: message }], threadId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call assistant API');
    }

    const data = await response.json();
    console.log('Assistant reply:', data.content);
    console.log('Thread ID:', data.threadId);
    
    // You should store the threadId somewhere in your application state
    // so you can continue the same conversation.
    return { reply: data.content, threadId: data.threadId };
  } catch (error) {
    console.error('Error invoking assistant API:', error);
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
 */ 