'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface AccordionItem {
  id: string
  title: string
  content: string
}

export interface AccordionProps {
  items: AccordionItem[]
  allowMultipleOpen?: boolean
  variant?: 'default' | 'bordered' | 'separated'
}

export default function Accordion({
  items,
  allowMultipleOpen = false,
  variant = 'default'
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev)

      if (newSet.has(itemId)) {
        // Close the item
        newSet.delete(itemId)
      } else {
        // Open the item
        if (!allowMultipleOpen) {
          // If only one can be open, clear others
          newSet.clear()
        }
        newSet.add(itemId)
      }

      return newSet
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleItem(itemId)
    }
  }

  // Variant classes
  const containerClasses = {
    default: 'divide-y divide-gray-200',
    bordered: 'border border-gray-300 rounded-lg divide-y divide-gray-200',
    separated: 'space-y-4'
  }

  const itemClasses = {
    default: '',
    bordered: '',
    separated: 'border border-gray-300 rounded-lg'
  }

  return (
    <div
      className={`w-full max-w-4xl mx-auto ${containerClasses[variant]}`}
      role="region"
      aria-label="Accordion"
    >
      {items.map((item) => {
        const isOpen = openItems.has(item.id)

        return (
          <div key={item.id} className={itemClasses[variant]}>
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${variant === 'separated' ? 'rounded-t-lg' : ''}`}
            >
              <span className="text-lg font-semibold text-gray-900">
                {item.title}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                aria-hidden="true"
              />
            </button>

            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-button-${item.id}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
              style={{
                // CSS-based animation respects prefers-reduced-motion
                transitionProperty: 'max-height, opacity'
              }}
            >
              <div className="px-6 py-4 text-gray-700 bg-white">
                <div
                  dangerouslySetInnerHTML={{ __html: item.content }}
                  className="prose prose-sm max-w-none"
                />
              </div>
            </div>
          </div>
        )
      })}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .transition-all,
          .transition-transform,
          .transition-colors {
            transition-duration: 0.01ms !important;
          }
        }

        .prose :global(p) {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .prose :global(ul),
        .prose :global(ol) {
          margin-left: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .prose :global(li) {
          margin-bottom: 0.25rem;
        }

        .prose :global(strong) {
          font-weight: 600;
          color: #1f2937;
        }

        .prose :global(a) {
          color: #3b82f6;
          text-decoration: underline;
        }

        .prose :global(a:hover) {
          color: #2563eb;
        }

        @media (prefers-color-scheme: dark) {
          .prose :global(p),
          .prose :global(li) {
            color: #d1d5db;
          }

          .prose :global(strong) {
            color: #f3f4f6;
          }
        }
      `}</style>
    </div>
  )
}
