"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Save, Plus, X, Loader2 } from "lucide-react"
import type { InboundSettings } from "@/lib/database"

export function InboundSettingsPanel() {
  const [settings, setSettings] = useState<InboundSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")
  const [newBlockedNumber, setNewBlockedNumber] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/settings/inbound")
        if (response.ok) {
          const { settings } = await response.json()
          setSettings(settings)
        } else {
          throw new Error("Failed to fetch settings")
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load inbound settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/inbound", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }

      const { settings: updatedSettings } = await response.json()
      setSettings(updatedSettings)

      toast({
        title: "Settings saved",
        description: "Your inbound settings have been updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addKeyword = () => {
    if (!newKeyword.trim() || !settings) return

    const keyword = newKeyword.trim().toUpperCase()
    if (settings.keyword_filters.includes(keyword)) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword is already in the filter list",
        variant: "destructive",
      })
      return
    }

    setSettings({
      ...settings,
      keyword_filters: [...settings.keyword_filters, keyword],
    })
    setNewKeyword("")
  }

  const removeKeyword = (keyword: string) => {
    if (!settings) return

    setSettings({
      ...settings,
      keyword_filters: settings.keyword_filters.filter((k) => k !== keyword),
    })
  }

  const addBlockedNumber = () => {
    if (!newBlockedNumber.trim() || !settings) return

    const number = newBlockedNumber.trim()
    if (settings.blocked_numbers.includes(number)) {
      toast({
        title: "Duplicate number",
        description: "This number is already blocked",
        variant: "destructive",
      })
      return
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-$$$$]+$/
    if (!phoneRegex.test(number)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    setSettings({
      ...settings,
      blocked_numbers: [...settings.blocked_numbers, number],
    })
    setNewBlockedNumber("")
  }

  const removeBlockedNumber = (number: string) => {
    if (!settings) return

    setSettings({
      ...settings,
      blocked_numbers: settings.blocked_numbers.filter((n) => n !== number),
    })
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center text-muted-foreground">
          <p className="mb-4">Failed to load settings</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inbound Settings</h1>
            <p className="text-muted-foreground">Configure how your profile handles incoming messages</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Auto Reply Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Auto Reply</CardTitle>
            <CardDescription>Automatically respond to incoming messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-reply"
                checked={settings.auto_reply_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_reply_enabled: checked })}
              />
              <Label htmlFor="auto-reply">Enable auto reply</Label>
            </div>

            {settings.auto_reply_enabled && (
              <div className="space-y-2">
                <Label htmlFor="auto-reply-message">Auto reply message</Label>
                <Textarea
                  id="auto-reply-message"
                  value={settings.auto_reply_message || ""}
                  onChange={(e) => setSettings({ ...settings, auto_reply_message: e.target.value })}
                  placeholder="Enter your auto reply message..."
                  rows={3}
                  maxLength={160}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {(settings.auto_reply_message || "").length}/160 characters
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>Restrict message handling to business hours only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="business-hours"
                checked={settings.business_hours_only}
                onCheckedChange={(checked) => setSettings({ ...settings, business_hours_only: checked })}
              />
              <Label htmlFor="business-hours">Business hours only</Label>
            </div>

            {settings.business_hours_only && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={settings.business_hours_start}
                      onChange={(e) => setSettings({ ...settings, business_hours_start: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time">End time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={settings.business_hours_end}
                      onChange={(e) => setSettings({ ...settings, business_hours_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Business days</Label>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((day, index) => (
                      <Badge
                        key={index}
                        variant={settings.business_days.includes(index) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const newDays = settings.business_days.includes(index)
                            ? settings.business_days.filter((d) => d !== index)
                            : [...settings.business_days, index].sort()
                          setSettings({ ...settings, business_days: newDays })
                        }}
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keyword Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Keyword Filters</CardTitle>
            <CardDescription>Keywords that trigger special handling (e.g., STOP, UNSUBSCRIBE)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                maxLength={20}
              />
              <Button onClick={addKeyword} size="icon" disabled={!newKeyword.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.keyword_filters.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(keyword)} />
                </Badge>
              ))}
              {settings.keyword_filters.length === 0 && (
                <p className="text-sm text-muted-foreground">No keyword filters configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blocked Numbers */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Numbers</CardTitle>
            <CardDescription>Phone numbers that are blocked from sending messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add phone number..."
                value={newBlockedNumber}
                onChange={(e) => setNewBlockedNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addBlockedNumber()}
              />
              <Button onClick={addBlockedNumber} size="icon" disabled={!newBlockedNumber.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {settings.blocked_numbers.map((number) => (
                <div key={number} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-mono">{number}</span>
                  <X
                    className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => removeBlockedNumber(number)}
                  />
                </div>
              ))}
              {settings.blocked_numbers.length === 0 && (
                <p className="text-sm text-muted-foreground">No numbers blocked</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>Configure your Telnyx webhook URL for receiving messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={`${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/webhooks/telnyx`}
                readOnly
                className="font-mono text-sm bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Configure this URL in your Telnyx messaging profile to receive incoming messages
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Setup Instructions:</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Copy the webhook URL above</li>
                <li>Go to your Telnyx Portal → Messaging → Messaging Profiles</li>
                <li>Select your messaging profile</li>
                <li>Add the webhook URL to receive message events</li>
                <li>Enable the following event types: message.received, message.sent, message.delivered</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
