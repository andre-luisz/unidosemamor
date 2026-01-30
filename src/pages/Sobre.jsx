import { motion } from "framer-motion"
import {
  Heart,
  Cross,
  Target,
  Globe,
  MapPin,
  BookOpen,
} from "lucide-react"

export default function Sobre() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14 text-white">

      {/* TÍTULO */}
      <motion.div
        className="mb-14"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
          <Heart className="text-primary" />
          Unidos em Amor
        </h1>
        <p className="text-white/70 max-w-3xl text-lg">
          Um projeto que nasce da fé, cresce na união e se manifesta no amor ao próximo.
        </p>
      </motion.div>

      {/* CARD PRINCIPAL */}
      <motion.div
        className="bg-white text-black rounded-3xl shadow-xl p-8 md:p-10 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-lg leading-relaxed">
          O <strong>Unidos em Amor</strong> nasceu com um propósito simples, porém profundo:
          <strong className="text-primary"> amar pessoas na prática</strong>.
        </p>

        <p className="leading-relaxed">
          Embora a igreja seja um pilar essencial na vida cristã, este projeto
          <strong> não carrega placa de igreja</strong>. Acreditamos que o amor,
          a fé e a união vão além de denominações.
        </p>

        <p className="leading-relaxed">
          Nosso objetivo é <strong>ajudar os necessitados</strong>, cuidando tanto
          das necessidades materiais quanto das espirituais. Ajudamos com alimento,
          apoio, cuidado e presença, mas também com aquilo que sustenta a alma:
          <strong> a Palavra de Deus</strong>.
        </p>

        <blockquote className="
          border-l-4 border-primary
          pl-4 italic text-gray-700 flex gap-3 items-start
        ">
          <BookOpen size={22} className="mt-1 text-primary" />
          “Nem só de pão viverá o homem, mas de toda palavra que procede da boca de Deus.”
        </blockquote>

        <p className="leading-relaxed">
          Queremos alcançar os <strong>sedentos da Palavra</strong>, levando esperança,
          fé e direção. Pessoas feridas, cansadas e desanimadas — gente real,
          como nós.
        </p>
      </motion.div>

      {/* MISSÃO / VISÃO */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <motion.div
          className="bg-white text-black rounded-3xl shadow p-7"
          whileHover={{ y: -4 }}
        >
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Target className="text-primary" />
            Nossa Missão
          </h2>
          <p className="leading-relaxed">
            Servir como Jesus serviu, ajudando pessoas em suas necessidades
            físicas e espirituais, fortalecendo a fé, a esperança e a união
            através do amor.
          </p>
        </motion.div>

        <motion.div
          className="bg-white text-black rounded-3xl shadow p-7"
          whileHover={{ y: -4 }}
        >
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Globe className="text-primary" />
            Nossa Visão
          </h2>
          <p className="leading-relaxed">
            Crescer de forma sólida e responsável, alcançando pessoas em
            diferentes lugares, levando ajuda, cuidado e a mensagem do Evangelho.
          </p>
        </motion.div>
      </div>

      {/* ORIGEM */}
      <motion.div
        className="bg-white text-black rounded-3xl shadow-xl p-8 mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="text-primary" />
          Nossa Origem
        </h2>

        <p className="leading-relaxed">
          Somos de <strong>Floriano</strong>. Começamos aqui porque acreditamos
          que a transformação começa onde nossos pés estão.
        </p>

        <p className="leading-relaxed mt-4">
          Este projeto <strong>nasceu no coração de Jesus</strong>. Não foi apenas
          uma ideia, foi um chamado.
        </p>
      </motion.div>

      {/* FECHAMENTO */}
      <motion.div
        className="text-center mt-16 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-xl font-semibold">
          Unidos em Amor não é apenas um projeto.
        </p>
        <p className="text-xl font-semibold text-primary">
          É uma missão. É um propósito. É servir como Jesus serviu.
        </p>
      </motion.div>
    </section>
  )
}
