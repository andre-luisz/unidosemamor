import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBasket,
  Package,
} from "lucide-react"
import { motion } from "framer-motion"

export default function EditarCesta() {
  const { id } = useParams()
  const navigate = useNavigate()

  /* FORM */
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")

  /* PRODUTOS */
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState("")

  /* CARRINHO */
  const [carrinho, setCarrinho] = useState([])

  const [loading, setLoading] = useState(false)

  /* ================= PRODUTOS ================= */
  useEffect(() => {
    supabase
      .from("products")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => setProdutos(data || []))
  }, [])

  /* ================= CESTA ================= */
  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("baskets")
        .select(`
          nome,
          descricao,
          basket_items (
            produto_id,
            quantidade,
            products ( nome )
          )
        `)
        .eq("id", id)
        .single()

      if (error) {
        toast.error("Erro ao carregar cesta")
        return
      }

      setNome(data.nome)
      setDescricao(data.descricao)

      const normalizado = {}

      data.basket_items.forEach(i => {
        if (normalizado[i.produto_id]) {
          normalizado[i.produto_id].quantidade += i.quantidade
        } else {
          normalizado[i.produto_id] = {
            produto_id: i.produto_id,
            nome: i.products.nome,
            quantidade: i.quantidade,
          }
        }
      })

      setCarrinho(Object.values(normalizado))
    }

    carregar()
  }, [id])

  /* ================= BUSCA ================= */
  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  /* ================= CARRINHO ================= */
  function adicionar(produto) {
    setCarrinho(prev => {
      const existe = prev.find(i => i.produto_id === produto.id)
      if (existe) {
        return prev.map(i =>
          i.produto_id === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        )
      }
      return [
        ...prev,
        { produto_id: produto.id, nome: produto.nome, quantidade: 1 },
      ]
    })
  }

  function alterarQtd(produto_id, delta) {
    setCarrinho(prev =>
      prev
        .map(i =>
          i.produto_id === produto_id
            ? { ...i, quantidade: i.quantidade + delta }
            : i
        )
        .filter(i => i.quantidade > 0)
    )
  }

  function remover(produto_id) {
    setCarrinho(prev =>
      prev.filter(i => i.produto_id !== produto_id)
    )
  }

  /* ================= SALVAR ================= */
  async function salvarEdicao() {
    if (!nome.trim()) {
      toast.error("Informe o nome da cesta")
      return
    }

    if (carrinho.length === 0) {
      toast.error("A cesta precisa ter ao menos um item")
      return
    }

    setLoading(true)

    try {
      await supabase
        .from("baskets")
        .update({ nome, descricao })
        .eq("id", id)

      await supabase
        .from("basket_items")
        .delete()
        .eq("basket_id", id)

      const itens = carrinho.map(i => ({
        basket_id: id,
        produto_id: i.produto_id,
        quantidade: i.quantidade,
      }))

      await supabase.from("basket_items").insert(itens)

      toast.success("Cesta atualizada com sucesso")
      navigate("/admin/cestas")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao salvar alterações")
    }

    setLoading(false)
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
          Editar Cesta
        </h1>
        <p className="text-white/70 mt-1">
          Ajuste os itens e quantidades da cesta
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ESQUERDA */}
        <div>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full p-3 mb-3 rounded-xl text-black"
            placeholder="Nome da cesta"
          />

          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            className="w-full p-3 rounded-xl text-black"
            placeholder="Descrição"
          />

          <input
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full p-3 mt-6 rounded-xl text-black"
          />

          <div className="space-y-2 mt-4 max-h-80 overflow-auto">
            {produtosFiltrados.map(p => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-white text-black p-3 rounded-xl"
              >
                <span>{p.nome}</span>
                <button
                  onClick={() => adicionar(p)}
                  className="bg-primary text-white px-3 py-1 rounded-lg"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* DIREITA — CARRINHO */}
        <div className="bg-white/5 rounded-2xl p-5 flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            <Package />
            Itens da Cesta
          </h2>

          <p className="text-sm text-white/60 mb-4">
            {carrinho.length} itens •{" "}
            {carrinho.reduce((s, i) => s + i.quantidade, 0)} unidades
          </p>

          <div className="flex-1 space-y-3 overflow-auto pr-1">
            {carrinho.map(i => (
              <div
                key={i.produto_id}
                className="bg-white text-black rounded-xl p-3 flex justify-between items-center"
              >
                <span className="font-medium text-sm">
                  {i.nome}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alterarQtd(i.produto_id, -1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="w-6 text-center font-semibold">
                    {i.quantidade}
                  </span>

                  <button
                    onClick={() => alterarQtd(i.produto_id, 1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <Plus size={14} />
                  </button>

                  <button
                    onClick={() => remover(i.produto_id)}
                    className="text-red-600 ml-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={salvarEdicao}
            className="mt-5 w-full bg-green-600 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  )
}
