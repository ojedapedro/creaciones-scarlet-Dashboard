import useDashboardData from '../hooks/useDashboardData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ReactECharts from 'echarts-for-react'

export default function Appointments() {
  const { appointments, apptByDate, loading } = useDashboardData()

  // Service type distribution
  const serviceTypes = {}
  appointments.forEach(a => {
    serviceTypes[a.service_type] = (serviceTypes[a.service_type] || 0) + 1
  })
  const serviceChartData = Object.entries(serviceTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 25) + '…' : name, count }))

  // Status funnel
  const statusCounts = {}
  appointments.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1 })

  // ECharts calendar heatmap
  const calendarData = Object.entries(apptByDate).map(([date, value]) => [date, value])
  const years = [...new Set(Object.keys(apptByDate).map(d => d.slice(0, 4)))]
  const calYear = years[years.length - 1] || new Date().getFullYear().toString()

  const calendarOption = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: p => `${p.data[0]}: ${p.data[1]} cita(s)`,
      textStyle: { color: '#ECE5D8', fontFamily: 'Montserrat' },
    },
    visualMap: {
      min: 0,
      max: Math.max(...Object.values(apptByDate), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      inRange: { color: ['#13151C', '#B5005F', '#E6007E'] },
      textStyle: { color: '#ECE5D880' },
    },
    calendar: {
      top: 60,
      left: 30,
      right: 30,
      cellSize: ['auto', 18],
      range: calYear,
      itemStyle: { borderWidth: 2, borderColor: '#08080A' },
      yearLabel: { show: true, color: '#ECE5D880' },
      monthLabel: { color: '#ECE5D880', fontSize: 11 },
      dayLabel: { color: '#ECE5D860', fontSize: 10 },
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: calendarData,
    }],
  }

  if (loading) return <div className="text-champagne/40 text-sm">Cargando citas...</div>

  // Upcoming appointments
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments
    .filter(a => a.scheduled_date >= today)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    .slice(0, 8)

  function statusBadge(s) {
    if (s?.includes('confirm') || s?.includes('Confirm')) return 'bg-emerald-500/20 text-emerald-400'
    if (s?.includes('Complet') || s?.includes('complet')) return 'bg-blue-500/20 text-blue-400'
    return 'bg-amber-500/20 text-amber-400'
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="section-title">Citas Atelier</h1>
        <p className="text-champagne/40 text-sm font-montserrat mt-1">
          {appointments.length} citas totales · {upcoming.length} próximas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total citas', value: appointments.length, color: 'text-scarlet' },
          { label: 'Pendientes', value: appointments.filter(a => a.status?.includes('Pendiente')).length, color: 'text-amber-400' },
          { label: 'Confirmadas', value: appointments.filter(a => a.status?.toLowerCase().includes('confirm')).length, color: 'text-emerald-400' },
          { label: 'Completadas', value: appointments.filter(a => a.status?.toLowerCase().includes('complet')).length, color: 'text-blue-400' },
        ].map((k, i) => (
          <div key={i} className="card">
            <p className="text-champagne/50 text-xs uppercase tracking-wider mb-2">{k.label}</p>
            <p className={`font-cormorant text-3xl font-semibold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar heatmap */}
      <div className="card">
        <h3 className="font-cormorant text-xl text-white mb-4">Mapa de calor de citas ({calYear})</h3>
        {calendarData.length > 0 ? (
          <ReactECharts option={calendarOption} style={{ height: 200 }} />
        ) : (
          <div className="h-[200px] flex items-center justify-center text-champagne/30 text-sm">
            Sin citas registradas para mostrar en el calendario
          </div>
        )}
      </div>

      {/* Service types + Upcoming */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Servicios más solicitados</h3>
          {serviceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serviceChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: '#ECE5D880', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#ECE5D880', fontSize: 10 }} />
                <Tooltip formatter={v => [v, 'Citas']} />
                <Bar dataKey="count" fill="#D4AF37" radius={[0, 6, 6, 0]} name="Citas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-champagne/30 text-sm">Sin datos</div>
          )}
        </div>

        <div className="card">
          <h3 className="font-cormorant text-xl text-white mb-4">Próximas citas</h3>
          <div className="space-y-3">
            {upcoming.length > 0 ? upcoming.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border-dark last:border-0">
                <div className="w-10 h-10 rounded-xl bg-scarlet/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-scarlet text-xs font-bold leading-none">{a.scheduled_date?.slice(8, 10)}</span>
                  <span className="text-scarlet/60 text-[9px] uppercase">{new Date(a.scheduled_date + 'T12:00:00').toLocaleString('es', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{a.customer_name}</p>
                  <p className="text-champagne/50 text-xs truncate">{a.service_type}</p>
                </div>
                <span className={`badge text-[10px] flex-shrink-0 ${statusBadge(a.status)}`}>{a.status}</span>
              </div>
            )) : (
              <p className="text-champagne/30 text-sm text-center py-8">Sin citas próximas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
