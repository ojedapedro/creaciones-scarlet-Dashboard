import useDashboardData from '../hooks/useDashboardData'
import AIAgentChat from '../components/AIAgentChat'

export default function AIAgent() {
  const { kpis, loading } = useDashboardData()

  return (
    <div className="h-full flex flex-col fade-in" style={{ minHeight: 'calc(100vh - 130px)' }}>
      <div className="mb-6">
        <h1 className="section-title">Agente Nova IA</h1>
        <p className="text-champagne/40 text-sm font-montserrat mt-1">
          Tu asistente de análisis de datos · Habla en venezolano 🇻🇪
        </p>
      </div>

      <div className="card flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-champagne/40 text-sm">
            Cargando datos del negocio...
          </div>
        ) : (
          <AIAgentChat businessContext={kpis} />
        )}
      </div>
    </div>
  )
}
