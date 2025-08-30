"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, getAuthSession, clearAuthSession } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkSession = () => {
    try {
      const session = getAuthSession()
      console.log("[AuthProvider] Checking session:", session)
      
      if (session && session.id && session.email) {
        setUser(session)
        console.log("[AuthProvider] User authenticated:", session.name)
        return true
      } else {
        console.log("[AuthProvider] No valid session found")
        setUser(null)
        return false
      }
    } catch (error) {
      console.error("[AuthProvider] Error checking session:", error)
      setUser(null)
      return false
    }
  }

  const refreshSession = () => {
    console.log("[AuthProvider] Refreshing session")
    checkSession()
  }

  useEffect(() => {
    console.log("[AuthProvider] Initializing, checking for existing session")
    
    // Check session immediately
    checkSession()
    
    // Set up storage event listener for cross-tab session sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mindscape_user") {
        console.log("[AuthProvider] Storage changed, refreshing session")
        checkSession()
      }
    }

    // Listen for storage changes (when session is set from login)
    window.addEventListener('storage', handleStorageChange)
    
    // Also check for session changes periodically during initial load
    const interval = setInterval(() => {
      if (!user && isLoading) {
        checkSession()
      } else {
        clearInterval(interval)
      }
    }, 100)

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setIsLoading(false)
    }
  }, [user])

  const logout = () => {
    console.log("[AuthProvider] Logging out user:", user)
    clearAuthSession()
    setUser(null)
    console.log("[AuthProvider] Redirecting to login page")
    window.location.href = "/auth/login"
  }

  const isAuthenticated = !!user && !!user.id

  return (
    <AuthContext.Provider value={{ 
      user, 
      logout, 
      isLoading, 
      isAuthenticated,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider")
  }
  return context
}
