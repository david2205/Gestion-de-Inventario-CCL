import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Inventory from './pages/Inventory.jsx'
import Products from './pages/Products.jsx'
import Movements from './pages/Movements.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Navbar from './components/Navbar.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute><Navbar /><Outlet /></ProtectedRoute>}>
            <Route path="/" element={<Inventory />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/products" element={<Products />} />
            <Route path="/movements" element={<Movements />} />
          </Route>
          <Route path="*" element={<App />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={5000} />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
