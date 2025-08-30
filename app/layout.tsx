import type React from "react"
import type { Metadata } from "next"
import { RealtimeProvider } from "@/components/realtime-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mindscape Agent - Telnyx Messaging Platform",
  description: "Professional SMS messaging platform powered by Telnyx",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-foreground">
        <Suspense fallback={null}>
          <AuthProvider>
            <RealtimeProvider>
              {children}
              <Toaster />
            </RealtimeProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  )
}
