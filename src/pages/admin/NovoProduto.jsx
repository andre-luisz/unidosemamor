import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"
import FormProduto from "../../components/produtos/FormProduto"

export default function NovoProduto() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

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

  async function handleCreate(dados) {
    try {
      setLoading(true)

      let imageUrl = null

      if (dados.imagemFile) {
        imageUrl = await uploadImagem(dados.imagemFile)
      }

      const { error } = await supabase.from("products").insert({
        nome: dados.nome,
        descricao: dados.descricao,
        quantidade: dados.quantidade,
        image_url: imageUrl
      })

      if (error) throw error

      alert("Produto cadastrado com sucesso!")
      navigate("/admin/produtos")
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar produto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <FormProduto onSubmit={handleCreate} loading={loading} />
    </div>
  )
}
