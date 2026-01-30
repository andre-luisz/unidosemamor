import { useEffect, useState } from "react"
import { supabase } from "../../services/supabase"
import { toast } from "sonner"
import { Package, User, Calendar } from "lucide-react"

export default function HistoricoCestas() {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)

    const { data, error } = await supabase
      .from("basket_mounts")
      .select(`
        id,
        quantidade,
        descricao,
        created_at,
        baskets (
          nome
        ),
        profiles (
          nome
        ),
        basket_mount_items (
          quantidade,
          products (
            nome
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar histórico de cestas")
      setLoading(false)
      return
    }

    setHistorico(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-white">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Package />
          Histórico de Montagem de Cestas
        </h1>
        <p className="text-sm text-zinc-300 mt-1">
          Registros de todas as cestas montadas
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-zinc-300">
          Carregando histórico...
        </div>
      )}

      {/* EMPTY */}
      {!loading && historico.length === 0 && (
        <div className="bg-zinc-800 text-zinc-300 p-6 rounded-xl text-center">
          Nenhum registro encontrado
        </div>
      )}

      {/* LISTA */}
      <div className="space-y-4">
        {!loading &&
          historico.map(h => (
            <div
              key={h.id}
              className="bg-white text-black p-5 rounded-2xl shadow space-y-4"
            >
              {/* DADOS PRINCIPAIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <p>
                  <strong>Cesta:</strong>{" "}
                  {h.baskets?.nome || "—"}
                </p>

                <p>
                  <strong>Quantidade montada:</strong>{" "}
                  {h.quantidade}
                </p>

                <p className="flex items-center gap-1">
                  <User size={16} />
                  <strong>Usuário:</strong>{" "}
                  {h.profiles?.nome || "—"}
                </p>

                <p className="flex items-center gap-1">
                  <Calendar size={16} />
                  <strong>Data:</strong>{" "}
                  {new Date(h.created_at).toLocaleString()}
                </p>
              </div>

              {/* DESCRIÇÃO */}
              {h.descricao && (
                <div className="bg-zinc-100 p-3 rounded-xl text-sm">
                  <strong>Descrição:</strong>
                  <p className="mt-1">{h.descricao}</p>
                </div>
              )}

              {/* ITENS */}
              <div>
                <strong>Itens da Cesta:</strong>

                <ul className="mt-2 space-y-1 text-sm">
                  {h.basket_mount_items.map((item, index) => (
                    <li
                      key={`${h.id}-${index}`}
                      className="flex justify-between border-b pb-1"
                    >
                      <span>
                        {item.products?.nome || "—"}
                      </span>
                      <span className="font-semibold">
                        {item.quantidade}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
