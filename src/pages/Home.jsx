import { HeartHandshake, HandHelping } from "lucide-react"
import { motion } from "framer-motion"
import ActionButton from "../components/ActionButton"
import logo from "../assets/logo.png"

export default function Home() {
  return (
    <section className="
      min-h-screen
      flex items-center justify-center
      bg-gradient-to-b from-background via-background to-black
      px-6
    ">
      <div className="max-w-4xl text-center">

        {/* LOGO */}
        <motion.img
          src={logo}
          alt="Unidos em Amor"
          className="mx-auto w-28 md:w-36 mb-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* TÍTULO */}
        <motion.h1
          className="
            text-4xl md:text-5xl lg:text-6xl
            font-bold
            text-secondary
            leading-tight
          "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Um mercado diferente,
          <span className="block text-primary">feito com amor</span>
        </motion.h1>

        {/* DESCRIÇÃO */}
        <motion.p
          className="
            mt-6
            text-lg md:text-xl
            text-white/80
            max-w-2xl
            mx-auto
          "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Um projeto solidário que conecta quem pode ajudar
          com quem realmente precisa, fortalecendo a fé,
          a união e o cuidado com o próximo.
        </motion.p>

        {/* AÇÕES */}
        <motion.div
          className="
            mt-12
            flex flex-col sm:flex-row
            justify-center
            gap-6
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <ActionButton
            to="/login"
            label="Quero Ajudar"
            icon={HeartHandshake}
            variant="primary"
          />

          <ActionButton
            to="/cadastro"
            label="Preciso de Ajuda"
            icon={HandHelping}
            variant="support"
          />
        </motion.div>
      </div>
    </section>
  )
}
