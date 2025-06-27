# ConvoAI API Keys Setup Guide

This guide will help you set up all the required API keys for the ConvoAI application.

## Required API Keys

### 1. OpenAI API Key (Required for GPT models)
**Used for:** `gpt-4o`, `gpt-4-turbo` models
**How to get:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Environment Variable:** `OPENAI_API_KEY`

### 2. Anthropic API Key (Required for Claude models)
**Used for:** `claude-3-opus-20240229`, `claude-3-sonnet-20240229` models
**How to get:**
1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in to your Anthropic account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

**Environment Variable:** `ANTHROPIC_API_KEY`

### 3. OpenRouter API Key (Required for ConvoMini)
**Used for:** `deepseek/deepseek-r1:free` model
**How to get:**
1. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in to your OpenRouter account
3. Create a new API key
4. Copy the key (starts with `sk-or-`)

**Environment Variable:** `OPENROUTER_API_KEY`

### 4. Groq API Key (Required for ConvoQ)
**Used for:** `convoq` model (ultra-fast responses)
**How to get:**
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up or log in to your Groq account
3. Create a new API key
4. Copy the key (starts with `gsk_`)

**Environment Variable:** `GROQ_API_KEY` (server-side) or `NEXT_PUBLIC_GROQ_API_KEY` (client-side)

## Setup Instructions

### Step 1: Create Environment File
Create a `.env.local` file in the `convocore` directory:

```bash
# AI Service Configuration
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
OPENROUTER_API_KEY=sk-or-your-openrouter-key-here
GROQ_API_KEY=gsk-your-groq-key-here

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Restart Development Server
After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

### Step 3: Verify API Keys
The application will automatically validate your API keys. You can check the status in the browser console or settings modal.

## Model Availability by API Key

| Model | Provider | Required API Key | Status |
|-------|----------|------------------|---------|
| gpt-4o | OpenAI | OPENAI_API_KEY | ✅ Available |
| gpt-4-turbo | OpenAI | OPENAI_API_KEY | ✅ Available |
| claude-3-opus-20240229 | Anthropic | ANTHROPIC_API_KEY | ✅ Available |
| claude-3-sonnet-20240229 | Anthropic | ANTHROPIC_API_KEY | ✅ Available |
| deepseek/deepseek-r1:free | OpenRouter | OPENROUTER_API_KEY | ✅ Available |
| convoq | Groq | GROQ_API_KEY | ✅ Available |

## Free Tier Limitations

- **Free Plan:** Only ConvoQ model is available
- **Pro Plan:** All models available
- **Premium Plan:** All models + priority access

## Troubleshooting

### "Missing OPENAI_API_KEY" Error
- Ensure your `.env.local` file exists in the `convocore` directory
- Check that the API key is correctly copied (no extra spaces)
- Restart the development server after adding the key

### "Invalid API Key" Error
- Verify the API key format (should start with the correct prefix)
- Check if the API key has sufficient credits/quota
- Ensure the API key is active and not expired

### Model Not Available
- Check if you have the required API key for that model
- Verify your subscription tier allows access to that model
- Check the browser console for specific error messages

## Security Notes

- Never commit your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore`
- API keys are only used server-side for security
- Client-side keys (NEXT_PUBLIC_*) are only used for ConvoQ settings

## Cost Considerations

- **OpenAI:** Pay per token usage
- **Anthropic:** Pay per token usage  
- **OpenRouter:** Pay per token usage
- **Groq:** Pay per token usage (generally cheaper and faster)

## Support

If you encounter issues with API key setup:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the development server is restarted after changes
4. Check the API provider's documentation for any service issues 