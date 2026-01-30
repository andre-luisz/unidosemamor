import { useState } from "react"
import { supabase } from "../services/supabase"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Lock,
  Phone,
  IdCard,
  UserPlus,
  Eye,
  EyeOff
} from "lucide-react"

export default function Cadastro() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    senha: "",
    confirmarSenha: ""
  })

  /* ================= MASKS ================= */

  function maskCPF(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14)
  }

  function maskTelefone(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15)
  }

  function handleChange(e) {
    let { name, value } = e.target
    if (name === "cpf") value = maskCPF(value)
    if (name === "telefone") value = maskTelefone(value)
    setForm({ ...form, [name]: value })
  }

  /* ================= VALIDAÇÕES ================= */

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function cpfValido(cpf) {
    cpf = cpf.replace(/\D/g, "")
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

    let soma = 0
    for (let i = 0; i < 9; i++) soma += cpf[i] * (10 - i)
    let resto = (soma * 10) % 11
    if (resto === 10) resto = 0
    if (resto != cpf[9]) return false

    soma = 0
    for (let i = 0; i < 10; i++) soma += cpf[i] * (11 - i)
    resto = (soma * 10) % 11
    if (resto === 10) resto = 0
    return resto == cpf[10]
  }

  function senhaForca(senha) {
    let score = 0
    if (senha.length >= 8) score++
    if (/[A-Z]/.test(senha)) score++
    if (/[a-z]/.test(senha)) score++
    if (/[0-9]/.test(senha)) score++
    return score
  }

  async function cpfJaExiste(cpf) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("cpf", cpf.replace(/\D/g, ""))
      .maybeSingle()

    return !!data
  }

  /* ================= SUBMIT ================= */

  async function handleSubmit(e) {
    e.preventDefault()

    if (!emailValido(form.email)) {
      toast.error("E-mail inválido")
      return
    }

    if (!cpfValido(form.cpf)) {
      toast.error("CPF inválido")
      return
    }

    if (await cpfJaExiste(form.cpf)) {
      toast.error("Este CPF já está cadastrado")
      return
    }

    if (senhaForca(form.senha) < 4) {
      toast.error("Senha fraca. Use maiúsculas, minúsculas e números.")
      return
    }

    if (form.senha !== form.confirmarSenha) {
      toast.error("As senhas não coincidem")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        data: {
          nome: form.nome,
          cpf: form.cpf.replace(/\D/g, ""),
          telefone: form.telefone
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("Cadastro realizado! Confirme seu e-mail.")
    navigate("/login")
  }

  const strength = senhaForca(form.senha)

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mb-2">
            <UserPlus />
          </div>
          <h1 className="text-2xl font-bold text-primary">Criar Conta</h1>
        </div>

        <div className="space-y-3">
          <Input icon={User} name="nome" placeholder="Nome completo" onChange={handleChange} />
          <Input icon={IdCard} name="cpf" placeholder="CPF" value={form.cpf} onChange={handleChange} />
          <Input icon={Phone} name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} />
          <Input icon={Mail} name="email" placeholder="E-mail" onChange={handleChange} />

          <PasswordInput
            label="Senha"
            value={form.senha}
            onChange={e => setForm({ ...form, senha: e.target.value })}
            show={showSenha}
            toggle={() => setShowSenha(!showSenha)}
          />

          <div className="h-2 rounded bg-zinc-200 overflow-hidden">
            <div
              className={`h-full transition-all ${
                ["w-1/4 bg-red-500", "w-2/4 bg-yellow-500", "w-3/4 bg-blue-500", "w-full bg-green-600"][strength - 1] || "w-0"
              }`}
            />
          </div>

          <PasswordInput
            label="Confirmar senha"
            value={form.confirmarSenha}
            onChange={e => setForm({ ...form, confirmarSenha: e.target.value })}
            show={showSenha}
            toggle={() => setShowSenha(!showSenha)}
          />
        </div>

        <button
          disabled={loading}
          className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Cadastrar"}
        </button>

        <p className="text-center text-sm text-zinc-600 mt-6">
          Já tem conta? <Link to="/login" className="text-primary font-semibold">Entrar</Link>
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
        className="
          flex-1 outline-none text-sm
          text-zinc-900 placeholder:text-zinc-400
          bg-transparent
          autofill:bg-white autofill:text-zinc-900
        "
        required
      />
    </div>
  )
}

function PasswordInput({ label, value, onChange, show, toggle }) {
  return (
    <div className="border rounded-lg px-3 py-2 flex items-center gap-2 bg-white">
      <Lock size={18} className="text-zinc-500" />
      <input
        type={show ? "text" : "password"}
        placeholder={label}
        value={value}
        onChange={onChange}
        className="
          flex-1 outline-none text-sm
          text-zinc-900 placeholder:text-zinc-400
          bg-transparent
        "
        required
      />
      <button type="button" onClick={toggle} className="text-zinc-500">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
