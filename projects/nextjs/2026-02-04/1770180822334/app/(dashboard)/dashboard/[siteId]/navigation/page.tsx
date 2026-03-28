'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Save, Eye, Menu as MenuIcon, Trash2, GripVertical, Lock, Unlock, ExternalLink, Hash, FileText, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/dropdown'
import { toast } from 'sonner'

interface MenuItem {
  id: string
  type: 'page' | 'url' | 'fragment' | 'divider'
  label: string
  icon?: string
  target?: '_self' | '_blank'
  cssClass?: string
  pageId?: string
  url?: string
  fragmentId?: string
  children?: MenuItem[]
}

interface Menu {
  id: string
  name: string
  location: 'header' | 'footer' | 'sidebar' | 'custom'
  items: MenuItem[]
}

interface Page {
  id: string
  title: string
  slug: string
  status: string
}

export default function NavigationPage() {
  const params = useParams()
  const siteId = params.siteId as string

  const [selectedLocation, setSelectedLocation] = useState<'header' | 'footer' | 'sidebar'>('header')
  const [menu, setMenu] = useState<Menu | null>(null)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pages, setPages] = useState<Page[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchUserRole()
    fetchPages()
  }, [siteId])

  useEffect(() => {
    fetchMenu()
  }, [siteId, selectedLocation])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.profile.role === 'admin')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchPages = async () => {
    try {
      const response = await fetch(`/api/pages?siteId=${siteId}`)
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    }
  }

  const fetchMenu = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/menus?siteId=${siteId}&location=${selectedLocation}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.id) {
          setMenu(data as Menu)
        } else {
          // Create new empty menu for this location
          setMenu({
            id: '',
            name: `${selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)} Menu`,
            location: selectedLocation,
            items: []
          })
        }
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  const saveMenu = async () => {
    if (!menu || !isAdmin) return

    // Validate
    const totalItems = countMenuItems(menu.items)
    if (totalItems > 50) {
      toast.error('Menu cannot have more than 50 items')
      return
    }

    const maxDepth = getMaxDepth(menu.items)
    const allowedDepth = selectedLocation === 'header' ? 2 : 3
    if (maxDepth > allowedDepth) {
      toast.error(`Max depth for ${selectedLocation} menu is ${allowedDepth}`)
      return
    }

    setSaving(true)
    try {
      const endpoint = menu.id ? `/api/menus/${menu.id}` : '/api/menus'
      const method = menu.id ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          name: menu.name,
          location: menu.location,
          items: menu.items
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMenu(data.menu)
        toast.success('Menu saved successfully')
      } else {
        toast.error('Failed to save menu')
      }
    } catch (error) {
      console.error('Error saving menu:', error)
      toast.error('Failed to save menu')
    } finally {
      setSaving(false)
    }
  }

  const countMenuItems = (items: MenuItem[]): number => {
    return items.reduce((count, item) => {
      return count + 1 + (item.children ? countMenuItems(item.children) : 0)
    }, 0)
  }

  const getMaxDepth = (items: MenuItem[], currentDepth: number = 1): number => {
    if (items.length === 0) return currentDepth - 1
    return Math.max(
      ...items.map(item =>
        item.children && item.children.length > 0
          ? getMaxDepth(item.children, currentDepth + 1)
          : currentDepth
      )
    )
  }

  const addMenuItem = () => {
    if (!menu || !isAdmin) return

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      type: 'page',
      label: 'New Item',
      target: '_self'
    }

    setMenu({
      ...menu,
      items: [...menu.items, newItem]
    })
    setSelectedItem(newItem)
  }

  const deleteMenuItem = (itemId: string) => {
    if (!menu || !isAdmin) return

    const removeItem = (items: MenuItem[]): MenuItem[] => {
      return items.filter(item => {
        if (item.id === itemId) return false
        if (item.children) {
          item.children = removeItem(item.children)
        }
        return true
      })
    }

    setMenu({
      ...menu,
      items: removeItem(menu.items)
    })

    if (selectedItem?.id === itemId) {
      setSelectedItem(null)
    }
  }

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    if (!menu || !isAdmin) return

    const updateItem = (items: MenuItem[]): MenuItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, ...updates }
          if (selectedItem?.id === itemId) {
            setSelectedItem(updated)
          }
          return updated
        }
        if (item.children) {
          item.children = updateItem(item.children)
        }
        return item
      })
    }

    setMenu({
      ...menu,
      items: updateItem(menu.items)
    })
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
            <p className="text-gray-600">Only administrators can manage site navigation.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading navigation...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MenuIcon className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold">Navigation</h1>

          {/* Menu Location Selector */}
          <div className="flex items-center gap-2 ml-4">
            {(['header', 'footer', 'sidebar'] as const).map((loc) => (
              <Button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                variant={selectedLocation === loc ? 'default' : 'outline'}
                size="sm"
              >
                {loc.charAt(0).toUpperCase() + loc.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="outline"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={saveMenu}
            disabled={saving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Menu'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu Tree Panel */}
        <div className="w-1/2 border-r bg-white overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Menu Items</h2>
              <Button onClick={addMenuItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {menu && menu.items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MenuIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No menu items yet</p>
                <p className="text-sm mt-2">Click "Add Item" to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {menu?.items.map(item => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    depth={0}
                    maxDepth={selectedLocation === 'header' ? 2 : 3}
                    selected={selectedItem?.id === item.id}
                    onSelect={() => setSelectedItem(item)}
                    onDelete={deleteMenuItem}
                    pages={pages}
                  />
                ))}
              </div>
            )}

            {menu && menu.items.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total items:</span>
                  <span className="font-medium">{countMenuItems(menu.items)} / 50</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Max depth:</span>
                  <span className="font-medium">
                    {getMaxDepth(menu.items)} / {selectedLocation === 'header' ? '2' : '3'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          {selectedItem ? (
            <MenuItemSettings
              item={selectedItem}
              pages={pages}
              onUpdate={(updates) => updateMenuItem(selectedItem.id, updates)}
              onDelete={() => deleteMenuItem(selectedItem.id)}
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Select a menu item to edit its settings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuItemRow({
  item,
  depth,
  maxDepth,
  selected,
  onSelect,
  onDelete,
  pages
}: {
  item: MenuItem
  depth: number
  maxDepth: number
  selected: boolean
  onSelect: () => void
  onDelete: (id: string) => void
  pages: Page[]
}) {
  const getItemLabel = () => {
    if (item.type === 'divider') return '— Divider —'
    if (item.type === 'page' && item.pageId) {
      const page = pages.find(p => p.id === item.pageId)
      return page ? `${item.label} (${page.title})` : item.label
    }
    return item.label
  }

  const getItemIcon = () => {
    switch (item.type) {
      case 'page': return <FileText className="h-4 w-4" />
      case 'url': return <ExternalLink className="h-4 w-4" />
      case 'fragment': return <Hash className="h-4 w-4" />
      case 'divider': return <Minus className="h-4 w-4" />
    }
  }

  return (
    <div style={{ paddingLeft: `${depth * 24}px` }}>
      <div
        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
          selected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-gray-300'
        }`}
        onClick={onSelect}
      >
        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex-shrink-0 text-gray-600">{getItemIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{getItemLabel()}</div>
          <div className="text-xs text-gray-500">
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            {item.target === '_blank' && ' • Opens in new tab'}
          </div>
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          variant="outline"
          size="sm"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {item.children && item.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {item.children.map(child => (
            <MenuItemRow
              key={child.id}
              item={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              selected={selected}
              onSelect={onSelect}
              onDelete={onDelete}
              pages={pages}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MenuItemSettings({
  item,
  pages,
  onUpdate,
  onDelete
}: {
  item: MenuItem
  pages: Page[]
  onUpdate: (updates: Partial<MenuItem>) => void
  onDelete: () => void
}) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6">Item Settings</h2>

      <div className="space-y-6">
        {/* Label */}
        <div>
          <Label>Label</Label>
          <Input
            value={item.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Menu item label"
            className="mt-1"
          />
        </div>

        {/* Type */}
        <div>
          <Label>Type</Label>
          <select
            value={item.type}
            onChange={(e) => onUpdate({ type: e.target.value as any })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="page">Page</option>
            <option value="url">URL</option>
            <option value="fragment">Fragment</option>
            <option value="divider">Divider</option>
          </select>
        </div>

        {/* Page Picker */}
        {item.type === 'page' && (
          <div>
            <Label>Page</Label>
            <select
              value={item.pageId || ''}
              onChange={(e) => onUpdate({ pageId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Select a page...</option>
              {pages.map(page => (
                <option key={page.id} value={page.id}>
                  {page.title} ({page.slug})
                  {page.status !== 'published' && ` - ${page.status}`}
                </option>
              ))}
            </select>
            {item.pageId && pages.find(p => p.id === item.pageId)?.status !== 'published' && (
              <p className="text-sm text-yellow-600 mt-1">
                ⚠️ This page is not published yet
              </p>
            )}
          </div>
        )}

        {/* URL */}
        {item.type === 'url' && (
          <div>
            <Label>URL</Label>
            <Input
              value={item.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://example.com"
              className="mt-1"
            />
          </div>
        )}

        {/* Target */}
        {item.type !== 'divider' && (
          <div>
            <Label>Target</Label>
            <div className="mt-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={item.target === '_self'}
                  onChange={() => onUpdate({ target: '_self' })}
                />
                <span>Same window</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={item.target === '_blank'}
                  onChange={() => onUpdate({ target: '_blank' })}
                />
                <span>New tab</span>
              </label>
            </div>
          </div>
        )}

        {/* CSS Class */}
        <div>
          <Label>CSS Class</Label>
          <Input
            value={item.cssClass || ''}
            onChange={(e) => onUpdate({ cssClass: e.target.value })}
            placeholder="custom-class"
            className="mt-1"
          />
        </div>

        {/* Delete Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={onDelete}
            variant="outline"
            className="w-full text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Item
          </Button>
        </div>
      </div>
    </div>
  )
}
