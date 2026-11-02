import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Loader2, Sparkles, CheckCircle } from 'lucide-react'

// Correos administradores predeterminados de respaldo
const FALLBACK_AUTHORIZED_EMAILS = [
  'analistadedatosnova@gmail.com'
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [authorizedEmails, setAuthorizedEmails] = useState(FALLBACK_AUTHORIZED_EMAILS)

  useEffect(() => {
    // Consultamos la tabla authorized_users en Supabase si existe
    async function fetchAuthorizedList() {
      try {
        const { data, error } = await supabase
          .from('authorized_users')
          .select('email')
        
        if (!error && data && data.length > 0) {
          const list = data.map(item => item.email.toLowerCase().trim())
          // Unimos con la lista fallback asegurando que no haya duplicados
          setAuthorizedEmails([...new Set([...FALLBACK_AUTHORIZED_EMAILS, ...list])])
        }
      } catch (err) {
        console.warn('Usando lista local de correos autorizados')
      }
    }

    fetchAuthorizedList()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    const cleanEmail = email.toLowerCase().trim()

    if (!authorizedEmails.includes(cleanEmail)) {
      setError('Este correo no está autorizado. Contacta a la propietaria de Creaciones Scarlet.')
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-noir flex flex-col items-center justify-center p-6">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-scarlet/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="font-vibes text-6xl text-scarlet">Scarlet</p>
          <p className="text-champagne/40 text-xs font-montserrat uppercase tracking-widest mt-2">
            Dashboard Privado · Creaciones Scarlet
          </p>
        </div>

        {sent ? (
          <div className="card text-center fade-in">
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="font-cormorant text-2xl text-white mb-2">¡Revisa tu correo!</h2>
            <p className="text-champagne/60 text-sm font-montserrat">
              Te enviamos un enlace mágico a <strong className="text-champagne">{email}</strong>.
              Haz clic en él para entrar al dashboard.
            </p>
            <p className="text-champagne/30 text-xs mt-4">
              Si no lo ves, revisa tu carpeta de spam.
            </p>
          </div>
        ) : (
          <div className="card fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} className="text-gold" />
              <h2 className="font-cormorant text-xl text-white">Acceso exclusivo</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label-dark">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-champagne/30" />
                  <input
                    type="email"
                    className="input-dark pl-10"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {loading ? 'Enviando enlace...' : 'Recibir enlace de acceso'}
              </button>
            </form>

            <p className="text-champagne/25 text-[11px] font-montserrat text-center mt-5">
              🔒 Solo usuarios autorizados por Creaciones Scarlet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
