import { X, LayoutDashboard, Package, History, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminSidebarMobile({ open, onClose }) {
  if (!open) return null

  const Item = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10"
    >
      <Icon size={18} />
      {label}
    </Link>
  )

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-50 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.aside
          className="absolute left-0 top-0 h-full w-72 bg-dark p-4"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-secondary">
              Administração
            </span>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          {/* MENU */}
          <nav className="flex flex-col gap-1 text-sm">
            <Item to="/admin" icon={LayoutDashboard} label="Dashboard" />
            <Item to="/admin/cestas" icon={Package} label="Cestas" />
            <Item to="/admin/cestas/historico" icon={History} label="Histórico" />
            <Item to="/admin/usuarios" icon={Users} label="Usuários" />
          </nav>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  )
}
