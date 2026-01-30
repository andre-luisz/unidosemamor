import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"
import { toast } from "sonner"
import {
  Search,
  Package,
  Pencil,
  PackagePlus
} from "lucide-react"
import { motion } from "framer-motion"

export default function Produtos() {
  const navigate = useNavigate()

  const [produtos, setProdutos] = useState([])
  const [filtro, setFiltro] = useState("")
  const [loading, setLoading] = useState(true)

  async function carregarProdutos() {
    setLoading(true)

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar produtos")
    } else {
      setProdutos(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="text-primary" />
          Produtos
        </h1>

        <button
          onClick={() => navigate("/admin/produtos/novo")}
          className="
            bg-primary px-5 py-2
            rounded-xl font-semibold
            flex items-center gap-2
            hover:opacity-90
          "
        >
          <PackagePlus size={18} />
          Novo Produto
        </button>
      </motion.div>

      {/* BUSCA */}
      <div className="relative max-w-sm mb-6">
        <Search
          size={18}
          className="absolute left-3 top-3 text-gray-400"
        />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="
            w-full pl-10 pr-4 py-2
            rounded-xl text-black
            focus:ring-2 focus:ring-primary
          "
        />
      </div>

      {/* ESTADOS */}
      {loading && (
        <p className="text-white/70">
          Carregando produtos...
        </p>
      )}

      {!loading && produtosFiltrados.length === 0 && (
        <p className="text-white/70">
          Nenhum produto encontrado.
        </p>
      )}

      {/* TABELA (DESKTOP) */}
      <div className="hidden md:block bg-white rounded-2xl text-black overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-4 text-left">Produto</th>
              <th className="p-4">Quantidade</th>
              <th className="p-4">Criado em</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map(produto => (
              <tr
                key={produto.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-4 flex items-center gap-3">
                  <img
                    src={produto.image_url || "/sem-imagem.png"}
                    alt={produto.nome}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                  />
                  <span className="font-medium">
                    {produto.nome}
                  </span>
                </td>

                <td className="p-4 text-center">
                  {produto.quantidade ?? 0}
                </td>

                <td className="p-4 text-sm text-gray-500">
                  {new Date(produto.created_at).toLocaleDateString()}
                </td>

                <td className="p-4 text-center">
                  <button
                    onClick={() =>
                      navigate(`/admin/produtos/${produto.id}/editar`)
                    }
                    className="
                      inline-flex items-center gap-1
                      text-primary font-medium
                      hover:underline
                    "
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CARDS (MOBILE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {produtosFiltrados.map(produto => (
          <motion.div
            key={produto.id}
            whileHover={{ y: -3 }}
            className="
              bg-white text-black
              rounded-2xl p-4
            "
          >
            <div className="flex gap-3">
              <img
                src={produto.image_url || "/sem-imagem.png"}
                alt={produto.nome}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />

              <div className="flex-1">
                <h3 className="font-bold">
                  {produto.nome}
                </h3>
                <p className="text-sm text-gray-500">
                  Estoque: {produto.quantidade ?? 0}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/admin/produtos/${produto.id}/editar`)
              }
              className="
                mt-4 w-full
                bg-primary text-white
                py-2 rounded-xl
                font-semibold
              "
            >
              Editar Produto
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
