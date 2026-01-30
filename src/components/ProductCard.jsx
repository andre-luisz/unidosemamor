import { Plus, Minus, Check } from "lucide-react"
import { motion } from "framer-motion"

export default function ProductCard({ produto, quantidade, onAlterar }) {
  const adicionado = quantidade > 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="
        relative w-full
        bg-white text-black
        rounded-2xl
        border border-transparent
        hover:border-red-400
        hover:shadow-lg
        transition-all
        overflow-hidden
      "
    >
      {/* BADGE */}
      {adicionado && (
        <span className="
          absolute top-2 right-2 z-10
          bg-red-600 text-white
          text-[11px] font-bold
          px-2 py-1 rounded-full
        ">
          {quantidade} na cesta
        </span>
      )}

      {/* IMAGEM */}
      <div className="h-32 bg-gray-100 flex items-center justify-center">
        <img
          src={produto.image_url || "/sem-imagem.png"}
          alt={produto.nome}
          className={`
            h-full object-contain transition
            ${adicionado ? "opacity-40" : "opacity-100"}
          `}
        />
      </div>

      {/* CONTEÚDO */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-semibold leading-tight">
          {produto.nome}
        </h3>

        <p className="text-xs text-gray-500">
          Estoque: {produto.quantidade}
        </p>

        {/* CONTROLES */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAlterar(produto, -1)}
              className="w-7 h-7 rounded-full bg-gray-200 text-sm"
            >
              −
            </button>

            <span className="text-sm font-semibold">
              {quantidade}
            </span>

            <button
              onClick={() => onAlterar(produto, 1)}
              className="w-7 h-7 rounded-full bg-gray-200 text-sm"
            >
              +
            </button>
          </div>

          <button
            onClick={() => onAlterar(produto, 1)}
            className={`
              flex items-center gap-1
              px-3 py-1.5 rounded-lg
              text-xs font-medium
              ${
                adicionado
                  ? "bg-green-600 text-white"
                  : "bg-primary text-white"
              }
            `}
          >
            <Check size={14} />
            {adicionado ? "Adicionado" : "Add"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
