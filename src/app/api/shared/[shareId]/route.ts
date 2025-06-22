import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    try {
      // Try to get from database first
      const supabase = createClientComponentClient();
      
      const { data: sharedChat, error: shareError } = await supabase
        .from('shared_chats')
        .select(`
          id,
          chat_id,
          is_public,
          allow_comments,
          expires_at,
          password_hash,
          created_at
        `)
        .eq('id', shareId)
        .single();

      if (shareError || !sharedChat) {
        // Fallback: create a demo shared chat for testing
        return createDemoSharedChat(shareId);
      }

      // Check if share has expired
      if (sharedChat.expires_at && new Date(sharedChat.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'This shared chat has expired' },
          { status: 410 }
        );
      }

      // Check if chat is public
      if (!sharedChat.is_public) {
        return NextResponse.json(
          { error: 'This shared chat is private' },
          { status: 403 }
        );
      }

      // Get the actual conversation and messages
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          model,
          created_at,
          messages (
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('id', sharedChat.chat_id)
        .single();

      if (convError || !conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // Sort messages by creation time
      const sortedMessages = conversation.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const chatData = {
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        created_at: conversation.created_at,
        messages: sortedMessages,
        isPublic: sharedChat.is_public,
        allowComments: sharedChat.allow_comments
      };

      return NextResponse.json({ 
        success: true, 
        chat: chatData 
      });

    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      // Fallback to demo chat
      return createDemoSharedChat(shareId);
    }

  } catch (error) {
    console.error('Shared chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to load shared chat' },
      { status: 500 }
    );
  }
}

function createDemoSharedChat(shareId: string) {
  // Create a demo shared chat for testing purposes
  const demoChat = {
    id: shareId,
    title: 'Demo Shared Conversation',
    model: 'Convocore Omni',
    created_at: new Date().toISOString(),
    messages: [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello! Can you help me understand how AI models work?',
        created_at: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: `I'd be happy to explain how AI models work! 

AI models are computer programs that learn patterns from data to make predictions or generate responses. Here's a simplified overview:

**Training Process:**
1. **Data Collection**: Large amounts of text, images, or other data are gathered
2. **Pattern Recognition**: The model analyzes this data to find patterns and relationships
3. **Learning**: Through repeated exposure, the model adjusts its internal parameters

**How They Generate Responses:**
- When you ask a question, the model processes your input
- It uses learned patterns to predict what would be an appropriate response
- The response is generated word by word, considering context and probability

**Key Components:**
- **Neural Networks**: Interconnected nodes that process information
- **Parameters**: Millions or billions of values that determine behavior
- **Attention Mechanisms**: Help the model focus on relevant parts of the input

This is a simplified explanation, but it covers the basic concepts! Would you like me to dive deeper into any particular aspect?`,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        role: 'user' as const,
        content: 'That\'s fascinating! How do you ensure the responses are accurate and helpful?',
        created_at: new Date(Date.now() + 30000).toISOString()
      },
      {
        id: '4',
        role: 'assistant' as const,
        content: `Great question! Ensuring accuracy and helpfulness is a multi-layered challenge in AI development:

**Training Techniques:**
- **Quality Data**: Using high-quality, verified sources for training
- **Reinforcement Learning**: Training models to prefer helpful, accurate responses
- **Human Feedback**: Incorporating human reviewers to guide model behavior

**Safety Measures:**
- **Fact-checking**: Cross-referencing information against reliable sources
- **Uncertainty Expression**: Teaching models to express when they're unsure
- **Bias Mitigation**: Actively working to reduce harmful biases in responses

**Ongoing Improvements:**
- **Regular Updates**: Continuously improving models with new data and techniques
- **User Feedback**: Learning from user interactions to improve responses
- **Expert Review**: Having domain experts evaluate model outputs

**Limitations to Remember:**
- AI models can make mistakes or have outdated information
- They should be used as tools to assist, not replace, human judgment
- Critical decisions should always involve human oversight

The goal is to create AI that's helpful, harmless, and honest - but it's an ongoing process of improvement!`,
        created_at: new Date(Date.now() + 60000).toISOString()
      }
    ],
    isPublic: true,
    allowComments: false
  };

  return NextResponse.json({ 
    success: true, 
    chat: demoChat 
  });
} 