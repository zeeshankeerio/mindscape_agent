"use client"

import { useState, useEffect } from "react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Phone, Loader2 } from "lucide-react"
import type { Contact } from "@/lib/database"
import { displayPhoneNumber } from "@/lib/telnyx"
import { cn } from "@/lib/utils"

interface ContactListProps {
  selectedContactId: number | null
  onContactSelect: (contactId: number | null) => void
  showFullView?: boolean
}

export function ContactList({ selectedContactId, onContactSelect, showFullView = false }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [newContactPhone, setNewContactPhone] = useState("")
  const [newContactName, setNewContactName] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/contacts")
        if (response.ok) {
          const { contacts } = await response.json()
          setContacts(contacts)
        } else {
          throw new Error("Failed to fetch contacts")
        }
      } catch (error) {
        console.error("Error fetching contacts:", error)
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [toast])

  const handleAddContact = async () => {
    if (!newContactPhone.trim()) return

    setIsAddingContact(true)
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: newContactPhone.trim(),
          name: newContactName.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add contact")
      }

      const { contact } = await response.json()
      setContacts((prev) => [contact, ...prev])
      setNewContactPhone("")
      setNewContactName("")

      toast({
        title: "Contact added",
        description: `${contact.name || contact.phone_number} has been added to your contacts`,
      })
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive",
      })
    } finally {
      setIsAddingContact(false)
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) || contact.phone_number.includes(searchQuery),
  )

  const getInitials = (name?: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className={cn("bg-card border-r border-border flex flex-col", showFullView ? "flex-1" : "w-80")}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">Contacts</h2>
          <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Phone number"
            value={newContactPhone}
            onChange={(e) => setNewContactPhone(e.target.value)}
            className="text-sm"
          />
          <div className="flex space-x-2">
            <Input
              placeholder="Name (optional)"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddContact}
              disabled={!newContactPhone.trim() || isAddingContact}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              {isAddingContact ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
            <div className="text-muted-foreground">Loading contacts...</div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No contacts found" : "No contacts yet"}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className={cn(
                  "p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
                  selectedContactId === contact.id && "bg-accent text-accent-foreground",
                )}
                onClick={() => onContactSelect(contact.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{contact.name || "Unknown Contact"}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {displayPhoneNumber(contact.phone_number)}
                    </div>
                  </div>

                  {showFullView && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
