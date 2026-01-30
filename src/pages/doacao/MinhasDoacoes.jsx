import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { toast } from "sonner"
import {
  HeartHandshake,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function MinhasDoacoes() {
  const { user } = useAuth()
  const [doacoes, setDoacoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      if (!user) return

      const { data, error } = await supabase
        .from("donations")
        .select(`
          id,
          status,
          created_at,
          donation_items (
            quantidade,
            products ( nome )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        toast.error("Erro ao carregar doações")
      } else {
        setDoacoes(data || [])
      }

      setLoading(false)
    }

    carregar()
  }, [user])

  const statusMap = {
    pending: {
      label: "Em análise",
      color: "bg-yellow-100 text-yellow-800",
      icon: Clock,
      message:
        "Deixe sua doação num ponto de coleta para que seja analisada pela equipe.",
    },
    approved: {
      label: "Aprovada",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2,
      message:
        "Doação aprovada! Obrigado por contribuir ❤️",
    },
    rejected: {
      label: "Rejeitada",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
      message:
        "A doação não foi aprovada. Em caso de dúvidas, procure a equipe.",
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
          <HeartHandshake className="text-primary" />
          Minhas Doações
        </h1>

        <p className="text-white/70 max-w-2xl mt-2">
          Acompanhe o status das doações que você realizou.
          Todas passam por análise antes de entrar no estoque.
        </p>
      </motion.div>

      {/* ESTADOS */}
      {loading && (
        <p className="text-white/70">
          Carregando suas doações...
        </p>
      )}

      {!loading && doacoes.length === 0 && (
        <p className="text-white/70">
          Você ainda não realizou nenhuma doação.
        </p>
      )}

      {/* LISTA */}
      <AnimatePresence>
        <div className="space-y-4">
          {doacoes.map(doacao => {
            const status = statusMap[doacao.status]
            const StatusIcon = status.icon

            return (
              <motion.div
                key={doacao.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{
                  y: -3,
                  boxShadow:
                    "0 10px 25px rgba(0,0,0,0.15)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="
                  bg-white text-black
                  rounded-2xl p-5
                "
              >
                {/* TOPO */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <Package size={18} />
                    Doação de Alimentos
                  </div>

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

                {/* ITENS */}
                <ul className="text-sm space-y-1 mb-3">
                  {doacao.donation_items.map(
                    (item, i) => (
                      <li key={i}>
                        • {item.products?.nome} —{" "}
                        <strong>
                          {item.quantidade}
                        </strong>
                      </li>
                    )
                  )}
                </ul>

                {/* DATA */}
                <p className="text-xs text-gray-500">
                  Doado em{" "}
                  {new Date(
                    doacao.created_at
                  ).toLocaleString()}
                </p>

                {/* MENSAGEM */}
                <p
                  className={`
                    mt-3 text-sm
                    ${
                      doacao.status === "pending"
                        ? "text-yellow-700"
                        : doacao.status === "approved"
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
