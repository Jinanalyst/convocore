-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'active',
    subscription_expires_at TIMESTAMPTZ,
    wallet_address TEXT,
    wallet_type TEXT,
    tron_wallet_address TEXT, -- Keep for backward compatibility
    api_requests_used INTEGER DEFAULT 0,
    api_requests_limit INTEGER DEFAULT 3, -- Free tier: 3 chats/day
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

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

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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
        api_requests_limit = CASE 
            WHEN p_subscription_tier = 'pro' THEN 999999
            WHEN p_subscription_tier = 'premium' THEN 999999
            ELSE 3
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 