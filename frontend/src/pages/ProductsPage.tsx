import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter
} from "recharts"
import { 
  ChevronLeft, ChevronRight, Package, DollarSign, Search, 
  Filter, X, ArrowLeft, Plus, Edit, Trash2, Eye,
  TrendingUp, Target, AlertCircle, Loader2, BarChart3
} from "lucide-react"

// API Configuration
const API_BASE_URL = "http://127.0.0.1:8000/api"

// Interfaces
interface Product {
  id: number
  name: string
  price: string
  category: number
  category_name?: string
}

interface Category {
  id: number
  name: string
}

interface Inventory {
  id: number
  product: number
  quantity_in: number
  quantity_out: number
  status: string
}

interface OrderItem {
  product_name: string
  quantity: number
}

interface Order {
  id: number
  items: OrderItem[]
}

// API Functions
const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  }
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  // Analytics data
  const [priceDistribution, setPriceDistribution] = useState<{ range: string; count: number }[]>([])
  const [stockByCategory, setStockByCategory] = useState<{ category: string; stock: number }[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<{ category: string; count: number; avgPrice: number }[]>([])
  const [priceVsStock, setPriceVsStock] = useState<{ price: number; stock: number; name: string }[]>([])

  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    priceMin: '',
    priceMax: '',
    status: '',
    quantityMin: '',
    quantityMax: ''
  })

  const productsPerPage = 8

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load all data concurrently
        const [
          productsData,
          categoriesData, 
          inventoryData,
          ordersData
        ] = await Promise.all([
          api.get('/products/'),
          api.get('/categories/'),
          api.get('/inventory/'),
          api.get('/orders/')
        ])

        // Add category names to products
        const productsWithCategories = productsData.map((product: Product) => ({
          ...product,
          category_name: categoriesData.find((cat: Category) => cat.id === product.category)?.name
        }))

        setProducts(productsWithCategories)
        setCategories(categoriesData)
        setInventory(inventoryData)
        setOrders(ordersData)

        // Calculate price distribution
        calculatePriceDistribution(productsWithCategories)

      } catch (err) {
        console.error('Error loading data:', err)
        setError('Greška pri učitavanju podataka. Molimo pokušajte ponovo.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate analytics when data changes
  useEffect(() => {
    if (products.length && categories.length && inventory.length) {
      calculateCategoryDistribution()
      calculatePriceVsStock()
      calculateStockByCategory()
    }
  }, [products, categories, inventory])

  const calculatePriceDistribution = (productsData: Product[]) => {
    const prices = productsData.map(p => parseFloat(p.price))
    const priceRanges = [
      { range: "0-100€", min: 0, max: 100 },
      { range: "100-500€", min: 100, max: 500 },
      { range: "500-1000€", min: 500, max: 1000 },
      { range: "1000€+", min: 1000, max: Infinity }
    ]
    
    const priceDistrib = priceRanges.map(range => ({
      range: range.range,
      count: prices.filter(price => price >= range.min && price < range.max).length
    })).filter(item => item.count > 0)
    
    setPriceDistribution(priceDistrib)
  }

  const calculateStockByCategory = () => {
    const stockData = categories.map(cat => {
      const catProducts = products.filter(p => p.category === cat.id)
      const totalStock = catProducts.reduce((sum, product) => {
        const inv = inventory.find(i => i.product === product.id)
        return sum + (inv ? Math.max(0, inv.quantity_in - inv.quantity_out) : 0)
      }, 0)
      
      return {
        category: cat.name,
        stock: totalStock
      }
    }).filter(item => item.stock > 0)
    
    setStockByCategory(stockData)
  }

  const calculateCategoryDistribution = () => {
    const catData = categories.map(cat => {
      const catProducts = products.filter(p => p.category === cat.id)
      const avgPrice = catProducts.length > 0 
        ? catProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / catProducts.length 
        : 0
      
      return {
        category: cat.name,
        count: catProducts.length,
        avgPrice: Math.round(avgPrice)
      }
    }).filter(item => item.count > 0)
    
    setCategoryDistribution(catData)
  }

  const calculatePriceVsStock = () => {
    const scatterData = products.map(product => {
      const inv = inventory.find(i => i.product === product.id)
      const stock = inv ? inv.quantity_in - inv.quantity_out : 0
      return {
        price: parseFloat(product.price),
        stock: Math.max(0, stock),
        name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
      }
    }).filter(item => item.stock >= 0)
    
    setPriceVsStock(scatterData)
  }

  // Get inventory status
  const getInventoryStatus = (productId: number) => {
    const inv = inventory.find(i => i.product === productId)
    if (!inv) return { quantity: 0, status: 'N/A' }
    const quantity = Math.max(0, inv.quantity_in - inv.quantity_out)
    return { quantity, status: inv.status }
  }

  // Apply filters
  const filteredProducts = products.filter(product => {
    const invData = getInventoryStatus(product.id)
    const price = parseFloat(product.price)
    
    return (
      (!filters.name || product.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.category || categories.find(c => c.id === product.category)?.name.toLowerCase().includes(filters.category.toLowerCase())) &&
      (!filters.priceMin || price >= parseFloat(filters.priceMin)) &&
      (!filters.priceMax || price <= parseFloat(filters.priceMax)) &&
      (!filters.status || invData.status === filters.status) &&
      (!filters.quantityMin || invData.quantity >= parseInt(filters.quantityMin)) &&
      (!filters.quantityMax || invData.quantity <= parseInt(filters.quantityMax))
    )
  })

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  // Clear filters
  const clearFilters = () => {
    setFilters({
      name: '',
      category: '',
      priceMin: '',
      priceMax: '',
      status: '',
      quantityMin: '',
      quantityMax: ''
    })
  }

  const COLORS = ["#EAB308", "#F59E0B", "#FBBF24", "#FCD34D", "#84CC16", "#22D3EE", "#8B5CF6", "#F97316"]
  const hasActiveFilters = Object.values(filters).some(filter => filter !== '')

  // Navigation functions
  const goBack = () => {
    navigate('/')
  }

  const handleAction = async (action: string, productId?: number) => {
    if (action === 'view' && productId) {
      const product = products.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product)
        setShowProductModal(true)
      }
    }
  }

  // Product Detail Modal Component
  const ProductDetailModal = () => {
    if (!showProductModal || !selectedProduct) return null

    const invData = getInventoryStatus(selectedProduct.id)
    const category = categories.find(c => c.id === selectedProduct.category)

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-yellow-400/40 rounded-3xl w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100 animate-in">
          
          {/* Decorative top bar */}
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-t-3xl"></div>
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-yellow-400/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-yellow-400 uppercase tracking-wide">Pregled proizvoda</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Podaci iz baze</span>
                </div>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-gray-700/50 rounded-full transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Product Header */}
          <div className="px-8 py-6 text-center bg-gradient-to-r from-yellow-400/5 to-amber-400/5">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-2xl mb-4 border border-yellow-400/30">
              <Package className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2 leading-tight">{selectedProduct.name}</h4>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-full border border-gray-600">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span className="text-sm text-yellow-400 font-medium">ID #{selectedProduct.id}</span>
            </div>
          </div>

          {/* Details */}
          <div className="px-8 py-6 space-y-4">
            
            {/* Price */}
            <div className="group bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-2xl border border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-gray-300 font-medium">Cijena</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-400">{selectedProduct.price}</span>
                  <span className="text-green-300 ml-1">€</span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="group bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-gray-300 font-medium">Kategorija</span>
                </div>
                <span className="text-blue-400 font-semibold">{category?.name || 'N/A'}</span>
              </div>
            </div>

            {/* Stock */}
            <div className="group bg-gradient-to-r from-purple-500/10 to-violet-500/10 p-4 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-gray-300 font-medium">Na lageru</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-purple-400">{invData.quantity}</span>
                  <span className="text-purple-300 ml-1 text-sm">kom</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className={`group bg-gradient-to-r p-4 rounded-2xl border transition-all ${
              invData.status === 'available' 
                ? 'from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40'
                : invData.status === 'low_stock'
                ? 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20 hover:border-yellow-500/40'
                : 'from-red-500/10 to-rose-500/10 border-red-500/20 hover:border-red-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    invData.status === 'available' ? 'bg-green-500/20' :
                    invData.status === 'low_stock' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  }`}>
                    <AlertCircle className={`w-5 h-5 ${
                      invData.status === 'available' ? 'text-green-400' :
                      invData.status === 'low_stock' ? 'text-yellow-400' : 'text-red-400'
                    }`} />
                  </div>
                  <span className="text-gray-300 font-medium">Status</span>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                  invData.status === 'available' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : invData.status === 'low_stock'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {invData.status === 'available' ? 'Dostupno' :
                   invData.status === 'low_stock' ? 'Niska zaliha' :
                   'Nema na lageru'}
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-yellow-400/20">
            <button
              onClick={() => setShowProductModal(false)}
              className="w-full py-4 bg-gradient-to-r from-yellow-400/10 to-amber-400/10 border border-yellow-400/30 rounded-2xl text-yellow-400 font-semibold hover:from-yellow-400/20 hover:to-amber-400/20 hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Zatvori pregled
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-yellow-400 text-lg">Učitavanje podataka...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-all"
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header with Navigation */}
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
                Upravljanje proizvodima
              </h1>
              <p className="text-gray-400 mt-1">Analiza i pregled kataloga proizvoda</p>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupno proizvoda</p>
                <p className="text-3xl font-bold text-yellow-400">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Prosječna cijena</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {products.length > 0 ? 
                    Math.round(products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length) 
                    : 0} €
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Kategorije</p>
                <p className="text-3xl font-bold text-yellow-400">{categories.length}</p>
              </div>
              <Target className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Nema na lageru</p>
                <p className="text-3xl font-bold text-red-400">
                  {inventory.filter(inv => inv.status === 'out_of_stock').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500/60" />
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Price Distribution */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Raspodjela cijena</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={priceDistribution} dataKey="count" nameKey="range" outerRadius={100}>
                  {priceDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Analysis */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Kategorije - Broj i prosječna cijena</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#EAB308" name="Broj proizvoda" />
                <Bar yAxisId="right" dataKey="avgPrice" fill="#F59E0B" name="Prosječna cijena (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Stock by Category */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-yellow-400" />
              <h3 className="text-yellow-400 text-xl font-semibold">Zalihe po kategorijama</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }}
                  formatter={(value) => [`${value} kom`, 'Ukupno zaliha']}
                />
                <Bar dataKey="stock" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Price vs Stock Scatter */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Cijena vs Zalihe</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart data={priceVsStock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="stock" stroke="#9CA3AF" name="Zalihe" />
                <YAxis dataKey="price" stroke="#9CA3AF" name="Cijena (€)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308" }}
                  formatter={(value: any, name: any) => [
                    name === 'price' ? `${value}€` : value,
                    name === 'price' ? 'Cijena' : 'Zalihe'
                  ]}
                  labelFormatter={(label: any) => label || ''}
                />
                <Scatter dataKey="price" fill="#8B5CF6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 rounded-2xl overflow-hidden">
          
          {/* Table Header */}
          <div className="p-6 border-b border-yellow-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-yellow-400 text-xl font-semibold">Lista proizvoda</h3>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                    {Object.values(filters).filter(f => f !== '').length} filtera aktivno
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

          {/* Filter Controls */}
          {showFilters && (
            <div className="p-6 border-b border-yellow-500/30 bg-gray-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Naziv proizvoda</label>
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(e) => setFilters({...filters, name: e.target.value})}
                    placeholder="Pretraži po nazivu..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Kategorija</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="">Sve kategorije</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min. cijena (€)</label>
                  <input
                    type="number"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max. cijena (€)</label>
                  <input
                    type="number"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                    placeholder="9999"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status zaliha</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="">Svi statusi</option>
                    <option value="available">Dostupno</option>
                    <option value="low_stock">Niska zaliha</option>
                    <option value="out_of_stock">Nema na lageru</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min. količina</label>
                  <input
                    type="number"
                    value={filters.quantityMin}
                    onChange={(e) => setFilters({...filters, quantityMin: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max. količina</label>
                  <input
                    type="number"
                    value={filters.quantityMax}
                    onChange={(e) => setFilters({...filters, quantityMax: e.target.value})}
                    placeholder="999"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
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
                Prikazano: {filteredProducts.length} od {products.length} proizvoda
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProducts.map((product) => {
                const invData = getInventoryStatus(product.id)
                const category = categories.find(c => c.id === product.category)
                
                return (
                  <div key={product.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-yellow-500/50 transition-all group">
                    
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-yellow-400 font-medium text-sm">#{product.id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invData.status === 'available' ? 'bg-green-500/20 text-green-400' :
                        invData.status === 'low_stock' ? 'bg-yellow-500/20 text-yellow-400' :
                        invData.status === 'out_of_stock' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {invData.status === 'available' ? 'Dostupno' :
                         invData.status === 'low_stock' ? 'Niska zaliha' :
                         invData.status === 'out_of_stock' ? 'Nema na lageru' : 'N/A'}
                      </span>
                    </div>

                    {/* Product Info */}
                    <h4 className="text-white font-medium text-lg leading-tight mb-3 group-hover:text-yellow-400 transition-colors">
                      {product.name}
                    </h4>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Cijena:</span>
                        <span className="text-yellow-400 font-semibold text-lg">{product.price} €</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Zalihe:</span>
                        <span className="text-white font-medium">{invData.quantity}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Kategorija:</span>
                        <span className="text-gray-300 text-sm">{category?.name || "N/A"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center pt-3 border-t border-gray-700">
                      <button 
                        onClick={() => handleAction('view', product.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Pregled proizvoda
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty State */}
            {currentProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl text-gray-400 mb-2">Nema proizvoda</h3>
                <p className="text-gray-500">Nema proizvoda koji odgovaraju vašim filterima.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Prikazano {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} od {filteredProducts.length}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prethodna
                  </button>
                  <span className="text-gray-400 font-medium">
                    Stranica {currentPage} od {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Sljedeća
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Detail Modal */}
        <ProductDetailModal />

      </div>
    </div>
  )
}