import useDashboardData from '../hooks/useDashboardData'
import KPICard from '../components/KPICard'
import StockAlertBanner from '../components/StockAlertBanner'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { DollarSign, ShoppingBag, Clock, Calendar, Package } from 'lucide-react'

const COLORS = ['#E6007E', '#D4AF37', '#ECE5D8', '#9F7AEA', '#38BDF8', '#34D399']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-panel border border-border-dark rounded-xl px-4 py-2 text-xs font-montserrat">
      <p className="text-champagne/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.name !== 'count' ? `$${p.value}` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Overview() {
  const { kpis, salesChartData, statusChartData, catChartData, lowStockProducts, monthOrders, loading } = useDashboardData()

  const recentOrders = monthOrders.slice(0, 6)

  function statusColor(status) {
    const map = {
      'Pendiente de verificación': 'bg-amber-500/20 text-amber-400',
      'Pendiente': 'bg-amber-500/20 text-amber-400',
      'Verificado': 'bg-blue-500/20 text-blue-400',
      'En confección': 'bg-purple-500/20 text-purple-400',
      'Despachado': 'bg-emerald-500/20 text-emerald-400',
    }
    return map[status] || 'bg-white/10 text-white'
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="section-title">Resumen del Negocio</h1>
        <p className="text-champagne/40 text-sm font-montserrat mt-1">
          Noviembre 2026 · Datos en tiempo real
        </p>
      </div>

      <StockAlertBanner products={lowStockProducts} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Ingresos del mes"
          value={`$${kpis.monthRevenue?.toFixed(2) || '0.00'}`}
          subtitle={`Bs. ${((kpis.monthRevenue || 0) * (kpis.exchangeRate || 54.2)).toFixed(0)}`}
          change={kpis.revenueChange}
          changeLabel="vs mes ant."
          icon={DollarSign}
          color="gold"
          loading={loading}
        />
        <KPICard
          title="Pedidos del mes"
          value={kpis.monthOrders || 0}
          subtitle="Este mes"
          icon={ShoppingBag}
          color="scarlet"
          loading={loading}
        />
        <KPICard
          title="Pendientes"
          value={kpis.pendingOrders || 0}
          subtitle="En proceso"
          icon={Clock}
          color="red"
          loading={loading}
        />
        <KPICard
          title="Citas este mes"
          value={kpis.monthAppointments || 0}
          subtitle="Atelier"
          icon={Calendar}
          color="blue"
          loading={loading}
        />
        <KPICard
          title="Stock bajo"
          value={kpis.lowStockCount || 0}
          subtitle="Productos (≤5 uds.)"
          icon={Package}
          color={kpis.lowStockCount > 0 ? 'red' : 'green'}
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales line chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-cormorant text-xl text-white mb-4">Ventas del mes (USD)</h3>
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <YAxis tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#E6007E" strokeWidth={2.5}
                  dot={{ fill: '#E6007E', r: 4 }} name="USD" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-champagne/30 text-sm">
              Sin ventas registradas este mes
            </div>
          )}
        </div>

        {/* Category pie */}
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Por categoría</h3>
          {catChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {catChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend formatter={v => <span className="text-champagne/70 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-champagne/30 text-sm">
              Sin ventas por categoría
            </div>
          )}
        </div>
      </div>

      {/* Status bar + Recent orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Estado de pedidos</h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <YAxis type="category" dataKey="status" width={130}
                  tick={{ fill: '#ECE5D880', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#E6007E" radius={[0, 6, 6, 0]} name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-champagne/30 text-sm">
              Sin pedidos registrados
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Pedidos recientes</h3>
          <div className="space-y-2">
            {recentOrders.length > 0 ? recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-border-dark last:border-0">
                <div>
                  <p className="text-white text-sm font-semibold">{o.order_code}</p>
                  <p className="text-champagne/40 text-xs">{o.customer_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gold text-sm font-semibold">${o.total_usd}</span>
                  <span className={`badge ${statusColor(o.status)} text-[10px]`}>{o.status}</span>
                </div>
              </div>
            )) : (
              <p className="text-champagne/30 text-sm text-center py-8">Sin pedidos este mes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
