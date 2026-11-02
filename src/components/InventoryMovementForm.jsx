import { useState, useEffect, useRef } from 'react'
import { X, ShoppingBag, Scissors, Loader2, Plus, UploadCloud, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MOVEMENT_TYPES = [
  { value: 'compra', label: '🛍️ Compra (Proveedor externo)', icon: ShoppingBag },
  { value: 'produccion_taller', label: '🧵 Producción del Atelier', icon: Scissors },
]

const CATEGORIES = ['mujer', 'ninos', 'hombre', 'amedida']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'A Medida']

export default function InventoryMovementForm({ onClose, onSuccess }) {
  const [type, setType] = useState('produccion_taller')
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isNewProduct, setIsNewProduct] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Imagen del producto
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    product_id: '',
    product_name: '',
    quantity: 1,
    unit_cost_usd: '',
    supplier_id: '',
    new_supplier_name: '',
    notes: '',
    // Para producto nuevo
    new_product_name: '',
    new_product_category: 'mujer',
    new_product_price: '',
    new_product_description: '',
    new_product_sizes: ['M'],
    image_url: '',
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: prods }, { data: supps }] = await Promise.all([
        supabase.from('products').select('id, name, stock, category, image_url').eq('is_active', true).order('name'),
        supabase.from('suppliers').select('id, name').order('name'),
      ])
      setProducts(prods || [])
      setSuppliers(supps || [])
      setLoading(false)
    }
    load()
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleSize(size) {
    setForm(prev => ({
      ...prev,
      new_product_sizes: prev.new_product_sizes.includes(size)
        ? prev.new_product_sizes.filter(s => s !== size)
        : [...prev.new_product_sizes, size],
    }))
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError('')
    }
  }

  async function uploadImageToStorage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `products/${fileName}`

    // Intentamos subir al bucket 'products'
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.warn('Fallo subida a storage bucket products:', uploadError.message)
      // Como fallback seguro si el bucket de storage no está creado en Supabase,
      // convertimos la imagen a DataURL base64 para que la landing lo muestre sin fallar
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      let productId = form.product_id
      let productName = ''
      let finalImageUrl = form.image_url

      // Si subieron un archivo de imagen, procesarlo
      if (imageFile) {
        setUploadingImage(true)
        finalImageUrl = await uploadImageToStorage(imageFile)
        setUploadingImage(false)
      }

      if (isNewProduct) {
        // Crear nuevo producto en el catálogo
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert({
            name: form.new_product_name,
            category: form.new_product_category,
            price_usd: parseFloat(form.new_product_price) || 0,
            description: form.new_product_description || null,
            available_sizes: form.new_product_sizes,
            image_url: finalImageUrl || null,
            stock: 0,
            is_active: true,
          })
          .select()
          .single()
        if (prodErr) throw prodErr
        productId = newProd.id
        productName = newProd.name
      } else {
        const found = products.find(p => p.id === form.product_id)
        productName = found?.name || ''
        
        // Si seleccionaron producto existente y subieron una nueva foto para actualizarlo
        if (finalImageUrl && finalImageUrl !== found?.image_url) {
          await supabase
            .from('products')
            .update({ image_url: finalImageUrl })
            .eq('id', productId)
        }
      }

      // Proveedor si es compra
      let supplierId = form.supplier_id
      if (type === 'compra' && form.new_supplier_name) {
        const { data: newSupp, error: suppErr } = await supabase
          .from('suppliers')
          .insert({ name: form.new_supplier_name })
          .select()
          .single()
        if (suppErr) throw suppErr
        supplierId = newSupp.id
      }

      // Insertar movimiento de inventario
      const qty = parseInt(form.quantity)
      const unitCost = type === 'compra' ? parseFloat(form.unit_cost_usd) || 0 : null
      const { error: movErr } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: productId,
          product_name: productName,
          movement_type: type,
          quantity: qty,
          unit_cost_usd: unitCost,
          total_cost_usd: unitCost ? unitCost * qty : null,
          supplier_id: type === 'compra' ? supplierId : null,
          notes: form.notes,
        })
      if (movErr) throw movErr

      // Actualizar el stock del producto
      const currentStock = products.find(p => p.id === productId)?.stock || 0
      await supabase
        .from('products')
        .update({ stock: currentStock + qty })
        .eq('id', productId)

      setSuccess(`✅ ¡Listo! Se cargaron ${qty} unidades de "${productName}" y la imagen ya está visible en el catálogo de la landing.`)
      setTimeout(() => { onSuccess?.(); onClose?.() }, 2000)
    } catch (err) {
      setError(`❌ Error: ${err.message}`)
    } finally {
      setSaving(false)
      setUploadingImage(false)
    }
  }

  // Previsualización actual al seleccionar un producto existente
  const selectedProduct = products.find(p => p.id === form.product_id)
  const currentDisplayImage = imagePreview || (selectedProduct?.image_url)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-obsidian border border-border-dark rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto slide-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark sticky top-0 bg-obsidian z-10">
          <div>
            <h2 className="font-cormorant text-2xl text-white">Registrar Entrada de Inventario</h2>
            <p className="text-champagne/40 text-xs font-montserrat">Alimenta el catálogo de ventas y actualiza imágenes</p>
          </div>
          <button onClick={onClose} className="text-champagne/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo de entrada */}
          <div>
            <label className="label-dark">Tipo de entrada</label>
            <div className="grid grid-cols-2 gap-3">
              {MOVEMENT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`p-3 rounded-xl border text-sm font-montserrat text-left transition-all ${
                    type === value
                      ? 'border-scarlet bg-scarlet/10 text-white'
                      : 'border-border-dark text-champagne/60 hover:border-scarlet/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Producto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-dark">Producto</label>
              <button
                type="button"
                onClick={() => {
                  setIsNewProduct(!isNewProduct)
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="text-scarlet text-xs font-montserrat flex items-center gap-1 hover:underline"
              >
                <Plus size={12} />
                {isNewProduct ? 'Seleccionar existente' : 'Crear nuevo producto'}
              </button>
            </div>

            {isNewProduct ? (
              <div className="space-y-3 p-4 bg-noir rounded-xl border border-border-dark">
                <div>
                  <label className="label-dark">Nombre de la prenda</label>
                  <input
                    type="text"
                    className="input-dark"
                    placeholder="Ej: Vestido Gala Scarlet Glam"
                    value={form.new_product_name}
                    onChange={e => set('new_product_name', e.target.value)}
                    required={isNewProduct}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-dark">Categoría</label>
                    <select
                      className="input-dark"
                      value={form.new_product_category}
                      onChange={e => set('new_product_category', e.target.value)}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>
                          {c === 'mujer' ? 'Mujer' : c === 'ninos' ? 'Niños' : c === 'hombre' ? 'Hombre' : 'A Medida'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-dark">Precio venta (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-dark"
                      placeholder="0.00"
                      value={form.new_product_price}
                      onChange={e => set('new_product_price', e.target.value)}
                      required={isNewProduct}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-dark">Descripción de la prenda (opcional)</label>
                  <input
                    type="text"
                    className="input-dark"
                    placeholder="Ej: Alta costura, tela satén importada..."
                    value={form.new_product_description}
                    onChange={e => set('new_product_description', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-dark">Tallas disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-1 rounded-lg text-xs font-montserrat border transition-all ${
                          form.new_product_sizes.includes(s)
                            ? 'bg-scarlet border-scarlet text-white'
                            : 'border-border-dark text-champagne/50 hover:border-scarlet/50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <select
                className="input-dark"
                value={form.product_id}
                onChange={e => {
                  set('product_id', e.target.value)
                  setImageFile(null)
                  setImagePreview(null)
                }}
                required={!isNewProduct}
              >
                <option value="">— Selecciona una prenda del catálogo —</option>
                {loading ? (
                  <option disabled>Cargando...</option>
                ) : (
                  products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Carga de Imagen para la Landing Page */}
          <div>
            <label className="label-dark flex items-center justify-between">
              <span>Foto de la Prenda (Visible en Landing)</span>
              {currentDisplayImage && (
                <span className="text-[10px] text-emerald-400 font-normal">Foto cargada</span>
              )}
            </label>

            <div className="flex items-center gap-4 p-3 bg-noir/80 border border-border-dark rounded-xl">
              {currentDisplayImage ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border-dark flex-shrink-0 group">
                  <img
                    src={currentDisplayImage}
                    alt="Prenda"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    title="Quitar foto"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-obsidian border border-dashed border-border-dark flex items-center justify-center text-champagne/30 flex-shrink-0">
                  <ImageIcon size={22} />
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5"
                >
                  <UploadCloud size={14} className="text-scarlet" />
                  {currentDisplayImage ? 'Cambiar imagen' : 'Subir foto desde galería o cámara'}
                </button>
                <p className="text-[10px] text-champagne/40 mt-1">
                  Formatos JPG, PNG, WEBP (hasta 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="label-dark">Cantidad de unidades a sumar al stock</label>
            <input
              type="number"
              min="1"
              className="input-dark"
              placeholder="1"
              value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
              required
            />
          </div>

          {/* Campos adicionales de Compra */}
          {type === 'compra' && (
            <>
              <div>
                <label className="label-dark">Costo unitario de compra (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-dark"
                  placeholder="0.00"
                  value={form.unit_cost_usd}
                  onChange={e => set('unit_cost_usd', e.target.value)}
                />
                {form.unit_cost_usd && form.quantity && (
                  <p className="text-gold text-xs mt-1 font-montserrat">
                    Total compra: ${(parseFloat(form.unit_cost_usd) * parseInt(form.quantity)).toFixed(2)} USD
                  </p>
                )}
              </div>
              <div>
                <label className="label-dark">Proveedor</label>
                <select
                  className="input-dark mb-2"
                  value={form.supplier_id}
                  onChange={e => set('supplier_id', e.target.value)}
                >
                  <option value="">— Selecciona proveedor —</option>
                  <option value="__new__">+ Nuevo proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {form.supplier_id === '__new__' && (
                  <input
                    type="text"
                    className="input-dark"
                    placeholder="Nombre del nuevo proveedor"
                    value={form.new_supplier_name}
                    onChange={e => set('new_supplier_name', e.target.value)}
                  />
                )}
              </div>
            </>
          )}

          {/* Notas */}
          <div>
            <label className="label-dark">Notas (opcional)</label>
            <textarea
              className="input-dark resize-none"
              rows={2}
              placeholder={type === 'compra'
                ? 'Ej: Factura #001, lote importado...'
                : 'Ej: Confección exclusiva terminada por taller...'}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {/* Mensajes */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={saving || uploadingImage} className="btn-primary flex-1 justify-center">
              {saving || uploadingImage ? <Loader2 size={16} className="animate-spin" /> : null}
              {uploadingImage ? 'Subiendo imagen...' : saving ? 'Guardando...' : 'Registrar y Actualizar Catálogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
