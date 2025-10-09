import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter
} from "recharts"
import { 
  ChevronLeft, ChevronRight, Package, DollarSign, Search, 
  Filter, X, ArrowLeft, Plus, Edit, Trash2, Eye,
  TrendingUp, Target, AlertCircle, Loader2, BarChart3, Menu
} from "lucide-react"
import api from "../services/api"
import EditProductForm from "../components/EditProductForm"
import AddProductForm from "../components/AddProductForm"


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

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [priceDistribution, setPriceDistribution] = useState<{ range: string; count: number }[]>([])
  const [stockByCategory, setStockByCategory] = useState<{ category: string; stock: number }[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<{ category: string; count: number; avgPrice: number }[]>([])
  const [priceVsStock, setPriceVsStock] = useState<{ price: number; stock: number; name: string }[]>([])

  const [filters, setFilters] = useState({
    category: '',
    priceMin: '',
    priceMax: '',
    status: '',
    quantityMin: '',
    quantityMax: ''
  })

  const productsPerPage = 8

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, sortOption])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.append('page', currentPage.toString())
        
        if (searchQuery) params.append('search', searchQuery)
        if (sortOption) {
          const orderingMap: { [key: string]: string } = {
            'price_asc': 'price',
            'price_desc': '-price',
            'name_asc': 'name',
            'name_desc': '-name',
            'category': 'category'
          }
          params.append('ordering', orderingMap[sortOption] || '')
        }
        if (filters.category) {
          const cat = categories.find(c => c.name === filters.category)
          if (cat) params.append('category', cat.id.toString())
        }
        if (filters.priceMin) params.append('price__gte', filters.priceMin)
        if (filters.priceMax) params.append('price__lte', filters.priceMax)

        const [productsRes, allProductsRes, categoriesRes, inventoryRes, ordersRes] = await Promise.all([
          api.get(`/products/?${params.toString()}`),
          api.get('/products/?page_size=9999'),
          api.get('/categories/?page_size=9999'),
          api.get('/inventory/?page_size=9999'),
          api.get('/orders/?page_size=9999')
        ])

        const productsList = productsRes.data.results || productsRes.data
        const allList = allProductsRes.data.results || allProductsRes.data
        const categoriesList = categoriesRes.data.results || categoriesRes.data
        const inventoryList = inventoryRes.data.results || inventoryRes.data
        const ordersList = ordersRes.data.results || ordersRes.data

        const productsWithCategories = productsList.map((product: Product) => ({
          ...product,
          category_name: categoriesList.find((cat: Category) => cat.id === product.category)?.name
        }))

        const allProductsWithCategories = allList.map((product: Product) => ({
          ...product,
          category_name: categoriesList.find((cat: Category) => cat.id === product.category)?.name
        }))

        setProducts(productsWithCategories)
        setAllProducts(allProductsWithCategories)
        setCategories(categoriesList)
        setInventory(inventoryList)
        setOrders(ordersList)

        const totalCount = productsRes.data.count || productsList.length
        setTotalPages(Math.ceil(totalCount / productsPerPage))

        calculatePriceDistribution(allProductsWithCategories)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Greška pri učitavanju podataka. Molimo pokušajte ponovo.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentPage, searchQuery, sortOption, filters.category, filters.priceMin, filters.priceMax])

  useEffect(() => {
    if (allProducts.length > 0 && categories.length > 0 && inventory.length > 0) {
      calculateCategoryDistribution()
      calculatePriceVsStock()
      calculateStockByCategory()
    }
  }, [allProducts, categories, inventory])

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
    if (!Array.isArray(categories) || !Array.isArray(allProducts) || !Array.isArray(inventory)) {
      return
    }
    
    const stockData = categories.map(cat => {
      const catProducts = allProducts.filter(p => p.category === cat.id)
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
    if (!Array.isArray(categories) || !Array.isArray(allProducts)) {
      return
    }
    
    const catData = categories.map(cat => {
      const catProducts = allProducts.filter(p => p.category === cat.id)
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
    if (!Array.isArray(allProducts) || !Array.isArray(inventory)) {
      return
    }
    
    const scatterData = allProducts.map(product => {
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

  const getInventoryStatus = (productId: number) => {
  const inv = inventory.find(i => i.product === productId)
  if (!inv) return { quantity: 0, status: 'N/A' }

  const quantity = Math.max(0, inv.quantity_in - inv.quantity_out)

  let status = 'available'
  if (quantity === 0) status = 'out_of_stock'
  else if (quantity < 10) status = 'low_stock'

  return { quantity, status }
}


  const filteredProducts = products.filter(product => {
    const invData = getInventoryStatus(product.id)
    
    return (
      (!filters.status || invData.status === filters.status) &&
      (!filters.quantityMin || invData.quantity >= parseInt(filters.quantityMin)) &&
      (!filters.quantityMax || invData.quantity <= parseInt(filters.quantityMax))
    )
  })

  const sortedProducts = [...filteredProducts]

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const clearFilters = () => {
    setFilters({
      category: '',
      priceMin: '',
      priceMax: '',
      status: '',
      quantityMin: '',
      quantityMax: ''
    })
    setSearchQuery('')
    setSortOption('')
    setCurrentPage(1)
  }

  const COLORS = ["#EAB308", "#F59E0B", "#FBBF24", "#FCD34D", "#84CC16", "#22D3EE", "#8B5CF6", "#F97316"]
  const hasActiveFilters = Object.values(filters).some(filter => filter !== '') || searchQuery !== ''

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
    } else if (action === 'edit' && productId) {
      const product = products.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product)
        setShowEditModal(true)
      }
    } else if (action === 'delete' && productId) {
      setDeleteProductId(productId)
      setShowDeleteModal(true)
    } else if (action === 'add') {
      setShowAddModal(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return
    
    try {
      await api.delete(`/products/${deleteProductId}/`)
      setProducts(products.filter(p => p.id !== deleteProductId))
      setAllProducts(allProducts.filter(p => p.id !== deleteProductId))
      setShowDeleteModal(false)
      setDeleteProductId(null)
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Greška pri brisanju proizvoda')
    }
  }

  const ProductDetailModal = () => {
    if (!showProductModal || !selectedProduct) return null

    const invData = getInventoryStatus(selectedProduct.id)
    const category = categories.find(c => c.id === selectedProduct.category)

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-yellow-400/40 rounded-3xl w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-t-3xl"></div>
          
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

          <div className="px-8 py-6 space-y-4">
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

  const FilterSidebar = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Kategorija</label>
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none transition-colors"
        >
          <option value="">Sve kategorije</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Min. cijena</label>
          <input
            type="number"
            value={filters.priceMin}
            onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
            placeholder="0"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Max. cijena</label>
          <input
            type="number"
            value={filters.priceMax}
            onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
            placeholder="9999"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm text-gray-400 mb-2">Status zaliha</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none transition-colors"
        >
          <option value="">Svi statusi</option>
          <option value="available">Dostupno</option>
          <option value="low_stock">Niska zaliha</option>
          <option value="out_of_stock">Nema na lageru</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Min. količina</label>
          <input
            type="number"
            value={filters.quantityMin}
            onChange={(e) => setFilters({...filters, quantityMin: e.target.value})}
            placeholder="0"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Max. količina</label>
          <input
            type="number"
            value={filters.quantityMax}
            onChange={(e) => setFilters({...filters, quantityMax: e.target.value})}
            placeholder="999"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="pt-4 space-y-2">
        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="w-full px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          <X className="w-4 h-4" />
          Očisti filtere
        </button>
        
        {hasActiveFilters && (
          <div className="text-xs text-center text-gray-400 bg-gray-900/50 py-2 rounded-lg">
            Aktivni filteri
          </div>
        )}
      </div>
    </div>
  )

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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block bg-gradient-to-br from-gray-800 to-gray-900 border-r border-yellow-500/30 overflow-y-auto transition-all duration-300 ${
        sidebarOpen ? 'w-80' : 'w-0'
      }`}>
        <div className={`sticky top-0 p-6 ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Filter className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-yellow-400 text-lg font-semibold">Filteri</h3>
            </div>
          </div>
          <FilterSidebar />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-br from-gray-800 to-gray-900 border-r border-yellow-500/30 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Filter className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-yellow-400 text-lg font-semibold">Filteri</h3>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <FilterSidebar />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 px -3 lg:px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              {/* Desktop Toggle Button - Now in header */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex items-center gap-2 px-3 lg:px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="hidden xl:inline">Filteri</span>
              </button>

              {/* Mobile Filter Button */}
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Filteri</span>
              </button>

              <div>
                <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
                  Upravljanje proizvodima
                </h1>
                <p className="text-gray-400 mt-1 text-sm hidden lg:block">Analiza i pregled kataloga proizvoda</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pretraži..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
                />
              </div>
              
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none transition-colors"
              >
                <option value="">Sortiraj...</option>
                <option value="price_asc">Cijena ↑</option>
                <option value="price_desc">Cijena ↓</option>
                <option value="name_asc">Naziv A-Z</option>
                <option value="name_desc">Naziv Z-A</option>
                <option value="category">Kategorija</option>
              </select>
              
              <button
                onClick={() => handleAction('add')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg text-black font-semibold hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg hover:shadow-yellow-500/50"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Dodaj</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-400 mb-1">Ukupno</p>
                  <p className="text-xl lg:text-3xl font-bold text-yellow-400">{allProducts.length}</p>
                </div>
                <div className="p-2 lg:p-3 bg-yellow-500/20 rounded-xl">
                  <Package className="w-5 h-5 lg:w-8 lg:h-8 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-400 mb-1">Pros. cijena</p>
                  <p className="text-xl lg:text-3xl font-bold text-yellow-400">
                    {allProducts.length > 0 ? 
                      Math.round(allProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / allProducts.length) 
                      : 0} €
                  </p>
                </div>
                <div className="p-2 lg:p-3 bg-yellow-500/20 rounded-xl">
                  <DollarSign className="w-5 h-5 lg:w-8 lg:h-8 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-400 mb-1">Kategorije</p>
                  <p className="text-xl lg:text-3xl font-bold text-yellow-400">{categories.length}</p>
                </div>
                <div className="p-2 lg:p-3 bg-yellow-500/20 rounded-xl">
                  <Target className="w-5 h-5 lg:w-8 lg:h-8 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-red-500/30 p-4 lg:p-6 rounded-2xl shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-400 mb-1">Nema</p>
                  <p className="text-xl lg:text-3xl font-bold text-red-400">
                    {Array.isArray(inventory) ? inventory.filter(inv => inv.status === 'out_of_stock').length : 0}
                  </p>
                </div>
                <div className="p-2 lg:p-3 bg-red-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 lg:w-8 lg:h-8 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-400 text-lg lg:text-xl font-semibold">Raspodjela cijena</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={priceDistribution} dataKey="count" nameKey="range" outerRadius={80}>
                    {priceDistribution.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308", borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-400 text-sm lg:text-xl font-semibold">Kategorije</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                  <YAxis yAxisId="left" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308", borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="count" fill="#EAB308" name="Broj" />
                  <Bar yAxisId="right" dataKey="avgPrice" fill="#F59E0B" name="Pros. €" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-400 text-lg lg:text-xl font-semibold">Zalihe po kategorijama</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stockByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308", borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [`${value} kom`, 'Ukupno']}
                  />
                  <Bar dataKey="stock" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-4 lg:p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-400 text-lg lg:text-xl font-semibold">Cijena vs Zalihe</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart data={priceVsStock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="stock" stroke="#9CA3AF" name="Zalihe" style={{ fontSize: '11px' }} />
                  <YAxis dataKey="price" stroke="#9CA3AF" name="Cijena" style={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #EAB308", borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [
                      name === 'price' ? `${value}€` : value,
                      name === 'price' ? 'Cijena' : 'Zalihe'
                    ]}
                  />
                  <Scatter dataKey="price" fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 lg:p-6 border-b border-yellow-500/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-yellow-400 text-lg lg:text-xl font-semibold">Lista proizvoda</h3>
                <div className="text-xs lg:text-sm text-gray-400">
                  Str. {currentPage}/{totalPages} • Ukupno: {allProducts.length}
                </div>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {sortedProducts.map((product) => {
                  const invData = getInventoryStatus(product.id)
                  const category = categories.find(c => c.id === product.category)
                  
                  return (
                    <div 
                      key={product.id} 
                      className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all duration-300 group"
                    >
                      <div className="w-full h-32 lg:h-40 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 flex items-center justify-center group-hover:from-yellow-500/10 group-hover:to-amber-500/10 transition-all">
                        <Package className="w-12 h-12 lg:w-16 lg:h-16 text-gray-600 group-hover:text-yellow-400/50 transition-colors" />
                      </div>
                      
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-yellow-400 font-medium text-xs lg:text-sm">#{product.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invData.status === 'available' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          invData.status === 'low_stock' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          invData.status === 'out_of_stock' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {invData.status === 'available' ? 'Dostupno' :
                           invData.status === 'low_stock' ? 'Nisko' :
                           invData.status === 'out_of_stock' ? 'Nema' : 'N/A'}
                        </span>
                      </div>

                      <h4 className="text-white font-medium text-base lg:text-lg leading-tight mb-3 group-hover:text-yellow-400 transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs lg:text-sm">Cijena:</span>
                          <span className="text-yellow-400 font-semibold text-base lg:text-lg">{product.price} €</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs lg:text-sm">Zalihe:</span>
                          <span className="text-white font-medium text-sm lg:text-base">{invData.quantity} kom</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs lg:text-sm">Kategorija:</span>
                          <span className="text-gray-300 text-xs lg:text-sm">{category?.name || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
                        <button 
                          onClick={() => handleAction('view', product.id)}
                          className="flex-1 flex items-center justify-center gap-1 lg:gap-2 py-2 px-2 lg:px-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
                          title="Pregled"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAction('edit', product.id)}
                          className="flex-1 flex items-center justify-center gap-1 lg:gap-2 py-2 px-2 lg:px-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all"
                          title="Uredi"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAction('delete', product.id)}
                          className="flex-1 flex items-center justify-center gap-1 lg:gap-2 py-2 px-2 lg:px-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                          title="Obriši"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {sortedProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 lg:w-16 lg:h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg lg:text-xl text-gray-400 mb-2">Nema proizvoda</h3>
                  <p className="text-sm lg:text-base text-gray-500">
                    {searchQuery ? `Nema rezultata za "${searchQuery}"` : 'Nema proizvoda koji odgovaraju filterima.'}
                  </p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-700 gap-4">
                  <div className="text-xs lg:text-sm text-gray-400">
                    Stranica {currentPage} od {totalPages}
                  </div>
                  <div className="flex items-center gap-2 lg:gap-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm lg:text-base"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prethodna</span>
                    </button>
                    <span className="text-gray-400 font-medium text-sm lg:text-base">
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm lg:text-base"
                    >
                      <span className="hidden sm:inline">Sljedeća</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ProductDetailModal />

          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-red-400/40 rounded-3xl w-full max-w-md shadow-2xl transform transition-all duration-300">
                <div className="h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-t-3xl"></div>
                
                <div className="p-6 lg:p-8 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 bg-red-500/20 rounded-2xl mb-4 border border-red-500/30">
                    <AlertCircle className="w-7 h-7 lg:w-8 lg:h-8 text-red-400" />
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Potvrda brisanja</h3>
                  <p className="text-sm lg:text-base text-gray-400 mb-6">
                    Da li ste sigurni da želite obrisati ovaj proizvod? Ova akcija se ne može poništiti.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeleteProductId(null)
                      }}
                      className="flex-1 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-gray-300 font-semibold hover:bg-gray-700 transition-all text-sm lg:text-base"
                    >
                      Odustani
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-red-500/50 text-sm lg:text-base"
                    >
                      Obriši
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showEditModal && selectedProduct && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-yellow-400/40 rounded-3xl w-full max-w-2xl shadow-2xl transform transition-all duration-300 my-8">
                <div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 rounded-t-3xl"></div>

                <div className="p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold text-yellow-400">Uredi proizvod</h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditModal(false)
                        setSelectedProduct(null)
                      }}
                      className="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <EditProductForm
                    product={selectedProduct}
                    onSuccess={() => {
                      setShowEditModal(false)
                      setSelectedProduct(null)
                      window.location.reload()
                    }}
                    onCancel={() => {
                      setShowEditModal(false)
                      setSelectedProduct(null)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 border border-green-400/40 rounded-3xl w-full max-w-2xl shadow-2xl transform transition-all duration-300 my-8">
                <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-t-3xl"></div>
                
                <div className="p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold text-green-400">Dodaj novi proizvod</h3>
                      <p className="text-gray-400 text-xs lg:text-sm mt-1">Kreirajte novi proizvod u sistemu</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <AddProductForm
                    onSuccess={() => {
                      setShowAddModal(false)
                      window.location.reload()
                    }}
                    onCancel={() => setShowAddModal(false)}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}