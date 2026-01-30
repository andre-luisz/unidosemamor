import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { toast } from "sonner"
import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Save,
  ClipboardEdit,
} from "lucide-react"
import { motion } from "framer-motion"

export default function MovimentoProduto() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [produtos, setProdutos] = useState([])
  const [produtoId, setProdutoId] = useState("")
  const [tipo, setTipo] = useState("entrada")
  const [quantidade, setQuantidade] = useState(1)
  const [motivo, setMotivo] = useState("")
  const [observacao, setObservacao] = useState("")
  const [loading, setLoading] = useState(false)

  /* ================= PRODUTOS ================= */
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("products")
        .select("id, nome, quantidade")
        .order("nome")

      if (error) {
        toast.error("Erro ao carregar produtos")
      } else {
        setProdutos(data || [])
      }
    }

    carregarProdutos()
  }, [])

  /* ================= SUBMIT ================= */
  async function handleSubmit(e) {
    e.preventDefault()

    if (!produtoId || !motivo || quantidade <= 0) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      setLoading(true)

      // Buscar estoque atual
      const { data: produto, error } = await supabase
        .from("products")
        .select("quantidade, nome")
        .eq("id", produtoId)
        .single()

      if (error || !produto) {
        toast.error("Produto não encontrado")
        return
      }

      const novaQuantidade =
        tipo === "entrada"
          ? produto.quantidade + Number(quantidade)
          : produto.quantidade - Number(quantidade)

      if (novaQuantidade < 0) {
        toast.error("Estoque insuficiente para saída")
        return
      }

      // Registrar movimento
      await supabase.from("product_movements").insert({
        product_id: produtoId,
        user_id: user.id,
        tipo,
        quantidade,
        motivo,
        observacao,
      })

      // Atualizar estoque
      await supabase
        .from("products")
        .update({ quantidade: novaQuantidade })
        .eq("id", produtoId)

      toast.success("Movimento registrado com sucesso", {
        description: `${produto.nome} agora possui ${novaQuantidade} unidades.`,
      })

      navigate("/admin/estoque")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao registrar movimento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-white">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardEdit className="text-primary" />
          Movimento de Produto
        </h1>

        <p className="text-white/70 max-w-xl mt-2">
          Registre entradas e saídas de estoque com segurança
          e histórico completo.
        </p>
      </motion.div>

      {/* FORM */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="
          bg-white text-black
          rounded-2xl p-6
          space-y-4
        "
      >
        {/* PRODUTO */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Produto
          </label>
          <select
            value={produtoId}
            onChange={e => setProdutoId(e.target.value)}
            className="w-full p-3 rounded-lg border"
            required
          >
            <option value="">Selecione o produto</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome} (estoque: {p.quantidade})
              </option>
            ))}
          </select>
        </div>

        {/* TIPO */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Tipo de Movimento
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo("entrada")}
              className={`
                flex items-center justify-center gap-2
                p-3 rounded-xl border font-medium
                ${
                  tipo === "entrada"
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-gray-50"
                }
              `}
            >
              <ArrowUpCircle size={18} />
              Entrada
            </button>

            <button
              type="button"
              onClick={() => setTipo("saida")}
              className={`
                flex items-center justify-center gap-2
                p-3 rounded-xl border font-medium
                ${
                  tipo === "saida"
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "bg-gray-50"
                }
              `}
            >
              <ArrowDownCircle size={18} />
              Saída
            </button>
          </div>
        </div>

        {/* QUANTIDADE */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Quantidade
          </label>
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
            className="w-full p-3 rounded-lg border"
            required
          />
        </div>

        {/* MOTIVO */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Motivo
          </label>
          <input
            type="text"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ex: Doação, Cesta Básica, Ajuste"
            className="w-full p-3 rounded-lg border"
            required
          />
        </div>

        {/* OBSERVAÇÃO */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Observação (opcional)
          </label>
          <textarea
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg border"
          />
        </div>

        {/* BOTÃO */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full mt-4
            bg-primary text-white
            py-3 rounded-xl
            font-semibold
            flex items-center justify-center gap-2
            disabled:opacity-50
          "
        >
          <Save size={18} />
          {loading ? "Salvando..." : "Registrar Movimento"}
        </button>
      </motion.form>
    </div>
  )
}
