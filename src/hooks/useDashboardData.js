import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function useDashboardData() {
  const [data, setData] = useState({
    orders: [],
    orderItems: [],
    products: [],
    appointments: [],
    movements: [],
    exchangeRate: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchAll() {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

      const [
        { data: orders },
        { data: orderItems },
        { data: products },
        { data: appointments },
        { data: movements },
        { data: rates },
      ] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
        supabase.from('appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('exchange_rates').select('*').order('created_at', { ascending: false }).limit(1),
      ])

      setData({
        orders: orders || [],
        orderItems: orderItems || [],
        products: products || [],
        appointments: appointments || [],
        movements: movements || [],
        exchangeRate: rates?.[0] || null,
        monthStart,
        prevMonthStart,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()

    // Real-time subscription
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_movements' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // ── Computed KPIs ──────────────────────────────────────────────
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const monthOrders = data.orders.filter(o => new Date(o.created_at) >= monthStart)
  const prevMonthOrders = data.orders.filter(o => {
    const d = new Date(o.created_at)
    return d >= prevMonthStart && d <= prevMonthEnd
  })

  const monthRevenue = monthOrders.reduce((s, o) => s + parseFloat(o.total_usd || 0), 0)
  const prevMonthRevenue = prevMonthOrders.reduce((s, o) => s + parseFloat(o.total_usd || 0), 0)
  const revenueChange = prevMonthRevenue > 0
    ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : null

  const pendingOrders = data.orders.filter(o =>
    ['Pendiente de verificación', 'Pendiente', 'Verificado', 'En confección'].includes(o.status)
  ).length

  const completedOrders = data.orders.filter(o => o.status === 'Despachado').length

  const monthAppointments = data.appointments.filter(a => new Date(a.created_at) >= monthStart).length

  const lowStockProducts = data.products.filter(p => p.stock <= 5)

  // Top product by units sold
  const productSales = {}
  data.orderItems.forEach(item => {
    productSales[item.product_name] = (productSales[item.product_name] || 0) + item.quantity
  })
  const topProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Top category
  const catSales = {}
  data.orderItems.forEach(item => {
    const prod = data.products.find(p => p.id === item.product_id)
    const cat = prod?.category || 'otros'
    catSales[cat] = (catSales[cat] || 0) + item.quantity
  })
  const topCategory = Object.entries(catSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Top payment method
  const paymentCounts = {}
  data.orders.forEach(o => {
    paymentCounts[o.payment_method] = (paymentCounts[o.payment_method] || 0) + 1
  })
  const topPayment = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Top delivery type
  const deliveryCounts = {}
  data.orders.forEach(o => {
    deliveryCounts[o.delivery_type] = (deliveryCounts[o.delivery_type] || 0) + 1
  })
  const topDelivery = Object.entries(deliveryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Inventory value
  const inventoryValue = data.products.reduce((s, p) =>
    s + (parseFloat(p.price_usd || 0) * (p.stock || 0)), 0)

  const kpis = {
    monthRevenue,
    prevMonthRevenue,
    revenueChange,
    monthOrders: monthOrders.length,
    pendingOrders,
    completedOrders,
    monthAppointments,
    lowStockCount: lowStockProducts.length,
    topProduct,
    topCategory,
    topPayment,
    topDelivery,
    inventoryValue,
    exchangeRate: data.exchangeRate?.rate_usd_to_bs,
  }

  // Chart data: daily revenue this month
  const dailyRevenue = {}
  monthOrders.forEach(o => {
    const day = o.created_at?.slice(0, 10)
    dailyRevenue[day] = (dailyRevenue[day] || 0) + parseFloat(o.total_usd || 0)
  })
  const salesChartData = Object.entries(dailyRevenue)
    .sort()
    .map(([date, total]) => ({ date: date.slice(5), total: parseFloat(total.toFixed(2)) }))

  // Orders by status
  const statusCounts = {}
  data.orders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })
  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  // Category distribution
  const catChartData = Object.entries(catSales).map(([name, value]) => ({
    name: name === 'mujer' ? 'Mujer' : name === 'ninos' ? 'Niños' : name === 'hombre' ? 'Hombre' : 'A Medida',
    value,
  }))

  // Payment methods chart
  const paymentChartData = Object.entries(paymentCounts).map(([name, value]) => ({ name, value }))

  // Top products chart (top 8)
  const topProductsData = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, vendidos]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, vendidos }))
    .reverse()

  // Delivery types
  const deliveryChartData = Object.entries(deliveryCounts).map(([name, value]) => ({ name, value }))

  // Stock chart data
  const stockChartData = data.products
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 12)
    .map(p => ({
      name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
      stock: p.stock,
      alert: p.stock <= 5 ? 'low' : 'ok',
    }))

  // Appointments by date (for calendar)
  const apptByDate = {}
  data.appointments.forEach(a => {
    apptByDate[a.scheduled_date] = (apptByDate[a.scheduled_date] || 0) + 1
  })

  return {
    ...data,
    loading,
    error,
    kpis,
    salesChartData,
    statusChartData,
    catChartData,
    paymentChartData,
    topProductsData,
    deliveryChartData,
    stockChartData,
    apptByDate,
    lowStockProducts,
    monthOrders,
    refetch: fetchAll,
  }
}
