import { useEffect, useState } from "react"
import { Image } from "lucide-react"

export default function FormProduto({
  initialData = null,
  onSubmit,
  loading = false
}) {
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [quantidade, setQuantidade] = useState(0)
  const [imagemFile, setImagemFile] = useState(null)
  const [imagemPreview, setImagemPreview] = useState(null)

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome || "")
      setDescricao(initialData.descricao || "")
      setQuantidade(initialData.quantidade || 0)
      setImagemPreview(initialData.image_url || null)
    }
  }, [initialData])

  function handleImagemChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setImagemFile(file)
    setImagemPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e) {
    e.preventDefault()

    onSubmit({
      nome,
      descricao,
      quantidade: Number(quantidade),
      imagemFile
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white text-black rounded-2xl p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold mb-6">
        {initialData ? "Editar Produto" : "Novo Produto"}
      </h2>

      <div className="space-y-4">
        <input
          placeholder="Nome do produto"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
          className="w-full p-3 border rounded-lg"
        />

        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          rows={3}
          className="w-full p-3 border rounded-lg"
        />

        <input
          type="number"
          min="0"
          placeholder="Quantidade"
          value={quantidade}
          onChange={e => setQuantidade(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />

        <div>
          {imagemPreview && (
            <img
              src={imagemPreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg mb-3"
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Image size={18} />
            <span>Selecionar imagem</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImagemChange}
              hidden
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="
          mt-6 w-full
          bg-primary text-white
          py-3 rounded-xl
          font-semibold
          disabled:opacity-50
        "
      >
        {loading ? "Salvando..." : "Salvar Produto"}
      </button>
    </form>
  )
}
