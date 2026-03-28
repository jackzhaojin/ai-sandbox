'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  label?: string
  options: Option[]
  value: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  className = ''
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOption(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  function clearAll() {
    onChange([])
  }

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label)

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-green-400 font-mono text-sm mb-2 uppercase">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-black text-green-400 border-2 border-green-500 px-4 py-2 font-mono text-sm focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)] transition-all"
        >
          <div className="flex justify-between items-center">
            <span>
              {value.length === 0
                ? placeholder
                : `${value.length} selected: ${selectedLabels.join(', ')}`}
            </span>
            <span className="text-green-500">{isOpen ? '▲' : '▼'}</span>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-black border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.3)] max-h-60 overflow-y-auto">
            {value.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="w-full px-4 py-2 text-left font-mono text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-20 border-b-2 border-green-700"
              >
                &gt; Clear All
              </button>
            )}
            {options.map((option) => {
              const isSelected = value.includes(option.value)
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-green-900 hover:bg-opacity-20 cursor-pointer border-b border-green-700 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(option.value)}
                    className="w-4 h-4 bg-black border-2 border-green-500 checked:bg-green-500 cursor-pointer"
                  />
                  <span
                    className={`font-mono text-sm ${
                      isSelected ? 'text-green-300' : 'text-green-400'
                    }`}
                  >
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
