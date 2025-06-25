# Environment Setup Guide for Convocore

This guide will help you set up the required environment variables for the Convocore AI platform.

## Required Environment Variables

Create a `.env.local` file in the root directory of your project and add the following variables:

```bash
# API Keys (Required)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (Required for production)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# TRON Network Configuration
NEXT_PUBLIC_TRON_NETWORK=mainnet
NEXT_PUBLIC_TRON_RECIPIENT_ADDRESS=TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Feature Flags
NEXT_PUBLIC_ENABLE_STREAMING=true
NEXT_PUBLIC_ENABLE_VOICE_INPUT=false
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=false
```

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it as `OPENAI_API_KEY` value

### Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it as `ANTHROPIC_API_KEY` value

### Supabase Configuration
1. Go to [Supabase](https://supabase.com/)
2. Create a new project or use an existing one
3. Go to Settings → API
4. Copy the following values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Project API Keys → anon/public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Project API Keys → service_role/secret → `SUPABASE_SERVICE_ROLE_KEY`

### Database Setup
1. In your Supabase project, go to SQL Editor
2. Copy the contents of `supabase/schema.sql` from this project
3. Run the SQL to create all necessary tables and policies
4. Enable Google OAuth (optional):
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials

## Supported AI Models

The platform supports the following AI models:

### OpenAI Models
- `gpt-4-turbo` - Most capable GPT-4 model, optimized for speed
- `gpt-4` - High-intelligence flagship model for complex tasks
- `gpt-3.5-turbo` - Fast, cost-effective model for simple tasks

### Anthropic Models
- `claude-3-opus` - Most powerful model for highly complex tasks
- `claude-3-sonnet` - Balanced model for a wide range of tasks
- `claude-3-haiku` - Fastest model for simple tasks

## Testing Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit the status endpoint to check if your API keys are configured:
   ```
   http://localhost:3000/api/status
   ```

3. Navigate to the Convocore application:
   ```
   http://localhost:3000/convocore
   ```

4. Try sending a message to test the AI integration.

## Troubleshooting

### Common Issues

1. **"API key not configured" error**
   - Make sure your `.env.local` file is in the root directory
   - Check that the API key variable names match exactly
   - Restart your development server after adding environment variables

2. **"Failed to get AI response" error**
   - Verify your API keys are valid and active
   - Check your internet connection
   - Ensure you have sufficient credits/quota with the AI provider

3. **Model not found error**
   - Make sure you're using a supported model name
   - Check if your API key has access to the specific model
   - Some models may require special access or approval

### Environment Variables Explanation

- `OPENAI_API_KEY` - Your OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude models
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js session encryption
- `NEXT_PUBLIC_TRON_RECIPIENT_ADDRESS` - TRON wallet address for payments
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per time window
- `RATE_LIMIT_WINDOW_MS` - Time window for rate limiting in milliseconds

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API keys secure and don't share them publicly
- Regularly rotate your API keys for security
- Use environment-specific configurations for different deployments

## Next Steps

Once your environment is set up:
1. Test the chat functionality with different AI models
2. Explore the settings modal to configure AI parameters
3. Set up TRON wallet integration for payments
4. Customize the platform for your specific use case 