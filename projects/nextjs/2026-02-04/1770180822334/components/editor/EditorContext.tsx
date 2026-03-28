'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'

// Component instance on the canvas
export interface ComponentInstance {
  id: string
  type: string // 'hero', 'text', 'image', etc.
  props: Record<string, unknown>
}

// History entry for undo/redo
interface HistoryEntry {
  components: ComponentInstance[]
  selectedComponentId: string | null
}

interface EditorContextValue {
  // Page info
  pageId: string
  siteId: string

  // Component state
  components: ComponentInstance[]
  setComponents: (components: ComponentInstance[]) => void
  addComponent: (component: ComponentInstance) => void
  updateComponent: (id: string, props: Record<string, unknown>) => void
  deleteComponent: (id: string) => void
  moveComponent: (fromIndex: number, toIndex: number) => void

  // Selection state
  selectedComponentId: string | null
  setSelectedComponentId: (id: string | null) => void
  selectedComponentIds: string[]
  setSelectedComponentIds: (ids: string[]) => void
  toggleComponentSelection: (id: string) => void
  selectAll: () => void
  deselectAll: () => void

  // Clipboard
  clipboard: ComponentInstance | null
  copyComponent: (id?: string) => void
  cutComponent: (id?: string) => void
  pasteComponent: () => void
  duplicateComponent: (id?: string) => void

  // History (undo/redo)
  history: HistoryEntry[]
  historyIndex: number
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  resetHistory: () => void

  // Viewport
  viewport: 'desktop' | 'tablet' | 'mobile'
  setViewport: (viewport: 'desktop' | 'tablet' | 'mobile') => void

  // Dirty state
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider')
  }
  return context
}

interface EditorProviderProps {
  children: ReactNode
  pageId: string
  siteId: string
}

export function EditorProvider({ children, pageId, siteId }: EditorProviderProps) {
  // Component state
  const [components, setComponentsState] = useState<ComponentInstance[]>([])
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([])

  // Clipboard state
  const [clipboard, setClipboard] = useState<ComponentInstance | null>(null)

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([
    { components: [], selectedComponentId: null }
  ])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Viewport state
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Dirty state (has unsaved changes)
  const [isDirty, setIsDirty] = useState(false)

  // Debounce timer ref for updateComponent
  const updateDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Add to history when components change
  const addToHistory = useCallback((newComponents: ComponentInstance[]) => {
    const newEntry: HistoryEntry = {
      components: newComponents,
      selectedComponentId
    }

    // Remove any history entries after current index (if we've undone and then made a new change)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newEntry)

    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }

    setHistory(newHistory)
    setIsDirty(true)
  }, [history, historyIndex, selectedComponentId])

  // Set components with history tracking
  const setComponents = useCallback((newComponents: ComponentInstance[]) => {
    setComponentsState(newComponents)
    addToHistory(newComponents)
  }, [addToHistory])

  // Add component
  const addComponent = useCallback((component: ComponentInstance) => {
    const newComponents = [...components, component]
    setComponentsState(newComponents)
    addToHistory(newComponents)
    setSelectedComponentId(component.id)
  }, [components, addToHistory])

  // Update component props (with debouncing for history)
  const updateComponent = useCallback((id: string, props: Record<string, unknown>) => {
    const newComponents = components.map(c =>
      c.id === id ? { ...c, props: { ...c.props, ...props } } : c
    )
    setComponentsState(newComponents)

    // Debounce history updates to avoid creating too many history entries during typing
    if (updateDebounceTimer.current) {
      clearTimeout(updateDebounceTimer.current)
    }

    updateDebounceTimer.current = setTimeout(() => {
      addToHistory(newComponents)
    }, 500)
  }, [components, addToHistory])

  // Delete component
  const deleteComponent = useCallback((id: string) => {
    const newComponents = components.filter(c => c.id !== id)
    setComponentsState(newComponents)
    addToHistory(newComponents)

    // Clear selection if deleted component was selected
    if (selectedComponentId === id) {
      setSelectedComponentId(null)
    }
  }, [components, selectedComponentId, addToHistory])

  // Move component (for drag-and-drop reordering)
  const moveComponent = useCallback((fromIndex: number, toIndex: number) => {
    const newComponents = [...components]
    const [movedComponent] = newComponents.splice(fromIndex, 1)
    newComponents.splice(toIndex, 0, movedComponent)
    setComponentsState(newComponents)
    addToHistory(newComponents)
  }, [components, addToHistory])

  // Copy component to clipboard (uses selected component if id not provided)
  const copyComponent = useCallback((id?: string) => {
    const targetId = id || selectedComponentId
    if (!targetId) return

    const component = components.find(c => c.id === targetId)
    if (component) {
      // Deep clone the component props
      const clonedComponent: ComponentInstance = {
        ...component,
        props: JSON.parse(JSON.stringify(component.props))
      }
      setClipboard(clonedComponent)
    }
  }, [components, selectedComponentId])

  // Cut component (copy + delete)
  const cutComponent = useCallback((id?: string) => {
    const targetId = id || selectedComponentId
    if (!targetId) return

    copyComponent(targetId)
    deleteComponent(targetId)
  }, [selectedComponentId, copyComponent, deleteComponent])

  // Paste component from clipboard
  const pasteComponent = useCallback(() => {
    if (!clipboard) return

    // Create new component with new ID and deep-cloned props
    const newComponent: ComponentInstance = {
      ...clipboard,
      id: crypto.randomUUID(),
      props: JSON.parse(JSON.stringify(clipboard.props))
    }

    // Insert below selected component, or at the end
    let newComponents: ComponentInstance[]
    if (selectedComponentId) {
      const selectedIndex = components.findIndex(c => c.id === selectedComponentId)
      if (selectedIndex !== -1) {
        newComponents = [
          ...components.slice(0, selectedIndex + 1),
          newComponent,
          ...components.slice(selectedIndex + 1)
        ]
      } else {
        newComponents = [...components, newComponent]
      }
    } else {
      newComponents = [...components, newComponent]
    }

    setComponentsState(newComponents)
    addToHistory(newComponents)
    setSelectedComponentId(newComponent.id)
  }, [clipboard, selectedComponentId, components, addToHistory])

  // Duplicate component
  const duplicateComponent = useCallback((id?: string) => {
    const targetId = id || selectedComponentId
    if (!targetId) return

    const component = components.find(c => c.id === targetId)
    if (!component) return

    // Create new component with new ID and deep-cloned props
    const newComponent: ComponentInstance = {
      ...component,
      id: crypto.randomUUID(),
      props: JSON.parse(JSON.stringify(component.props))
    }

    // Insert right after the original
    const originalIndex = components.findIndex(c => c.id === targetId)
    const newComponents = [
      ...components.slice(0, originalIndex + 1),
      newComponent,
      ...components.slice(originalIndex + 1)
    ]

    setComponentsState(newComponents)
    addToHistory(newComponents)
    setSelectedComponentId(newComponent.id)
  }, [components, selectedComponentId, addToHistory])

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const entry = history[newIndex]
      setComponentsState(entry.components)
      setSelectedComponentId(entry.selectedComponentId)
      setIsDirty(true)
    }
  }, [history, historyIndex])

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const entry = history[newIndex]
      setComponentsState(entry.components)
      setSelectedComponentId(entry.selectedComponentId)
      setIsDirty(true)
    }
  }, [history, historyIndex])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // Reset history (call after save to create new checkpoint)
  const resetHistory = useCallback(() => {
    const currentEntry: HistoryEntry = {
      components,
      selectedComponentId
    }
    setHistory([currentEntry])
    setHistoryIndex(0)
    setIsDirty(false)
  }, [components, selectedComponentId])

  // Multi-select functions
  const toggleComponentSelection = useCallback((id: string) => {
    setSelectedComponentIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedComponentIds(components.map(c => c.id))
    setSelectedComponentId(null)
  }, [components])

  const deselectAll = useCallback(() => {
    setSelectedComponentIds([])
    setSelectedComponentId(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (ctrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if (ctrlOrCmd && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        redo()
        return
      }

      // Copy: Ctrl/Cmd + C
      if (ctrlOrCmd && e.key === 'c') {
        if (selectedComponentId || selectedComponentIds.length > 0) {
          e.preventDefault()
          copyComponent()
        }
        return
      }

      // Cut: Ctrl/Cmd + X
      if (ctrlOrCmd && e.key === 'x') {
        if (selectedComponentId) {
          e.preventDefault()
          cutComponent()
        }
        return
      }

      // Paste: Ctrl/Cmd + V
      if (ctrlOrCmd && e.key === 'v') {
        e.preventDefault()
        pasteComponent()
        return
      }

      // Duplicate: Ctrl/Cmd + D
      if (ctrlOrCmd && e.key === 'd') {
        if (selectedComponentId) {
          e.preventDefault()
          duplicateComponent()
        }
        return
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          e.preventDefault()
          deleteComponent(selectedComponentId)
        } else if (selectedComponentIds.length > 0) {
          e.preventDefault()
          // Bulk delete for multi-select
          const newComponents = components.filter(c => !selectedComponentIds.includes(c.id))
          setComponentsState(newComponents)
          addToHistory(newComponents)
          setSelectedComponentIds([])
        }
        return
      }

      // Select All: Ctrl/Cmd + A
      if (ctrlOrCmd && e.key === 'a') {
        e.preventDefault()
        selectAll()
        return
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        deselectAll()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    undo,
    redo,
    copyComponent,
    cutComponent,
    pasteComponent,
    duplicateComponent,
    deleteComponent,
    selectAll,
    deselectAll,
    selectedComponentId,
    selectedComponentIds,
    components,
    addToHistory
  ])

  const value: EditorContextValue = {
    pageId,
    siteId,
    components,
    setComponents,
    addComponent,
    updateComponent,
    deleteComponent,
    moveComponent,
    selectedComponentId,
    setSelectedComponentId,
    selectedComponentIds,
    setSelectedComponentIds,
    toggleComponentSelection,
    selectAll,
    deselectAll,
    clipboard,
    copyComponent,
    cutComponent,
    pasteComponent,
    duplicateComponent,
    history,
    historyIndex,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    viewport,
    setViewport,
    isDirty,
    setIsDirty
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}
