import {
  Package,
  BarChart3,
  Users,
  ShoppingBasket,
  Inbox,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react"
import { motion } from "framer-motion"
import AdminCard from "../components/AdminCard"

export default function Admin() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">

      {/* CABEÇALHO */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-red-400" size={32} />
          <h1 className="text-3xl md:text-4xl font-bold text-red-400">
            Painel Administrativo
          </h1>
        </div>

        <p className="text-white/70 max-w-2xl">
          Controle total do sistema, gerenciamento de estoque,
          usuários, cestas e doações.
        </p>
      </motion.div>

      {/* GRID ADMIN */}
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AdminCard
          to="/admin/produtos"
          title="Produtos"
          icon={Package}
        />

        <AdminCard
          to="/admin/estoque"
          title="Estoque"
          icon={BarChart3}
        />

        <AdminCard
          to="/admin/usuarios"
          title="Usuários"
          icon={Users}
        />

        <AdminCard
          to="/admin/cestas"
          title="Criar Cestas"
          icon={ShoppingBasket}
        />
        
        <AdminCard
          to="/admin/cestas/montar"
          title="Montar Cestas"
          icon={ShoppingBasket}
        />

        <AdminCard
          to="/admin/cestas/solicitacoes"
          title="Solicitações"
          icon={Inbox}
          danger
        />

        <AdminCard
          to="/admin/doacoes"
          title="Doações"
          icon={HeartHandshake}
        />
      </motion.div>
    </section>
  )
}
