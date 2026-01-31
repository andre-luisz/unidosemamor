import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  History,
  Users
} from "lucide-react"
import logo from "/logo.png"

export default function AdminSidebar() {
  const location = useLocation()

  const Item = ({ to, icon: Icon, label }) => {
    const active = location.pathname.startsWith(to)

    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
          active
            ? "bg-white/10 text-secondary font-semibold"
            : "text-white/80 hover:bg-white/5"
        }`}
      >
        <Icon size={18} />
        {label}
      </Link>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-dark border-r border-white/10 p-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <img src={logo} className="h-8" />
        <span className="font-bold text-secondary">Admin</span>
      </div>

      <nav className="flex flex-col gap-1 text-sm">
        <Item to="/admin" icon={LayoutDashboard} label="Dashboard" />
        <Item to="/admin/cestas" icon={Package} label="Cestas" />
        <Item to="/admin/cestas/historico" icon={History} label="Histórico" />
        <Item to="/admin/usuarios" icon={Users} label="Usuários" />
      </nav>
    </aside>
  )
}
