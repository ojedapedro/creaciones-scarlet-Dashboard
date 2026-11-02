import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, TrendingUp, Package, PackagePlus,
  Calendar, Users, Bot, LogOut, Menu, X, Sparkles
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Resumen', end: true },
  { to: '/ventas', icon: TrendingUp, label: 'Ventas' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/inventario', icon: PackagePlus, label: 'Inventario', badge: 'nuevo' },
  { to: '/citas', icon: Calendar, label: 'Citas Atelier' },
  { to: '/clientas', icon: Users, label: 'Clientas' },
  { to: '/agente', icon: Bot, label: 'Agente Nova IA' },
]

export default function Layout({ session }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const userEmail = session?.user?.email || ''
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-noir">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-obsidian border-r border-border-dark
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-border-dark">
          <div>
            <p className="font-vibes text-3xl text-scarlet leading-none">Scarlet</p>
            <p className="text-champagne/40 text-[10px] font-montserrat uppercase tracking-widest mt-1">
              Analytics Dashboard
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-champagne/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="badge bg-scarlet/20 text-scarlet text-[9px] uppercase">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border-dark">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-scarlet flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userEmail}</p>
              <div className="flex items-center gap-1">
                <Sparkles size={10} className="text-gold" />
                <p className="text-champagne/40 text-[10px]">Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-champagne/50 hover:text-red-400
                       text-xs font-montserrat transition-colors py-2 px-2 rounded-lg hover:bg-red-400/10"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border-dark bg-obsidian/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-champagne/60 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-champagne/40 text-xs font-montserrat">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Datos en tiempo real
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
