import React, { useEffect, useState } from "react"
import api from "../services/api"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
  RadialBarChart, RadialBar, Treemap
} from "recharts"
import { 
  ArrowLeft, Tag, Package, DollarSign, TrendingUp, 
  Plus, Edit, Trash2, Eye, Filter, X, Search,
  Target, BarChart3
} from "lucide-react"

interface Category {
  id: number
  name: string
  description?: string
  created_at?: string
}

interface Product {
  id: number
  name: string
  price: string
  category: number
}

interface CategoryAnalytics {
  id: number
  name: string
  productCount: number
  totalRevenue: number
  avgPrice: number
  topProduct: string
  recentOrders: number
  marketShare: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([])
  const [filteredCategories, setFilteredCategories] = useState<CategoryAnalytics[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Analytics data
  const [categoryPerformance, setCategoryPerformance] = useState<
    { category: string; revenue: number; products: number; growth: number }[]
  >([])
  const [marketShareData, setMarketShareData] = useState<
    { category: string; share: number; value: number }[]
  >([])
  const [categoryTrends, setCategoryTrends] = useState<{ month: string; [key: string]: any }[]>([])
  const [priceAnalysis, setPriceAnalysis] = useState<
    { category: string; avgPrice: number; minPrice: number; maxPrice: number }[]
  >([])

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'name', // name, products, revenue, avgPrice
    minProducts: '',
    maxProducts: '',
    minRevenue: '',
    maxRevenue: ''
  })

  const itemsPerPage = 8

  // API pozivi
  useEffect(() => {
    Promise.all([
      api.get("categories/"),
      api.get("products/"),
      api.get("orders/")
    ]).then(([categoriesRes, productsRes, ordersRes]) => {
      setCategories(categoriesRes.data)
      setProducts(productsRes.data)

      // Calculate analytics for each category
      const analytics: CategoryAnalytics[] = categoriesRes.data.map((category: Category) => {
        const categoryProducts = productsRes.data.filter((p: Product) => p.category === category.id)
        
        // Calculate revenue from orders
        let totalRevenue = 0
        let recentOrders = 0
        let topProduct = ''
        let maxProductRevenue = 0
        const productRevenue: Record<string, number> = {}

        ordersRes.data.forEach((order: any) => {
          const orderDate = new Date(order.time_created)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          order.items.forEach((item: any) => {
            const product = productsRes.data.find((p: Product) => p.id === item.product)
            if (product && product.category === category.id) {
              const itemRevenue = parseFloat(item.final_price)
              totalRevenue += itemRevenue
              
              // Count recent orders
              if (orderDate >= thirtyDaysAgo) {
                recentOrders++
              }

              // Track product revenue
              if (!productRevenue[item.product_name]) {
                productRevenue[item.product_name] = 0
              }
              productRevenue[item.product_name] += itemRevenue

              // Find top product
              if (productRevenue[item.product_name] > maxProductRevenue) {
                maxProductRevenue = productRevenue[item.product_name]
                topProduct = item.product_name
              }
            }
          })
        })

        const avgPrice = categoryProducts.length > 0 
          ? categoryProducts.reduce((sum: number, p: Product) => sum + parseFloat(p.price), 0) / categoryProducts.length 
          : 0

        return {
          id: category.id,
          name: category.name,
          productCount: categoryProducts.length,
          totalRevenue: Math.round(totalRevenue),
          avgPrice: Math.round(avgPrice),
          topProduct: topProduct || 'N/A',
          recentOrders,
          marketShare: 0 // Calculate later
        }
      })

      // Calculate market share
      const totalRevenue = analytics.reduce((sum: number, cat: CategoryAnalytics) => sum + cat.totalRevenue, 0)
      analytics.forEach((cat: CategoryAnalytics) => {
        cat.marketShare = totalRevenue > 0 ? Math.round((cat.totalRevenue / totalRevenue) * 100) : 0
      })

      setCategoryAnalytics(analytics)
      setFilteredCategories(analytics)

      // Category Performance Data
      const performance = analytics
        .filter((cat: CategoryAnalytics) => cat.productCount > 0)
        .map((cat: CategoryAnalytics) => ({
          category: cat.name.length > 12 ? cat.name.substring(0, 12) + '...' : cat.name,
          revenue: cat.totalRevenue,
          products: cat.productCount,
          growth: Math.floor(Math.random() * 40) - 10 // Mock growth data
        }))
        .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
        .slice(0, 8)
      
      setCategoryPerformance(performance)

      // Market Share Data
      const marketShare = analytics
        .filter((cat: CategoryAnalytics) => cat.totalRevenue > 0)
        .map((cat: CategoryAnalytics) => ({
          category: cat.name,
          share: cat.marketShare,
          value: cat.totalRevenue
        }))
        .sort((a: { share: number }, b: { share: number }) => b.share - a.share)
        .slice(0, 6)
      
      setMarketShareData(marketShare)

      // Price Analysis
      const priceAnalysis = analytics
        .filter((cat: CategoryAnalytics) => cat.productCount > 0)
        .map((cat: CategoryAnalytics) => {
          const categoryProducts = productsRes.data.filter((p: Product) => p.category === cat.id)
          const prices = categoryProducts.map((p: Product) => parseFloat(p.price))
          
          return {
            category: cat.name,
            avgPrice: cat.avgPrice,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices)
          }
        })
        .sort((a: { avgPrice: number }, b: { avgPrice: number }) => b.avgPrice - a.avgPrice)
      
      setPriceAnalysis(priceAnalysis)

      // Mock category trends (kasnije možeš zamijeniti pravim podacima)
      const mockTrends = [
        { month: 'Jan', Elektronika: 2500, Odjeća: 1800, Kućanstvo: 1200, Sport: 900 },
        { month: 'Feb', Elektronika: 2700, Odjeća: 2100, Kućanstvo: 1400, Sport: 1100 },
        { month: 'Mar', Elektronika: 2400, Odjeća: 1900, Kućanstvo: 1300, Sport: 950 },
        { month: 'Apr', Elektronika: 2900, Odjeća: 2300, Kućanstvo: 1600, Sport: 1200 },
        { month: 'Maj', Elektronika: 3100, Odjeća: 2000, Kućanstvo: 1500, Sport: 1300 },
        { month: 'Jun', Elektronika: 2800, Odjeća: 2400, Kućanstvo: 1700, Sport: 1100 }
      ]
      setCategoryTrends(mockTrends)

    }).catch(err => console.error(err))
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered: CategoryAnalytics[] = [...categoryAnalytics]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Product count filters
    if (filters.minProducts) {
      filtered = filtered.filter(cat => cat.productCount >= parseInt(filters.minProducts))
    }
    if (filters.maxProducts) {
      filtered = filtered.filter(cat => cat.productCount <= parseInt(filters.maxProducts))
    }

    // Revenue filters
    if (filters.minRevenue) {
      filtered = filtered.filter(cat => cat.totalRevenue >= parseFloat(filters.minRevenue))
    }
    if (filters.maxRevenue) {
      filtered = filtered.filter(cat => cat.totalRevenue <= parseFloat(filters.maxRevenue))
    }

    // Sorting
    filtered.sort((a: CategoryAnalytics, b: CategoryAnalytics) => {
      switch (filters.sortBy) {
        case 'products':
          return b.productCount - a.productCount
        case 'revenue':
          return b.totalRevenue - a.totalRevenue
        case 'avgPrice':
          return b.avgPrice - a.avgPrice
        default: // name
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredCategories(filtered)
    setCurrentPage(1)
  }, [filters, categoryAnalytics])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      sortBy: 'name',
      minProducts: '',
      maxProducts: '',
      minRevenue: '',
      maxRevenue: ''
    })
  }

  // Actions
  const handleAction = (action: string, categoryId?: number) => {
    console.log(`Action: ${action}`, categoryId)
  }

  const goBack = () => {
    console.log('Navigate back to dashboard')
  }

  const COLORS = ["#22D3EE", "#EAB308", "#F87171", "#84CC16", "#A78BFA", "#F59E0B", "#8B5CF6", "#F97316"]
  const hasActiveFilters = Object.values(filters).some((filter, index) => 
    index === 1 ? filter !== 'name' : filter !== '' // sortBy default is 'name'
  )

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Ostatak JSX-a ostaje isti */}
      </div>
    </div>
  )
}
