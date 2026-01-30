import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { toast } from "sonner"
import {
  CheckCircle,
  XCircle,
  Clock,
  History
} from "lucide-react"
import { useNavigate } from "react-router-dom"

/* ================= MODAL ================= */
function ConfirmModal({ open, onClose, onConfirm, loading }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-2">
          Confirmar rejeição
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja rejeitar esta doação?
          Essa ação não poderá ser desfeita.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border py-2 rounded-xl"
          >
            Cancelar
          </button>

          <button
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 rounded-xl disabled:opacity-50"
          >
            {loading ? "Rejeitando..." : "Rejeitar"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ================= MAIN ================= */
export default function Doacoes() {
  const navigate = useNavigate()

  const [doacoes, setDoacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [validadeMap, setValidadeMap] = useState({})

  const [dashboard, setDashboard] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  })

  const [modalRejeitar, setModalRejeitar] = useState(null)

  /* ================= DASHBOARD ================= */
  async function carregarDashboard() {
    const { data } = await supabase
      .from("donations")
      .select("status")

    const resumo = { pending: 0, approved: 0, rejected: 0 }
    data?.forEach(d => resumo[d.status]++)

    setDashboard(resumo)
  }

  /* ================= DADOS ================= */
  async function carregarDoacoes() {
    setLoading(true)

    const { data: donations, error } = await supabase
      .from("donations")
      .select(`
        id,
        user_id,
        status,
        created_at,
        donation_items (
          id,
          produto_id,
          quantidade,
          validade,
          products (
            nome,
            image_url
          )
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar doações")
      setLoading(false)
      return
    }

    const userIds = [...new Set(donations.map(d => d.user_id))]

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome, cpf")
      .in("id", userIds)

    const perfilMap = Object.fromEntries(
      profiles.map(p => [p.id, p])
    )

    setDoacoes(
      donations.map(d => ({
        ...d,
        profile: perfilMap[d.user_id]
      }))
    )

    setLoading(false)
  }

  useEffect(() => {
    carregarDoacoes()
    carregarDashboard()
  }, [])

  /* ================= APROVAR ================= */
  async function aprovarDoacao(doacao) {
    setProcessando(doacao.id)

    try {
      const semValidade = doacao.donation_items.some(
        i => !validadeMap[i.id]
      )

      if (semValidade) {
        toast.error("Informe a validade de todos os itens")
        setProcessando(null)
        return
      }

      for (const item of doacao.donation_items) {
        await supabase
          .from("donation_items")
          .update({ validade: validadeMap[item.id] })
          .eq("id", item.id)

        const { data: produto } = await supabase
          .from("products")
          .select("quantidade")
          .eq("id", item.produto_id)
          .single()

        await supabase
          .from("products")
          .update({
            quantidade: (produto.quantidade || 0) + item.quantidade
          })
          .eq("id", item.produto_id)
      }

      await supabase
        .from("donations")
        .update({ status: "approved" })
        .eq("id", doacao.id)

      toast.success("Doação aprovada")
      carregarDoacoes()
      carregarDashboard()

    } catch {
      toast.error("Erro ao aprovar doação")
    }

    setProcessando(null)
  }

  /* ================= REJEITAR ================= */
  async function confirmarRejeicao() {
    const id = modalRejeitar
    setProcessando(id)

    await supabase
      .from("donations")
      .update({ status: "rejected" })
      .eq("id", id)

    toast.success("Doação rejeitada")
    setModalRejeitar(null)
    setProcessando(null)
    carregarDoacoes()
    carregarDashboard()
  }

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Aprovação de Doações
        </h1>

        <button
          onClick={() => navigate("/admin/doacoes/historico")}
          className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl"
        >
          <History size={18} />
          Histórico
        </button>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Resumo titulo="Pendentes" valor={dashboard.pending} icon={<Clock />} />
        <Resumo titulo="Aprovadas" valor={dashboard.approved} icon={<CheckCircle />} />
        <Resumo titulo="Rejeitadas" valor={dashboard.rejected} icon={<XCircle />} />
      </div>

      {loading && <p>Carregando...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {doacoes.map(d => (
    <div
      key={d.id}
      className="bg-white text-black rounded-2xl p-6 flex flex-col"
    >
      <p className="font-semibold mb-3">
        Doador: {d.profile?.nome}
      </p>

      <div className="space-y-3 flex-1">
        {d.donation_items.map(item => (
          <div
            key={item.id}
            className="flex gap-4 border p-3 rounded-xl"
          >
            <img
              src={item.products?.image_url}
              className="w-16 h-16 rounded object-cover"
            />

            <div className="flex-1">
              <strong>{item.products?.nome}</strong>
              <p className="text-sm">Qtd: {item.quantidade}</p>

              <input
                type="date"
                className="border p-2 rounded mt-2 w-full"
                value={validadeMap[item.id] || ""}
                onChange={e =>
                  setValidadeMap(prev => ({
                    ...prev,
                    [item.id]: e.target.value
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => aprovarDoacao(d)}
          className="bg-green-600 text-white py-3 rounded-xl"
        >
          Aprovar
        </button>

        <button
          onClick={() => setModalRejeitar(d.id)}
          className="bg-red-600 text-white py-3 rounded-xl"
        >
          Rejeitar
        </button>
      </div>
    </div>
  ))}
</div>


      {/* MODAL */}
      <ConfirmModal
        open={!!modalRejeitar}
        loading={processando}
        onClose={() => setModalRejeitar(null)}
        onConfirm={confirmarRejeicao}
      />
    </div>
  )
}

/* ================= CARD ================= */
function Resumo({ titulo, valor, icon }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
      <div className="p-3 bg-white/10 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-white/60">{titulo}</p>
        <p className="text-2xl font-bold">{valor}</p>
      </div>
    </div>
  )
}
