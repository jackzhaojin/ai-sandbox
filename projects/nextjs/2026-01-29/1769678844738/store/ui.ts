import { create } from 'zustand'

interface DateRange {
  start: Date
  end: Date
}

interface Filters {
  eventTypes?: string[]
  paths?: string[]
  searchTerm?: string
  [key: string]: any
}

interface UIState {
  // Sidebar state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Theme state
  theme: 'retro' | 'modern'
  setTheme: (theme: 'retro' | 'modern') => void
  toggleTheme: () => void

  // Date range state
  dateRange: DateRange
  setDateRange: (range: DateRange) => void

  // Filters state
  filters: Filters
  setFilters: (filters: Filters) => void
  clearFilters: () => void

  // Modal state
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void

  // Notification preferences
  notificationsEnabled: boolean
  toggleNotifications: () => void
}

// Default date range: last 30 days
const getDefaultDateRange = (): DateRange => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return { start, end }
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarOpen: false,
  theme: 'retro',
  dateRange: getDefaultDateRange(),
  filters: {},
  activeModal: null,
  notificationsEnabled: true,

  // Sidebar actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Theme actions
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'retro' ? 'modern' : 'retro',
    })),

  // Date range actions
  setDateRange: (range) => set({ dateRange: range }),

  // Filters actions
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),

  // Modal actions
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // Notification actions
  toggleNotifications: () =>
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
}))
