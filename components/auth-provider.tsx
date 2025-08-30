"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, getAuthSession, clearAuthSession } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("[AuthProvider] Initializing, checking for existing session")
    
    try {
      const session = getAuthSession()
      console.log("[AuthProvider] Found session:", session)
      
      if (session && session.id && session.email) {
        setUser(session)
        console.log("[AuthProvider] User authenticated:", session.name)
      } else {
        console.log("[AuthProvider] No valid session found")
        setUser(null)
      }
    } catch (error) {
      console.error("[AuthProvider] Error checking session:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
      isAuthenticated 
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
