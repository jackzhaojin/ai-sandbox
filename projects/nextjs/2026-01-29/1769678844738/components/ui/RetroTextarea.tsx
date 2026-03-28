import React from 'react'

interface RetroTextareaProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  name?: string
  required?: boolean
  rows?: number
  className?: string
}

export function RetroTextarea({
  label,
  placeholder,
  value,
  onChange,
  name,
  required = false,
  rows = 4,
  className = ''
}: RetroTextareaProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-green-400 font-mono text-sm mb-2 uppercase">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className="w-full bg-black border-2 border-green-500 text-green-400 px-4 py-2 font-mono focus:outline-none focus:border-green-300 focus:shadow-[0_0_10px_rgba(0,255,0,0.5)] resize-vertical"
      />
    </div>
  )
}
