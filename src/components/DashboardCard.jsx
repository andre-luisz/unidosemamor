import { Link } from "react-router-dom"
import { motion } from "framer-motion"

export default function DashboardCard({
  to,
  title,
  description,
  icon: Icon,
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link
        to={to}
        className="
          block bg-white text-black
          p-6 rounded-3xl
          shadow-md hover:shadow-xl
          transition-all
          h-full
        "
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="
            bg-primary/10
            p-3 rounded-2xl
            text-primary
          ">
            <Icon size={26} />
          </div>

          <h2 className="text-lg font-bold">
            {title}
          </h2>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      </Link>
    </motion.div>
  )
}
