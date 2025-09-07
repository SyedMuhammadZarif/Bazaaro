"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../lib/auth-context"

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      if (requiredRole && user?.role !== requiredRole) {
        router.push("/")
        return
      }
    }
  }, [isAuthenticated, loading, user, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null
  }

  return children
}
