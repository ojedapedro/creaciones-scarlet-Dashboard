import useDashboardData from '../hooks/useDashboardData'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'

const COLORS = ['#E6007E', '#D4AF37', '#ECE5D8', '#9F7AEA', '#38BDF8', '#34D399', '#FB923C', '#A78BFA']

export default function Products() {
  const { products, topProductsData, catChartData, stockChartData, loading, kpis } = useDashboardData()

  if (loading) return <div className="text-champagne/40 text-sm">Cargando análisis de productos...</div>

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="section-title">Productos & Catálogo</h1>
        <p className="text-champagne/40 text-sm font-montserrat mt-1">
          {products.length} productos activos · Valor de inventario: <span className="text-gold">${kpis.inventoryValue?.toFixed(2)}</span>
        </p>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Top productos vendidos</h3>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#ECE5D880', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="vendidos" fill="#E6007E" radius={[0, 6, 6, 0]} name="Unidades" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-champagne/30 text-sm">
              Sin ventas registradas aún
            </div>
          )}
        </div>

        {/* Category pie */}
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Ventas por categoría</h3>
          {catChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {catChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} uds.`, n]} />
                <Legend formatter={v => <span className="text-champagne/70 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-champagne/30 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Stock chart */}
      <div className="card">
        <h3 className="font-cormorant text-xl text-white mb-1">Stock actual por producto</h3>
        <p className="text-champagne/40 text-xs font-montserrat mb-4">Línea roja = alerta de stock bajo (5 uds.)</p>
        {stockChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#ECE5D880', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#ECE5D880', fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} unidades`, 'Stock']} />
              <ReferenceLine y={5} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Alerta', fill: '#F59E0B', fontSize: 10 }} />
              <Bar dataKey="stock" radius={[6, 6, 0, 0]} name="Stock">
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

      {/* Products table */}
      <div className="card">
        <h3 className="font-cormorant text-xl text-white mb-4">Catálogo completo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-montserrat">
            <thead>
              <tr className="border-b border-border-dark text-champagne/40 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-2">Prenda</th>
                <th className="text-left py-3 px-2">Categoría</th>
                <th className="text-left py-3 px-2">Precio (USD)</th>
                <th className="text-left py-3 px-2">Stock</th>
                <th className="text-left py-3 px-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-border-dark/50 hover:bg-white/2">
                  <td className="py-3 px-2 text-white font-semibold">{p.name}</td>
                  <td className="py-3 px-2">
                    <span className="badge bg-scarlet/10 text-scarlet/80 text-[10px] capitalize">{p.category}</span>
                  </td>
                  <td className="py-3 px-2 text-gold">${p.price_usd}</td>
                  <td className="py-3 px-2">
                    <span className={`font-bold ${p.stock <= 2 ? 'text-red-400' : p.stock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {p.stock === 0
                      ? <span className="badge bg-red-500/20 text-red-400 text-[10px]">Agotado</span>
                      : p.stock <= 5
                        ? <span className="badge bg-amber-500/20 text-amber-400 text-[10px]">Stock bajo</span>
                        : <span className="badge bg-emerald-500/20 text-emerald-400 text-[10px]">Disponible</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
