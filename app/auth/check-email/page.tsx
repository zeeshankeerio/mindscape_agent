import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-purple-600">Check your email</CardTitle>
            <CardDescription>We&apos;ve sent you a confirmation link to complete your registration.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Click the link in your email to verify your account and start using Mindscape Agent.
            </p>
            <Link href="/auth/login" className="text-sm text-purple-600 underline underline-offset-4">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
