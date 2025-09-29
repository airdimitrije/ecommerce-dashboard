import React, { useEffect, useState } from "react"
import api from "../services/api"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts"
import { 
  Package, DollarSign, ShoppingCart, Target, 
  BarChart3, Archive, FileText, ArrowRight, TrendingUp
} from "lucide-react"
import { useNavigate } from "react-router-dom"

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

interface OrdersByMonth {
  month: string
  order_count: number
}

interface Inventory {
  id: number
  product: number
  quantity_in: number
  quantity_out: number
  status: string
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [ordersData, setOrdersData] = useState<{ month: string; orders: number }[]>([])
  const [totalOrders, setTotalOrders] = useState<number>(0)
  const [totalValue, setTotalValue] = useState<string>("0.00")
  
  // Dashboard specific data
  const [recentTrend, setRecentTrend] = useState<{ month: string; revenue: number }[]>([])
  const [topCategories, setTopCategories] = useState<{ category: string; count: number }[]>([])
  const [lowStockCount, setLowStockCount] = useState<number>(0)

  const navigate = useNavigate()
  const navigateTo = (page: string) => {
    navigate(`/${page}`)
  }

  // API pozivi za podatke
  useEffect(() => {
    // Proizvodi
    api.get("products/").then((res) => {
      setProducts(res.data)
    }).catch(err => console.error(err))

    // Kategorije
    api.get("categories/").then((res) => {
      setCategories(res.data)
    }).catch(err => console.error(err))

    // Inventar
    api.get("inventory/").then((res) => {
      setInventory(res.data)

      // Broj proizvoda sa niskim zalihama
      const lowStock = res.data.filter((inv: Inventory) => inv.status === "out_of_stock").length
      setLowStockCount(lowStock)
    }).catch(err => console.error(err))

    // Narudžbe
    api.get("orders/").then((res) => {
      setTotalOrders(res.data.length)

      let total = 0
      const monthlyRevenue: Record<string, number> = {}
      const categoryCount: Record<string, number> = {}

      res.data.forEach((order: any) => {
        const month = new Date(order.time_created).toLocaleString("default", {
          month: "short",
          year: "numeric",
        })

        order.items.forEach((item: any) => {
          const itemTotal = parseFloat(item.final_price)
          total += itemTotal
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + itemTotal

          // Traženje kategorije preko product_name
          const product = products.find((p) => p.name === item.product_name)
          if (product) {
            const category = categories.find((c) => c.id === product.category)?.name || "Ostalo"
            categoryCount[category] = (categoryCount[category] || 0) + item.quantity
          }
        })
      })

      setTotalValue(total.toFixed(2))

      // Trend prihoda (poslednjih 6 mjeseci)
      const recentRevenue = Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .slice(-6)
      setRecentTrend(recentRevenue)

      // Top 5 kategorija
      const topCats = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      setTopCategories(topCats)
    }).catch(err => console.error(err))

    // Narudžbe po mjesecima
    api.get("orders-by-month/").then((res) => {
      const formatted = res.data.map((item: OrdersByMonth) => ({
        month: new Date(item.month).toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        orders: item.order_count,
      })).slice(-6)
      setOrdersData(formatted)
    }).catch(err => console.error(err))
  }, [products, categories])

  const COLORS = ["#EAB308", "#F59E0B", "#FBBF24", "#FCD34D", "#84CC16"]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
            Poslovni Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Pregled ključnih pokazatelja performansi</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupno proizvoda</p>
                <p className="text-3xl font-bold text-yellow-400">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
          
          <div className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupni prihod</p>
                <p className="text-3xl font-bold text-yellow-400">{totalValue} €</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
          
          <div className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupne narudžbe</p>
                <p className="text-3xl font-bold text-yellow-400">{totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>

          <div className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Niske zalihe</p>
                <p className="text-3xl font-bold text-red-400">{lowStockCount}</p>
              </div>
              <Target className="w-8 h-8 text-red-500/60" />
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
          <h3 className="text-yellow-400 mb-6 text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Brza navigacija
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <button 
              onClick={() => navigateTo("products")}
              className="group flex items-center justify-between p-4 bg-gray-800/50 border border-gray-600 rounded-lg hover:border-yellow-500/50 hover:bg-gray-700/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300 group-hover:text-white">Proizvodi</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-yellow-400" />
            </button>

            <button 
              onClick={() => navigateTo("inventory")}
              className="group flex items-center justify-between p-4 bg-gray-800/50 border border-gray-600 rounded-lg hover:border-yellow-500/50 hover:bg-gray-700/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300 group-hover:text-white">Inventar</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-yellow-400" />
            </button>

            <button 
              onClick={() => navigateTo("orders")}
              className="group flex items-center justify-between p-4 bg-gray-800/50 border border-gray-600 rounded-lg hover:border-yellow-500/50 hover:bg-gray-700/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300 group-hover:text-white">Narudžbe</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-yellow-400" />
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <h3 className="text-yellow-400 text-xl font-semibold">Trend prihoda (zadnjih 6 mjeseci)</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={recentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }}
                  formatter={(value) => [`${value}€`, "Prihod"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#F59E0B" 
                  fill="url(#revenueGradient)" 
                  strokeWidth={3} 
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Narudžbe po mjesecima</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }} />
                <Bar 
                  dataKey="orders" 
                  fill="url(#ordersGradient)" 
                  radius={[8, 8, 0, 0]} 
                />
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
          <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Top 5 kategorija po prodaji</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={topCategories} 
                dataKey="count" 
                nameKey="category" 
                outerRadius={120}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              >
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
