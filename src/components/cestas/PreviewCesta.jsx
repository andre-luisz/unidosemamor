import { X, CheckCircle, XCircle, Package } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function PreviewCesta({
  aberto,
  onClose,
  itens,
  onConfirmar
}) {
  if (!aberto) return null

  const temErro = itens.some(
    i => i.estoque_atual < i.total
  )

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white text-black w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Package />
              Preview da Cesta
            </h2>

            <button
              onClick={onClose}
              className="hover:text-red-600"
            >
              <X size={22} />
            </button>
          </div>

          {/* BODY */}
          <div className="overflow-y-auto">
            {/* DESKTOP */}
            <div className="hidden md:block p-5">
              <table className="w-full border rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Produto</th>
                    <th className="p-2 text-center">Por Cesta</th>
                    <th className="p-2 text-center">Total</th>
                    <th className="p-2 text-center">Estoque</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map(item => {
                    const ok = item.estoque_atual >= item.total

                    return (
                      <tr key={item.produto_id} className="border-t">
                        <td className="p-2 font-medium">
                          {item.nome}
                        </td>
                        <td className="p-2 text-center">
                          {item.por_cesta}
                        </td>
                        <td className="p-2 text-center">
                          {item.total}
                        </td>
                        <td className="p-2 text-center">
                          {item.estoque_atual}
                        </td>
                        <td className="p-2 text-center">
                          {ok ? (
                            <CheckCircle className="text-green-600 inline" />
                          ) : (
                            <XCircle className="text-red-600 inline" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="md:hidden p-5 space-y-3">
              {itens.map(item => {
                const ok = item.estoque_atual >= item.total

                return (
                  <div
                    key={item.produto_id}
                    className={`border rounded-xl p-3 ${
                      ok
                        ? "border-green-300"
                        : "border-red-300"
                    }`}
                  >
                    <strong>{item.nome}</strong>
                    <p className="text-sm mt-1">Por cesta: {item.por_cesta}</p>
                    <p className="text-sm">Total: {item.total}</p>
                    <p className="text-sm">Estoque: {item.estoque_atual}</p>

                    <p
                      className={`mt-2 text-sm font-semibold ${
                        ok ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {ok
                        ? "✅ Estoque suficiente"
                        : "❌ Estoque insuficiente"}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ALERTA */}
          {temErro && (
            <div className="bg-red-50 text-red-700 px-5 py-3 text-sm font-semibold">
              ❌ Um ou mais itens não possuem estoque suficiente
            </div>
          )}

          {/* FOOTER */}
          <div className="p-4 border-t">
            <button
              onClick={onConfirmar}
              disabled={temErro}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              Confirmar Montagem
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
