import { AlertTriangle, XCircle } from 'lucide-react'

export default function StockAlertBanner({ products }) {
  const critical = products.filter(p => p.stock <= 2 && p.stock >= 0)
  const low = products.filter(p => p.stock > 2 && p.stock <= 5)

  if (critical.length === 0 && low.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {critical.length > 0 && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">🚨 Stock crítico (≤2 unidades)</p>
            <p className="text-champagne/60 text-xs mt-1">
              {critical.map(p => `${p.name} (${p.stock} uds.)`).join(' · ')}
            </p>
          </div>
        </div>
      )}
      {low.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">⚠️ Stock bajo (3–5 unidades)</p>
            <p className="text-champagne/60 text-xs mt-1">
              {low.map(p => `${p.name} (${p.stock} uds.)`).join(' · ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
