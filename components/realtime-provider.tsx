"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useRealtime, type RealtimeEvent } from "@/hooks/use-realtime"

interface RealtimeContextType {
  isConnected: boolean
  connectionStatus: "connecting" | "connected" | "disconnected"
  subscribe: (eventType: string, listener: (event: RealtimeEvent) => void) => () => void
  clientId: string
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const realtime = useRealtime()

  return <RealtimeContext.Provider value={realtime}>{children}</RealtimeContext.Provider>
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error("useRealtimeContext must be used within a RealtimeProvider")
  }
  return context
}
