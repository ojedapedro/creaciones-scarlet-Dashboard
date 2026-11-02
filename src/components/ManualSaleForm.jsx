import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CHANNELS = [
  { value: 'Atelier / Showroom', label: '🏛️ En Atelier / Showroom' },
  { value: 'WhatsApp Directo', label: '💬 WhatsApp Directo' },
  { value: 'Instagram DM', label: '📸 Instagram DM' },
  { value: 'Feria / Evento', label: '🎪 Feria o Evento' },
  { value: 'Otro', label: '✨ Venta Externa' },
]

const PAYMENT_METHODS = [
  'Pago Móvil',
  'Zelle',
  'Efectivo USD',
  'Efectivo Bs.',
  'Transferencia Bancaria',
  'Punto de Venta',
]

const DELIVERY_TYPES = [
  'Retiro en Atelier',
  'Delivery Local',
  'Envío Nacional',
  'Entregado en Mano',
]

export default function ManualSaleForm({ onClose, onSuccess }) {
  const [products, setProducts] = useState([])
  const [exchangeRate, setExchangeRate] = useState(54.20)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Datos del cliente
  const [customer, setCustomer] = useState({
    name: '',
    id_doc: '',
    phone: '',
    sales_channel: 'Atelier / Showroom',
    payment_method: 'Pago Móvil',
    delivery_type: 'Retiro en Atelier',
    delivery_address: '',
    notes: '',
  })

  // Ítems de la venta
  const [items, setItems] = useState([
    { product_id: '', size: 'M', quantity: 1, unit_price_usd: 0 }
  ])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [{ data: prods }, { data: rates }] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).order('name'),
        supabase.from('exchange_rates').select('rate_usd_to_bs').order('created_at', { ascending: false }).limit(1),
      ])
      setProducts(prods || [])
      if (rates && rates.length > 0) {
        setExchangeRate(rates[0].rate_usd_to_bs)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  function addItem() {
    setItems([...items, { product_id: '', size: 'M', quantity: 1, unit_price_usd: 0 }])
  }

  function removeItem(index) {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  function handleProductChange(index, productId) {
    const prod = products.find(p => p.id === productId)
    const newItems = [...items]
    newItems[index].product_id = productId
    newItems[index].unit_price_usd = prod ? parseFloat(prod.price_usd || 0) : 0
    newItems[index].size = prod?.available_sizes?.[0] || 'M'
    setItems(newItems)
  }

  function handleItemChange(index, field, value) {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const totalUSD = items.reduce((sum, item) => {
    return sum + (parseFloat(item.unit_price_usd || 0) * (parseInt(item.quantity) || 1))
  }, 0)

  const totalBs = (totalUSD * exchangeRate).toFixed(2)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
    // Validación
    const validItems = items.filter(it => it.product_id)
    if (validItems.length === 0) {
      setError('Debes agregar al menos un producto válido')
      return
    }

    setSaving(true)

    try {
      const orderCode = `EXT-${Date.now().toString().slice(-4)}`
      const fullNotes = `[Origen: ${customer.sales_channel}] ${customer.notes || ''}`.trim()

      // 1. Insertar orden en Supabase
      const { data: newOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_name: customer.name || 'Cliente Atelier',
          customer_id_doc: customer.id_doc || 'V-00000000',
          customer_phone: customer.phone || '0000-0000000',
          delivery_type: customer.delivery_type,
          delivery_address: customer.delivery_address || 'Entrega física en taller',
          total_usd: totalUSD,
          applied_exchange_rate: exchangeRate,
          payment_method: customer.payment_method,
          notes: fullNotes,
          status: 'Despachado', // Las ventas externas suelen entregarse de inmediato
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      // 2. Insertar los order_items y descontar stock
      for (const item of validItems) {
        const prod = products.find(p => p.id === item.product_id)
        const qty = parseInt(item.quantity) || 1
        const unitPrice = parseFloat(item.unit_price_usd) || 0

        await supabase.from('order_items').insert({
          order_id: newOrder.id,
          product_id: item.product_id,
          product_name: prod?.name || 'Prenda Atelier',
          size: item.size,
          quantity: qty,
          unit_price_usd: unitPrice,
          subtotal_usd: unitPrice * qty,
        })

        // Descontar stock en la tabla products
        const currentStock = prod?.stock || 0
        const newStock = Math.max(0, currentStock - qty)
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id)
      }

      setSuccess(`✅ ¡Venta registrada exitosamente con código ${orderCode}! El inventario ha sido actualizado.`)
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 2000)
    } catch (err) {
      setError(`❌ Error al registrar la venta: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-obsidian border border-border-dark rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark sticky top-0 bg-obsidian z-10">
          <div>
            <h2 className="font-cormorant text-2xl text-white flex items-center gap-2">
              <ShoppingCart size={22} className="text-scarlet" />
              Registrar Venta Externa / Atelier
            </h2>
            <p className="text-champagne/40 text-xs font-montserrat">
              Ventas realizadas por WhatsApp, Instagram, Atelier o eventos (descuenta inventario)
            </p>
          </div>
          <button onClick={onClose} className="text-champagne/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Canal de venta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-dark">Canal de Venta</label>
              <select
                className="input-dark"
                value={customer.sales_channel}
                onChange={e => setCustomer({ ...customer, sales_channel: e.target.value })}
              >
                {CHANNELS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-dark">Método de Pago</label>
              <select
                className="input-dark"
                value={customer.payment_method}
                onChange={e => setCustomer({ ...customer, payment_method: e.target.value })}
              >
                {PAYMENT_METHODS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="p-4 bg-noir/70 border border-border-dark rounded-xl space-y-3">
            <p className="text-xs uppercase tracking-wider text-champagne/70 font-semibold font-montserrat">
              Datos de la Clienta
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label-dark">Nombre y Apellido</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: Valeria Rivas"
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label-dark">Cédula o Doc.</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: V-24.580.123"
                  value={customer.id_doc}
                  onChange={e => setCustomer({ ...customer, id_doc: e.target.value })}
                />
              </div>
              <div>
                <label className="label-dark">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Ej: 0414-1234567"
                  value={customer.phone}
                  onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Prendas / Ítems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-dark">Prendas Vendidas</label>
              <button
                type="button"
                onClick={addItem}
                className="text-scarlet text-xs font-montserrat flex items-center gap-1 hover:underline font-semibold"
              >
                <Plus size={14} /> Agregar otra prenda
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const prod = products.find(p => p.id === item.product_id)
                const availableSizes = prod?.available_sizes || ['XS', 'S', 'M', 'L', 'XL', 'A Medida']

                return (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-noir border border-border-dark rounded-xl">
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        className="input-dark"
                        value={item.product_id}
                        onChange={e => handleProductChange(idx, e.target.value)}
                        required
                      >
                        <option value="">— Seleccionar prenda —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${p.price_usd} USD · Stock: {p.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-24">
                      <select
                        className="input-dark"
                        value={item.size}
                        onChange={e => handleItemChange(idx, 'size', e.target.value)}
                      >
                        {availableSizes.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-20">
                      <input
                        type="number"
                        min="1"
                        className="input-dark"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="Cant."
                        required
                      />
                    </div>

                    <div className="w-full sm:w-28">
                      <input
                        type="number"
                        step="0.01"
                        className="input-dark"
                        value={item.unit_price_usd}
                        onChange={e => handleItemChange(idx, 'unit_price_usd', e.target.value)}
                        placeholder="Precio $"
                        required
                      />
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-champagne/40 hover:text-red-400 p-2 transition-colors self-end sm:self-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumen Total */}
          <div className="p-4 bg-scarlet/10 border border-scarlet/30 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-montserrat text-champagne/70 uppercase tracking-wider">Total a Cobrar</p>
              <p className="text-[11px] text-champagne/40">Tasa del día: Bs. {exchangeRate} / USD</p>
            </div>
            <div className="text-right">
              <p className="font-cormorant text-3xl font-bold text-gold">${totalUSD.toFixed(2)} USD</p>
              <p className="text-xs text-champagne/80 font-semibold font-montserrat">≈ Bs. {totalBs}</p>
            </div>
          </div>

          {/* Entrega y Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-dark">Modalidad de Entrega</label>
              <select
                className="input-dark"
                value={customer.delivery_type}
                onChange={e => setCustomer({ ...customer, delivery_type: e.target.value })}
              >
                {DELIVERY_TYPES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-dark">Notas / Observaciones</label>
              <input
                type="text"
                className="input-dark"
                placeholder="Ej: Pago verificado por transferencia Banesco..."
                value={customer.notes}
                onChange={e => setCustomer({ ...customer, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={saving || totalUSD <= 0} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Guardando venta...' : 'Registrar Venta Externa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
