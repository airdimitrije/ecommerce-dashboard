import React, { useState, useEffect } from "react"
import api from "../services/api"

interface Category {
  id: number
  name: string
}

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddProductForm({ onSuccess, onCancel }: Props) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [sku, setSku] = useState("")              // ✅ novo polje
  const [category, setCategory] = useState("")
  const [quantity, setQuantity] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    api.get("/categories/")
      .then(res => setCategories(res.data.results || res.data))
      .catch(() => setError("Greška pri učitavanju kategorija"))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("📦 Sending product data:", {
        name,
        price: parseFloat(price),
        category: parseInt(category),
        sku
      })

      // ✅ Ako korisnik nije unio SKU, napravi ga automatski
      const finalSku = sku.trim() !== "" ? sku : `SKU-${Date.now()}`

      // 1️⃣ Kreiraj proizvod
      const res = await api.post("/products/", {
        name,
        price: parseFloat(price),
        category: parseInt(category),
        sku: finalSku
      })

      // 2️⃣ Kreiraj inicijalni inventar (ako ima unosa)
      if (quantity) {
        await api.post("/inventory/", {
          product: res.data.id,
          quantity_in: parseInt(quantity),
          quantity_out: 0,
          status: "available"
        })
      }

      onSuccess()
    } catch (err: any) {
      console.error("❌ API error:", err.response?.data)
      setError("Greška pri dodavanju proizvoda. Provjerite unos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-red-400 text-center">{error}</p>}

      <div>
        <label className="block text-sm text-gray-400 mb-2">Naziv proizvoda</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-400 outline-none"
          placeholder="Unesite naziv..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Cijena (€)</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-400 outline-none"
          placeholder="npr. 49.99"
        />
      </div>

      {/* ✅ NOVO POLJE SKU */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Šifra proizvoda (SKU)</label>
        <input
          type="text"
          value={sku}
          onChange={e => setSku(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-400 outline-none"
          placeholder="npr. IPH-001 ili SKU-12345"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Kategorija</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-400 outline-none"
        >
          <option value="">Odaberi kategoriju</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Početne zalihe</label>
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-400 outline-none"
          placeholder="npr. 100"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-all"
        >
          Otkaži
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-semibold hover:from-green-400 hover:to-emerald-500 transition-all"
        >
          {loading ? "Dodavanje..." : "Dodaj proizvod"}
        </button>
      </div>
    </form>
  )
}
