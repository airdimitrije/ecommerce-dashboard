import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area, 
  ComposedChart, ScatterChart, Scatter
} from "recharts"
import { 
  ArrowLeft, ShoppingCart, DollarSign, TrendingUp, 
  Calendar, Users, Eye, Filter, X, Search,
  CheckCircle, Clock, AlertCircle, Package, RefreshCw
} from "lucide-react"

interface Order {
  id: number
  time_created: string
  status: string
  total_amount: number
  customer_name?: string
  items: OrderItem[]
}

interface OrderItem {
  id: number
  product: number
  product_name: string
  quantity: number
  price: string
  final_price: string
}

interface Product {
  id: number
  name: string
  price: string
  category: number
}

interface Category {
  id: number
  name: string
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Analytics data
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; orders: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; revenue: number; quantity: number }[]>([])
  const [ordersByStatus, setOrdersByStatus] = useState<{ status: string; count: number; percentage: number }[]>([])
  const [dailyTrend, setDailyTrend] = useState<{ date: string; orders: number; revenue: number }[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<{ category: string; revenue: number }[]>([])
  const [averageOrderValue, setAverageOrderValue] = useState<{ month: string; avgValue: number }[]>([])

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date' // date, amount, status
  })

  const ordersPerPage = 10

  // Funkcija za dohvaćanje podataka
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersRes, productsRes, categoriesRes] = await Promise.all([
        api.get("orders/"),
        api.get("products/"),
        api.get("categories/")
      ])

      // Provjeri da li su podaci stvarno dostupni
      if (!ordersRes.data || ordersRes.data.length === 0) {
        console.warn("Nema podataka o narudžbama")
      }
      
      if (!productsRes.data || productsRes.data.length === 0) {
        console.warn("Nema podataka o proizvodima")
      }
      
      if (!categoriesRes.data || categoriesRes.data.length === 0) {
        console.warn("Nema podataka o kategorijama")
      }

      // Postavi podatke
      setOrders(ordersRes.data || [])
      setProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
      setFilteredOrders(ordersRes.data || [])

    } catch (err) {
      console.error("Greška pri dohvaćanju podataka:", err)
      setError("Greška pri učitavanju podataka. Molimo pokušajte kasnije.")
    } finally {
      setLoading(false)
    }
  }

  // Početno učitavanje podataka
  useEffect(() => {
    fetchData()
  }, [])

  // Provjeri da li su narudžbe pravilno struktuirane
  const processOrders = (rawOrders: any[]) => {
    return rawOrders.map(order => {
      // Provjeri da li narudžba ima items
      if (!order.items || !Array.isArray(order.items)) {
        console.warn(`Narudžba ${order.id} nema validne items`)
        return {
          ...order,
          items: [],
          total_amount: 0
        }
      }

      // Kalkuliraj ukupnu cijenu na osnovu stavki
      const calculatedTotal = order.items.reduce((sum: number, item: any) => {
        const itemPrice = parseFloat(item.final_price || item.price || '0')
        return sum + itemPrice
      }, 0)

      return {
        ...order,
        total_amount: order.total_amount || calculatedTotal,
        items: order.items.map((item: any) => ({
          ...item,
          price: item.price || '0',
          final_price: item.final_price || item.price || '0'
        }))
      }
    })
  }

  // Analytics calculations
  useEffect(() => {
    if (orders.length && products.length && categories.length) {
      // Proces narudžbi da osiguramo pravilnu strukturu
      const processedOrders = processOrders(orders)
      
      // 1. Revenue by month
      const monthlyData: Record<string, { revenue: number; orders: number }> = {}
      const productSales: Record<string, { revenue: number; quantity: number }> = {}
      const categoryData: Record<string, number> = {}
      const statusCount: Record<string, number> = {}

      processedOrders.forEach(order => {
        const orderDate = new Date(order.time_created)
        
        // Provjeri da li je datum valjan
        if (isNaN(orderDate.getTime())) {
          console.warn(`Nevažeći datum za narudžbu ${order.id}:`, order.time_created)
          return
        }

        const month = orderDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        })

        // Monthly revenue and orders
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, orders: 0 }
        }
        
        let orderTotal = 0
        
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: OrderItem) => {
            const itemTotal = parseFloat(item.final_price || '0')
            orderTotal += itemTotal

            // Product sales
            const productName = item.product_name || `Proizvod ${item.product}`
            if (!productSales[productName]) {
              productSales[productName] = { revenue: 0, quantity: 0 }
            }
            productSales[productName].revenue += itemTotal
            productSales[productName].quantity += item.quantity || 1

            // Category revenue
            const product = products.find(p => p.id === item.product)
            if (product) {
              const category = categories.find(c => c.id === product.category)?.name || "Ostalo"
              categoryData[category] = (categoryData[category] || 0) + itemTotal
            }
          })
        }

        // Koristi kalkulirani total ili postojeći
        const finalTotal = orderTotal > 0 ? orderTotal : (order.total_amount || 0)
        monthlyData[month].revenue += finalTotal
        monthlyData[month].orders += 1

        // Status count
        statusCount[order.status] = (statusCount[order.status] || 0) + 1
      })

      // Format revenue data
      const revenueArray = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        orders: data.orders
      })).sort((a, b) => {
        // Sortiranje po datumu
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
      setRevenueData(revenueArray)

      // Top products by revenue
      const topProds = Object.entries(productSales)
        .map(([name, data]) => ({
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          revenue: Math.round(data.revenue),
          quantity: data.quantity
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
      setTopProducts(topProds)

      // Orders by status
      const total = processedOrders.length
      const statusArray = Object.entries(statusCount).map(([status, count]) => ({
        status: status === 'completed' ? 'Završeno' : 
                status === 'pending' ? 'Na čekanju' :
                status === 'processing' ? 'U obradi' :
                status === 'cancelled' ? 'Otkazano' : status,
        count: count as number,
        percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0
      }))
      setOrdersByStatus(statusArray)

      // Category revenue
      const catRevenue = Object.entries(categoryData)
        .map(([category, revenue]) => ({
          category,
          revenue: Math.round(revenue)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)
      setCategoryRevenue(catRevenue)

      // Average order value by month
      const avgOrderData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        avgValue: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0
      }))
      setAverageOrderValue(avgOrderData)

      // Daily trend (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const last30Days = processedOrders
        .filter(order => {
          const orderDate = new Date(order.time_created)
          return orderDate >= thirtyDaysAgo && !isNaN(orderDate.getTime())
        })
        .reduce((acc: Record<string, { orders: number; revenue: number }>, order) => {
          const date = new Date(order.time_created).toLocaleDateString()
          if (!acc[date]) {
            acc[date] = { orders: 0, revenue: 0 }
          }
          acc[date].orders += 1
          
          const orderRevenue = order.items?.reduce((sum: number, item: OrderItem) => 
            sum + parseFloat(item.final_price || '0'), 0) || order.total_amount || 0
          acc[date].revenue += orderRevenue
          
          return acc
        }, {})

      const dailyArray = Object.entries(last30Days)
        .map(([date, data]) => ({
          date,
          orders: data.orders,
          revenue: Math.round(data.revenue)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-15) // Last 15 days for better readability

      setDailyTrend(dailyArray)
    }
  }, [orders, products, categories])

  // Apply filters
  useEffect(() => {
    let filtered = [...orders]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(order => 
        order.id.toString().includes(filters.search) ||
        order.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.items?.some(item => 
          item.product_name?.toLowerCase().includes(filters.search.toLowerCase())
        )
      )
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.time_created) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.time_created) <= new Date(filters.dateTo + 'T23:59:59')
      )
    }

    // Amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(order => 
        (order.total_amount || 0) >= parseFloat(filters.minAmount)
      )
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(order => 
        (order.total_amount || 0) <= parseFloat(filters.maxAmount)
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'amount':
          return (b.total_amount || 0) - (a.total_amount || 0)
        case 'status':
          return a.status.localeCompare(b.status)
        default: // date
          return new Date(b.time_created).getTime() - new Date(a.time_created).getTime()
      }
    })

    setFilteredOrders(filtered)
    setCurrentPage(1)
  }, [filters, orders])

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date'
    })
  }

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-orange-400" />
      case 'cancelled':
        return <X className="w-4 h-4 text-red-400" />
      default:
        return <Package className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno'
      case 'processing': return 'U obradi'
      case 'pending': return 'Na čekanju'
      case 'cancelled': return 'Otkazano'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const goBack = () => {
    navigate('/')
  }

  const viewOrderDetails = (orderId: number) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setShowOrderModal(true)
    }
  }

  // Kalkuliraj ukupni prihod sigurno
  const calculateTotalRevenue = () => {
    return orders.reduce((sum, order) => {
      const orderTotal = order.items?.reduce((itemSum, item) => 
        itemSum + parseFloat(item.final_price || '0'), 0) || order.total_amount || 0
      return sum + orderTotal
    }, 0)
  }

  // Kalkuliraj prosječnu narudžbu
  const calculateAverageOrder = () => {
    const total = calculateTotalRevenue()
    return orders.length > 0 ? Math.round(total / orders.length) : 0
  }

  // Kalkuliraj narudžbe ovog mjeseca
  const getThisMonthOrders = () => {
    const now = new Date()
    return orders.filter(order => {
      const orderDate = new Date(order.time_created)
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear()
    }).length
  }

  const COLORS = ["#22D3EE", "#EAB308", "#F87171", "#84CC16", "#A78BFA", "#F59E0B", "#8B5CF6", "#F97316"]
  const hasActiveFilters = Object.values(filters).some((filter, index) => 
    index === 6 ? filter !== 'date' : filter !== '' // sortBy default is 'date'
  )

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-yellow-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Učitavam podatke...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl text-red-400 mb-2">Greška</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all"
          >
            Pokušaj ponovno
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
                Analiza narudžbi
              </h1>
              <p className="text-gray-400 mt-1">Pregled prodaje, prihoda i analitika narudžbi</p>
            </div>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Osvježi
          </button>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupno narudžbi</p>
                <p className="text-3xl font-bold text-blue-400">{orders.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-500/60" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupni prihod</p>
                <p className="text-3xl font-bold text-green-400">
                  {calculateTotalRevenue().toFixed(0)} €
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500/60" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Prosječna narudžba</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {calculateAverageOrder()} €
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ovaj mjesec</p>
                <p className="text-3xl font-bold text-purple-400">
                  {getThisMonthOrders()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500/60" />
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Trend */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <h3 className="text-yellow-400 text-xl font-semibold">Prihod i narudžbe po mjesecima</h3>
            </div>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#22D3EE" name="Narudžbe" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#EAB308" strokeWidth={3} name="Prihod (€)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Nema podataka za prikaz
              </div>
            )}
          </div>

          {/* Order Status Distribution */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Distribucija po statusu</h3>
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={ordersByStatus} 
                    dataKey="count" 
                    nameKey="status" 
                    outerRadius={100}
                    label={({ status, percentage }) => `${status} ${percentage}%`}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Nema podataka za prikaz
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Products by Revenue */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Top proizvodi po prihodu</h3>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#9CA3AF" 
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }}
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? `${value}€` : `${value} kom`,
                      name === 'revenue' ? 'Prihod' : 'Količina'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#22D3EE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-gray-400">
                <Package className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">
                  {orders.length === 0 ? 'Nema narudžbi za analizu' : 'Nema podataka o proizvodima'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Dodajte narudžbe s proizvodima da vidite statistike
                </p>
              </div>
            )}
          </div>

          {/* Daily Trend */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-yellow-400" />
              <h3 className="text-yellow-400 text-xl font-semibold">Dnevni trend (zadnjih 15 dana)</h3>
            </div>
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('sr-RS', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('sr-RS')}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#8B5CF6" name="Narudžbe" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3} name="Prihod (€)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400">
                Nema podataka za prikaz
              </div>
            )}
          </div>
        </div>

        {/* Category Revenue & Average Order Value */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Revenue */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Prihod po kategorijama</h3>
            {categoryRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }}
                    formatter={(value: any) => [`${value}€`, 'Prihod']}
                  />
                  <Bar dataKey="revenue" fill="#84CC16" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Nema podataka za prikaz
              </div>
            )}
          </div>

          {/* Average Order Value */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Prosječna vrijednost narudžbe</h3>
            {averageOrderValue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={averageOrderValue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }}
                    formatter={(value: any) => [`${value}€`, 'Prosječna vrijednost']}
                  />
                  <Line type="monotone" dataKey="avgValue" stroke="#F97316" strokeWidth={3} dot={{ fill: "#F97316", r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Nema podataka za prikaz
              </div>
            )}
          </div>
        </div>

        {/* Data Status Indicator */}
        {orders.length === 0 && !loading && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-yellow-400 font-semibold">Nema podataka</h3>
                <p className="text-gray-400">
                  API je povezan, ali nema podataka o narudžbama. Provjerite bazu podataka ili dodajte test podatke.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 rounded-2xl overflow-hidden">
          
          {/* Table Header */}
          <div className="p-6 border-b border-yellow-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-yellow-400 text-xl font-semibold">Lista narudžbi</h3>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                    Aktivni filteri
                  </span>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all"
                >
                  <Filter className="w-4 h-4" />
                  Filteri
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-6 border-b border-yellow-500/30 bg-gray-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Pretraži</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      placeholder="ID, kupac ili proizvod..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="">Svi statusi</option>
                    <option value="completed">Završeno</option>
                    <option value="processing">U obradi</option>
                    <option value="pending">Na čekanju</option>
                    <option value="cancelled">Otkazano</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Datum od</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Datum do</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min. iznos (€)</label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max. iznos (€)</label>
                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                    placeholder="9999"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sortiraj po</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="date">Datum</option>
                    <option value="amount">Iznos</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Očisti
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-400">
                Prikazano: {filteredOrders.length} od {orders.length} narudžbi
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="p-6">
            <div className="space-y-4">
              {currentOrders.map((order) => {
                const orderTotal = order.items?.reduce((sum: number, item: OrderItem) => 
                  sum + parseFloat(item.final_price || '0'), 0) || order.total_amount || 0
                
                return (
                  <div key={order.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-yellow-500/50 transition-all">
                    
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400 font-medium">#{order.id}</span>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-yellow-400 font-semibold text-lg">{orderTotal.toFixed(2)} €</div>
                        <div className="text-gray-400 text-sm">
                          {new Date(order.time_created).toLocaleDateString('sr-RS', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    {order.customer_name && (
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{order.customer_name}</span>
                      </div>
                    )}

                    {/* Order Items */}
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <div className="text-gray-400 text-sm font-medium">Proizvodi:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {order.items.slice(0, 6).map((item: OrderItem) => (
                            <div key={item.id} className="bg-gray-700/30 rounded-lg p-2 text-sm">
                              <div className="text-white font-medium truncate">
                                {item.product_name || `Proizvod ${item.product}`}
                              </div>
                              <div className="flex justify-between text-gray-400">
                                <span>{item.quantity || 1}x {item.price || '0'}€</span>
                                <span className="text-yellow-400">{item.final_price || item.price || '0'}€</span>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 6 && (
                            <div className="bg-gray-700/30 rounded-lg p-2 text-sm flex items-center justify-center text-gray-400">
                              +{order.items.length - 6} više
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-700/30 rounded-lg p-3 text-sm text-gray-400 mb-4">
                        Nema stavki narudžbe
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Ukupno: {order.items?.length || 0} stavki</span>
                        <span>•</span>
                        <span>
                          {new Date(order.time_created).toLocaleTimeString('sr-RS', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => viewOrderDetails(order.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Detalji
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty State - No results from filters */}
            {currentOrders.length === 0 && orders.length > 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl text-gray-400 mb-2">Nema rezultata</h3>
                <p className="text-gray-500">Nema narudžbi koje odgovaraju vašim filterima.</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all"
                >
                  Očisti filtere
                </button>
              </div>
            )}

            {/* Empty State - No orders at all */}
            {orders.length === 0 && !loading && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl text-gray-400 mb-2">Nema narudžbi</h3>
                <p className="text-gray-500">
                  API je povezan, ali nema podataka o narudžbama u bazi.
                </p>
                <button
                  onClick={fetchData}
                  className="mt-4 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
                >
                  Osvježi podatke
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Prikazano {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} od {filteredOrders.length}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage((p: number) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Prethodna
                  </button>
                  <span className="text-gray-400 font-medium">
                    Stranica {currentPage} od {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p: number) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Sljedeća
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-yellow-500/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {getStatusText(selectedOrder.status)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-yellow-400">
                      Narudžba #{selectedOrder.id}
                    </h2>
                    <p className="text-gray-400">
                      {new Date(selectedOrder.time_created).toLocaleString('sr-RS', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Order Details */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Customer Info */}
                    {selectedOrder.customer_name && (
                      <div className="bg-gray-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Users className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-semibold text-blue-400">Informacije o kupcu</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-400">Ime kupca</label>
                            <p className="text-white font-medium">{selectedOrder.customer_name}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">ID narudžbe</label>
                            <p className="text-white font-medium">#{selectedOrder.id}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Package className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-green-400">
                          Stavke narudžbe ({selectedOrder.items?.length || 0})
                        </h3>
                      </div>
                      
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <div className="space-y-3">
                          {selectedOrder.items.map((item, index) => (
                            <div key={item.id || index} className="bg-gray-700/30 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium mb-1">
                                    {item.product_name || `Proizvod ${item.product}`}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span>Količina: {item.quantity || 1}</span>
                                    <span>•</span>
                                    <span>Cijena: {item.price || '0'}€</span>
                                    {item.final_price !== item.price && (
                                      <>
                                        <span>•</span>
                                        <span className="text-yellow-400">Konačna: {item.final_price}€</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-yellow-400">
                                    {((item.quantity || 1) * parseFloat(item.final_price || item.price || '0')).toFixed(2)}€
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    ukupno
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-4">Nema stavki u narudžbi</p>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-6">
                    
                    {/* Total Summary */}
                    <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-yellow-400 mb-4">Sažetak narudžbe</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Broj stavki:</span>
                          <span className="text-white">{selectedOrder.items?.length || 0}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Ukupna količina:</span>
                          <span className="text-white">
                            {selectedOrder.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0}
                          </span>
                        </div>
                        
                        <div className="border-t border-yellow-500/30 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-yellow-400">Ukupno:</span>
                            <span className="text-2xl font-bold text-yellow-400">
                              {(selectedOrder.items?.reduce((sum, item) => 
                                sum + parseFloat(item.final_price || '0'), 0) || selectedOrder.total_amount || 0
                              ).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-purple-400 mb-4">Vremenska linija</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                          <div>
                            <p className="text-white font-medium">Narudžba kreirana</p>
                            <p className="text-sm text-gray-400">
                              {new Date(selectedOrder.time_created).toLocaleString('sr-RS')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedOrder.status === 'completed' ? 'bg-green-400' :
                            selectedOrder.status === 'processing' ? 'bg-yellow-400' :
                            selectedOrder.status === 'cancelled' ? 'bg-red-400' : 'bg-gray-400'
                          }`}></div>
                          <div>
                            <p className="text-white font-medium">
                              Status: {getStatusText(selectedOrder.status)}
                            </p>
                            <p className="text-sm text-gray-400">Trenutno stanje</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-blue-400 mb-4">Brze akcije</h3>
                      
                      <div className="space-y-2">
                        <button className="w-full px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all text-sm">
                          Ažuriraj status
                        </button>
                        <button className="w-full px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-all text-sm">
                          Generiraj račun
                        </button>
                        <button className="w-full px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all text-sm">
                          Kontaktiraj kupca
                        </button>
                        <button className="w-full px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all text-sm">
                          Ispiši detalje
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}