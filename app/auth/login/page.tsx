"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from "lucide-react"
import { validateCredentials, setAuthSession, getHardcodedUser } from "@/lib/auth"
import { useAuth } from "@/components/auth-provider"
import Head from "next/head"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { refreshSession } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("[Login] Attempting login with:", { username, password })

    try {
      if (validateCredentials(username, password)) {
        console.log("[Login] Credentials valid, setting session")
        const user = getHardcodedUser()
        setAuthSession(user)
        
        // Refresh the auth context to pick up the new session
        console.log("[Login] Refreshing auth context")
        refreshSession()
        
        // Small delay to ensure session is properly established
        console.log("[Login] Waiting for session to establish...")
        await new Promise(resolve => setTimeout(resolve, 200))
        
        console.log("[Login] Session established, redirecting to dashboard")
        router.push("/")
      } else {
        console.log("[Login] Invalid credentials")
        setError("Invalid credentials. Please check your username and password.")
      }
    } catch (error) {
      console.error("[Login] Error during login:", error)
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Sign In - Mindscape Agent | Mindscape Analytics LLC</title>
        <meta name="description" content="Professional SMS messaging platform by Mindscape Analytics LLC. Sign in to access your messaging dashboard." />
        <meta name="keywords" content="SMS, messaging, platform, Mindscape Analytics, professional" />
        <meta property="og:title" content="Sign In - Mindscape Agent" />
        <meta property="og:description" content="Professional SMS messaging platform by Mindscape Analytics LLC" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agent.mindscapeanalytics.com" />
        <link rel="canonical" href="https://agent.mindscapeanalytics.com/auth/login" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-teal-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Brain Icon and Brand */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl">
                <Brain className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">Mindscape Agent</h1>
            <p className="text-lg text-muted-foreground mb-2">Professional SMS Messaging Platform</p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-4 rounded-full"></div>
            
            {/* Mindscape Analytics LLC Branding */}
            <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">A Product By</p>
              <a 
                href="https://mindscapeanalytics.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:text-primary/80 transition-colors duration-200"
              >
                Mindscape Analytics LLC
              </a>
            </div>
          </div>

          {/* Login Form */}
          <Card className="mindscape-shadow border-border/30 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to access your messaging dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="border-border/50 focus:border-primary focus:ring-primary/20 h-11 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-border/50 focus:border-primary focus:ring-primary/20 h-11 text-base"
                  />
                </div>

                {error && (
                  <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mindscape-gradient hover:opacity-90 text-white font-semibold py-3 text-base h-12 transition-all duration-200 hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Professional Footer */}
              <div className="mt-8 pt-6 border-t border-border/20">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Enterprise-grade messaging platform
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    <div className="w-1 h-1 bg-primary/60 rounded-full"></div>
                    <div className="w-1 h-1 bg-primary/30 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Professional SMS messaging platform powered by Telnyx
            </p>
            <div className="mt-2">
              <a 
                href="https://mindscapeanalytics.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary/70 hover:text-primary transition-colors duration-200"
              >
                © 2025 Mindscape Analytics LLC. All rights reserved.
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
