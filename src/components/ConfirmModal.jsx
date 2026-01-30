import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle } from "lucide-react"

export default function ConfirmModal({
  aberto,
  onClose,
  onConfirm,
  titulo,
  descricao,
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* MODAL */}
          <motion.div
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              px-4
            "
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="
              bg-white text-black
              w-full max-w-md
              rounded-2xl p-6
              shadow-xl
            ">
              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  {titulo}
                </h2>
                <button onClick={onClose}>
                  <X />
                </button>
              </div>

              {/* CONTEÚDO */}
              <p className="text-sm text-gray-600 mb-6">
                {descricao}
              </p>

              {/* AÇÕES */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="
                    px-4 py-2 rounded-xl
                    bg-gray-100
                    hover:bg-gray-200
                  "
                >
                  Cancelar
                </button>

                <button
                  onClick={onConfirm}
                  className="
                    px-4 py-2 rounded-xl
                    bg-primary text-white
                    font-semibold
                    flex items-center gap-1
                  "
                >
                  <CheckCircle size={18} />
                  Confirmar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
