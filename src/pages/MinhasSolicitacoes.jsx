import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { toast } from "sonner"
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBasket,
  Filter,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function MinhasSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("all")

  async function carregar() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Usuário não autenticado")
      setLoading(false)
      return
    }

    let query = supabase
      .from("basket_requests")
      .select(`
        id,
        quantidade,
        descricao,
        status,
        tipo,
        created_at,
        baskets ( nome )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (filtro !== "all") {
      query = query.eq("status", filtro)
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
      toast.error("Erro ao carregar suas solicitações")
    } else {
      setSolicitacoes(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [filtro])

  const statusMap = {
    pending: {
      label: "Em análise",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      message: "Sua solicitação está sendo analisada.",
    },
    approved: {
      label: "Aprovada",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2,
      message:
        "Sua solicitação foi aprovada. Aguarde orientações para retirada.",
    },
    rejected: {
      label: "Rejeitada",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
      message:
        "Sua solicitação não foi aprovada. Em caso de dúvidas, procure a equipe.",
    },
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-white">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingBasket className="text-primary" />
          Minhas Solicitações
        </h1>

        <p className="text-white/70 max-w-2xl mt-2">
          Acompanhe o status das cestas solicitadas.
          Cada pedido é analisado com cuidado pela equipe.
        </p>
      </motion.div>

      {/* FILTROS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center gap-2 mb-8"
      >
        <Filter size={18} className="text-white/60" />

        {[
          { key: "all", label: "Todas" },
          { key: "pending", label: "Em análise" },
          { key: "approved", label: "Aprovadas" },
          { key: "rejected", label: "Rejeitadas" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition
              ${
                filtro === f.key
                  ? "bg-primary text-white"
                  : "bg-white/10 hover:bg-white/20"
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* ESTADOS */}
      {loading && (
        <p className="text-white/70">
          Carregando solicitações...
        </p>
      )}

      {!loading && solicitacoes.length === 0 && (
        <p className="text-white/70">
          Nenhuma solicitação encontrada.
        </p>
      )}

      {/* LISTA */}
      <AnimatePresence>
        <div className="space-y-4">
          {solicitacoes.map(s => {
            const status = statusMap[s.status]
            const StatusIcon = status.icon

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                layout
                whileHover={{
                  y: -4,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="
                bg-white text-black
                  rounded-2xl p-5
                  border border-transparent
                hover:border-primary
                  transition-colors
                  "
                >

                {/* TOPO */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <strong className="text-sm sm:text-base">
                    {s.tipo === "livre"
                      ?  "Mercado Solidário"
                      : s.baskets?.nome}
                  </strong>

                  <span
                    className={`
                      inline-flex items-center gap-1
                      px-3 py-1 rounded-full
                      text-xs font-semibold
                      ${status.color}
                    `}
                  >
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                {/* INFO */}
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Quantidade:</strong>{" "}
                    {s.quantidade}
                  </p>

                  <p>
                    <strong>Descrição:</strong>{" "}
                    {s.descricao || "—"}
                  </p>
                </div>

                {/* DATA */}
                <p className="text-xs text-gray-500 mt-2">
                  Solicitado em{" "}
                  {new Date(s.created_at).toLocaleString()}
                </p>

                {/* MENSAGEM */}
                <p
                  className={`
                    mt-3 text-sm
                    ${
                      s.status === "pending"
                        ? "text-yellow-700"
                        : s.status === "approved"
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  `}
                >
                  {status.message}
                </p>
              </motion.div>
            )
          })}
        </div>
      </AnimatePresence>
    </div>
  )
}
