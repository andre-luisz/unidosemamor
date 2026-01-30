import {
  ShoppingCart,
  Package,
  ClipboardList,
  HeartHandshake,
} from "lucide-react"
import { motion } from "framer-motion"
import DashboardCard from "../components/DashboardCard"

export default function Dashboard() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">

      {/* CABEÇALHO */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Área do Usuário
        </h1>

        <p className="text-white/70 max-w-2xl">
          Aqui você acompanha suas solicitações, doações
          e acessa o mercado solidário de forma simples
          e transparente.
        </p>
      </motion.div>

      {/* CARDS */}
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <DashboardCard
          to="/mercado-solidario"
          title="Mercado Solidário"
          description="Monte sua cesta personalizada com os itens disponíveis."
          icon={ShoppingCart}
        />

        <DashboardCard
          to="/cestas/disponiveis"
          title="Cestas Básicas"
          description="Solicite uma cesta já montada com itens essenciais."
          icon={Package}
        />

        <DashboardCard
          to="/cestas/solicitacoes"
          title="Minhas Solicitações"
          description="Acompanhe o status das cestas que você solicitou."
          icon={ClipboardList}
        />

        <DashboardCard
          to="/doar"
          title="Doar"
          description="Contribua com alimentos ou valores e faça a diferença."
          icon={HeartHandshake}
        />
        <DashboardCard
          to="/doacoes"
          title="Minhas Doações"
          description="Acompanhe o status das cestas que você doou."
          icon={HeartHandshake}
        />
      </motion.div>
    </section>
  )
}
