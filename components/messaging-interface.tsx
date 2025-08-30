"use client"

import { useState } from "react"
import { ContactList } from "./contact-list"
import { MessageThread } from "./message-thread"
import { InboundSettingsPanel } from "./inbound-settings-panel"
import { Button } from "./ui/button"
import { Settings, MessageSquare, Users, LogOut, Phone, Bell, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "./auth-provider"

type View = "messages" | "contacts" | "settings"

export function MessagingInterface() {
  const [activeView, setActiveView] = useState<View>("messages")
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-blue-50/20 to-teal-50/20">
      {/* Enhanced Sidebar Navigation */}
      <div className="w-24 bg-white/80 backdrop-blur-sm border-r border-sidebar-border/50 flex flex-col items-center py-6 space-y-8 shadow-lg">
        {/* Brain Icon Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col space-y-6">
          <Button
            variant={activeView === "messages" ? "default" : "ghost"}
            size="icon"
            onClick={() => setActiveView("messages")}
            className={cn(
              "w-14 h-14 transition-all duration-200 rounded-xl",
              activeView === "messages"
                ? "bg-sidebar-primary text-sidebar-primary-foreground mindscape-glow shadow-lg"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md",
            )}
            title="Messages"
          >
            <MessageSquare className="h-7 w-7" />
          </Button>

          <Button
            variant={activeView === "contacts" ? "default" : "ghost"}
            size="icon"
            onClick={() => setActiveView("contacts")}
            className={cn(
              "w-14 h-14 transition-all duration-200 rounded-xl",
              activeView === "contacts"
                ? "bg-sidebar-primary text-sidebar-primary-foreground mindscape-glow shadow-lg"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md",
            )}
            title="Contacts"
          >
            <Users className="h-7 w-7" />
          </Button>

          <Button
            variant={activeView === "settings" ? "default" : "ghost"}
            size="icon"
            onClick={() => setActiveView("settings")}
            className={cn(
              "w-14 h-14 transition-all duration-200 rounded-xl",
              activeView === "settings"
                ? "bg-sidebar-primary text-sidebar-primary-foreground mindscape-glow shadow-lg"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md",
            )}
            title="Settings"
          >
            <Settings className="h-7 w-7" />
          </Button>
        </nav>

        {/* Additional Features */}
        <div className="flex flex-col space-y-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md transition-all duration-200 rounded-xl"
            title="Phone Numbers"
          >
            <Phone className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md transition-all duration-200 rounded-xl"
            title="Notifications"
          >
            <Bell className="h-6 w-6" />
          </Button>
        </div>

        {/* Bottom Section - User Info and Logout */}
        <div className="mt-auto space-y-6">
          {/* User Info */}
          {user && (
            <div className="text-center px-1">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-sidebar-primary-foreground text-base font-bold">
                  {user.name.charAt(0)}
                </span>
              </div>
              <p className="text-xs text-sidebar-foreground font-medium truncate px-1">
                {user.name.split(' ')[0]}
              </p>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="w-14 h-14 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 hover:shadow-md transition-all duration-200 rounded-xl"
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="h-20 bg-white/80 backdrop-blur-sm border-b border-border/30 flex items-center px-8 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                {activeView === "messages" && (
                  <>
                    <MessageSquare className="h-6 w-6 mr-3 text-primary" />
                    Messages
                  </>
                )}
                {activeView === "contacts" && (
                  <>
                    <Users className="h-6 w-6 mr-3 text-primary" />
                    Contacts
                  </>
                )}
                {activeView === "settings" && (
                  <>
                    <Settings className="h-6 w-6 mr-3 text-primary" />
                    Settings
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeView === "messages" && "Manage your SMS conversations and stay connected"}
                {activeView === "contacts" && "Organize and manage your contact list"}
                {activeView === "settings" && "Configure your messaging preferences and automation"}
              </p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="ml-auto flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-full">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-primary">Connected</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === "messages" && (
            <>
              <ContactList selectedContactId={selectedContactId} onContactSelect={setSelectedContactId} />
              <MessageThread contactId={selectedContactId} />
            </>
          )}

          {activeView === "contacts" && (
            <div className="flex-1">
              <ContactList
                selectedContactId={selectedContactId}
                onContactSelect={setSelectedContactId}
                showFullView={true}
              />
            </div>
          )}

          {activeView === "settings" && (
            <div className="flex-1">
              <InboundSettingsPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
