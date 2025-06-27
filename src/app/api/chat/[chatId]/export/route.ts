import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { format } = await request.json();
    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    if (!['pdf', 'txt', 'md', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Handle demo chats - return error
    if (chatId.startsWith('demo_')) {
      return NextResponse.json({ error: 'Demo chats cannot be exported' }, { status: 400 });
    }

    // Handle local chats - return error (they're stored in localStorage)
    if (chatId.startsWith('local_chat_')) {
      return NextResponse.json({ error: 'Local chats cannot be exported. Please connect your wallet to export chats.' }, { status: 400 });
    }

    // For Solana wallet chats, we would need to implement export functionality
    // For now, return an error indicating this feature is not yet implemented
    return NextResponse.json({ error: 'Export functionality for Solana chats is not yet implemented' }, { status: 501 });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ConversationData {
  id: string;
  title: string;
  model: string;
  created_at: string;
}

interface MessageData {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

function generateMarkdown(conversation: ConversationData, messages: MessageData[]): string {
  const date = new Date(conversation.created_at).toLocaleDateString();
  
  let content = `# ${conversation.title}\n\n`;
  content += `**Model:** ${conversation.model}\n`;
  content += `**Date:** ${date}\n`;
  content += `**Exported:** ${new Date().toLocaleDateString()}\n\n`;
  content += `---\n\n`;

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? '👤 **User**' : '🤖 **Assistant**';
    const timestamp = new Date(message.created_at).toLocaleTimeString();
    
    content += `## ${role} (${timestamp})\n\n`;
    content += `${message.content}\n\n`;
    
    if (index < messages.length - 1) {
      content += `---\n\n`;
    }
  });

  content += `\n*Exported from Convocore*`;
  return content;
}

function generatePlainText(conversation: ConversationData, messages: MessageData[]): string {
  const date = new Date(conversation.created_at).toLocaleDateString();
  
  let content = `${conversation.title}\n`;
  content += `${'='.repeat(conversation.title.length)}\n\n`;
  content += `Model: ${conversation.model}\n`;
  content += `Date: ${date}\n`;
  content += `Exported: ${new Date().toLocaleDateString()}\n\n`;

  messages.forEach((message) => {
    const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
    const timestamp = new Date(message.created_at).toLocaleTimeString();
    
    content += `[${role}] ${timestamp}\n`;
    content += `${'-'.repeat(40)}\n`;
    content += `${message.content}\n\n`;
  });

  content += `\nExported from Convocore`;
  return content;
}

function generateHTML(conversation: ConversationData, messages: MessageData[]): string {
  const date = new Date(conversation.created_at).toLocaleDateString();
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${conversation.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
        }
        .user-message {
            background-color: #f0f0f0;
            margin-left: 20px;
        }
        .assistant-message {
            background-color: #e8f4fd;
            margin-right: 20px;
        }
        .message-header {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .message-content {
            white-space: pre-wrap;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${conversation.title}</h1>
        <p><strong>Model:</strong> ${conversation.model}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Exported:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="messages">
`;

  messages.forEach(message => {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    const cssClass = message.role === 'user' ? 'user-message' : 'assistant-message';
    const timestamp = new Date(message.created_at).toLocaleTimeString();
    
    html += `
        <div class="message ${cssClass}">
            <div class="message-header">${role} - ${timestamp}</div>
            <div class="message-content">${message.content}</div>
        </div>
`;
  });

  html += `
    </div>
    
    <div class="footer">
        <p>Exported from Convocore</p>
    </div>
</body>
</html>
`;

  return html;
} 