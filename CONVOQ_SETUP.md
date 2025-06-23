# ConvoQ Setup Guide

ConvoQ is Convocore's ultra-fast AI model powered by Groq's lightning-fast inference engine. This guide will help you set up and configure ConvoQ for your Convocore application.

## What is ConvoQ?

ConvoQ leverages Groq's specialized hardware and inference optimization to deliver:
- ⚡ **Ultra-fast responses** - Sub-second response times
- 🧠 **High-quality output** - Powered by Llama 3 and other advanced models
- 🔧 **Easy integration** - Seamless integration with your existing Convocore setup
- 💰 **Cost-effective** - Competitive pricing for high-performance AI

## Getting Your Groq API Key

1. **Visit Groq Console**
   - Go to [https://console.groq.com](https://console.groq.com)
   - Create an account or sign in

2. **Generate API Key**
   - Navigate to the API Keys section
   - Click "Create API Key"
   - Give it a descriptive name (e.g., "Convocore ConvoQ")
   - Copy the generated API key

3. **Important Security Notes**
   - Store your API key securely
   - Never commit API keys to version control
   - Use environment variables for production

## Configuration Methods

### Method 1: Environment Variables (Recommended for Production)

Add to your `.env.local` file:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

### Method 2: Settings UI (User Configuration)

1. Open Convocore application
2. Go to Settings (⚙️ icon)
3. Navigate to "AI Models" section
4. Find "ConvoQ API Key" field
5. Enter your Groq API key
6. Save settings

## Default Configuration

ConvoQ comes pre-configured with a working API key for immediate testing:
- **Default API Key**: `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`
- **Default Model**: Llama 3 8B (llama3-8b-8192)
- **Context Window**: 8,192 tokens
- **Max Tokens**: 8,192 tokens

## Available Models

ConvoQ supports multiple Groq-powered models:

| Model | Description | Context Window | Best For |
|-------|-------------|----------------|----------|
| Llama 3 8B | Fast and efficient | 8,192 tokens | General conversations |
| Llama 3 70B | More capable reasoning | 8,192 tokens | Complex tasks |
| Mixtral 8x7B | Mixture of experts | 32,768 tokens | Long context needs |
| Gemma 7B | Google's lightweight model | 8,192 tokens | Quick responses |

## Usage

### Via Model Selector
1. Click the model dropdown in the chat interface
2. Select "⚡ ConvoQ (Ultra-Fast Responses)"
3. Start chatting with ultra-fast responses

### Via @ Mentions
Type `@convoq` in the chat input to quickly switch to ConvoQ:
```
@convoq What's the weather like today?
```

### Via Settings
1. Open Settings → AI Models
2. Set "Default Model" to "ConvoQ"
3. All new chats will use ConvoQ by default

## Performance Optimization

### Speed Features
- **Streaming Responses**: Real-time token streaming
- **Optimized Inference**: Groq's custom silicon acceleration
- **Minimal Latency**: Direct API integration without middleware

### Configuration Tips
- Lower temperature (0.1-0.3) for faster, more deterministic responses
- Reduce max_tokens for even faster responses
- Use streaming for better user experience

## Troubleshooting

### Common Issues

**"ConvoQ API key not configured"**
- Solution: Add your Groq API key in Settings or environment variables

**"Invalid Groq API key"**
- Solution: Verify your API key is correct and active
- Check [console.groq.com](https://console.groq.com) for key status

**"Rate limit exceeded"**
- Solution: Wait a moment and try again
- Consider upgrading your Groq plan for higher limits

**Slow responses despite "ultra-fast" claims**
- Check your internet connection
- Verify you're using the ConvoQ model, not others
- Try reducing max_tokens or temperature

### Debug Mode

Enable debug logging to troubleshoot issues:
1. Open browser Developer Tools (F12)
2. Check Console tab for ConvoQ-related logs
3. Look for messages starting with "🔄 Calling Groq API"

## Rate Limits & Pricing

ConvoQ uses Groq's pricing structure:
- **Free Tier**: Limited requests per minute
- **Pro Plans**: Higher rate limits and priority access
- **Enterprise**: Custom limits and SLA

Check [groq.com/pricing](https://groq.com/pricing) for current rates.

## Security Best Practices

1. **API Key Protection**
   - Never expose API keys in client-side code
   - Use environment variables in production
   - Rotate keys regularly

2. **Rate Limiting**
   - Implement client-side rate limiting
   - Handle 429 errors gracefully
   - Monitor usage patterns

3. **Content Filtering**
   - Implement input validation
   - Monitor for abuse patterns
   - Use Groq's safety features

## Support

For ConvoQ-specific issues:
- Check this documentation first
- Review browser console for error messages
- Contact support with specific error details

For Groq API issues:
- Visit [Groq Documentation](https://console.groq.com/docs)
- Check [Groq Status Page](https://status.groq.com)
- Contact Groq support for API-related issues

## Integration Examples

### Basic Chat
```typescript
import { convoQService } from '@/lib/convoq-service';

const response = await convoQService.generateResponse({
  messages: [
    { role: 'user', content: 'Hello, ConvoQ!' }
  ],
  model: 'llama3-8b-8192',
  temperature: 0.7,
  max_tokens: 1000
});
```

### Streaming Responses
```typescript
const stream = await convoQService.streamResponse({
  messages: [
    { role: 'user', content: 'Tell me a story' }
  ],
  model: 'llama3-8b-8192',
  stream: true
});
```

## Changelog

- **v1.0.0**: Initial ConvoQ integration with Groq API
- **v1.0.1**: Added multiple model support
- **v1.0.2**: Enhanced error handling and user feedback

---

**ConvoQ** - Ultra-fast AI responses powered by Groq's cutting-edge inference technology. ⚡ 