import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { CheckCircle, XCircle, Clock } from "lucide-react"

export default function HistoricoDoacoes() {
  const [doacoes, setDoacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("all")

  useEffect(() => {
    async function carregar() {
      setLoading(true)

      const { data, error } = await supabase
        .from("donations")
        .select(`
          id,
          status,
          created_at,
          profiles ( nome, cpf ),
          donation_items (
            quantidade,
            validade,
            products ( nome )
          )
        `)
        .order("created_at", { ascending: false })

      if (!error) setDoacoes(data || [])
      setLoading(false)
    }

    carregar()
  }, [])

  /* ================= FILTRO ================= */
  const filtradas = doacoes.filter(d => {
    const matchNome =
      d.profiles?.nome
        ?.toLowerCase()
        .includes(busca.toLowerCase()) ||
      d.profiles?.cpf?.includes(busca)

    const matchStatus =
      statusFiltro === "all" ||
      d.status === statusFiltro

    return matchNome && matchStatus
  })

  /* ================= BADGE ================= */
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Histórico de Doações
      </h1>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          placeholder="Buscar por nome ou CPF..."
          className="p-3 rounded-xl text-black flex-1"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />

        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          className="p-3 rounded-xl text-black md:w-48"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
          <option value="rejected">Rejeitadas</option>
        </select>
      </div>

      {loading && <p>Carregando...</p>}

      {!loading && filtradas.length === 0 && (
        <p>Nenhuma doação encontrada</p>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtradas.map(doacao => (
          <div
            key={doacao.id}
            className="bg-white text-black rounded-2xl p-6 flex flex-col"
          >
            {/* TOPO */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">
                  {doacao.profiles?.nome}
                </p>
                <p className="text-sm text-gray-600">
                  CPF: {doacao.profiles?.cpf}
                </p>
              </div>

              {statusBadge(doacao.status)}
            </div>

            {/* ITENS */}
            <div className="space-y-2 flex-1">
              {doacao.donation_items.map((item, idx) => (
                <div
                  key={idx}
                  className="border rounded-xl p-3"
                >
                  <strong>{item.products?.nome}</strong>
                  <p className="text-sm">
                    Qtd: {item.quantidade}
                  </p>
                  <p className="text-sm">
                    Validade: {item.validade || "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* DATA */}
            <p className="text-xs text-gray-500 mt-4">
              {new Date(doacao.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
