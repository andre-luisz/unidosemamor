import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function DonationDrawer({
  aberto,
  onClose,
  carrinho,
  onRemover,
  onAlterarQtd,
  onConfirmar,
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* DRAWER */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="
              fixed right-0 top-0 h-full
              w-full sm:w-[420px]
              bg-white z-50
              p-6 flex flex-col
            "
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="text-primary" size={20} />
                Sacola de Doação
              </h2>

              <button onClick={onClose}>
                <X />
              </button>
            </div>

            {/* ITENS */}
            <div className="flex-1 overflow-auto space-y-3">
              {carrinho.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Nenhum item adicionado
                </p>
              )}

              {carrinho.map(item => (
                <div
                  key={item.id}
                  className="
                    flex items-center gap-3
                    border rounded-xl
                    px-4 py-3
                  "
                >
                  {/* IMAGEM */}
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img
                      src={item.image_url || "/sem-imagem.png"}
                      alt={item.nome}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* INFO */}
                  <div className="flex-1">
                    <p className="text-gray-500 font-medium">
                      {item.nome}
                    </p>
                  </div>

                  {/* CONTROLES */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onAlterarQtd(item.id, -1)
                      }
                      className="
                        w-8 h-8 rounded-full
                        bg-gray-200
                        flex items-center justify-center
                      "
                    >
                      <Minus size={14} />
                    </button>

                    <span className="w-5 text-center text-gray-500 font-semibold">
                      {item.quantidade}
                    </span>

                    <button
                      onClick={() =>
                        onAlterarQtd(item.id, 1)
                      }
                      className="
                        w-8 h-8 rounded-full
                        bg-gray-200
                        flex items-center justify-center
                      "
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* REMOVER */}
                  <button
                    onClick={() => onRemover(item.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* FINALIZAR */}
            <button
              onClick={onConfirmar}
              className="
                mt-4 bg-green-600
                text-white py-3
                rounded-xl font-semibold
              "
            >
              Confirmar Doação
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
