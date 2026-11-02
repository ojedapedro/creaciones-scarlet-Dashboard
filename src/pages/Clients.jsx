import useDashboardData from '../hooks/useDashboardData'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useEffect } from 'react'

export default function Clients() {
  const { orders, loading } = useDashboardData()
  const [measurements, setMeasurements] = useState([])
  const [mLoading, setMLoading] = useState(true)

  useEffect(() => {
    supabase.from('customer_measurements').select('*').then(({ data }) => {
      setMeasurements(data || [])
      setMLoading(false)
    })
  }, [])

  // Group orders by client
  const clientMap = {}
  orders.forEach(o => {
    if (!clientMap[o.customer_phone]) {
      clientMap[o.customer_phone] = {
        name: o.customer_name,
        phone: o.customer_phone,
        orders: [],
        total: 0,
      }
    }
    clientMap[o.customer_phone].orders.push(o)
    clientMap[o.customer_phone].total += parseFloat(o.total_usd || 0)
  })
  const clients = Object.values(clientMap).sort((a, b) => b.total - a.total)

  // Scatter data: bust vs waist measurements
  const scatterData = measurements
    .filter(m => m.bust_cm && m.waist_cm)
    .map(m => ({ bust: parseFloat(m.bust_cm), waist: parseFloat(m.waist_cm), name: m.customer_name }))

  if (loading || mLoading) return <div className="text-champagne/40 text-sm">Cargando clientas...</div>

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="section-title">Clientas</h1>
        <p className="text-champagne/40 text-sm font-montserrat mt-1">
          {clients.length} clientas únicas · {measurements.length} perfiles de medidas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Clientas únicas', value: clients.length, color: 'text-scarlet' },
          { label: 'Clientas frecuentes', value: clients.filter(c => c.orders.length > 1).length, color: 'text-gold' },
          { label: 'Con medidas', value: measurements.length, color: 'text-purple-400' },
          { label: 'Mejor clienta (USD)', value: clients[0] ? `$${clients[0].total.toFixed(2)}` : '$0', color: 'text-emerald-400' },
        ].map((k, i) => (
          <div key={i} className="card">
            <p className="text-champagne/50 text-xs uppercase tracking-wider mb-2">{k.label}</p>
            <p className={`font-cormorant text-3xl font-semibold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top clients table */}
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Clientas más frecuentes</h3>
          <div className="space-y-3">
            {clients.slice(0, 8).map((c, i) => (
              <div key={c.phone} className="flex items-center gap-3 py-2 border-b border-border-dark last:border-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i === 0 ? 'bg-gold text-noir' : i === 1 ? 'bg-champagne/20 text-champagne' : 'bg-border-dark text-champagne/50'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{c.name}</p>
                  <p className="text-champagne/40 text-xs">{c.orders.length} pedido{c.orders.length !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-gold font-semibold text-sm">${c.total.toFixed(2)}</span>
              </div>
            ))}
            {clients.length === 0 && (
              <p className="text-champagne/30 text-sm text-center py-8">Sin clientas registradas aún</p>
            )}
          </div>
        </div>

        {/* Measurements scatter */}
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-1">Distribución de medidas</h3>
          <p className="text-champagne/40 text-xs mb-4">Busto vs Cintura (cm)</p>
          {scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bust" name="Busto" unit="cm" tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <YAxis dataKey="waist" name="Cintura" unit="cm" tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(v, n) => [`${v} cm`, n]}
                />
                <Scatter data={scatterData} fill="#E6007E" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-champagne/30 text-sm">
              Sin medidas anatómicas registradas
            </div>
          )}
        </div>
      </div>

      {/* Measurements table */}
      {measurements.length > 0 && (
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Perfiles de medidas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-montserrat">
              <thead>
                <tr className="border-b border-border-dark text-champagne/40 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-2">Clienta</th>
                  <th className="text-left py-3 px-2">Busto</th>
                  <th className="text-left py-3 px-2">Cintura</th>
                  <th className="text-left py-3 px-2">Cadera</th>
                  <th className="text-left py-3 px-2">Hombros</th>
                  <th className="text-left py-3 px-2">Talla aprox.</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map(m => (
                  <tr key={m.id} className="border-b border-border-dark/50 hover:bg-white/2">
                    <td className="py-3 px-2 text-white font-semibold">{m.customer_name || m.customer_phone}</td>
                    <td className="py-3 px-2 text-champagne/70">{m.bust_cm ? `${m.bust_cm} cm` : '—'}</td>
                    <td className="py-3 px-2 text-champagne/70">{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                    <td className="py-3 px-2 text-champagne/70">{m.hip_cm ? `${m.hip_cm} cm` : '—'}</td>
                    <td className="py-3 px-2 text-champagne/70">{m.shoulder_cm ? `${m.shoulder_cm} cm` : '—'}</td>
                    <td className="py-3 px-2">
                      {m.bust_cm < 82 ? <span className="badge bg-blue-500/20 text-blue-400 text-[10px]">XS/S</span>
                       : m.bust_cm < 90 ? <span className="badge bg-emerald-500/20 text-emerald-400 text-[10px]">M</span>
                       : m.bust_cm < 98 ? <span className="badge bg-gold/20 text-gold text-[10px]">L</span>
                       : <span className="badge bg-purple-500/20 text-purple-400 text-[10px]">XL+</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
