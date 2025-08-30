// Database utility functions for Mindscape Agent
// Handles database connections and common queries
import { createServerClient } from "@/lib/supabase/server"

export interface Contact {
  id: number
  phone_number: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  telnyx_message_id?: string
  contact_id: number
  direction: "inbound" | "outbound"
  message_type: "SMS" | "MMS"
  content?: string
  media_urls?: string[]
  status: "sent" | "delivered" | "failed" | "pending"
  from_number: string
  to_number: string
  created_at: string
  updated_at: string
  contact?: Contact
}

export interface InboundSettings {
  id: number
  auto_reply_enabled: boolean
  auto_reply_message?: string
  business_hours_only: boolean
  business_hours_start: string
  business_hours_end: string
  business_days: number[]
  keyword_filters: string[]
  blocked_numbers: string[]
  created_at: string
  updated_at: string
}

export interface MessagingProfile {
  id: number
  profile_id: string
  name: string
  webhook_url?: string
  webhook_failover_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Database query functions will be implemented with the chosen database integration
export const db = {
  // Contact operations
  async getContacts(userId: string): Promise<Contact[]> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning empty contacts list")
      return []
    }

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .order("name")

    if (error) {
      console.error("[Database] Error fetching contacts:", error)
      return []
    }

    return data || []
  },

  async getContactByPhone(phoneNumber: string, userId: string): Promise<Contact | null> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning null contact")
      return null
    }

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("[Database] Error fetching contact by phone:", error)
      return null
    }

    return data
  },

  async getContactById(contactId: number, userId: string): Promise<Contact | null> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning null contact")
      return null
    }

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("[Database] Error fetching contact by ID:", error)
      return null
    }

    return data
  },

  async createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">): Promise<Contact> {
    const supabase = await createServerClient()
    if (!supabase) {
      throw new Error("Database not configured. Please set Supabase environment variables.")
    }

    const { data, error } = await supabase.from("contacts").insert(contact).select().single()

    if (error) {
      console.error("[Database] Error creating contact:", error)
      throw new Error("Failed to create contact")
    }

    return data
  },

  // Message operations
  async getMessages(userId: string, contactId?: number, limit = 50): Promise<Message[]> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning empty messages list")
      return []
    }

    let query = supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (contactId) {
      query = query.eq("contact_id", contactId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Database] Error fetching messages:", error)
      return []
    }

    return data || []
  },

  async createMessage(message: Omit<Message, "id" | "created_at" | "updated_at">): Promise<Message> {
    const supabase = await createServerClient()
    if (!supabase) {
      throw new Error("Database not configured. Please set Supabase environment variables.")
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(message)
      .select()
      .single()

    if (error) {
      console.error("[Database] Error creating message:", error)
      throw new Error("Failed to create message")
    }

    return data
  },

  async updateMessageStatus(messageId: number, status: Message["status"], userId: string): Promise<void> {
    const supabase = await createServerClient()
    if (!supabase) {
      throw new Error("Database not configured. Please set Supabase environment variables.")
    }

    const { error } = await supabase
      .from("messages")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("user_id", userId)

    if (error) {
      console.error("[Database] Error updating message status:", error)
      throw new Error("Failed to update message status")
    }
  },

  async updateMessageByTelnyxId(
    telnyxMessageId: string,
    updates: Partial<Message>,
    userId: string,
  ): Promise<Message | null> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning null message")
      return null
    }

    const { data, error } = await supabase
      .from("messages")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("telnyx_message_id", telnyxMessageId)
      .eq("user_id", userId)
      .select(`
        *,
        contact:contacts(*)
      `)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[Database] Error updating message by Telnyx ID:", error)
      throw new Error("Failed to update message")
    }

    return data || null
  },

  async getMessageByTelnyxId(telnyxMessageId: string, userId: string): Promise<Message | null> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning null message")
      return null
    }

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq("telnyx_message_id", telnyxMessageId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[Database] Error fetching message by Telnyx ID:", error)
      throw new Error("Failed to fetch message")
    }

    return data || null
  },

  // Settings operations
  async getInboundSettings(userId: string): Promise<InboundSettings | null> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning null settings")
      return null
    }

    const { data, error } = await supabase.from("inbound_settings").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("[Database] Error fetching inbound settings:", error)
      return null
    }

    return data
  },

  async updateInboundSettings(settings: Partial<InboundSettings>, userId: string): Promise<InboundSettings> {
    const supabase = await createServerClient()
    if (!supabase) {
      throw new Error("Database not configured. Please set Supabase environment variables.")
    }

    const { data, error } = await supabase
      .from("inbound_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("[Database] Error updating inbound settings:", error)
      throw new Error("Failed to update inbound settings")
    }

    return data
  },

  // Messaging profile operations
  async getMessagingProfiles(userId: string): Promise<MessagingProfile[]> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning empty profiles list")
      return []
    }

    const { data, error } = await supabase
      .from("messaging_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Database] Error fetching messaging profiles:", error)
      return []
    }

    return data || []
  },

  async getDefaultMessagingProfile(userId: string): Promise<MessagingProfile | null> {
    const supabase = await createServerClient()
    if (!supabase) {
      console.warn("[Database] Supabase not configured, returning null profile")
      return null
    }

    const { data, error } = await supabase
      .from("messaging_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("[Database] Error fetching default messaging profile:", error)
      return null
    }

    return data
  },

  async createMessagingProfile(profile: Omit<MessagingProfile, 'id' | 'created_at' | 'updated_at'>): Promise<MessagingProfile | null> {
    try {
      const supabase = await createServerClient()
      if (!supabase) return null

      const { data, error } = await supabase
        .from('messaging_profiles')
        .insert(profile)
        .select()
        .single()

      if (error) {
        console.error('Error creating messaging profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error creating messaging profile:', error)
      return null
    }
  },

  async updateMessagingProfilePhone(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      const supabase = await createServerClient()
      if (!supabase) return false

      const { error } = await supabase
        .from('messaging_profiles')
        .update({ profile_id: phoneNumber })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Error updating messaging profile phone:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating messaging profile phone:', error)
      return false
    }
  }
}
