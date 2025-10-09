import React from 'react'
import { Search, Filter, X } from 'lucide-react'

interface Category {
  id: number
  name: string
}

interface LocalFilters {
  category: string
  priceMin: string
  priceMax: string
  status: string
  quantityMin: string
  quantityMax: string
  searchQuery: string
}

interface FilterSidebarProps {
  localFilters: LocalFilters
  setLocalFilters: (filters: LocalFilters) => void
  categories: Category[]
  applyFilters: () => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  localFilters,
  setLocalFilters,
  categories,
  applyFilters,
  clearFilters,
  hasActiveFilters
}) => {
  return (
    <div className="space-y-4">
      {/* Filter za pretragu po nazivu */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Pretraži po nazivu</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={localFilters.searchQuery}
            onChange={(e) => setLocalFilters({...localFilters, searchQuery: e.target.value})}
            placeholder="Unesite naziv..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Kategorija</label>
        <select
          value={localFilters.category}
          onChange={(e) => setLocalFilters({...localFilters, category: e.target.value})}
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
            value={localFilters.priceMin}
            onChange={(e) => setLocalFilters({...localFilters, priceMin: e.target.value})}
            placeholder="0"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Max. cijena</label>
          <input
            type="number"
            value={localFilters.priceMax}
            onChange={(e) => setLocalFilters({...localFilters, priceMax: e.target.value})}
            placeholder="9999"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm text-gray-400 mb-2">Status zaliha</label>
        <select
          value={localFilters.status}
          onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
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
            value={localFilters.quantityMin}
            onChange={(e) => setLocalFilters({...localFilters, quantityMin: e.target.value})}
            placeholder="0"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Max. količina</label>
          <input
            type="number"
            value={localFilters.quantityMax}
            onChange={(e) => setLocalFilters({...localFilters, quantityMax: e.target.value})}
            placeholder="999"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="pt-4 space-y-3">
        {/* DUGME: Primijeni filtere */}
        <button
          onClick={applyFilters}
          className="w-full px-4 py-2.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Filter className="w-4 h-4" />
          Filtriraj
        </button>

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
}

export default FilterSidebar