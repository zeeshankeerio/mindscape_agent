export interface User {
  id: string
  email: string
  name: string
}

const HARDCODED_USER: User = {
  id: "mindscape-user-1",
  email: "mindscape@example.com",
  name: "Mindscape Agent",
}

const HARDCODED_CREDENTIALS = {
  username: "mindscape",
  password: "mindscape",
}

export function validateCredentials(username: string, password: string): boolean {
  console.log("[Auth] Validating credentials:", { username, password })
  const isValid = username === HARDCODED_CREDENTIALS.username && password === HARDCODED_CREDENTIALS.password
  console.log("[Auth] Credentials valid:", isValid)
  return isValid
}

export function getHardcodedUser(): User {
  console.log("[Auth] Getting hardcoded user:", HARDCODED_USER)
  return HARDCODED_USER
}

export function setAuthSession(user: User) {
  console.log("[Auth] Setting auth session for user:", user)
  if (typeof window !== "undefined") {
    localStorage.setItem("mindscape_user", JSON.stringify(user))
  }
}

export function getAuthSession(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mindscape_user")
    const user = stored ? JSON.parse(stored) : null
    console.log("[Auth] Getting auth session:", user)
    return user
  }
  return null
}

export function clearAuthSession() {
  console.log("[Auth] Clearing auth session")
  if (typeof window !== "undefined") {
    localStorage.removeItem("mindscape_user")
  }
}
