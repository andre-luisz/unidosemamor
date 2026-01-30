import { ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"

export default function FloatingBagButton({ totalItens, onClick }) {
  if (totalItens === 0) return null

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-50
        bg-primary text-white
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-xl
      "
    >
      <ShoppingBag />
      <span
        className="
          absolute -top-1 -right-1
          bg-red-600 text-xs
          w-6 h-6 rounded-full
          flex items-center justify-center
        "
      >
        {totalItens}
      </span>
    </motion.button>
  )
}
