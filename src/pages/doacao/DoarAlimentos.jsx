import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { toast } from "sonner"
import ConfirmModal from "../../components/ConfirmModal"
import FloatingBagButton from "../../components/FloatingBagButton"
import DonationDrawer from "../../components/DonationDrawer"

import {
  HeartHandshake,
  Search,
  Plus,
} from "lucide-react"
import { motion } from "framer-motion"

export default function DoarAlimentos() {
  const { user, profile } = useAuth()

  const [produtos, setProdutos] = useState([])
  const [filtro, setFiltro] = useState("")
  const [loading, setLoading] = useState(true)
  const [quantidades, setQuantidades] = useState({})
  const [carrinho, setCarrinho] = useState([])

  const [sacolaAberta, setSacolaAberta] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  const podeDoar = !!user && profile?.status === "active"

  /* ================= PRODUTOS ================= */
  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("ativo", true)
        .order("nome")

      if (error) {
        toast.error("Erro ao carregar alimentos")
      } else {
        setProdutos(data || [])
      }

      setLoading(false)
    }

    carregar()
  }, [])

  /* ================= CARRINHO ================= */
  function alterarQtd(id, delta) {
  setCarrinho(prev =>
    prev
      .map(item =>
        item.id === id
          ? { ...item, quantidade: item.quantidade + delta }
          : item
      )
      .filter(item => item.quantidade > 0)
  )
}

  function adicionarAoCarrinho(produto) {
    const qtd = Number(quantidades[produto.id] || 0)

    if (qtd <= 0) {
      toast.error("Informe uma quantidade válida")
      return
    }

    setCarrinho(prev => {
      const existente = prev.find(p => p.id === produto.id)

      if (existente) {
        return prev.map(p =>
          p.id === produto.id
            ? { ...p, quantidade: p.quantidade + qtd }
            : p
        )
      }

      return [...prev, { ...produto, quantidade: qtd }]
    })

    setQuantidades(prev => ({ ...prev, [produto.id]: "" }))
    toast.success("Item adicionado à sacola")
  }

  function removerItem(id) {
    setCarrinho(prev => prev.filter(p => p.id !== id))
  }

  /* ================= CONFIRMAÇÃO ================= */
  function abrirConfirmacao() {
    if (!podeDoar) {
      toast.warning("Sua conta precisa ser aprovada para doar")
      return
    }

    if (carrinho.length === 0) {
      toast.error("Adicione pelo menos um item")
      return
    }

    setConfirmar(true)
  }

  async function confirmarDoacao() {
    const { data: doacao, error } = await supabase
      .from("donations")
      .insert({
        user_id: user.id,
        tipo: "alimento",
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      toast.error("Erro ao criar doação")
      return
    }

    const itens = carrinho.map(item => ({
      donation_id: doacao.id,
      produto_id: item.id,
      quantidade: item.quantidade,
    }))

    const { error: itensError } = await supabase
      .from("donation_items")
      .insert(itens)

    if (itensError) {
      toast.error("Erro ao registrar itens")
      return
    }

    toast.success("Doação enviada com sucesso", {
      description:
        "Um administrador irá analisar antes de entrar no estoque.",
    })

    setCarrinho([])
    setConfirmar(false)
    setSacolaAberta(false)
  }

  const filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  const totalItens = carrinho.reduce(
    (s, i) => s + i.quantidade,
    0
  )

  /* ================= RENDER ================= */
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-10 text-white">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HeartHandshake className="text-primary" />
            Doar Alimentos
          </h1>

          <p className="text-white/70 max-w-2xl mt-2">
            Escolha os alimentos que deseja doar.
            Todas as doações passam por aprovação.
          </p>
        </motion.div>

        {/* BUSCA */}
        <div className="relative max-w-md mb-8">
          <Search
            className="absolute left-3 top-3 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar alimento..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2
              rounded-xl text-black
              focus:ring-2 focus:ring-primary
            "
          />
        </div>

        {/* GRID RESPONSIVO */}
        <div
          className="
            grid grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4
            gap-4
          "
        >
          {loading && <p>Carregando alimentos...</p>}

          {filtrados.map(produto => {
            const selecionado = carrinho.find(
              i => i.id === produto.id
            )

            return (
              <motion.div
                key={produto.id}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="
                  bg-white text-black
                  rounded-2xl p-4
                  border border-transparent
                  hover:border-primary
                  flex flex-col
                "
              >
                <div className="h-32 w-full bg-gray-100 rounded-lg flex items-center justify-center mb-3">
  <img
    src={produto.image_url || "/sem-imagem.png"}
    alt={produto.nome}
    className="
      max-h-full
      max-w-full
      object-contain
    "
  />
</div>


                <h3 className="font-bold text-sm mb-1">
                  {produto.nome}
                </h3>

                {selecionado && (
                  <p className="text-xs text-green-600 font-semibold mb-1">
                    Na sacola: {selecionado.quantidade}
                  </p>
                )}

                <p className="text-xs text-gray-600 mb-3">
                  {produto.descricao || "Alimento essencial"}
                </p>

                <div className="flex gap-2 mt-auto">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qtd"
                    value={quantidades[produto.id] || ""}
                    onChange={e =>
                      setQuantidades(prev => ({
                        ...prev,
                        [produto.id]: e.target.value,
                      }))
                    }
                    disabled={!podeDoar}
                    className="
                      border p-2 rounded-lg
                      w-20 text-sm
                    "
                  />

                  <button
                    disabled={!podeDoar}
                    onClick={() =>
                      adicionarAoCarrinho(produto)
                    }
                    className="
                      bg-primary text-white
                      px-3 rounded-lg
                      flex items-center gap-1
                      text-sm
                      disabled:opacity-50
                    "
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* SACOLA FLUTUANTE */}
      <FloatingBagButton
        totalItens={totalItens}
        onClick={() => setSacolaAberta(true)}
      />

      {/* DRAWER */}
      <DonationDrawer
  aberto={sacolaAberta}
  onClose={() => setSacolaAberta(false)}
  carrinho={carrinho}
  onRemover={removerItem}
  onAlterarQtd={alterarQtd}
  onConfirmar={abrirConfirmacao}
/>


      {/* MODAL CONFIRMAÇÃO */}
      <ConfirmModal
        aberto={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={confirmarDoacao}
        titulo="Confirmar doação"
        descricao={`Você está prestes a doar ${totalItens} item(ns). Deseja continuar?`}
      />
    </>
  )
}
