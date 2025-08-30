"use client"

import { MessagingInterface } from "@/components/messaging-interface"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("[Home] No user found, redirecting to login")
      setIsRedirecting(true)
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  // Show loading while checking authentication
  if (isLoading || isRedirecting) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isRedirecting ? "Redirecting to login..." : "Loading..."}
          </p>
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
