"use client"

import { MessagingInterface } from "@/components/messaging-interface"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Only redirect once and only when not loading
    if (!isLoading && !user && !hasRedirected) {
      console.log("[Home] No user found, redirecting to login")
      setHasRedirected(true)
      
      // Try Next.js router first, fallback to window.location
      try {
        router.push("/auth/login")
      } catch (error) {
        console.log("[Home] Router failed, using window.location")
        window.location.href = "/auth/login"
      }
    }
  }, [user, isLoading, router, hasRedirected])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // User is authenticated, show the messaging interface with sidebar only
  return (
    <div className="min-h-screen bg-background">
      <MessagingInterface />
    </div>
  )
}
