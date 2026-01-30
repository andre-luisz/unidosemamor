import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { toast } from "sonner"
import { Link } from "react-router-dom"
import { History, } from "lucide-react"
import PreviewCesta from "../../components/cestas/PreviewCesta"

export default function MontarCesta() {
  const [cestas, setCestas] = useState([])
  const [cestaSelecionada, setCestaSelecionada] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [descricao, setDescricao] = useState("")

  const [preview, setPreview] = useState([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [abrirPreview, setAbrirPreview] = useState(false)

  /* ================= CARREGAR CESTAS ================= */
  useEffect(() => {
    async function carregarCestas() {
      const { data, error } = await supabase
        .from("baskets")
        .select("id, nome")
        .eq("ativa", true)
        .order("nome")

      if (error) {
        toast.error("Erro ao carregar cestas")
        return
      }

      setCestas(data || [])
    }

    carregarCestas()
  }, [])

  /* ================= GERAR PREVIEW ================= */
  async function gerarPreview() {
    if (!cestaSelecionada || quantidade <= 0) {
      toast.warning("Selecione a cesta e informe a quantidade")
      return
    }

    setLoadingPreview(true)

    const { data, error } = await supabase
      .from("basket_items")
      .select(`
        produto_id,
        quantidade,
        products ( nome, quantidade )
      `)
      .eq("basket_id", cestaSelecionada)

    if (error) {
      toast.error("Erro ao gerar o preview da cesta")
      setLoadingPreview(false)
      return
    }

    const resultado = data.map(item => {
      const total = item.quantidade * quantidade

      return {
        produto_id: item.produto_id,
        nome: item.products.nome,
        por_cesta: item.quantidade,
        total,
        estoque_atual: item.products.quantidade,
        ok: item.products.quantidade >= total
      }
    })

    setPreview(resultado)
    setAbrirPreview(true)
    setLoadingPreview(false)
  }

  /* ================= CONFIRMAR MONTAGEM ================= */
  async function confirmarMontagem() {
    if (!descricao.trim()) {
      toast.warning("Informe a descrição da montagem")
      return
    }

    if (preview.some(p => !p.ok)) {
      toast.error("Existe item sem estoque suficiente")
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user.id

    const { error } = await supabase.rpc("montar_cesta", {
      p_basket_id: cestaSelecionada,
      p_quantidade: quantidade,
      p_user_id: userId,
      p_descricao: descricao
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("Cestas montadas com sucesso!")
    setPreview([])
    setDescricao("")
    setAbrirPreview(false)
  }

  /* ================= RENDER ================= */
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-white">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Montar Cestas
        </h1>

        <Link
          to="/admin/cestas/historico"
          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <History size={18} />
          Histórico de Cestas
        </Link>
      </div>

      {/* FORM */}
      <div className="bg-white text-black p-6 rounded-2xl shadow space-y-4">
        <select
          className="w-full p-3 border rounded-xl"
          value={cestaSelecionada}
          onChange={e => setCestaSelecionada(e.target.value)}
        >
          <option value="">Selecione a cesta</option>
          {cestas.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          value={quantidade}
          onChange={e => setQuantidade(Number(e.target.value))}
          className="w-full p-3 border rounded-xl"
          placeholder="Quantidade de cestas"
        />

        <textarea
          placeholder="Descrição (ex: Família João - Bairro Centro)"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          className="w-full p-3 border rounded-xl"
        />

        <button
          onClick={gerarPreview}
          disabled={loadingPreview}
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loadingPreview ? "Gerando Pre-Visualização..." : "Pre-Visualização"}
        </button>
      </div>

      {/* MODAL PREVIEW */}
      <PreviewCesta
        aberto={abrirPreview}
        onClose={() => setAbrirPreview(false)}
        itens={preview}
        onConfirmar={confirmarMontagem}
      />
    </div>
  )
}
