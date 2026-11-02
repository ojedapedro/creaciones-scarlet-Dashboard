import { useState } from 'react'
import useDashboardData from '../hooks/useDashboardData'
import StockAlertBanner from '../components/StockAlertBanner'
import InventoryMovementForm from '../components/InventoryMovementForm'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { PackagePlus, ShoppingBag, Scissors, RefreshCw } from 'lucide-react'

const COLORS = ['#E6007E', '#D4AF37', '#ECE5D8', '#9F7AEA', '#34D399']

function typeLabel(t) {
  return t === 'compra' ? '🛍️ Compra' : t === 'produccion_taller' ? '🧵 Producción' : '⚙️ Ajuste'
}
function typeBadge(t) {
  return t === 'compra'
    ? 'bg-blue-500/20 text-blue-400'
    : t === 'produccion_taller'
      ? 'bg-purple-500/20 text-purple-400'
      : 'bg-gold/20 text-gold'
}

export default function Inventory() {
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const { products, movements, stockChartData, lowStockProducts, loading, kpis, refetch } = useDashboardData()

  // Movement type pie
  const movTypeCounts = {}
  movements.forEach(m => { movTypeCounts[m.movement_type] = (movTypeCounts[m.movement_type] || 0) + 1 })
  const movTypePie = Object.entries(movTypeCounts).map(([name, value]) => ({
    name: typeLabel(name), value
  }))

  // Inventory value over time (approx from movements)
  const filtered = filterType === 'all' ? movements : movements.filter(m => m.movement_type === filterType)

  const inventoryKpis = [
    { label: 'Valor del inventario', value: `$${kpis.inventoryValue?.toFixed(2) || '0.00'}`, color: 'text-gold' },
    { label: 'Total movimientos', value: movements.length, color: 'text-scarlet' },
    { label: 'Entradas por compra', value: movements.filter(m => m.movement_type === 'compra').length, color: 'text-blue-400' },
    { label: 'Producción atelier', value: movements.filter(m => m.movement_type === 'produccion_taller').length, color: 'text-purple-400' },
  ]

  if (loading) return <div className="text-champagne/40 text-sm">Cargando inventario...</div>

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Gestión de Inventario</h1>
          <p className="text-champagne/40 text-sm font-montserrat mt-1">
            Alimenta el catálogo desde compras o producción del taller
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={refetch} className="btn-ghost px-3 py-2" title="Actualizar">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <PackagePlus size={16} />
            Registrar entrada
          </button>
        </div>
      </div>

      <StockAlertBanner products={lowStockProducts} />

      {/* Quick action cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => setShowForm(true)}
          className="card border border-blue-500/20 hover:border-blue-500/50 text-left transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <ShoppingBag size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold font-montserrat">Registrar Compra</p>
              <p className="text-champagne/40 text-xs">Proveedor externo → Stock</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="card border border-purple-500/20 hover:border-purple-500/50 text-left transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Scissors size={22} className="text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold font-montserrat">Producción del Atelier</p>
              <p className="text-champagne/40 text-xs">Pieza terminada → Catálogo</p>
            </div>
          </div>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {inventoryKpis.map((k, i) => (
          <div key={i} className="card">
            <p className="text-champagne/50 text-xs uppercase tracking-wider mb-2">{k.label}</p>
            <p className={`font-cormorant text-3xl font-semibold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-cormorant text-xl text-white mb-4">Stock actual (unidades)</h3>
          {stockChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#ECE5D880', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <Tooltip formatter={v => [`${v} uds.`, 'Stock']} />
                <ReferenceLine y={5} stroke="#F59E0B" strokeDasharray="4 4" />
                <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
                  {stockChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.stock <= 2 ? '#EF4444' : entry.stock <= 5 ? '#F59E0B' : '#E6007E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-champagne/30 text-sm">Sin productos</div>
          )}
        </div>

        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Tipo de entrada</h3>
          {movTypePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={movTypePie} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {movTypePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-champagne/30 text-sm">Sin movimientos</div>
          )}
          <div className="mt-2 space-y-1">
            {movTypePie.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-montserrat">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-champagne/60">{e.name}</span>
                <span className="text-white font-semibold ml-auto">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movements history */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cormorant text-xl text-white">Historial de movimientos</h3>
          <div className="flex gap-2">
            {['all', 'compra', 'produccion_taller'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-montserrat border transition-all ${
                  filterType === t
                    ? 'border-scarlet bg-scarlet/10 text-white'
                    : 'border-border-dark text-champagne/40 hover:border-scarlet/40'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'compra' ? '🛍️ Compras' : '🧵 Producción'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-montserrat">
            <thead>
              <tr className="border-b border-border-dark text-champagne/40 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-2">Tipo</th>
                <th className="text-left py-3 px-2">Producto</th>
                <th className="text-left py-3 px-2">Cantidad</th>
                <th className="text-left py-3 px-2">Costo total</th>
                <th className="text-left py-3 px-2">Notas</th>
                <th className="text-left py-3 px-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.slice(0, 30).map(m => (
                <tr key={m.id} className="border-b border-border-dark/50 hover:bg-white/2">
                  <td className="py-3 px-2">
                    <span className={`badge text-[10px] ${typeBadge(m.movement_type)}`}>
                      {typeLabel(m.movement_type)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-white">{m.product_name}</td>
                  <td className="py-3 px-2 text-emerald-400 font-semibold">+{m.quantity}</td>
                  <td className="py-3 px-2 text-gold">{m.total_cost_usd ? `$${m.total_cost_usd}` : '—'}</td>
                  <td className="py-3 px-2 text-champagne/50 text-xs max-w-[200px] truncate">{m.notes || '—'}</td>
                  <td className="py-3 px-2 text-champagne/40 text-xs">{m.created_at?.slice(0, 10)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-champagne/30 text-sm">
                    Sin movimientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <InventoryMovementForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refetch() }}
        />
      )}
    </div>
  )
}
