import React, { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts"
import { 
  ChevronLeft, ChevronRight, TrendingUp, Package, DollarSign, 
  ShoppingCart, Filter, X, Search
} from "lucide-react"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  
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

  const productsPerPage = 5

  // Mock data since we don't have API
  useEffect(() => {
    // Mock products data
    const mockProducts = [
      { id: 1, name: "Samsung Galaxy S24", price: "999.99", category: 1 },
      { id: 2, name: "Sony WH-1000XM5", price: "349.50", category: 1 },
      { id: 3, name: "Dell XPS 13", price: "1299.00", category: 1 },
      { id: 4, name: "Apple iPad Pro 12.9", price: "1399.00", category: 1 },
      { id: 5, name: "Samsung 65\" QLED TV", price: "1899.00", category: 1 },
      { id: 6, name: "Nike Air Max", price: "129.99", category: 2 },
      { id: 7, name: "Adidas Ultraboost", price: "180.00", category: 2 },
      { id: 8, name: "Coffee Machine", price: "299.99", category: 3 },
    ]

    const mockCategories = [
      { id: 1, name: "Elektronika" },
      { id: 2, name: "Odjeća" },
      { id: 3, name: "Kućanski aparati" }
    ]

    const mockInventory = [
      { id: 1, product: 1, quantity_in: 100, quantity_out: 10, status: "available" },
      { id: 2, product: 2, quantity_in: 50, quantity_out: 30, status: "available" },
      { id: 3, product: 3, quantity_in: 30, quantity_out: 30, status: "out_of_stock" },
      { id: 4, product: 4, quantity_in: 120, quantity_out: 10, status: "available" },
      { id: 5, product: 5, quantity_in: 50, quantity_out: 10, status: "available" },
      { id: 6, product: 6, quantity_in: 200, quantity_out: 190, status: "low_stock" },
      { id: 7, product: 7, quantity_in: 150, quantity_out: 100, status: "available" },
      { id: 8, product: 8, quantity_in: 80, quantity_out: 60, status: "available" },
    ]

    const mockOrdersData = [
      { month: "Jan 2024", orders: 45 },
      { month: "Feb 2024", orders: 52 },
      { month: "Mar 2024", orders: 38 },
      { month: "Apr 2024", orders: 61 },
      { month: "May 2024", orders: 55 },
      { month: "Jun 2024", orders: 48 },
    ]

    setProducts(mockProducts)
    setCategories(mockCategories)
    setInventory(mockInventory)
    setOrdersData(mockOrdersData)
    setTotalOrders(mockOrdersData.reduce((sum, item) => sum + item.orders, 0))
  }, [])

  // Get inventory status
  const getInventoryStatus = (productId: number) => {
    const inv = inventory.find(i => i.product === productId)
    if (!inv) return { quantity: 0, status: 'N/A' }
    const quantity = inv.quantity_in - inv.quantity_out
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

  // Data for pie chart
  const categoryData = categories.map(cat => ({
    category: cat.name,
    count: products.filter(p => p.category === cat.id).length
  })).filter(item => item.count > 0)

  const COLORS = ["#EAB308", "#F59E0B", "#FBBF24", "#FCD34D"]

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '')

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">
            Poslovni Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Pregled proizvoda, kategorija i narudžbi</p>
        </div>

        {/* Stats Cards - Improved */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupno proizvoda</p>
                <p className="text-3xl font-bold text-yellow-400">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
          
          <div className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupna vrijednost</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {products.reduce((sum, p) => sum + parseFloat(p.price), 0).toFixed(2)} €
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
          
          <div className="group relative rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Ukupne narudžbe</p>
                <p className="text-3xl font-bold text-yellow-400">{totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-yellow-500/60" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Trend narudžbi</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #EAB308',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="orders" stroke="#EAB308" strokeWidth={3} dot={{ fill: '#EAB308', r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
            <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Mjesečne narudžbe</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #EAB308',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="orders" fill="#EAB308" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 p-6 rounded-2xl">
          <h3 className="text-yellow-400 mb-4 text-xl font-semibold">Kategorije proizvoda</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="count" nameKey="category" outerRadius={90}>
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #EAB308',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Filter Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-500/30 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-yellow-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-yellow-400 text-xl font-semibold">Proizvodi</h3>
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
                  <input
                    type="text"
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    placeholder="Pretraži kategoriju..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                  />
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
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
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

          {/* Products Table */}
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead className="border-b border-yellow-500/30">
                <tr>
                  <th className="p-4 text-yellow-400 font-semibold">ID</th>
                  <th className="p-4 text-yellow-400 font-semibold">Naziv</th>
                  <th className="p-4 text-yellow-400 font-semibold">Cijena</th>
                  <th className="p-4 text-yellow-400 font-semibold">Kategorija</th>
                  <th className="p-4 text-yellow-400 font-semibold">Količina</th>
                  <th className="p-4 text-yellow-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product) => {
                  const invData = getInventoryStatus(product.id)
                  return (
                    <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-yellow-400 font-medium">#{product.id}</td>
                      <td className="p-4 text-gray-300">{product.name}</td>
                      <td className="p-4 text-yellow-400 font-semibold">{product.price} €</td>
                      <td className="p-4 text-gray-300">
                        {categories.find(c => c.id === product.category)?.name || "N/A"}
                      </td>
                      <td className="p-4 text-gray-300 font-medium">{invData.quantity}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invData.status === 'available' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          invData.status === 'low_stock' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          invData.status === 'out_of_stock' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {invData.status === 'available' ? 'Dostupno' :
                           invData.status === 'low_stock' ? 'Niska zaliha' :
                           invData.status === 'out_of_stock' ? 'Nema na lageru' : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-yellow-500/30">
              <div className="flex justify-between items-center">
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
            </div>
          )}
        </div>

      </div>
    </div>
  )
}