import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function ActionButton({
  to,
  label,
  icon: Icon,
  variant = "primary",
}) {
  const variants = {
    primary: "bg-primary text-white",
    support: "bg-support text-white",
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
      <Link
        to={to}
        className={`
          ${variants[variant]}
          flex items-center gap-3
          px-8 py-4
          rounded-2xl
          font-semibold
          shadow-lg
          transition-all
          hover:shadow-xl
        `}
      >
        <Icon size={20} />
        {label}
      </Link>
    </motion.div>
  )
}
