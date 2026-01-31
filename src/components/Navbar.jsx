import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../services/supabase"
import {
  Menu,
  Bell,
  User,
  X,
  Home,
  Info,
  LayoutDashboard,
  ShoppingBasket,
  Package,
  Shield,
  LogOut
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import logo from "../assets/logo-n.png"

export default function Navbar() {
  const { user, profile } = useAuth()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const avatarRef = useRef(null)
  const notifRef = useRef(null)

  const isActive = path =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path)

  const unreadCount = notifications.filter(n => !n.read).length

  /* ================= FECHAR DROPDOWNS ================= */
  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  /* ================= NOTIFICAÇÕES (SUPABASE REALTIME) ================= */
  useEffect(() => {
    if (!user) return

    async function loadNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setNotifications(data || [])
    }

    loadNotifications()

    const channel = supabase
      .channel("notifications-navbar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        payload => {
          if (payload.eventType === "INSERT") {
            setNotifications(prev => [payload.new, ...prev])
          }
          if (payload.eventType === "UPDATE") {
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new : n))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function markAsRead(id) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
  }

  const NavItem = ({ to, icon: Icon, children, onClick }) => {
    const active = isActive(to)

    return (
      <Link
        to={to}
        onClick={onClick}
        className={`relative flex items-center gap-2 px-1 py-1 transition ${
          active
            ? "text-secondary font-semibold"
            : "text-white/80 hover:text-secondary"
        }`}
      >
        <Icon size={16} />
        {children}

        {active && (
          <motion.div
            layoutId="nav-underline"
            className="absolute -bottom-1 left-0 right-0 h-[2px] bg-secondary rounded-full"
          />
        )}
      </Link>
    )
  }

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="bg-dark/95 backdrop-blur border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} className="h-9" />
            <span className="font-bold text-secondary tracking-wide">
              Unidos em Amor
            </span>
          </Link>

          {/* NAV DESKTOP */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <NavItem to="/" icon={Home}>Início</NavItem>
            <NavItem to="/sobre" icon={Info}>Sobre</NavItem>

            {user && (
              <>
                <NavItem to="/dashboard" icon={LayoutDashboard}>Painel</NavItem>
                <NavItem to="/mercado-solidario" icon={ShoppingBasket}>Mercado</NavItem>
                <NavItem to="/cestas/solicitacoes" icon={Package}>Minhas Cestas</NavItem>
                {profile?.role === "admin" && (
                  <NavItem to="/admin" icon={Shield}>Admin</NavItem>
                )}
              </>
            )}
          </nav>

          {/* ACTIONS DESKTOP */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                {/* NOTIFICAÇÕES DESKTOP */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-full hover:bg-white/10"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-secondary text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute right-0 mt-3 w-80 bg-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        {notifications.length === 0 && (
                          <p className="p-4 text-sm text-white/60">
                            Nenhuma notificação
                          </p>
                        )}

                        {notifications.map(n => (
                          <Link
                            key={n.id}
                            to={n.link || "#"}
                            onClick={() => {
                              markAsRead(n.id)
                              setNotifOpen(false)
                            }}
                            className={`block px-4 py-3 text-sm hover:bg-white/10 ${
                              !n.read ? "bg-white/5" : ""
                            }`}
                          >
                            <p className="font-semibold">{n.title}</p>
                            {n.message && (
                              <p className="text-xs text-white/60">
                                {n.message}
                              </p>
                            )}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* AVATAR DESKTOP */}
                <div className="relative" ref={avatarRef}>
                  <button
                    onClick={() => setAvatarOpen(!avatarOpen)}
                    className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20"
                  >
                    <div className="w-7 h-7 rounded-full bg-secondary text-black flex items-center justify-center font-bold">
                      {profile?.nome?.[0] || <User size={14} />}
                    </div>
                    <span className="text-sm">{profile?.nome}</span>
                  </button>

                  <AnimatePresence>
                    {avatarOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute right-0 mt-3 w-56 bg-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <button
                          onClick={() => supabase.auth.signOut()}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm"
                        >
                          <LogOut size={16} />
                          Sair
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
          >
            <Menu />
          </button>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              className="absolute right-0 top-0 h-full w-80 bg-dark border-l border-white/10 p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
            >
              {/* HEADER MOBILE */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-semibold text-secondary">Menu</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X />
                </button>
              </div>

              {/* AVATAR + NOTIF MOBILE */}
              {user && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary text-black flex items-center justify-center font-bold">
                        {profile?.nome?.[0] || <User size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold">{profile?.nome}</p>
                        <span className="text-xs text-white/60">
                          Minha conta
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setMobileNotifOpen(!mobileNotifOpen)}
                      className="relative p-2 rounded-full hover:bg-white/10"
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-secondary text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {mobileNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="mt-4 bg-white/5 rounded-xl overflow-hidden"
                      >
                        {notifications.length === 0 && (
                          <p className="p-4 text-sm text-white/60">
                            Nenhuma notificação
                          </p>
                        )}

                        {notifications.map(n => (
                          <Link
                            key={n.id}
                            to={n.link || "#"}
                            onClick={() => {
                              markAsRead(n.id)
                              setMobileNotifOpen(false)
                              setMobileOpen(false)
                            }}
                            className={`block px-4 py-3 text-sm hover:bg-white/10 ${
                              !n.read ? "bg-white/10" : ""
                            }`}
                          >
                            <p className="font-semibold">{n.title}</p>
                            {n.message && (
                              <p className="text-xs text-white/60">
                                {n.message}
                              </p>
                            )}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* LINKS MOBILE */}
              <nav className="flex flex-col gap-4 text-sm">
                <NavItem to="/" icon={Home} onClick={() => setMobileOpen(false)}>
                  Início
                </NavItem>
                <NavItem to="/sobre" icon={Info} onClick={() => setMobileOpen(false)}>
                  Sobre
                </NavItem>

                {user && (
                  <>
                    <NavItem to="/dashboard" icon={LayoutDashboard} onClick={() => setMobileOpen(false)}>
                      Painel
                    </NavItem>
                    <NavItem to="/mercado-solidario" icon={ShoppingBasket} onClick={() => setMobileOpen(false)}>
                      Mercado
                    </NavItem>
                    <NavItem to="/cestas/solicitacoes" icon={Package} onClick={() => setMobileOpen(false)}>
                      Minhas Cestas
                    </NavItem>

                    {profile?.role === "admin" && (
                      <NavItem to="/admin" icon={Shield} onClick={() => setMobileOpen(false)}>
                        Admin
                      </NavItem>
                    )}

                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="mt-6 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg"
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </>
                )}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
