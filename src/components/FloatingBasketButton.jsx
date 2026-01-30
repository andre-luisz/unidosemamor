import { ShoppingBasket } from "lucide-react"
import { motion } from "framer-motion"

export default function FloatingBasketButton({ totalItens, onClick }) {
  if (totalItens === 0) return null

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="
        fixed bottom-6 right-6 z-50
        bg-primary text-white
        w-16 h-16 rounded-full
        shadow-xl
        flex items-center justify-center
      "
    >
      <ShoppingBasket size={26} />
      <span className="
        absolute -top-1 -right-1
        bg-red-600 text-white
        text-xs font-bold
        w-6 h-6 rounded-full
        flex items-center justify-center
      ">
        {totalItens}
      </span>
    </motion.button>
  )
}
