import React, { useState } from "react"
import api from "../services/api"

interface AddProductFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [sku, setSku] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !price || !sku) {
      alert("Naziv, cijena i SKU su obavezni.")
      return
    }

    try {
      setLoading(true)
      await api.post("/products/", {
        name,
        price,
        category,
        sku,
        description
      })
      onSuccess()
    } catch (err) {
      console.error("❌ Greška pri dodavanju proizvoda:", err)
      alert("Došlo je do greške prilikom dodavanja proizvoda.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Naziv */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Naziv proizvoda</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          placeholder="Unesite naziv proizvoda"
        />
      </div>

      {/* Cijena */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Cijena (€)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          placeholder="Unesite cijenu"
        />
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Šifra (SKU)</label>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          placeholder="Unesite SKU (npr. PROD-123)"
        />
      </div>

      {/* Kategorija */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Kategorija</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          placeholder="Unesite naziv kategorije"
        />
      </div>

      {/* Opis */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Opis</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white h-24 resize-none"
          placeholder="Unesite kratak opis proizvoda"
        />
      </div>

      {/* Dugmad */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700"
        >
          Odustani
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 disabled:opacity-50"
        >
          {loading ? "Dodavanje..." : "Dodaj proizvod"}
        </button>
      </div>
    </form>
  )
}
