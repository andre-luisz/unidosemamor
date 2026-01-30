import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  ClipboardList,
  CircleFadingPlus,
} from "lucide-react"
import { motion } from "framer-motion"

const LIMITE = 15

export default function Estoque() {
  const navigate = useNavigate()

  const [movimentos, setMovimentos] = useState([])
  const [filtro, setFiltro] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [resumo, setResumo] = useState({
    total: 0,
    entradas: 0,
    saidas: 0,
  })

  /* ================= RESUMO (VIEW) ================= */
  async function carregarResumo() {
    const { data, error } = await supabase
      .from("estoque_resumo")
      .select("*")
      .single()

    if (error) {
      console.error(error)
      toast.error("Erro ao carregar resumo do estoque")
      return
    }

    setResumo({
      total: data.total_movimentacoes,
      entradas: data.total_entradas,
      saidas: data.total_saidas,
    })
  }

  /* ================= MOVIMENTOS (PAGINADO) ================= */
  async function carregarMovimentos(reset = false) {
    if (!hasMore && !reset) return

    reset ? setLoading(true) : setLoadingMore(true)

    const from = reset ? 0 : pagina * LIMITE
    const to = from + LIMITE - 1

    const { data, error } = await supabase
      .from("product_movements")
      .select(`
        id,
        tipo,
        quantidade,
        motivo,
        created_at,
        products!product_movements_product_fk ( nome ),
        profiles!product_movements_user_fk ( nome )
      `)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error(error)
      toast.error("Erro ao carregar histórico")
    } else {
      if (data.length < LIMITE) setHasMore(false)
      setMovimentos(prev => (reset ? data : [...prev, ...data]))
    }

    setLoading(false)
    setLoadingMore(false)
  }

  /* ================= INIT ================= */
  useEffect(() => {
    carregarResumo()
    carregarMovimentos(true)
  }, [])

  /* ================= SCROLL INFINITO ================= */
  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        !loadingMore &&
        hasMore
      ) {
        setPagina(p => p + 1)
      }
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [loadingMore, hasMore])

  useEffect(() => {
    if (pagina > 0) carregarMovimentos()
  }, [pagina])

  /* ================= FILTRO ================= */
  const movimentosFiltrados = movimentos.filter(m =>
    m.products?.nome
      ?.toLowerCase()
      .includes(filtro.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="text-primary" />
            Histórico de Estoque
          </h1>
          <p className="text-white/70">
            Visão geral e controle detalhado
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/estoque/movimento")}
          className="bg-primary px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
        >
          <CircleFadingPlus size={18} />
          Nova Movimentação
        </button>
      </motion.div>

      {/* RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ResumoCard
          titulo="Movimentações"
          valor={resumo.total}
          icon={Package}
          cor="bg-blue-500/20 text-blue-400"
        />
        <ResumoCard
          titulo="Entradas"
          valor={resumo.entradas}
          icon={ArrowUpCircle}
          cor="bg-green-500/20 text-green-400"
        />
        <ResumoCard
          titulo="Saídas"
          valor={resumo.saidas}
          icon={ArrowDownCircle}
          cor="bg-red-500/20 text-red-400"
        />
      </div>

      {/* FILTRO */}
      <input
        type="text"
        placeholder="Filtrar por produto..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        className="w-full md:w-1/3 p-3 rounded-xl text-black mb-6"
      />

      {/* DESKTOP */}
      <div className="hidden md:block bg-white rounded-2xl text-black overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Qtd</th>
              <th className="p-3 text-left">Motivo</th>
              <th className="p-3 text-left">Usuário</th>
            </tr>
          </thead>
          <tbody>
            {movimentosFiltrados.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-3 text-sm">
                  {new Date(m.created_at).toLocaleString()}
                </td>
                <td className="p-3 font-medium">
                  {m.products?.nome}
                </td>
                <td
                  className={`p-3 font-semibold ${
                    m.tipo === "entrada"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {m.tipo.toUpperCase()}
                </td>
                <td className="p-3">{m.quantidade}</td>
                <td className="p-3">{m.motivo}</td>
                <td className="p-3">
                  {m.profiles?.nome || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="md:hidden space-y-4 mt-6">
        {movimentosFiltrados.map(m => (
          <motion.div
            key={m.id}
            whileHover={{ y: -2 }}
            className="bg-white text-black rounded-2xl p-4"
          >
            <div className="flex justify-between mb-2">
              <strong>{m.products?.nome}</strong>
              <span
                className={`text-xs font-semibold ${
                  m.tipo === "entrada"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {m.tipo.toUpperCase()}
              </span>
            </div>

            <p className="text-sm">
              <strong>Qtd:</strong> {m.quantidade}
            </p>
            <p className="text-sm">
              <strong>Motivo:</strong> {m.motivo}
            </p>
            <p className="text-sm">
              <strong>Usuário:</strong>{" "}
              {m.profiles?.nome || "-"}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              {new Date(m.created_at).toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      {loadingMore && (
        <p className="text-center text-white/60 mt-6">
          Carregando mais registros...
        </p>
      )}
    </div>
  )
}

/* ================= CARD ================= */
function ResumoCard({ titulo, valor, icon: Icon, cor }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl p-5 bg-white/5 border border-white/10 flex items-center gap-4"
    >
      <div className={`p-3 rounded-xl ${cor}`}>
        <Icon size={24} />
      </div>

      <div>
        <p className="text-sm text-white/60">{titulo}</p>
        <p className="text-2xl font-bold">{valor}</p>
      </div>
    </motion.div>
  )
}
