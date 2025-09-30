import { HashRouter as Router, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import ProductsPage from "./pages/ProductsPage"
import InventoryPage from "./pages/InventoryPage"
import OrdersPage from "./pages/OrdersPage"
import CategoriesPage from "./pages/CategoriesPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="*" element={<h1 style={{ color: "white" }}>404 - Stranica nije pronađena</h1>} />
      </Routes>
    </Router>
  )
}

export default App