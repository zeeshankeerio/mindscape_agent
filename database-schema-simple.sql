-- Simplified Database Schema for Mindscape Agent Telnyx Messaging App
-- Run this in your Supabase SQL Editor

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    telnyx_message_id VARCHAR(255) UNIQUE,
    contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('SMS', 'MMS')),
    content TEXT,
    media_urls TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inbound_settings table
CREATE TABLE IF NOT EXISTS inbound_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    auto_reply_enabled BOOLEAN DEFAULT false,
    auto_reply_message TEXT,
    business_hours_only BOOLEAN DEFAULT false,
    business_hours_start TIME DEFAULT '09:00:00',
    business_hours_end TIME DEFAULT '17:00:00',
    business_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Monday to Friday
    keyword_filters TEXT[] DEFAULT '{}',
    blocked_numbers TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messaging_profiles table
CREATE TABLE IF NOT EXISTS messaging_profiles (
    id BIGSERIAL PRIMARY KEY,
    profile_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    webhook_url TEXT,
    webhook_failover_url TEXT,
    is_active BOOLEAN DEFAULT true,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_telnyx_id ON messages(telnyx_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_number ON messages(from_number);
CREATE INDEX IF NOT EXISTS idx_messages_to_number ON messages(to_number);
CREATE INDEX IF NOT EXISTS idx_inbound_settings_user_id ON inbound_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_messaging_profiles_user_id ON messaging_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_messaging_profiles_active ON messaging_profiles(is_active);

-- Insert default data for development
INSERT INTO contacts (phone_number, name, user_id) VALUES 
    ('+15551234567', 'Test Contact 1', 'mindscape-user-1'),
    ('+15559876543', 'Test Contact 2', 'mindscape-user-1')
ON CONFLICT DO NOTHING;

INSERT INTO inbound_settings (user_id, auto_reply_enabled, auto_reply_message) VALUES 
    ('mindscape-user-1', true, 'Thank you for your message. We will get back to you soon.')
ON CONFLICT DO NOTHING;

INSERT INTO messaging_profiles (profile_id, name, is_active, user_id) VALUES 
    ('+1987654321', 'Default Profile', true, 'mindscape-user-1')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inbound_settings_updated_at BEFORE UPDATE ON inbound_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messaging_profiles_updated_at BEFORE UPDATE ON messaging_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
