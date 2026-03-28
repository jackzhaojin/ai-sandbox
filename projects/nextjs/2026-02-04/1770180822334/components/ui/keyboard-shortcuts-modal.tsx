'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Keyboard } from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
}

interface ShortcutCategory {
  title: string
  shortcuts: Shortcut[]
}

const shortcuts: ShortcutCategory[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal/dialog' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { keys: ['⌘', 'S'], description: 'Save page' },
      { keys: ['⌘', 'Z'], description: 'Undo' },
      { keys: ['⌘', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['⌘', 'D'], description: 'Duplicate component' },
      { keys: ['Delete'], description: 'Delete selected component' },
      { keys: ['↑', '↓'], description: 'Navigate components' },
      { keys: ['Tab'], description: 'Focus next property field' },
      { keys: ['Shift', 'Tab'], description: 'Focus previous property field' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'then', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'then', 'P'], description: 'Go to Pages' },
      { keys: ['G', 'then', 'M'], description: 'Go to Media' },
      { keys: ['G', 'then', 'T'], description: 'Go to Templates' },
      { keys: ['G', 'then', 'S'], description: 'Go to Settings' },
    ],
  },
]

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open shortcuts modal with '?'
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        setIsOpen(true)
      }

      // Close with Esc
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Keyboard className="h-6 w-6 text-blue-600" />
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Keyboard Shortcuts
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                  <div className="space-y-8">
                    {shortcuts.map((category) => (
                      <div key={category.title}>
                        <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          {category.title}
                        </h3>
                        <div className="space-y-3">
                          {category.shortcuts.map((shortcut, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2"
                            >
                              <span className="text-sm text-gray-600">
                                {shortcut.description}
                              </span>
                              <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, keyIndex) => (
                                  <Fragment key={keyIndex}>
                                    <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-xs font-mono text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm">
                                      {key}
                                    </kbd>
                                    {keyIndex < shortcut.keys.length - 1 && (
                                      <span className="text-gray-400 text-xs px-1">
                                        +
                                      </span>
                                    )}
                                  </Fragment>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <p className="text-xs text-gray-500">
                    Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded">?</kbd> to
                    toggle this dialog
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
