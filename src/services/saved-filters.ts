export interface SavedFilter {
  id: string
  name: string
  criteria: any
}

const STORAGE_KEY = 'crm_saved_filters'

export const savedFiltersService = {
  getFilters(): SavedFilter[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  },

  saveFilter(filter: Omit<SavedFilter, 'id'>): SavedFilter {
    const filters = this.getFilters()
    const newFilter = { ...filter, id: crypto.randomUUID() }
    filters.push(newFilter)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    return newFilter
  },

  deleteFilter(id: string) {
    const filters = this.getFilters().filter((f) => f.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  },
}
