import React, { useState } from "react"
import api from "../services/api"

interface EditProductFormProps {
  product: {
    id: number
    name: string
    price: string
    category: number
  }
  onSuccess: () => void
  onCancel: () => void
}

export default function EditProductForm({ product, onSuccess, onCancel }: EditProductFormProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price,
    category: product.category,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await api.put(`/products/${product.id}/`, formData)
      setSuccess(true)
      setTimeout(onSuccess, 800)
    } catch (err) {
      console.error(err)
      setError("Greška pri ažuriranju proizvoda.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Naziv proizvoda</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-yellow-400 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Cijena (€)</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-yellow-400 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Kategorija (ID)</label>
        <input
          type="number"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-yellow-400 outline-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">✅ Proizvod uspješno ažuriran!</p>}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-all"
        >
          Odustani
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-semibold rounded-lg hover:from-yellow-300 hover:to-amber-300 transition-all disabled:opacity-50"
        >
          {loading ? "Čuvanje..." : "Sačuvaj izmjene"}
        </button>
      </div>
    </form>
  )
}
