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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post("/products/", { name, price, category })
      onSuccess()
    } catch (err) {
      alert("Greška pri dodavanju proizvoda")
      console.error(err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Naziv</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Cijena (€)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Kategorija</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        />
      </div>

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
          className="flex-1 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400"
        >
          Dodaj
        </button>
      </div>
    </form>
  )
}
