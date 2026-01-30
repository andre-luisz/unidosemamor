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
  const avatarRef = useRef(null)

  const isActive = path => location.pathname === path

  /* ================= FECHAR DROPDOWN AO CLICAR FORA ================= */
  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const NavItem = ({ to, icon: Icon, children }) => {
    const active = isActive(to)

    return (
      <Link
        to={to}
        className={`relative flex items-center gap-2 px-1 py-1 transition ${
          active
            ? "text-secondary font-semibold"
            : "text-white/80 hover:text-secondary"
        }`}
      >
        <Icon size={16} className="opacity-80" />
        <span>{children}</span>

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
      <header className="bg-dark/95 backdrop-blur border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Unidos em Amor" className="h-9 w-auto" />
            <span className="text-lg font-bold text-secondary tracking-wide">
              Unidos em Amor
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <NavItem to="/" icon={Home}>Início</NavItem>
            <NavItem to="/sobre" icon={Info}>Sobre</NavItem>

            {user && (
              <>
                <NavItem to="/dashboard" icon={LayoutDashboard}>
                  Painel
                </NavItem>
                <NavItem to="/mercado-solidario" icon={ShoppingBasket}>
                  Mercado
                </NavItem>
                <NavItem to="/cestas/solicitacoes" icon={Package}>
                  Minhas Cestas
                </NavItem>
                {profile?.role === "admin" && (
                  <NavItem to="/admin" icon={Shield}>
                    Admin
                  </NavItem>
                )}
              </>
            )}
          </nav>

          {/* ACTIONS */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                {/* NOTIFICAÇÕES */}
                <button className="relative p-2 rounded-full hover:bg-white/10 transition">
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
                </button>

                {/* AVATAR */}
                <div className="relative" ref={avatarRef}>
                  <button
                    onClick={() => setAvatarOpen(!avatarOpen)}
                    className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-secondary text-black flex items-center justify-center font-bold text-sm">
                      {profile?.nome?.[0] || <User size={14} />}
                    </div>
                    <span className="text-sm text-white/90">
                      {profile?.nome}
                    </span>
                  </button>

                  {/* DROPDOWN */}
                  <AnimatePresence>
                    {avatarOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute right-0 mt-3 w-56 bg-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <Link
                          to="/dashboard"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm"
                        >
                          <LayoutDashboard size={16} />
                          Painel
                        </Link>

                        {profile?.role === "admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm"
                          >
                            <Shield size={16} />
                            Administração
                          </Link>
                        )}

                        <div className="border-t border-white/10">
                          <button
                            onClick={() => supabase.auth.signOut()}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left"
                          >
                            <LogOut size={16} />
                            Sair
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {!user && (
              <>
                <NavItem to="/login" icon={User}>Entrar</NavItem>
                <Link
                  to="/cadastro"
                  className="bg-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90"
                >
                  Cadastro
                </Link>
              </>
            )}
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
          >
            <Menu />
          </button>
        </div>
      </header>

      {/* MOBILE MENU (mantido igual ao anterior) */}
      {/* Se quiser, no próximo passo a gente cria dropdown de avatar no mobile também */}
    </>
  )
}
