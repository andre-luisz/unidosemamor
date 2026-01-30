import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../../services/supabase"
import FormProduto from "../../components/produtos/FormProduto"

export default function EditarProduto() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [produto, setProduto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 🔎 Buscar produto pelo ID
  useEffect(() => {
    async function carregarProduto() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !data) {
        alert("Produto não encontrado")
        navigate("/admin/produtos")
        return
      }

      setProduto(data)
      setLoading(false)
    }

    carregarProduto()
  }, [id, navigate])

  async function uploadImagem(file) {
    const fileExt = file.name.split(".").pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, file)

    if (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      throw error
    }

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // 💾 Atualizar produto
  async function handleUpdate(dados) {
    try {
      setSaving(true)

      let imageUrl = produto.image_url

      // Se trocou a imagem
      if (dados.imagemFile) {
        imageUrl = await uploadImagem(dados.imagemFile)
      }

      const { error } = await supabase
        .from("products")
        .update({
          nome: dados.nome,
          descricao: dados.descricao,
          quantidade: dados.quantidade,
          image_url: imageUrl
        })
        .eq("id", produto.id)

      if (error) throw error

      alert("Produto atualizado com sucesso!")
      navigate("/admin/produtos")
    } catch (err) {
      console.error(err)
      alert("Erro ao atualizar produto")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-white">
        Carregando produto...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <FormProduto
        initialData={produto}
        onSubmit={handleUpdate}
        loading={saving}
      />
    </div>
  )
}
