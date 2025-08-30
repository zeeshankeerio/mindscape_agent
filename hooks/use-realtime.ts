"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface RealtimeEvent {
  type: string
  data?: any
  timestamp?: number
}

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const eventSourceRef = useRef<EventSource | null>(null)
  const clientIdRef = useRef<string>(crypto.randomUUID())
  const listenersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map())

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return // Already connected
    }

    setConnectionStatus("connecting")

    const eventSource = new EventSource(`/api/events?clientId=${clientIdRef.current}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setConnectionStatus("connected")
      console.log("[Realtime] Connected to event stream")
    }

    eventSource.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data)

        // Handle system events
        if (data.type === "connected") {
          console.log("[Realtime] Connection established")
        } else if (data.type === "heartbeat") {
          // Keep connection alive
        } else {
          // Broadcast to listeners
          const listeners = listenersRef.current.get(data.type)
          if (listeners) {
            listeners.forEach((listener) => listener(data))
          }

          // Also broadcast to wildcard listeners
          const wildcardListeners = listenersRef.current.get("*")
          if (wildcardListeners) {
            wildcardListeners.forEach((listener) => listener(data))
          }
        }
      } catch (error) {
        console.error("[Realtime] Error parsing event:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("[Realtime] EventSource error:", error)
      setIsConnected(false)
      setConnectionStatus("disconnected")

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
          connect()
        }
      }, 5000)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus("disconnected")
  }, [])

  const subscribe = useCallback((eventType: string, listener: (event: RealtimeEvent) => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType)!.add(listener)

    // Return unsubscribe function
    return () => {
      const listeners = listenersRef.current.get(eventType)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          listenersRef.current.delete(eventType)
        }
      }
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Reconnect when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        connect()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isConnected, connect])

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    subscribe,
    clientId: clientIdRef.current,
  }
}
