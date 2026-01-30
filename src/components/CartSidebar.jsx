import { ShoppingBasket } from "lucide-react"

export default function CartSidebar({
  carrinho,
  descricao,
  setDescricao,
  onEnviar,
  enviando,
}) {
  return (
    <div className="sticky top-24 bg-white text-black rounded-3xl p-6 shadow-xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ShoppingBasket className="text-primary" />
        Minha Cesta
      </h2>

      {Object.values(carrinho).length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhum item adicionado
        </p>
      )}

      <div className="space-y-1 text-sm">
        {Object.values(carrinho).map(i => (
          <div
            key={i.produto.id}
            className="flex justify-between"
          >
            <span>{i.produto.nome}</span>
            <span>{i.quantidade}</span>
          </div>
        ))}
      </div>

      <textarea
        placeholder="Para quem é essa cesta?"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
        className="
          w-full border rounded-xl
          p-3 text-sm mt-4
          focus:outline-none focus:ring-2 focus:ring-primary
        "
      />

      <button
        onClick={onEnviar}
        disabled={enviando}
        className="
          w-full mt-4
          bg-green-600 text-white
          py-3 rounded-xl
          font-semibold
          hover:opacity-90
          disabled:opacity-50
        "
      >
        {enviando ? "Enviando..." : "Solicitar Retirada"}
      </button>
    </div>
  )
}
