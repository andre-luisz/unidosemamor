import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { motion } from "framer-motion"

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      <Navbar />

      <motion.main
        className="flex-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.main>

      <Footer />
    </div>
  )
}
