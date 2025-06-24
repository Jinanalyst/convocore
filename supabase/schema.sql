-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Drop the existing table if it exists and recreate with proper structure
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with proper structure
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
    subscription_expires_at TIMESTAMPTZ NULL,
    subscription_auto_renew BOOLEAN DEFAULT FALSE,
    api_requests_used INTEGER DEFAULT 0,
    api_requests_limit INTEGER DEFAULT 3,
    api_requests_reset_at TIMESTAMPTZ DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW()) NOT NULL,
    last_login TIMESTAMPTZ
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, last_login)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('UTC', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_subscription_tier_idx ON public.users (subscription_tier);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users (created_at);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Conversations table
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation History table for memory-aware AI (as requested)
CREATE TABLE public.convo_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    transaction_hash TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    subscription_tier subscription_tier NOT NULL,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_convo_history_user_id ON public.convo_history(user_id);
CREATE INDEX idx_convo_history_created_at ON public.convo_history(created_at DESC);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_transaction_hash ON public.payments(transaction_hash);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Row Level Security (RLS) policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Conversation History policies
CREATE POLICY "Users can view own conversation history" ON public.convo_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversation history" ON public.convo_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to reset daily API limits
CREATE OR REPLACE FUNCTION public.reset_daily_api_limits()
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET api_requests_used = 0
    WHERE subscription_tier = 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check API rate limits
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT subscription_tier, api_requests_used, api_requests_limit
    INTO user_record
    FROM public.users
    WHERE id = user_id;
    
    -- Pro and Premium users have unlimited requests
    IF user_record.subscription_tier IN ('pro', 'premium') THEN
        RETURN TRUE;
    END IF;
    
    -- Free users have daily limits
    RETURN user_record.api_requests_used < user_record.api_requests_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment API usage
CREATE OR REPLACE FUNCTION public.increment_api_usage(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET api_requests_used = api_requests_used + 1,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process payment and update subscription
CREATE OR REPLACE FUNCTION public.process_payment(
    p_user_id UUID,
    p_transaction_hash TEXT,
    p_amount DECIMAL,
    p_subscription_tier subscription_tier
)
RETURNS void AS $$
DECLARE
    expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate expiration date (30 days from now)
    expires_at := NOW() + INTERVAL '30 days';
    
    -- Update payment status
    UPDATE public.payments 
    SET status = 'confirmed', confirmed_at = NOW()
    WHERE transaction_hash = p_transaction_hash;
    
    -- Update user subscription
    UPDATE public.users 
    SET 
        subscription_tier = p_subscription_tier,
        subscription_status = 'active',
        subscription_expires_at = expires_at,
        subscription_auto_renew = TRUE,
        api_requests_limit = CASE 
            WHEN p_subscription_tier = 'pro' THEN 999999
            WHEN p_subscription_tier = 'premium' THEN 999999
            ELSE 3
        END,
        api_requests_reset_at = CURRENT_DATE + INTERVAL '1 day',
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and expire subscriptions
CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Expire subscriptions that have passed their expiration date
    UPDATE public.users 
    SET 
        subscription_tier = 'free',
        subscription_status = 'expired',
        subscription_expires_at = NULL,
        subscription_auto_renew = FALSE,
        api_requests_limit = 3,
        api_requests_reset_at = CURRENT_DATE + INTERVAL '1 day',
        updated_at = NOW()
    WHERE 
        subscription_expires_at IS NOT NULL 
        AND subscription_expires_at < NOW()
        AND subscription_tier IN ('pro', 'premium')
        AND subscription_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID)
RETURNS TABLE(
    tier TEXT,
    status TEXT,
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN,
    requests_used INTEGER,
    requests_limit INTEGER,
    reset_at TIMESTAMPTZ,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.subscription_tier,
        u.subscription_status,
        u.subscription_expires_at,
        u.subscription_auto_renew,
        u.api_requests_used,
        u.api_requests_limit,
        u.api_requests_reset_at,
        CASE 
            WHEN u.subscription_expires_at IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM (u.subscription_expires_at - NOW()))::INTEGER
        END
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset API usage based on plan
CREATE OR REPLACE FUNCTION public.reset_api_usage()
RETURNS void AS $$
BEGIN
    -- Reset daily usage for free users
    UPDATE public.users 
    SET 
        api_requests_used = 0,
        api_requests_reset_at = CURRENT_DATE + INTERVAL '1 day',
        updated_at = NOW()
    WHERE 
        subscription_tier = 'free' 
        AND api_requests_reset_at < NOW();
        
    -- Reset monthly usage for pro/premium users (monthly cycle)
    UPDATE public.users 
    SET 
        api_requests_used = 0,
        api_requests_reset_at = date_trunc('month', NOW() + INTERVAL '1 month'),
        updated_at = NOW()
    WHERE 
        subscription_tier IN ('pro', 'premium')
        AND api_requests_reset_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade subscription
CREATE OR REPLACE FUNCTION public.upgrade_subscription(
    p_user_id UUID,
    p_new_tier subscription_tier,
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate expiration date (30 days from now)
    expires_at := NOW() + INTERVAL '30 days';
    
    -- Insert payment record if transaction hash provided
    IF p_transaction_hash IS NOT NULL THEN
        INSERT INTO public.payments (
            user_id, 
            transaction_hash, 
            amount, 
            subscription_tier, 
            status, 
            created_at
        ) VALUES (
            p_user_id, 
            p_transaction_hash, 
            CASE 
                WHEN p_new_tier = 'pro' THEN 20.00
                WHEN p_new_tier = 'premium' THEN 40.00
                ELSE 0.00
            END,
            p_new_tier, 
            'confirmed', 
            NOW()
        );
    END IF;
    
    -- Update user subscription
    UPDATE public.users 
    SET 
        subscription_tier = p_new_tier,
        subscription_status = 'active',
        subscription_expires_at = expires_at,
        subscription_auto_renew = TRUE,
        api_requests_limit = CASE 
            WHEN p_new_tier = 'pro' THEN 999999
            WHEN p_new_tier = 'premium' THEN 999999
            ELSE 3
        END,
        api_requests_used = 0, -- Reset usage on upgrade
        api_requests_reset_at = CASE
            WHEN p_new_tier = 'free' THEN CURRENT_DATE + INTERVAL '1 day'
            ELSE date_trunc('month', NOW() + INTERVAL '1 month')
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wallet Conversations table (for users authenticated via wallet only)
CREATE TABLE IF NOT EXISTS public.wallet_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Messages table
CREATE TABLE IF NOT EXISTS public.wallet_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_conversation_id UUID REFERENCES public.wallet_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_conversations_wallet_address ON public.wallet_conversations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_conversations_created_at ON public.wallet_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_messages_conversation_id ON public.wallet_messages(wallet_conversation_id);
CREATE INDEX IF NOT EXISTS idx_wallet_messages_created_at ON public.wallet_messages(created_at);

-- Enable RLS but allow wallet services to access via service role key
ALTER TABLE public.wallet_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_messages ENABLE ROW LEVEL SECURITY;

-- Simple policies to allow service role access; client access will be via server routes
CREATE POLICY "Anonymous cannot access wallet_conversations" ON public.wallet_conversations
    FOR ALL USING (false);
CREATE POLICY "Anonymous cannot access wallet_messages" ON public.wallet_messages
    FOR ALL USING (false);

-- End of wallet tables 