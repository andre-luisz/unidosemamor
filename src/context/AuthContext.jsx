import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../services/supabase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        const session = data?.session ?? null
        const currentUser = session?.user ?? null

        if (!mounted) return

        setUser(currentUser)

        // 🔥 IMPORTANTE: loading NÃO depende do profile
        setLoading(false)

        if (currentUser) {
          loadProfile(currentUser.id)
        }
      } catch (err) {
        console.error("❌ Erro init auth:", err)
        setLoading(false)
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          loadProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("❌ Erro ao carregar profile:", error)
        return
      }

      console.log("📄 PROFILE OK:", data)
      setProfile(data)
    } catch (err) {
      console.error("❌ Erro inesperado profile:", err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
