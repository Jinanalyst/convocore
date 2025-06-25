# Convocore Setup Guide

## 🚀 Quick Start

### 1. Environment Configuration

Copy `env.example` to `.env.local` and configure the following variables:

```bash
# Required for basic functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Required for Google login
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Optional: For enhanced functionality
TRON_GRID_API_KEY=your_tron_grid_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Configuration Details

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy the `URL` and `anon public` key to your `.env.local`
4. Enable Google OAuth:
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

### OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key
3. Add it to your `.env.local` as `OPENAI_API_KEY`

## 🐛 Bug Fixes Applied

### ✅ Authentication Issues
- Enhanced Google login error handling
- Fixed client-side exception handling
- Improved authentication flow with proper error messages
- Added comprehensive error boundaries

### ✅ Localization Issues
- Replaced all Korean text with English
- Fixed model descriptions and UI text
- Standardized language across the application

### ✅ Error Handling
- Added global error boundary component
- Enhanced error logging and reporting
- Improved network error recovery
- Better user-friendly error messages

### ✅ Chat Interface
- Complete ChatGPT-like interface
- Session management with sidebar
- Message history and persistence
- Mobile-responsive design
- Voice input support
- Model selection
- Web search integration

## 🎯 Features

### Authentication
- 🔐 Multiple login methods: Email/Password, Magic Link, Google OAuth, Wallet Connection
- 🛡️ Secure session management
- 🔄 Automatic error recovery

### Chat Interface
- 💬 ChatGPT-like conversation interface
- 📱 Mobile-responsive design
- 🎤 Voice input support
- 🌐 Web search integration
- 📝 Message editing and regeneration
- 📂 Chat session management

### AI Models
- 🤖 Multiple AI model support (GPT-4, Claude, etc.)
- ⚡ Fast response times
- 🎯 Model-specific optimizations

### Payments
- 💰 TRON blockchain USDT payments
- 💳 Secure transaction handling
- 📊 Usage tracking and limits

## 🚨 Troubleshooting

### Build Errors
If you encounter build errors, ensure all dependencies are installed:
```bash
npm install
npm run build
```

### Authentication Not Working
1. Check that all environment variables are set correctly
2. Verify Supabase configuration
3. Ensure Google OAuth redirect URIs are correct
4. Check browser console for detailed error messages

### API Errors
1. Verify OpenAI API key is valid and has credits
2. Check network connectivity
3. Review API usage limits

### Mobile Issues
The application includes comprehensive mobile support:
- Touch-friendly interface
- Responsive design
- Virtual keyboard handling
- Gesture navigation

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── auth/              # Authentication pages
│   ├── api/               # API routes
│   └── convocore/         # Main chat interface
├── components/            # React components
│   ├── blocks/            # Large feature components
│   ├── layout/            # Layout components
│   ├── modals/            # Modal dialogs
│   └── ui/                # Base UI components
├── lib/                   # Utility libraries
│   ├── ai-service.ts      # AI API integration
│   ├── auth-service.ts    # Authentication logic
│   ├── blockchain.ts      # TRON blockchain integration
│   └── utils.ts           # General utilities
└── middleware.ts          # Next.js middleware
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all production environment variables are set:
- Update redirect URIs for OAuth providers
- Set production Supabase URL
- Configure production API keys

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all environment variables are correctly set
3. Ensure all dependencies are installed
4. Review this setup guide

The application now includes comprehensive error handling and should provide clear error messages to help diagnose any issues. 