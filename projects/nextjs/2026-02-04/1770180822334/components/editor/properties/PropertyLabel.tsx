import React from 'react'

interface PropertyLabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export default function PropertyLabel({ children, htmlFor, required, className }: PropertyLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={className || "block text-sm font-medium text-gray-700 mb-1"}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}
