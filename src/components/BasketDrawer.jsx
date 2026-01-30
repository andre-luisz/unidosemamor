import { X, Plus, Minus, Trash2, ShoppingBasket } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function BasketDrawer({
  aberto,
  onClose,
  carrinho,
  descricao,
  setDescricao,
  onEnviar,
  enviando,
  onAlterarQtd,
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <>
          {/* BACKDROP (desktop e quando possível no mobile) */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* DRAWER */}
          <motion.aside
            className="
              fixed right-0 top-0 h-full
              w-full sm:w-[420px]
              bg-white z-50
              flex flex-col
            "
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
          >
            {/* HEADER FIXO */}
            <div className="
              sticky top-0 z-10
              bg-white
              px-6 py-4
              border-b
              flex items-center justify-between
            ">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBasket className="text-primary" size={20} />
                Minha Cesta
              </h2>

              {/* BOTÃO FECHAR (MOBILE FRIENDLY) */}
              <button
                onClick={onClose}
                className="
                  w-10 h-10
                  flex items-center justify-center
                  rounded-full
                  bg-gray-100
                  hover:bg-gray-200
                "
                aria-label="Fechar cesta"
              >
                <X size={22} />
              </button>
            </div>

            {/* ITENS */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
              {Object.values(carrinho).length === 0 && (
                <p className="text-gray-500 text-sm">
                  Nenhum item adicionado
                </p>
              )}

              {Object.values(carrinho).map(i => (
                <div
                  key={i.produto.id}
                  className="
                    flex items-center gap-4
                    border rounded-xl
                    px-4 py-3
                  "
                >
                  {/* IMAGEM */}
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img
                      src={i.produto.image_url || "/sem-imagem.png"}
                      alt={i.produto.nome}
                      className="h-full object-contain"
                    />
                  </div>

                  {/* NOME */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {i.produto.nome}
                    </p>
                  </div>

                  {/* CONTROLES */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAlterarQtd(i.produto, -1)}
                      className="
                        w-8 h-8
                        flex items-center justify-center
                        rounded-full
                        bg-gray-200
                        hover:bg-gray-300
                      "
                    >
                      <Minus size={14} />
                    </button>

                    <span className="w-5 text-center text-gray-700 font-semibold">
                      {i.quantidade}
                    </span>

                    <button
                      onClick={() => onAlterarQtd(i.produto, 1)}
                      className="
                        w-8 h-8
                        flex items-center justify-center
                        rounded-full
                        bg-gray-200
                        hover:bg-gray-300
                      "
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* REMOVER */}
                  <button
                    onClick={() =>
                      onAlterarQtd(i.produto, -i.quantidade)
                    }
                    className="
                      text-gray-400
                      hover:text-red-600
                    "
                    aria-label="Remover item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* RODAPÉ FIXO */}
            <div className="px-6 py-4 border-t bg-white">
              <textarea
                placeholder="Para quem é essa cesta?"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                className="
                  w-full border rounded-xl
                  p-3 text-sm text-gray-700
                  focus:ring-2 focus:ring-primary
                "
              />

              <button
                onClick={onEnviar}
                disabled={enviando}
                className="
                  mt-4 w-full
                  bg-green-600
                  text-white py-3
                  rounded-xl font-semibold
                  disabled:opacity-50
                "
              >
                {enviando ? "Enviando..." : "Finalizar Solicitação"}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
