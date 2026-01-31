import { Plus, Minus, Check } from "lucide-react"
import { motion } from "framer-motion"

export default function ProductCard({ produto, quantidade, onAlterar }) {
  const adicionado = quantidade > 0
  const indisponivel = produto.quantidade <= 0

  return (
    <motion.div
      whileHover={!indisponivel ? { scale: 1.02 } : {}}
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
        <span
          className="
            absolute top-2 right-2 z-10
            bg-red-600 text-white
            text-[11px] font-bold
            px-2 py-1 rounded-full
          "
        >
          {quantidade} na cesta
        </span>
      )}

      {/* IMAGEM */}
      <div className="relative h-32 bg-gray-100 flex items-center justify-center">
        <img
          src={produto.image_url || "/sem-imagem.png"}
          alt={produto.nome}
          className={`
            h-full object-contain transition
            ${indisponivel ? "opacity-30" : adicionado ? "opacity-40" : "opacity-100"}
          `}
        />

        {/* OVERLAY INDISPONÍVEL */}
        {indisponivel && (
          <div className="
            absolute inset-0
            bg-black/40
            flex items-center justify-center
          ">
            <span className="
              text-white text-xs font-bold
              bg-black/60 px-3 py-1 rounded-full
            ">
              Indisponível
            </span>
          </div>
        )}
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
              disabled={quantidade === 0}
              className="
                w-7 h-7 rounded-full bg-gray-200 text-sm
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              −
            </button>

            <span className="text-sm font-semibold">
              {quantidade}
            </span>

            <button
              onClick={() => onAlterar(produto, 1)}
              disabled={indisponivel}
              className="
                w-7 h-7 rounded-full bg-gray-200 text-sm
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              +
            </button>
          </div>

          <button
            onClick={() => onAlterar(produto, 1)}
            disabled={indisponivel}
            className={`
              flex items-center gap-1
              px-3 py-1.5 rounded-lg
              text-xs font-medium
              transition
              ${
                indisponivel
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : adicionado
                  ? "bg-green-600 text-white"
                  : "bg-primary text-white"
              }
            `}
          >
            <Check size={14} />
            {indisponivel
              ? "Indisponível"
              : adicionado
              ? "Adicionado"
              : "Add"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
