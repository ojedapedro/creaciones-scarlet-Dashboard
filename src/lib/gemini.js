import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
let genAI = null

try {
  genAI = new GoogleGenerativeAI(apiKey)
} catch (e) {
  console.warn('Gemini AI initialization warning:', e.message)
}

const SYSTEM_PROMPT = `Eres Nova, la asistente de análisis de datos de Creaciones Scarlet, 
una marca de moda de lujo venezolana. Hablas en español venezolano de manera amigable, cálida y profesional. 
Usas "chama", "pana", "chévere" cuando es apropiado, pero siempre mantienes un tono profesional y de confianza.
Tu trabajo es analizar los datos del negocio y dar recomendaciones claras y accionables a la propietaria y su equipo.
Cuando des números, siempre indica si son en USD o Bs.
Sé concisa pero completa. Usa emojis para hacer las respuestas más amigables.
Si no tienes datos suficientes para responder algo, dilo claramente.`

export async function askNova(userMessage, businessContext) {
  if (!genAI) {
    return '⚠️ El agente Nova no está disponible en este momento. Verifica que la API Key de Gemini sea válida.'
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const contextStr = `
CONTEXTO ACTUAL DEL NEGOCIO (datos en tiempo real):
- Ingresos del mes actual: $${businessContext.monthRevenue?.toFixed(2) || 0} USD
- Total pedidos del mes: ${businessContext.monthOrders || 0}
- Pedidos pendientes: ${businessContext.pendingOrders || 0}
- Pedidos completados/despachados: ${businessContext.completedOrders || 0}
- Citas agendadas este mes: ${businessContext.monthAppointments || 0}
- Productos con stock bajo (≤5): ${businessContext.lowStockCount || 0}
- Producto más vendido: ${businessContext.topProduct || 'N/A'}
- Categoría más vendida: ${businessContext.topCategory || 'N/A'}
- Método de pago más usado: ${businessContext.topPayment || 'N/A'}
- Tipo de entrega más usado: ${businessContext.topDelivery || 'N/A'}
- Tasa de cambio actual USD/Bs: ${businessContext.exchangeRate || 'N/A'}
- Valor total del inventario: $${businessContext.inventoryValue?.toFixed(2) || 0} USD
`

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${contextStr}\n\nPregunta del equipo: ${userMessage}`
    
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini error:', error)
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('400')) {
      return '⚠️ La API Key de Gemini no es válida. Por favor verifica la clave en el archivo .env'
    }
    return `❌ Hubo un error al consultar a Nova: ${error.message}. Intenta de nuevo en unos momentos.`
  }
}
