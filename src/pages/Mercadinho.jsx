import { useEffect, useState } from "react"
import { supabase } from "../services/supabase"
import { useAuth } from "../context/AuthContext"
import { toast } from "sonner"

import ProductCard from "../components/ProductCard"
import FloatingBasketButton from "../components/FloatingBasketButton"
import BasketDrawer from "../components/BasketDrawer"

export default function Mercadinho() {
  const { profile } = useAuth()

  const [produtos, setProdutos] = useState([])
  const [carrinho, setCarrinho] = useState({})
  const [descricao, setDescricao] = useState("")
  const [busca, setBusca] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [cestaAberta, setCestaAberta] = useState(false)

  useEffect(() => {
    carregarProdutos()
  }, [])

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("products")
      .select("id, nome, quantidade, image_url")
      .eq("ativo", true)
      .order("nome")

    if (error) {
      toast.error("Erro ao carregar produtos")
      return
    }

    setProdutos(data || [])
  }

  function alterarQtd(produto, delta) {
    setCarrinho(prev => {
      const atual = prev[produto.id]?.quantidade || 0
      const nova = Math.max(0, atual + delta)

      if (nova === 0) {
        const copia = { ...prev }
        delete copia[produto.id]
        return copia
      }

      return {
        ...prev,
        [produto.id]: { produto, quantidade: nova }
      }
    })
  }

  async function enviarSolicitacao() {
    if (!Object.keys(carrinho).length) {
      toast.warning("Sua cesta está vazia")
      return
    }

    if (!descricao.trim()) {
      toast.error("Informe para quem é essa cesta")
      return
    }

    setEnviando(true)

    const { data: request, error } = await supabase
      .from("basket_requests")
      .insert({
        user_id: profile.id,
        descricao,
        quantidade: Object.values(carrinho)
          .reduce((s, i) => s + i.quantidade, 0),
        tipo: "livre",
        status: "pending"
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setEnviando(false)
      return
    }

    const itens = Object.values(carrinho).map(i => ({
      request_id: request.id,
      product_id: i.produto.id,
      quantidade: i.quantidade
    }))

    const { error: errItens } = await supabase
      .from("basket_request_items")
      .insert(itens)

    if (errItens) {
      toast.error("Erro ao salvar itens da cesta")
      setEnviando(false)
      return
    }

    toast.success("Pedido recebido 💙", {
  description:
    "Recebemos sua solicitação. Em breve nossa equipe irá analisar e retornar. Acompanhe o andamento em “Minhas Solicitações”.",
  duration: 6000,
})

    setCarrinho({})
    setDescricao("")
    setCestaAberta(false)
    setEnviando(false)
  }

  const totalItens = Object.values(carrinho)
    .reduce((s, i) => s + i.quantidade, 0)

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <>
      <section className="max-w-[1400px] mx-auto px-4 py-10 text-white">
        <h1 className="text-2xl md:text-4xl font-bold mb-1">
          Mercadinho Solidário
        </h1>

        <p className="text-white/70 mb-4">
          Escolha os produtos e monte sua cesta
        </p>

        {/* BUSCA */}
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="
            w-full sm:w-80 mb-6
            px-4 py-2 rounded-xl
            text-black
            focus:outline-none
            focus:ring-2 focus:ring-primary
          "
        />

        {/* GRID DE PRODUTOS */}
        <div
          className="
            grid grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4
            gap-4
          "
        >
          {produtosFiltrados.length === 0 && (
            <p className="col-span-full text-white/70">
              Nenhum produto encontrado.
            </p>
          )}

          {produtosFiltrados.map(p => (
            <ProductCard
              key={p.id}
              produto={p}
              quantidade={carrinho[p.id]?.quantidade || 0}
              onAlterar={alterarQtd}
            />
          ))}
        </div>
      </section>

      {/* BOTÃO FLUTUANTE */}
      <FloatingBasketButton
        totalItens={totalItens}
        onClick={() => setCestaAberta(true)}
      />

      {/* DRAWER DA CESTA */}
      <BasketDrawer
        aberto={cestaAberta}
        onClose={() => setCestaAberta(false)}
        carrinho={carrinho}
        descricao={descricao}
        setDescricao={setDescricao}
        onEnviar={enviarSolicitacao}
        enviando={enviando}
        onAlterarQtd={alterarQtd}
      />
    </>
  )
}
