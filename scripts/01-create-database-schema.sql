-- Updated schema to use Supabase auth and RLS patterns
-- Create database schema for Mindscape Agent messaging app with Supabase auth integration
-- This script sets up tables for contacts, messages, and settings with Row Level Security

-- Contacts table to store phone numbers and contact information
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

-- Enable RLS on contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts
CREATE POLICY "Users can view their own contacts" ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON contacts FOR DELETE USING (auth.uid() = user_id);

-- Messages table to store SMS/MMS messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telnyx_message_id VARCHAR(255) UNIQUE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('SMS', 'MMS')),
  content TEXT,
  media_urls TEXT[], -- Array to store multiple media URLs for MMS
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

-- Messaging profiles table to store Telnyx configuration
CREATE TABLE IF NOT EXISTS messaging_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  webhook_url TEXT,
  webhook_failover_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

-- Enable RLS on messaging_profiles
ALTER TABLE messaging_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for messaging_profiles
CREATE POLICY "Users can view their own profiles" ON messaging_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profiles" ON messaging_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles" ON messaging_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profiles" ON messaging_profiles FOR DELETE USING (auth.uid() = user_id);

-- Inbound settings table for message handling configuration
CREATE TABLE IF NOT EXISTS inbound_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT DEFAULT 'Thank you for your message. We will get back to you soon.',
  business_hours_only BOOLEAN DEFAULT false,
  business_hours_start TIME DEFAULT '09:00:00',
  business_hours_end TIME DEFAULT '17:00:00',
  business_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Monday to Friday
  keyword_filters TEXT[],
  blocked_numbers TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on inbound_settings
ALTER TABLE inbound_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for inbound_settings
CREATE POLICY "Users can view their own settings" ON inbound_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON inbound_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON inbound_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON inbound_settings FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_telnyx_id ON messages(telnyx_message_id);
CREATE INDEX IF NOT EXISTS idx_messaging_profiles_user_id ON messaging_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_settings_user_id ON inbound_settings(user_id);

-- Function to create default inbound settings for new users
CREATE OR REPLACE FUNCTION create_default_inbound_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO inbound_settings (user_id, auto_reply_enabled, auto_reply_message)
  VALUES (
    NEW.id,
    false,
    'Thank you for your message. We will get back to you soon.'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically create inbound settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_inbound_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_inbound_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_inbound_settings();
