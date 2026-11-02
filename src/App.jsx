import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Sales from './pages/Sales'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Appointments from './pages/Appointments'
import Clients from './pages/Clients'
import AIAgent from './pages/AIAgent'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-noir flex flex-col items-center justify-center gap-4">
      <p className="font-vibes text-5xl text-scarlet">Scarlet</p>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-scarlet animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-champagne/40 text-sm font-montserrat">Cargando dashboard...</p>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={
          <ProtectedRoute session={session}>
            <Layout session={session} />
          </ProtectedRoute>
        }>
          <Route index element={<Overview />} />
          <Route path="ventas" element={<Sales />} />
          <Route path="productos" element={<Products />} />
          <Route path="inventario" element={<Inventory />} />
          <Route path="citas" element={<Appointments />} />
          <Route path="clientas" element={<Clients />} />
          <Route path="agente" element={<AIAgent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
