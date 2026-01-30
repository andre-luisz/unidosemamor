import { useState } from "react"
import { supabase } from "../services/supabase"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn
} from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    setLoading(false)

    if (error) {
      toast.error("E-mail ou senha inválidos")
      return
    }

    toast.success("Bem-vindo de volta!")
    navigate("/dashboard")
  }

  /* ================= ESQUECI A SENHA ================= */

  async function handleResetSenha() {
    if (!email) {
      toast.warning("Informe seu e-mail para recuperar a senha")
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/redefinir-senha`
      }
    )

    if (error) {
      toast.error("Erro ao enviar e-mail de recuperação")
      return
    }

    toast.success(
      "Enviamos um e-mail para você redefinir sua senha."
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl text-black"
      >
        {/* HEADER */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mb-3">
            <LogIn />
          </div>

          <h1 className="text-2xl font-bold text-primary">
            Entrar
          </h1>

          <p className="text-sm text-zinc-600 mt-1 text-center">
            Acesse sua conta para continuar
          </p>
        </div>

        {/* CAMPOS */}
        <div className="space-y-3">
          <Input
            icon={Mail}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <PasswordInput
            value={senha}
            onChange={e => setSenha(e.target.value)}
            show={showSenha}
            toggle={() => setShowSenha(!showSenha)}
            placeholder="Senha"
          />
        </div>

        {/* ESQUECI SENHA */}
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleResetSenha}
            className="text-sm text-primary hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        {/* BOTÃO */}
        <button
          disabled={loading}
          className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {/* FOOTER */}
        <p className="text-center text-sm text-zinc-600 mt-6">
          Não tem conta?{" "}
          <Link
            to="/cadastro"
            className="text-primary font-semibold hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </motion.form>
    </div>
  )
}

/* ================= COMPONENTES ================= */

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
      <Icon size={18} className="text-zinc-500" />
      <input
        {...props}
        className="flex-1 outline-none text-sm text-black placeholder:text-zinc-400 bg-transparent"
        required
      />
    </div>
  )
}

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
