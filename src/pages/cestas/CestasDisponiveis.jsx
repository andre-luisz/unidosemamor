import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { toast } from "sonner"
import ConfirmModal from "../../components/ConfirmModal"
import {
  Package,
  Users,
  CheckCircle,
  XCircle,
  ShoppingBasket,
} from "lucide-react"
import { motion } from "framer-motion"

export default function CestasDisponiveis() {
  const [cestas, setCestas] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantidades, setQuantidades] = useState({})
  const [descricoes, setDescricoes] = useState({})
  const [user, setUser] = useState(null)
  const [isDisabled] = useState(true)

  // controle do modal
  const [confirmar, setConfirmar] = useState(null)

  /* ================= USUÁRIO ================= */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null)
    })
  }, [])

  /* ================= CESTAS ================= */
  useEffect(() => {
    carregarCestas()
  }, [])

  async function carregarCestas() {
    setLoading(true)

    const { data, error } = await supabase
      .from("baskets")
      .select(`
        id,
        nome,
        descricao,
        basket_items (
          quantidade,
          products (
            id,
            nome,
            quantidade,
            image_url
          )
        )
      `)
      .eq("ativa", true)
      .order("nome")

    if (error) {
      toast.error("Erro ao carregar cestas")
      console.error(error)
    } else {
      setCestas(data || [])
    }

    setLoading(false)
  }

  /* ================= DISPONÍVEL ================= */
  function calcularDisponivel(cesta) {
    if (!cesta.basket_items.length) return 0

    return Math.min(
      ...cesta.basket_items.map(item =>
        Math.floor(item.products.quantidade / item.quantidade)
      )
    )
  }

  /* ================= ABRIR CONFIRMAÇÃO ================= */
  function solicitarRetirada(cesta) {
    if (!user) {
      toast.warning("Faça login para solicitar uma cesta")
      return
    }

    const qtd = quantidades[cesta.id] || 1
    const descricao = descricoes[cesta.id]?.trim() || ""
    const disponivel = calcularDisponivel(cesta)

    if (!descricao) {
      toast.error("Informe para quem é essa cesta", {
        description: "Esse campo é obrigatório.",
      })
      return
    }

    if (qtd <= 0 || qtd > disponivel) {
      toast.error("Quantidade inválida")
      return
    }

    // abre o modal
    setConfirmar({
      cesta,
      qtd,
      descricao,
    })
  }

  /* ================= CONFIRMAR ENVIO ================= */
  async function confirmarSolicitacao() {
    const { cesta, qtd, descricao } = confirmar

    const { error } = await supabase
      .from("basket_requests")
      .insert({
        basket_id: cesta.id,
        quantidade: qtd,
        descricao,
        user_id: user.id,
        status: "pending",
      })

    if (error) {
      toast.error("Erro ao enviar solicitação")
      console.error(error)
      return
    }

    toast.success("Solicitação enviada com sucesso", {
      description:
        "Sua cesta foi registrada e está aguardando análise da equipe.",
    })

    setQuantidades(prev => ({ ...prev, [cesta.id]: 1 }))
    setDescricoes(prev => ({ ...prev, [cesta.id]: "" }))
    setConfirmar(null)
  }

  /* ================= RENDER ================= */
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingBasket className="text-primary" />
          Cestas Disponíveis
        </h1>

        <p className="text-white/70 max-w-2xl mt-2">
          Escolha uma cesta disponível e faça sua solicitação.
          Cada pedido é analisado com cuidado pela equipe.
        </p>
      </motion.div>

      {loading && (
        <p className="text-white/70">
          Carregando cestas disponíveis...
        </p>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cestas.map(cesta => {
          const disponivel = calcularDisponivel(cesta)
          const indisponivel = disponivel === 0

          return (
            <motion.div
              key={cesta.id}
              whileHover={{
                y: -4,
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="
                bg-white text-black
                rounded-2xl p-5
                border border-transparent
                hover:border-primary
                flex flex-col
              "
            >
              {/* TOPO */}
              <div className="mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Package size={18} />
                  {cesta.nome}
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                  {cesta.descricao}
                </p>
              </div>

              {/* ITENS */}
              <div className="space-y-3 mb-4">
                {cesta.basket_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img
                      src={item.products.image_url || "/sem-imagem.png"}
                      alt={item.products.nome}
                      className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.products.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantidade} por cesta
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* DISPONÍVEL */}
              <div className="text-sm mb-3 flex items-center gap-2">
                <Users size={16} />
                {indisponivel ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle size={14} />
                    Indisponível
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} />
                    {disponivel} cestas disponíveis
                  </span>
                )}
              </div>

              {/* CONTROLES */}
              <input
                type="number"
                min="1"
                max={disponivel}
                value={quantidades[cesta.id] || 1}
                onChange={e =>
                  setQuantidades(prev => ({
                    ...prev,
                    [cesta.id]: Number(e.target.value),
                  }))
                }
                disabled={isDisabled}
                className="w-full p-2 border rounded-lg mb-2 disabled:bg-gray-100"
              />

              <textarea
                required
                placeholder="Para quem é essa cesta? (obrigatório)"
                value={descricoes[cesta.id] || ""}
                onChange={e =>
                  setDescricoes(prev => ({
                    ...prev,
                    [cesta.id]: e.target.value,
                  }))
                }
                className="
                  w-full p-2 border rounded-lg mb-3
                  text-sm focus:ring-2 focus:ring-primary
                "
              />

              <button
                disabled={indisponivel}
                onClick={() => solicitarRetirada(cesta)}
                className="
                  mt-auto w-full
                  bg-primary text-white
                  py-2 rounded-xl font-semibold
                  disabled:opacity-50
                "
              >
                Solicitar Retirada
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
      <ConfirmModal
        aberto={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={confirmarSolicitacao}
        titulo="Confirmar solicitação"
        descricao={`Você está solicitando ${confirmar?.qtd} cesta(s). Deseja continuar?`}
      />
    </div>
  )
}
