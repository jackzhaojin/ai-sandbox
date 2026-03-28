import React from 'react'

interface Option {
  value: string
  label: string
}

interface RetroSelectProps {
  label?: string
  options: Option[]
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  name?: string
  required?: boolean
  className?: string
}

export function RetroSelect({
  label,
  options,
  value,
  onChange,
  name,
  required = false,
  className = ''
}: RetroSelectProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-green-400 font-mono text-sm mb-2 uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-2 font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.5)] cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
