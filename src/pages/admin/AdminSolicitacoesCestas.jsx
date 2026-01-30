import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { toast } from "sonner"
import { CheckCircle, XCircle, Clock } from "lucide-react"

export default function AdminSolicitacoesCestas() {
  const [rows, setRows] = useState([])
  const [statusFiltro, setStatusFiltro] = useState("pending")
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(null)

  /* ================= CARREGAR DADOS ================= */
  async function carregar() {
    setLoading(true)

    let query = supabase
      .from("vw_admin_solicitacoes_cestas")
      .select("*")
      .order("created_at", { ascending: false })

    if (statusFiltro !== "all") {
      query = query.eq("status", statusFiltro)
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
      toast.error("Erro ao carregar solicitações")
    } else {
      setRows(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [statusFiltro])

  /* ================= AGRUPAR POR SOLICITAÇÃO ================= */
  const solicitacoes = Object.values(
    rows.reduce((acc, item) => {
      if (!acc[item.request_id]) {
        acc[item.request_id] = {
          id: item.request_id,
          status: item.status,
          tipo: item.tipo,
          descricao: item.descricao,
          created_at: item.created_at,
          usuario: item.usuario_nome,
          cesta: item.basket_nome,
          itens: []
        }
      }

      if (item.produto_nome) {
        acc[item.request_id].itens.push({
          nome: item.produto_nome,
          quantidade: item.produto_quantidade
        })
      }

      return acc
    }, {})
  )

  /* ================= AÇÕES ================= */
  async function aprovar(id) {
    setProcessando(id)

    const { error } = await supabase.rpc(
      "approve_basket_request",
      { p_request_id: id }
    )

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Solicitação aprovada")
      carregar()
    }

    setProcessando(null)
  }

  async function rejeitar(id) {
  setProcessando(id)

  const { error } = await supabase.rpc(
    "reject_basket_request",
    { p_request_id: id }
  )

  if (error) {
    toast.error(error.message)
  } else {
    toast.success("Solicitação rejeitada")
    carregar()
  }

  setProcessando(null)
}


  /* ================= STATUS BADGE ================= */
  function statusBadge(status) {
    const map = {
      pending: {
        label: "Pendente",
        class: "bg-yellow-100 text-yellow-800",
        icon: <Clock size={14} />
      },
      approved: {
        label: "Aprovada",
        class: "bg-green-100 text-green-800",
        icon: <CheckCircle size={14} />
      },
      rejected: {
        label: "Rejeitada",
        class: "bg-red-100 text-red-800",
        icon: <XCircle size={14} />
      }
    }

    const s = map[status]

    return (
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${s.class}`}
      >
        {s.icon}
        {s.label}
      </span>
    )
  }

  /* ================= RENDER ================= */
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Solicitações de Cestas / Mercadinho
      </h1>

      {/* FILTRO */}
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected", "all"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFiltro(s)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              statusFiltro === s
                ? "bg-primary text-white"
                : "bg-white/10"
            }`}
          >
            {s === "pending" && "Pendentes"}
            {s === "approved" && "Aprovadas"}
            {s === "rejected" && "Rejeitadas"}
            {s === "all" && "Todas"}
          </button>
        ))}
      </div>

      {loading && <p>Carregando...</p>}

      {!loading && solicitacoes.length === 0 && (
        <p>Nenhuma solicitação encontrada</p>
      )}

      <div className="space-y-4">
        {solicitacoes.map(s => (
          <div
            key={s.id}
            className="bg-white text-black rounded-2xl p-5"
          >
            <div className="flex justify-between items-center mb-2">
              <strong>
                {s.cesta || "Mercadinho (cesta personalizada)"}
              </strong>

              {statusBadge(s.status)}
            </div>

            <p><strong>Solicitante:</strong> {s.usuario}</p>
            <p><strong>Obs:</strong> {s.descricao || "—"}</p>

            {/* ITENS */}
            <div className="mt-3">
              <strong>Itens solicitados:</strong>

              {s.itens.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum item listado
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {s.itens.map((i, idx) => (
                    <li key={idx}>
                      • {i.nome} — {i.quantidade}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              {new Date(s.created_at).toLocaleString()}
            </p>

            {s.status === "pending" && (
              <div className="flex gap-3 mt-4">
                <button
                  disabled={processando === s.id}
                  onClick={() => aprovar(s.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl"
                >
                  Aprovar
                </button>

                <button
                  disabled={processando === s.id}
                  onClick={() => rejeitar(s.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl"
                >
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
