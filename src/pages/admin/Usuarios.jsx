import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { toast } from "sonner"
import ConfirmModal from "../../components/ConfirmModal"
import {
  Users,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCcw,
  Search,
} from "lucide-react"
import { motion } from "framer-motion"

const LIMITE = 15

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("all")

  const [resumo, setResumo] = useState({
    total: 0,
    active: 0,
    pending: 0,
    banned: 0,
  })

  const [confirmarBan, setConfirmarBan] = useState(null)

  /* ================= RESUMO (BANCO) ================= */
  async function carregarResumo() {
    const [total, active, pending, banned] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "banned"),
    ])

    setResumo({
      total: total.count || 0,
      active: active.count || 0,
      pending: pending.count || 0,
      banned: banned.count || 0,
    })
  }

  /* ================= USUÁRIOS ================= */
  async function carregarUsuarios(reset = false) {
    if (!hasMore && !reset) return

    reset ? setLoading(true) : setLoadingMore(true)

    const from = reset ? 0 : pagina * LIMITE
    const to = from + LIMITE - 1

    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to)

    if (statusFiltro !== "all") {
      query = query.eq("status", statusFiltro)
    }

    if (busca) {
      query = query.ilike("nome", `%${busca}%`)
    }

    const { data, error } = await query

    if (error) {
      toast.error("Erro ao carregar usuários")
    } else {
      if (data.length < LIMITE) setHasMore(false)
      setUsuarios(prev => (reset ? data : [...prev, ...data]))
    }

    setLoading(false)
    setLoadingMore(false)
  }
  function StatusBadge({ status }) {
  const map = {
    active: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    banned: "bg-red-100 text-red-700",
  }

  return (
    <span
      className={`
        px-2 py-0.5 rounded-full
        text-xs font-semibold
        ${map[status]}
      `}
    >
      {status}
    </span>
  )
}


  /* ================= EFFECTS ================= */
  useEffect(() => {
    carregarResumo()
    carregarUsuarios(true)
  }, [statusFiltro, busca])

  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        hasMore &&
        !loadingMore
      ) {
        setPagina(p => p + 1)
      }
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [hasMore, loadingMore])

  useEffect(() => {
    if (pagina > 0) carregarUsuarios()
  }, [pagina])

  /* ================= AÇÕES ================= */
  async function atualizarStatus(id, status) {
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", id)

    if (error) {
      toast.error("Erro ao atualizar usuário")
      return
    }

    toast.success("Usuário atualizado")
    setUsuarios([])
    setPagina(0)
    setHasMore(true)
    carregarResumo()
    carregarUsuarios(true)
  }

  /* ================= RENDER ================= */
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">
      {/* HEADER */}
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6">
        <Users className="text-primary" />
        Usuários
      </h1>

      {/* CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Resumo titulo="Total" valor={resumo.total} />
        <Resumo titulo="Ativos" valor={resumo.active} cor="text-green-400" />
        <Resumo titulo="Pendentes" valor={resumo.pending} cor="text-yellow-400" />
        <Resumo titulo="Banidos" valor={resumo.banned} cor="text-red-400" />
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3 mb-6">
        {["all", "active", "pending", "banned"].map(s => (
          <button
            key={s}
            onClick={() => {
              setUsuarios([])
              setPagina(0)
              setHasMore(true)
              setStatusFiltro(s)
            }}
            className={`px-4 py-2 rounded-full ${
              statusFiltro === s
                ? "bg-primary"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {s === "all" ? "Todos" : s}
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div className="space-y-3">
  {usuarios.map(u => (
    <motion.div
      key={u.id}
      whileHover={{ scale: 1.01 }}
      className="
        bg-white text-black
        rounded-xl p-4
        border border-gray-200
        flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-4
      "
    >
      {/* INFO */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <strong className="text-base">{u.nome}</strong>

          <StatusBadge status={u.status} />
        </div>

        <div className="text-sm text-gray-500 mt-1">
          CPF: {u.cpf || "—"} • Criado em{" "}
          {new Date(u.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* AÇÕES */}
      <div className="flex gap-2">
        {u.status === "pending" && (
          <button
            onClick={() => atualizarStatus(u.id, "active")}
            className="
              px-4 py-2 rounded-lg
              bg-green-600 text-white
              hover:opacity-90
            "
          >
            Aprovar
          </button>
        )}

        {u.status === "active" && (
          <button
            onClick={() => setConfirmarBan(u)}
            className="
              px-4 py-2 rounded-lg
              border border-red-500
              text-red-600
              hover:bg-red-50
            "
          >
            Banir
          </button>
        )}

        {u.status === "banned" && (
          <button
            onClick={() => atualizarStatus(u.id, "active")}
            className="
              px-4 py-2 rounded-lg
              border border-blue-500
              text-blue-600
              hover:bg-blue-50
            "
          >
            Reativar
          </button>
        )}
      </div>
    </motion.div>
  ))}
</div>


      {loadingMore && (
        <p className="text-center text-white/60 mt-6">
          Carregando mais usuários...
        </p>
      )}

      {/* MODAL */}
      <ConfirmModal
        aberto={!!confirmarBan}
        onClose={() => setConfirmarBan(null)}
        onConfirm={() => {
          atualizarStatus(confirmarBan.id, "banned")
          setConfirmarBan(null)
        }}
        titulo="Confirmar banimento"
        descricao={`Deseja realmente banir ${confirmarBan?.nome}?`}
      />
    </div>
  )
}

/* ================= CARD ================= */
function Resumo({ titulo, valor, cor = "text-white" }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-sm text-white/60">{titulo}</p>
      <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
    </div>
  )
}
