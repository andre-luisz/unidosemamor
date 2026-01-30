import { useState } from "react"
import { supabase } from "../services/supabase"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react"

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  /* ================= VALIDAÇÃO DE SENHA ================= */

  function senhaForte(s) {
    return (
      s.length >= 8 &&
      /[A-Z]/.test(s) &&
      /[a-z]/.test(s) &&
      /[0-9]/.test(s)
    )
  }

  /* ================= SUBMIT ================= */

  async function handleSubmit(e) {
    e.preventDefault()

    if (!senhaForte(senha)) {
      toast.error(
        "A senha deve ter no mínimo 8 caracteres, letras maiúsculas, minúsculas e números."
      )
      return
    }

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: senha
    })

    setLoading(false)

    if (error) {
      toast.error("Erro ao redefinir a senha")
      return
    }

    toast.success("Senha redefinida com sucesso!")
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white text-black p-8 rounded-2xl w-full max-w-md shadow-xl"
      >
        {/* HEADER */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mb-3">
            <KeyRound />
          </div>

          <h1 className="text-2xl font-bold text-primary">
            Redefinir Senha
          </h1>

          <p className="text-sm text-zinc-600 mt-1 text-center">
            Crie uma nova senha para sua conta
          </p>
        </div>

        {/* CAMPOS */}
        <div className="space-y-3">
          <PasswordInput
            value={senha}
            onChange={e => setSenha(e.target.value)}
            show={showSenha}
            toggle={() => setShowSenha(!showSenha)}
            placeholder="Nova senha"
          />

          <PasswordInput
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            show={showSenha}
            toggle={() => setShowSenha(!showSenha)}
            placeholder="Confirmar nova senha"
          />
        </div>

        {/* REGRAS */}
        <div className="mt-4 text-sm text-zinc-600 bg-zinc-100 p-3 rounded-lg">
          🔐 A senha deve conter:
          <ul className="list-disc pl-5 mt-1">
            <li>Mínimo de 8 caracteres</li>
            <li>Letra maiúscula</li>
            <li>Letra minúscula</li>
            <li>Número</li>
          </ul>
        </div>

        {/* BOTÃO */}
        <button
          disabled={loading}
          className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Redefinir Senha"}
        </button>
      </motion.form>
    </div>
  )
}

/* ================= COMPONENTE PASSWORD ================= */

function PasswordInput({ value, onChange, show, toggle, placeholder }) {
  return (
    <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
      <Lock size={18} className="text-zinc-500" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 outline-none text-sm text-black placeholder:text-zinc-400 bg-transparent"
        required
      />
      <button type="button" onClick={toggle}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
