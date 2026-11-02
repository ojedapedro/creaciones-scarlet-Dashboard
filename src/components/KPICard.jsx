import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ title, value, subtitle, change, changeLabel, icon: Icon, color = 'scarlet', loading }) {
  const colorMap = {
    scarlet: { bg: 'bg-scarlet/10', text: 'text-scarlet', border: 'border-scarlet/20' },
    gold: { bg: 'bg-gold/10', text: 'text-gold', border: 'border-gold/20' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  }
  const c = colorMap[color] || colorMap.scarlet

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-white/5 rounded w-1/2 mb-4" />
        <div className="h-8 bg-white/5 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
      </div>
    )
  }

  return (
    <div className={`card border ${c.border} fade-in`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-champagne/60 text-xs font-montserrat uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={c.text} />
          </div>
        )}
      </div>
      <p className={`font-cormorant text-3xl font-semibold ${c.text} leading-none mb-1`}>{value}</p>
      {subtitle && <p className="text-champagne/40 text-xs font-montserrat mt-1">{subtitle}</p>}
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border-dark">
          {change > 0 ? (
            <TrendingUp size={12} className="text-emerald-400" />
          ) : change < 0 ? (
            <TrendingDown size={12} className="text-red-400" />
          ) : (
            <Minus size={12} className="text-champagne/40" />
          )}
          <span className={`text-xs font-semibold ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-champagne/40'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-champagne/30 text-xs">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
