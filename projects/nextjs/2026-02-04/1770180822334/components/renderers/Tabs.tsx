'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface TabItem {
  id: string
  label: string
  content: string
}

export interface TabsProps {
  tabs: TabItem[]
  variant?: 'default' | 'pills' | 'underline' | 'bordered'
  defaultTab?: string
}

export default function Tabs({
  tabs,
  variant = 'default',
  defaultTab
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Update underline position for underline variant
  useEffect(() => {
    if (variant === 'underline' && activeTab && tabRefs.current[activeTab]) {
      const activeButton = tabRefs.current[activeTab]
      if (activeButton) {
        setUnderlineStyle({
          left: activeButton.offsetLeft,
          width: activeButton.offsetWidth
        })
      }
    }
  }, [activeTab, variant])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let newIndex = index

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = index === 0 ? tabs.length - 1 : index - 1
        break
      case 'ArrowRight':
        event.preventDefault()
        newIndex = index === tabs.length - 1 ? 0 : index + 1
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = tabs.length - 1
        break
      default:
        return
    }

    const newTabId = tabs[newIndex].id
    setActiveTab(newTabId)
    tabRefs.current[newTabId]?.focus()
  }

  // Variant-specific styles
  const tabListClasses = {
    default: 'border-b border-gray-200',
    pills: 'bg-gray-100 rounded-lg p-1',
    underline: 'border-b border-gray-200 relative',
    bordered: 'border border-gray-300 rounded-t-lg bg-gray-50'
  }

  const getTabButtonClasses = (isActive: boolean) => {
    const baseClasses = 'px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'

    const variantClasses = {
      default: isActive
        ? 'border-b-2 border-blue-600 text-blue-600'
        : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
      pills: isActive
        ? 'bg-white text-blue-600 rounded-md shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md',
      underline: isActive
        ? 'text-blue-600'
        : 'text-gray-600 hover:text-gray-900',
      bordered: isActive
        ? 'bg-white border-x border-t border-gray-300 text-blue-600 rounded-t-lg -mb-px'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-t-lg'
    }

    return `${baseClasses} ${variantClasses[variant]}`
  }

  const activeTabData = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className="w-full max-w-4xl mx-auto" role="region" aria-label="Tabs">
      {/* Tab List */}
      <div
        role="tablist"
        aria-label="Content tabs"
        className={`flex ${variant === 'pills' ? 'space-x-1' : 'space-x-0'} ${tabListClasses[variant]}`}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={getTabButtonClasses(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}

        {/* Sliding underline for underline variant */}
        {variant === 'underline' && (
          <div
            className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 ease-out"
            style={{
              left: `${underlineStyle.left}px`,
              width: `${underlineStyle.width}px`
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Tab Panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`tabpanel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className={`px-6 py-6 bg-white ${variant === 'bordered' ? 'border-x border-b border-gray-300 rounded-b-lg' : ''} ${activeTab === tab.id ? 'animate-fade-in' : ''}`}
        >
          {activeTab === tab.id && (
            <div
              dangerouslySetInnerHTML={{ __html: tab.content }}
              className="prose prose-sm max-w-none text-gray-700"
            />
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in {
            animation: none;
          }

          .transition-all {
            transition-duration: 0.01ms !important;
          }
        }

        .prose :global(p) {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .prose :global(h1),
        .prose :global(h2),
        .prose :global(h3) {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-weight: 700;
          color: #1f2937;
        }

        .prose :global(h1) {
          font-size: 1.875rem;
        }

        .prose :global(h2) {
          font-size: 1.5rem;
        }

        .prose :global(h3) {
          font-size: 1.25rem;
        }

        .prose :global(ul),
        .prose :global(ol) {
          margin-left: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .prose :global(li) {
          margin-bottom: 0.25rem;
        }

        .prose :global(a) {
          color: #3b82f6;
          text-decoration: underline;
        }

        .prose :global(a:hover) {
          color: #2563eb;
        }

        .prose :global(strong) {
          font-weight: 600;
          color: #1f2937;
        }

        @media (prefers-color-scheme: dark) {
          .prose :global(p),
          .prose :global(li) {
            color: #d1d5db;
          }

          .prose :global(h1),
          .prose :global(h2),
          .prose :global(h3),
          .prose :global(strong) {
            color: #f3f4f6;
          }
        }
      `}</style>
    </div>
  )
}
