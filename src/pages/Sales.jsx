import { useState } from 'react'
import useDashboardData from '../hooks/useDashboardData'
import ManualSaleForm from '../components/ManualSaleForm'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { ShoppingCart, Plus, RefreshCw, Store, Globe } from 'lucide-react'

const COLORS = ['#E6007E', '#D4AF37', '#ECE5D8', '#9F7AEA', '#38BDF8', '#34D399']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-panel border border-border-dark rounded-xl px-4 py-2 text-xs font-montserrat">
      <p className="text-champagne/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Sales() {
  const [showManualSale, setShowManualSale] = useState(false)
  const [filterSource, setFilterSource] = useState('all') // 'all', 'landing', 'external'

  const { salesChartData, statusChartData, paymentChartData, deliveryChartData, orders, loading, kpis, refetch } = useDashboardData()

  // Clasificación por origen (Landing vs Externa)
  const landingOrders = orders.filter(o => !o.order_code?.startsWith('EXT-'))
  const externalOrders = orders.filter(o => o.order_code?.startsWith('EXT-'))

  const filteredOrders = filterSource === 'landing'
    ? landingOrders
    : filterSource === 'external'
      ? externalOrders
      : orders

  // Gráfica de origen de ventas
  const sourceChartData = [
    { name: '🌐 Landing Page', value: landingOrders.length },
    { name: '🏛️ Ventas Externas / Atelier', value: externalOrders.length },
  ].filter(d => d.value > 0)

  // Monthly revenue by month (all time)
  const monthlyRevenue = {}
  orders.forEach(o => {
    const month = o.created_at?.slice(0, 7)
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(o.total_usd || 0)
  })
  const monthlyData = Object.entries(monthlyRevenue)
    .sort()
    .slice(-6)
    .map(([month, total]) => ({ month, total: parseFloat(total.toFixed(2)) }))

  if (loading) return <div className="text-champagne/40 text-sm">Cargando análisis de ventas...</div>

  return (
    <div className="space-y-6 fade-in">
      {/* Header con botón de acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Análisis de Ventas</h1>
          <p className="text-champagne/40 text-sm font-montserrat mt-1">
            Ventas de la Landing Page + Ventas directas (Atelier, WhatsApp, Eventos)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost px-3 py-2" title="Refrescar">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowManualSale(true)} className="btn-primary">
            <Plus size={16} />
            Registrar Venta Externa
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total acumulado', value: `$${orders.reduce((s, o) => s + parseFloat(o.total_usd || 0), 0).toFixed(2)}`, color: 'text-gold' },
          { label: 'Ventas en Landing', value: `${landingOrders.length} ($${landingOrders.reduce((s, o) => s + parseFloat(o.total_usd || 0), 0).toFixed(0)})`, color: 'text-scarlet' },
          { label: 'Ventas Externas / Atelier', value: `${externalOrders.length} ($${externalOrders.reduce((s, o) => s + parseFloat(o.total_usd || 0), 0).toFixed(0)})`, color: 'text-blue-400' },
          { label: 'Despachados / Entregados', value: orders.filter(o => o.status === 'Despachado').length, color: 'text-emerald-400' },
        ].map((c, i) => (
          <div key={i} className="card">
            <p className="text-champagne/50 text-xs uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`font-cormorant text-3xl font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly area chart */}
      <div className="card">
        <h3 className="font-cormorant text-xl text-white mb-4">Ingresos totales por mes (USD)</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E6007E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E6007E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#ECE5D880', fontSize: 11 }} />
              <YAxis tick={{ fill: '#ECE5D880', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#E6007E" strokeWidth={2.5}
                fill="url(#colorRevenue)" name="USD" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-champagne/30 text-sm">
            Sin datos históricos disponibles
          </div>
        )}
      </div>

      {/* Origen de ventas + Métodos de pago */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Canal de Venta (Landing vs Externo)</h3>
          {sourceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceChartData} cx="50%" cy="50%" outerRadius={85}
                  dataKey="value" nameKey="name" paddingAngle={4}>
                  <Cell fill="#E6007E" />
                  <Cell fill="#D4AF37" />
                </Pie>
                <Tooltip />
                <Legend formatter={v => <span className="text-champagne/70 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-champagne/30 text-sm">Sin datos</div>
          )}
        </div>

        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Métodos de pago utilizados</h3>
          {paymentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentChartData} cx="50%" cy="50%" outerRadius={85}
                  dataKey="value" nameKey="name" paddingAngle={2}>
                  {paymentChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend formatter={v => <span className="text-champagne/70 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-champagne/30 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Tabla con Filtros de Canal */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-cormorant text-xl text-white">Registro de Pedidos y Ventas</h3>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todas las ventas' },
              { id: 'landing', label: '🌐 Solo Landing' },
              { id: 'external', label: '🏛️ Solo Externas' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterSource(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-montserrat border transition-all ${
                  filterSource === f.id
                    ? 'border-scarlet bg-scarlet/10 text-white font-semibold'
                    : 'border-border-dark text-champagne/40 hover:border-scarlet/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-montserrat">
            <thead>
              <tr className="border-b border-border-dark text-champagne/40 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-2">Código</th>
                <th className="text-left py-3 px-2">Origen</th>
                <th className="text-left py-3 px-2">Cliente</th>
                <th className="text-left py-3 px-2">Total</th>
                <th className="text-left py-3 px-2">Pago</th>
                <th className="text-left py-3 px-2">Estado</th>
                <th className="text-left py-3 px-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 30).map(o => {
                const isExternal = o.order_code?.startsWith('EXT-')
                return (
                  <tr key={o.id} className="border-b border-border-dark/50 hover:bg-white/2">
                    <td className="py-3 px-2 text-scarlet font-semibold">{o.order_code}</td>
                    <td className="py-3 px-2">
                      {isExternal ? (
                        <span className="badge bg-gold/20 text-gold text-[10px] flex items-center gap-1 w-max">
                          <Store size={10} /> Externa
                        </span>
                      ) : (
                        <span className="badge bg-blue-500/20 text-blue-400 text-[10px] flex items-center gap-1 w-max">
                          <Globe size={10} /> Landing
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-champagne/80 font-medium">{o.customer_name}</td>
                    <td className="py-3 px-2 text-gold font-semibold">${o.total_usd}</td>
                    <td className="py-3 px-2 text-champagne/60 text-xs">{o.payment_method}</td>
                    <td className="py-3 px-2">
                      <span className={`badge text-[10px] ${
                        o.status?.includes('Despachado') ? 'bg-emerald-500/20 text-emerald-400'
                        : o.status?.includes('confección') ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-amber-500/20 text-amber-400'
                      }`}>{o.status}</span>
                    </td>
                    <td className="py-3 px-2 text-champagne/40 text-xs">{o.created_at?.slice(0, 10)}</td>
                  </tr>
                )
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-champagne/30 text-sm">
                    No hay ventas registradas para este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredOrders.length > 30 && (
            <p className="text-champagne/30 text-xs text-center py-3">
              Mostrando 30 de {filteredOrders.length} ventas
            </p>
          )}
        </div>
      </div>

      {/* Modal de Venta Manual */}
      {showManualSale && (
        <ManualSaleForm
          onClose={() => setShowManualSale(false)}
          onSuccess={() => {
            setShowManualSale(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
