import type { NextRequest } from "next/server"
import { getHardcodedUser } from "@/lib/auth"

// Store active connections with user authentication
const connections = new Map<string, { controller: ReadableStreamDefaultController; userId: string }>()

export async function GET(request: NextRequest) {
  console.log("[v0] SSE connection attempt")

  try {
    const user = getHardcodedUser()
    console.log("[v0] Using hardcoded user:", user.id)

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId") || crypto.randomUUID()

    console.log("[v0] Creating SSE stream for user:", user.id, "client:", clientId)

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Store the connection with user ID
        connections.set(clientId, { controller, userId: user.id })
        console.log("[v0] SSE connection stored, total connections:", connections.size)

        const initialMessage = `data: ${JSON.stringify({
          type: "connected",
          clientId,
          timestamp: Date.now(),
        })}\n\n`

        try {
          controller.enqueue(new TextEncoder().encode(initialMessage))
          console.log("[v0] Initial SSE message sent")
        } catch (error) {
          console.error("[v0] Error sending initial message:", error)
        }

        // Set up heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            const heartbeatMessage = `data: ${JSON.stringify({
              type: "heartbeat",
              timestamp: Date.now(),
            })}\n\n`
            controller.enqueue(new TextEncoder().encode(heartbeatMessage))
            console.log("[v0] Heartbeat sent to client:", clientId)
          } catch (error) {
            console.error("[v0] Heartbeat error:", error)
            clearInterval(heartbeat)
            connections.delete(clientId)
          }
        }, 30000) // Send heartbeat every 30 seconds

        // Clean up on connection close
        const cleanup = () => {
          console.log("[v0] Cleaning up SSE connection:", clientId)
          clearInterval(heartbeat)
          connections.delete(clientId)
          try {
            controller.close()
          } catch (error) {
            console.log("[v0] Connection already closed")
          }
        }

        request.signal.addEventListener("abort", cleanup)
      },
      cancel() {
        console.log("[v0] SSE stream cancelled for client:", clientId)
        connections.delete(clientId)
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    })
  } catch (error) {
    console.error("[v0] SSE Connection error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

// Function to broadcast events to all connected clients for a specific user
export function broadcastEvent(event: any) {
  console.log("[v0] Broadcasting event:", event.type, "to", connections.size, "connections")
  const message = `data: ${JSON.stringify(event)}\n\n`

  for (const [clientId, connection] of connections.entries()) {
    // Only broadcast to clients of the same user
    if (event.userId && connection.userId !== event.userId) {
      continue
    }

    try {
      connection.controller.enqueue(new TextEncoder().encode(message))
      console.log("[v0] Event broadcasted to client:", clientId)
    } catch (error) {
      console.error("[v0] Broadcast error:", error)
      // Remove dead connections
      connections.delete(clientId)
    }
  }
}

// Function to broadcast to specific client
export function broadcastToClient(clientId: string, event: any) {
  const connection = connections.get(clientId)
  if (connection) {
    try {
      const message = `data: ${JSON.stringify(event)}\n\n`
      connection.controller.enqueue(new TextEncoder().encode(message))
      console.log("[v0] Event sent to specific client:", clientId)
    } catch (error) {
      console.error("[v0] Client broadcast error:", error)
      connections.delete(clientId)
    }
  } else {
    console.log("[v0] Client not found for broadcast:", clientId)
  }
}
