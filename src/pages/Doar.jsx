import { useState } from "react"
import DoarAlimentos from "./doacao/DoarAlimentos"
import DoarPix from "./doacao/DoarPix"

export default function Doar() {
  const [aba, setAba] = useState("alimentos")

  return (
    <div className="max-w-7xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-2 text-center">
        Faça sua doação ❤️
      </h1>

      <p className="text-center text-gray-300 mb-8">
        Sua doação ajuda famílias em situação de vulnerabilidade.
      </p>

      {/* ABAS */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setAba("alimentos")}
          className={`px-6 py-2 rounded-lg font-semibold ${
            aba === "alimentos"
              ? "bg-primary"
              : "bg-gray-700"
          }`}
        >
          Doar Alimentos
        </button>

        <button
          onClick={() => setAba("pix")}
          className={`px-6 py-2 rounded-lg font-semibold ${
            aba === "pix"
              ? "bg-primary"
              : "bg-gray-700"
          }`}
        >
          Doar via PIX
        </button>
      </div>

      {/* CONTEÚDO */}
      {aba === "alimentos" && <DoarAlimentos />}
      {aba === "pix" && <DoarPix />}
    </div>
  )
}
