import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/auth"

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Memuat…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}