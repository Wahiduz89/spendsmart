'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PAYMENT_METHODS } from '@/lib/constants'
import { SearchIcon, FilterIcon, SaveIcon, XIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import debounce from 'lodash/debounce'

interface AdvancedSearchProps {
  categories: Array<{
    id: string
    name: string
    icon?: string | null
  }>
  onSearch?: (params: URLSearchParams) => void
}

interface SavedFilter {
  id: string
  name: string
  params: Record<string, string>
}

export function AdvancedSearch({ categories, onSearch }: AdvancedSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    merchant: searchParams.get('merchant') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    sortBy: searchParams.get('sortBy') || 'date',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  })

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('spendSmartFilters')
    if (saved) {
      setSavedFilters(JSON.parse(saved))
    }
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      applyFilters({ ...filters, q: query })
    }, 500),
    [filters]
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const applyFilters = (customFilters?: any) => {
    const params = new URLSearchParams()
    const activeFilters = customFilters || filters

    // Add search query
    if (searchQuery) params.set('q', searchQuery)

    // Add all active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && key !== 'q') {
        params.set(key, value as string)
      }
    })

    // Reset to page 1 when filters change
    params.set('page', '1')

    // Update URL and trigger search
    const url = `/expenses?${params.toString()}`
    router.push(url)
    
    if (onSearch) {
      onSearch(params)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({
      category: '',
      paymentMethod: '',
      merchant: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc',
    })
    router.push('/expenses')
  }

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name')
      return
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      params: {
        q: searchQuery,
        ...filters,
      },
    }

    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    localStorage.setItem('spendSmartFilters', JSON.stringify(updated))
    
    toast.success('Filter saved successfully')
    setShowSaveDialog(false)
    setFilterName('')
  }

  const applySavedFilter = (filter: SavedFilter) => {
    const { q, ...filterParams } = filter.params
    setSearchQuery(q || '')
    setFilters(filterParams as any)
    
    // Apply the filter
    applyFilters(filter.params)
  }

  const deleteSavedFilter = (filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId)
    setSavedFilters(updated)
    localStorage.setItem('spendSmartFilters', JSON.stringify(updated))
    toast.success('Filter deleted')
  }

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v && v !== 'date' && v !== 'desc')

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search expenses by description, merchant, or notes..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={hasActiveFilters ? 'border-primary-500' : ''}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </Button>
            <Button onClick={() => applyFilters()}>
              Search
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="mt-1"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Payment Method</label>
                  <Select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                    className="mt-1"
                  >
                    <option value="">All Methods</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.icon} {method.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Merchant</label>
                  <Input
                    type="text"
                    placeholder="Filter by merchant..."
                    value={filters.merchant}
                    onChange={(e) => handleFilterChange('merchant', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Min Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Max Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sort By</label>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="mt-1"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="description">Description</option>
                    <option value="merchant">Merchant</option>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Sort Order</label>
                  <Select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="mt-1"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="space-x-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Save Filter
                  </Button>
                </div>
                <Button onClick={() => applyFilters()}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Filters</h4>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm"
                  >
                    <button
                      onClick={() => applySavedFilter(filter)}
                      className="hover:text-primary-600"
                    >
                      {filter.name}
                    </button>
                    <button
                      onClick={() => deleteSavedFilter(filter.id)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Filter</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700">Filter Name</label>
            <Input
              type="text"
              placeholder="e.g., Monthly Food Expenses"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveCurrentFilter}>
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}