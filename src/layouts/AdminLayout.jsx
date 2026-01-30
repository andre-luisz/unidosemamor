import { useState } from "react"
import AdminSidebar from "../components/admin/AdminSidebar"
import AdminSidebarMobile from "../components/admin/AdminSidebarMobile"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"

export default function AdminLayout({ children }) {
  const [openMobile, setOpenMobile] = useState(false)

  return (
    <div className="min-h-screen bg-dark text-white flex">

      {/* SIDEBAR DESKTOP */}
      <AdminSidebar />

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR (mobile) */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <button
            onClick={() => setOpenMobile(true)}
            className="p-2 rounded-lg hover:bg-white/10"
          >
            <Menu />
          </button>
          <span className="font-semibold text-secondary">
            Administração
          </span>
        </div>

        <motion.main
          className="flex-1 p-6"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.main>
      </div>

      {/* SIDEBAR MOBILE */}
      <AdminSidebarMobile
        open={openMobile}
        onClose={() => setOpenMobile(false)}
      />
    </div>
  )
}
