import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <div className="text-white p-10">Verificando permissões...</div>
  }

  if (!user) return <Navigate to="/login" />

  // 🔥 AGORA profile pode carregar depois
  if (!profile) {
    return <div className="text-white p-10">Carregando perfil...</div>
  }

  if (profile.role !== "admin") {
    return <Navigate to="/dashboard" />
  }

  return children
}
