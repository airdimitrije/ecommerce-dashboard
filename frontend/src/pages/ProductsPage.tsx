import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ScatterChart, Scatter
} from "recharts"
import { 
  ChevronLeft, ChevronRight, Package, DollarSign, 
  Filter, X, ArrowLeft, Plus, Edit, Trash2, Eye,
  TrendingUp, Target, AlertCircle, Loader2, BarChart3, Menu, Search
} from "lucide-react"
import api from "../services/api"
import EditProductForm from "../components/EditProductForm"
import AddProductForm from "../components/AddProductForm"
import FilterSidebar from "../components/FilterSidebar"

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sortOption, setSortOption] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [priceDistribution, setPriceDistribution] = useState<{ range: string; count: number }[]>([])
  const [stockByCategory, setStockByCategory] = useState<{ category: string; stock: number }[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<{ category: string; count: number; avgPrice: number }[]>([])
  const [priceVsStock, setPriceVsStock] = useState<{ price: number; stock: number; name: string }[]>([])

  // Global filters
  const [filters, setFilters] = useState({
    category: "",
    priceMin: "",
    priceMax: "",
    status: "",
    quantityMin: "",
    quantityMax: ""
  })

  // Local filters (used before applying)
  const [localFilters, setLocalFilters] = useState({
    category: "",
    priceMin: "",
    priceMax: "",
    status: "",
    quantityMin: "",
    quantityMax: "",
    searchQuery: ""
  })

  const productsPerPage = 8

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.append("page", currentPage.toString())

        if (searchQuery) params.append("search", searchQuery)
        if (sortOption) {
          const orderingMap: { [key: string]: string } = {
            price_asc: "price",
            price_desc: "-price",
            name_asc: "name",
            name_desc: "-name",
            category: "category"
          }
          params.append("ordering", orderingMap[sortOption] || "")
        }
        if (filters.category) {
          const cat = categories.find((c) => c.name === filters.category)
          if (cat) params.append("category", cat.id.toString())
        }
        if (filters.priceMin) params.append("price__gte", filters.priceMin)
        if (filters.priceMax) params.append("price__lte", filters.priceMax)

        const [productsRes, allProductsRes, categoriesRes, inventoryRes, ordersRes] = await Promise.all([
          api.get(`/products/?${params.toString()}`),
          api.get("/products/?page_size=9999"),
          api.get("/categories/?page_size=9999"),
          api.get("/inventory/?page_size=9999"),
          api.get("/orders/?page_size=9999")
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
        console.error("Error loading data:", err)
        setError("Greška pri učitavanju podataka. Molimo pokušajte ponovo.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentPage, searchQuery, sortOption, filters.category, filters.priceMin, filters.priceMax])

  const calculatePriceDistribution = (productsData: Product[]) => {
    const prices = productsData.map((p) => parseFloat(p.price))
    const priceRanges = [
      { range: "0-100€", min: 0, max: 100 },
      { range: "100-500€", min: 100, max: 500 },
      { range: "500-1000€", min: 500, max: 1000 },
      { range: "1000€+", min: 1000, max: Infinity }
    ]
    const priceDistrib = priceRanges
      .map((range) => ({
        range: range.range,
        count: prices.filter((price) => price >= range.min && price < range.max).length
      }))
      .filter((item) => item.count > 0)
    setPriceDistribution(priceDistrib)
  }

  const getInventoryStatus = (productId: number) => {
    const inv = inventory.find((i) => i.product === productId)
    if (!inv) return { quantity: 0, status: "N/A" }

    const quantity = Math.max(0, inv.quantity_in - inv.quantity_out)
    let status = "available"
    if (quantity === 0) status = "out_of_stock"
    else if (quantity < 10) status = "low_stock"
    return { quantity, status }
  }

  const applyFilters = () => {
    setFilters({
      category: localFilters.category,
      priceMin: localFilters.priceMin,
      priceMax: localFilters.priceMax,
      status: localFilters.status,
      quantityMin: localFilters.quantityMin,
      quantityMax: localFilters.quantityMax
    })
    setSearchQuery(localFilters.searchQuery)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setLocalFilters({
      category: "",
      priceMin: "",
      priceMax: "",
      status: "",
      quantityMin: "",
      quantityMax: "",
      searchQuery: ""
    })
    setFilters({
      category: "",
      priceMin: "",
      priceMax: "",
      status: "",
      quantityMin: "",
      quantityMax: ""
    })
    setSearchQuery("")
  }

  const hasActiveFilters = Object.values(filters).some((f) => f !== "") || searchQuery !== ""

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

      {/* ✅ Desktop Sidebar */}
      <div
        className={`hidden lg:block bg-gradient-to-br from-gray-800 to-gray-900 border-r border-yellow-500/30 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0"
        }`}
      >
        <div className={`sticky top-0 p-6 ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Filter className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-yellow-400 text-lg font-semibold">Filteri</h3>
            </div>
          </div>

          <FilterSidebar
            localFilters={localFilters}
            setLocalFilters={setLocalFilters}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            categories={categories}
          />
        </div>
      </div>

      {/* ✅ Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-br from-gray-800 to-gray-900 border-r border-yellow-500/30 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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

              <FilterSidebar
                localFilters={localFilters}
                setLocalFilters={setLocalFilters}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                categories={categories}
              />
            </div>
          </div>
        </div>
      )}

      {/* ✅ Main Content */}
      <div className="flex-1 overflow-y-auto p-6 text-white">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent mb-6">
          Upravljanje proizvodima
        </h1>
        {/* Ovde ide ostatak tvojih grafova, tabela i logike */}
      </div>
    </div>
  )
}
