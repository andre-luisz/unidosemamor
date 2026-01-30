import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function AdminCard({
  to,
  title,
  icon: Icon,
  danger = false,
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260 }}
    >
      <Link
        to={to}
        className={`
          group block
          bg-white text-black
          p-6 rounded-3xl
          shadow-md hover:shadow-xl
          transition-all h-full
          ${danger ? "border-l-4 border-red-500" : "border-l-4 border-primary"}
        `}
      >
        <div className="flex items-center gap-4">
          <div className={`
            p-3 rounded-2xl
            ${danger ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}
          `}>
            <Icon size={26} />
          </div>

          <h2 className="text-lg font-bold">
            {title}
          </h2>
        </div>
      </Link>
    </motion.div>
  )
}
