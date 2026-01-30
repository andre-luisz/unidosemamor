import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

import Home from "../pages/Home"
import Login from "../pages/Login"
import RedefinirSenha from "../pages/RedefinirSenha"
import Cadastro from "../pages/Cadastro"
import Dashboard from "../pages/Dashboard"
import Admin from "../pages/Admin"
import CestasDisponiveis from "../pages/cestas/CestasDisponiveis"
import Mercadinho from "../pages/Mercadinho"
import Sobre from "../pages/Sobre"

import Produtos from "../pages/admin/Produtos"
import NovoProduto from "../pages/admin/NovoProduto"
import EditarProduto from "../pages/admin/EditarProduto"
import Estoque from "../pages/admin/Estoque"
import MovimentoProduto from "../pages/admin/MovimentoProduto"
import Usuarios from "../pages/admin/Usuarios"
import AdminDoacoes from "../pages/admin/AdminDoacoes"
import HistoricoDoacoes from "../pages/admin/HistoricoDoacoes"
import MontarCesta from "../pages/admin/MontarCesta"
import Cestas from "../pages/admin/Cestas"
import EditarCesta from "../pages/admin/EditarCesta"
import HistoricoCestas from "../pages/admin/HistoricoCestas"
import AdminSolicitacoesCestas from "../pages/admin/AdminSolicitacoesCestas"

import MinhasSolicitacoes from "../pages/MinhasSolicitacoes"

import Doar from "../pages/Doar"
import MinhasDoacoes from "../pages/doacao/MinhasDoacoes"

import PrivateRoute from "./PrivateRoute"
import AdminRoute from "./AdminRoute"
import MainLayout from "../layouts/MainLayout"

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" /> : children
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          {/* 🌐 Público */}
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />

          <Route
            path="/cadastro"
            element={
              <PublicOnly>
                <Cadastro />
              </PublicOnly>
            }
          />
          <Route
            path="/redefinir-senha"
            element={
              <PublicOnly>
                <RedefinirSenha />
              </PublicOnly>
            }
          />
          

          {/* 👤 Usuário autenticado */}
          <Route
            path="/mercado-solidario"
            element={
              <PrivateRoute>
                <Mercadinho/>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/doar"
            element={
              <PrivateRoute>
                <Doar />
              </PrivateRoute>
            }
          />

          <Route
            path="/doacoes"
            element={
              <PrivateRoute>
                <MinhasDoacoes />
              </PrivateRoute>
            }
          />
          <Route
            path="/cestas/disponiveis"
            element={
              <PrivateRoute>
                <CestasDisponiveis />
              </PrivateRoute>
            }
          />
          <Route
            path="/cestas/solicitacoes"
            element={
              <PrivateRoute>
                <MinhasSolicitacoes />
              </PrivateRoute>
            }
          />

          {/* 🛠️ Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/produtos"
            element={
              <AdminRoute>
                <Produtos />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/produtos/novo"
            element={
              <AdminRoute>
                <NovoProduto />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/produtos/:id/editar"
            element={
              <AdminRoute>
                <EditarProduto />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/estoque"
            element={
              <AdminRoute>
                <Estoque />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/estoque/movimento"
            element={
              <AdminRoute>
                <MovimentoProduto />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <Usuarios />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/doacoes"
            element={
              <AdminRoute>
                <AdminDoacoes />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/doacoes/historico"
            element={
              <AdminRoute>
                <HistoricoDoacoes />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cestas"
            element={
              <AdminRoute>
                <Cestas />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cestas/montar"
            element={
              <AdminRoute>
                <MontarCesta />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cestas/solicitacoes"
            element={
              <AdminRoute>
                <AdminSolicitacoesCestas />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cestas/:id/editar"
            element={<EditarCesta />}
          />
            <Route
            path="/admin/cestas/historico"
            element={
              <AdminRoute>
                <HistoricoCestas />
              </AdminRoute>
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}
