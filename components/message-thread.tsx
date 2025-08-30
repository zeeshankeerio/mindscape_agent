"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeContext } from "./realtime-provider"
import { Send, Paperclip, ImageIcon, Phone, Loader2 } from "lucide-react"
import type { Message, Contact } from "@/lib/database"
import { displayPhoneNumber } from "@/lib/telnyx"
import { cn } from "@/lib/utils"

interface MessageThreadProps {
  contactId: number | null
}

export function MessageThread({ contactId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [senderNumber, setSenderNumber] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { subscribe } = useRealtimeContext()

  // Fetch sender number from messaging profile
  useEffect(() => {
    const fetchSenderNumber = async () => {
      try {
        const response = await fetch("/api/messaging-profiles")
        if (response.ok) {
          const { profiles } = await response.json()
          const activeProfile = profiles.find((p: any) => p.is_active)
          if (activeProfile?.profile_id) {
            setSenderNumber(activeProfile.profile_id)
          }
        }
      } catch (error) {
        console.error("Error fetching sender number:", error)
        // Fallback to a default number for development
        setSenderNumber("+1987654321")
      }
    }

    fetchSenderNumber()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe("message.received", (event) => {
      const { message } = event.data

      // Only add message if it's for the current contact
      if (contactId && message.contact_id === contactId) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => m.id === message.id || m.telnyx_message_id === message.telnyx_message_id)
          if (exists) return prev

          return [...prev, message]
        })

        // Show notification for new messages
        const isOTP = message.metadata?.is_otp || false
        const notificationTitle = isOTP ? "OTP Received" : "New message"
        const notificationDescription = isOTP 
          ? `OTP: ${message.content} from ${contact?.name || displayPhoneNumber(message.from_number)}`
          : `Message from ${contact?.name || displayPhoneNumber(message.from_number)}`

        toast({
          title: notificationTitle,
          description: notificationDescription,
          variant: isOTP ? "default" : "default",
        })

        // Auto-scroll to new message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    })

    // Subscribe to OTP-specific events
    const unsubscribeOTP = subscribe("otp.received", (event) => {
      const { message, otp } = event.data

      // Only handle if it's for the current contact
      if (contactId && message.contact_id === contactId) {
        // Show special OTP notification
        toast({
          title: "🔐 OTP Received",
          description: `Verification code: ${otp}`,
          variant: "default",
        })

        // Update messages if not already present
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id)
          if (exists) return prev
          return [...prev, message]
        })
      }
    })

    return () => {
      unsubscribe()
      unsubscribeOTP()
    }
  }, [contactId, contact, subscribe, toast])

  useEffect(() => {
    const unsubscribe = subscribe("message.status", (event) => {
      const { messageId, status } = event.data

      setMessages((prev) =>
        prev.map((message) => (message.telnyx_message_id === messageId ? { ...message, status } : message)),
      )
    })

    return unsubscribe
  }, [subscribe])

  useEffect(() => {
    if (!contactId) {
      setMessages([])
      setContact(null)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch contact and messages from API
        const [contactResponse, messagesResponse] = await Promise.all([
          fetch(`/api/contacts/${contactId}`),
          fetch(`/api/messages?contact_id=${contactId}`),
        ])

        if (contactResponse.ok) {
          const { contact } = await contactResponse.json()
          setContact(contact)
        }

        if (messagesResponse.ok) {
          const { messages } = await messagesResponse.json()
          setMessages(messages)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [contactId, toast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !contactId || !contact || !senderNumber) return

    setIsSending(true)

    try {
      // Upload media files if any
      const mediaUrls: string[] = []
      if (selectedFiles.length > 0) {
        // TODO: Implement file upload to your preferred storage service
        // For now, we'll skip media upload and show a message
        toast({
          title: "Media Upload",
          description: "Media upload will be implemented with your preferred storage service",
        })
      }

      // Send message via API
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: contact.phone_number,
          from: senderNumber,
          text: newMessage.trim() || undefined,
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      const { message: sentMessage } = await response.json()

      // Add message to local state immediately for better UX
      setMessages((prev) => [...prev, sentMessage])
      setNewMessage("")
      setSelectedFiles([])

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/") || file.type.startsWith("video/")
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      return isValidType && isValidSize
    })

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only images and videos under 10MB are allowed",
        variant: "destructive",
      })
    }

    setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5)) // Max 5 files
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name?: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!contactId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">Select a contact</h3>
          <p className="text-sm">Choose a contact from the list to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      {contact && (
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={contact.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="font-medium text-card-foreground">{contact.name || "Unknown Contact"}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {displayPhoneNumber(contact.phone_number)}
              </div>
            </div>

            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="text-2xl mb-2">👋</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.direction === "outbound" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm",
                  message.direction === "outbound"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground border border-border",
                )}
              >
                {message.media_urls && message.media_urls.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {message.media_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url || "/placeholder.svg"}
                        alt="Message attachment"
                        className="max-w-full h-auto rounded"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                {message.content && <div className="text-pretty">{message.content}</div>}
                <div
                  className={cn(
                    "text-xs mt-1 opacity-70 flex items-center justify-between",
                    message.direction === "outbound" ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <span>{formatTime(message.created_at)}</span>
                  {message.direction === "outbound" && (
                    <span className="ml-1">
                      {message.status === "delivered" ? "✓✓" : message.status === "sent" ? "✓" : "⏳"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <div className="w-16 h-16 bg-card rounded border flex items-center justify-center text-xs text-center p-1">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-muted-foreground">
                      <ImageIcon className="h-4 w-4 mb-1" />
                      {file.name.split(".").pop()?.toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="shrink-0 bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            className="flex-1"
            disabled={isSending}
          />

          <Button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSending}
            className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
