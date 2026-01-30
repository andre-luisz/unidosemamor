import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Package,
  Plus,
  Minus,
  Trash2,
  ShoppingBasket,
  Edit,
} from "lucide-react"
import { motion } from "framer-motion"

export default function Cestas() {
  const navigate = useNavigate()

  /* FORM */
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")

  /* PRODUTOS */
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState("")

  /* CARRINHO */
  const [carrinho, setCarrinho] = useState([])

  /* LISTAGEM */
  const [cestas, setCestas] = useState([])
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

  /* ================= CESTAS ================= */
  async function carregarCestas() {
    const { data, error } = await supabase
      .from("baskets")
      .select(`
        id,
        nome,
        descricao,
        created_at,
        basket_items (
          id,
          quantidade,
          products ( nome )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar cestas")
      return
    }

    setCestas(data || [])
  }

  useEffect(() => {
    carregarCestas()
  }, [])

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
        {
          produto_id: produto.id,
          nome: produto.nome,
          quantidade: 1,
        },
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
  async function salvarCesta() {
    if (!nome.trim()) {
      toast.error("Informe o nome da cesta")
      return
    }

    if (carrinho.length === 0) {
      toast.error("Adicione pelo menos um item")
      return
    }

    setLoading(true)

    const { data: cesta, error } = await supabase
      .from("baskets")
      .insert({
        nome,
        descricao,
        ativa: true,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    const itens = carrinho.map(i => ({
      basket_id: cesta.id,
      produto_id: i.produto_id,
      quantidade: i.quantidade,
    }))

    const { error: erroItens } = await supabase
      .from("basket_items")
      .insert(itens)

    if (erroItens) {
      toast.error(erroItens.message)
      setLoading(false)
      return
    }

    toast.success("Cesta criada com sucesso")

    setNome("")
    setDescricao("")
    setCarrinho([])
    setLoading(false)
    carregarCestas()
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
          Cadastrar Cesta
        </h1>
        <p className="text-white/70 mt-1">
          Monte cestas personalizadas para distribuição
        </p>
      </motion.div>

      {/* FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* ESQUERDA */}
        <div>
          <input
            placeholder="Nome da cesta"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full p-3 mb-3 rounded-xl text-black"
          />

          <textarea
            placeholder="Descrição"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            className="w-full p-3 rounded-xl text-black"
          />

          {/* BUSCA */}
          <input
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full p-3 mt-6 rounded-xl text-black"
          />

          {/* PRODUTOS */}
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

        {/* DIREITA */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Package />
            Itens da Cesta
          </h2>

          {carrinho.length === 0 && (
            <p className="text-white/50">
              Nenhum item adicionado
            </p>
          )}

          <div className="space-y-2">
            {carrinho.map(i => (
              <div
                key={i.produto_id}
                className="bg-white text-black p-3 rounded-xl flex justify-between items-center"
              >
                <span className="font-medium">
                  {i.nome}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      alterarQtd(i.produto_id, -1)
                    }
                  >
                    <Minus size={16} />
                  </button>

                  <span>{i.quantidade}</span>

                  <button
                    onClick={() =>
                      alterarQtd(i.produto_id, 1)
                    }
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() =>
                      remover(i.produto_id)
                    }
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={salvarCesta}
            className="mt-6 w-full bg-green-600 py-3 rounded-xl font-semibold"
          >
            {loading ? "Salvando..." : "Salvar Cesta"}
          </button>
        </div>
      </div>

      {/* LISTAGEM */}
      <h2 className="text-2xl font-bold mb-4">
        Cestas Cadastradas
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cestas.map(c => (
          <motion.div
            key={c.id}
            whileHover={{ y: -3 }}
            className="bg-white text-black rounded-2xl p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <strong>{c.nome}</strong>
                <p className="text-sm text-gray-600">
                  {c.descricao}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(`/admin/cestas/${c.id}/editar`)
                }
                className="text-blue-600"
              >
                <Edit size={18} />
              </button>
            </div>

            <ul className="text-sm list-disc ml-5">
              {c.basket_items.map(item => (
                <li key={item.id}>
                  {item.products?.nome} —{" "}
                  {item.quantidade}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
