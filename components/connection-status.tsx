"use client"

import { Badge } from "./ui/badge"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { useRealtimeContext } from "./realtime-provider"

export function ConnectionStatus() {
  const { connectionStatus, isConnected } = useRealtimeContext()

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: "Connected",
          variant: "default" as const,
        }
      case "connecting":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: "Connecting",
          variant: "secondary" as const,
        }
      case "disconnected":
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: "Disconnected",
          variant: "destructive" as const,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
      {config.icon}
      {config.text}
    </Badge>
  )
}
