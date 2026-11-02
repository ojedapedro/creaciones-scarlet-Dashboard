import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { askNova } from '../lib/gemini'

const SUGGESTED = [
  '¿Qué producto vendí más este mes?',
  '¿Cuál es mi ingreso total en USD?',
  '¿Tengo productos con stock bajo?',
  '¿Qué método de pago prefieren mis clientas?',
  'Dame un resumen del negocio',
  '¿Cuántas citas tengo pendientes?',
]

export default function AIAgentChat({ businessContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'nova',
      text: '¡Hola chama! Soy **Nova**, tu asistente de análisis 🌺 ¿En qué te puedo ayudar hoy? Pregúntame sobre tus ventas, inventario, clientas o cualquier cosa del negocio.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const reply = await askNova(msg, businessContext || {})
      setMessages(prev => [...prev, { role: 'nova', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'nova', text: '❌ Hubo un problema al contactar a Nova. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-scarlet flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold font-montserrat flex items-center gap-2">
            Nova <Sparkles size={14} className="text-gold" />
          </p>
          <p className="text-champagne/40 text-xs">Agente de análisis IA · En línea</p>
        </div>
        <button
          onClick={() => setMessages([{
            role: 'nova',
            text: '¡Listo! Conversación reiniciada. ¿En qué te ayudo, chama? 🌺'
          }])}
          className="ml-auto text-champagne/30 hover:text-champagne/70 transition-colors"
          title="Reiniciar chat"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'nova' && (
              <div className="w-7 h-7 rounded-full bg-gradient-scarlet flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-montserrat leading-relaxed ${
              msg.role === 'user'
                ? 'bg-scarlet text-white rounded-br-sm'
                : 'bg-panel border border-border-dark text-champagne rounded-bl-sm'
            }`}
              dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
            />
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-scarlet flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-panel border border-border-dark rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-scarlet animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="text-xs border border-scarlet/30 text-scarlet/80 hover:bg-scarlet/10
                         px-3 py-1.5 rounded-full font-montserrat transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          className="input-dark flex-1"
          placeholder="Pregúntale algo a Nova..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn-primary px-4 disabled:opacity-40"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}
