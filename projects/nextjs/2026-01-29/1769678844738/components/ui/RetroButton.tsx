import React from 'react'

interface RetroButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  className?: string
}

export function RetroButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = ''
}: RetroButtonProps) {
  const baseClasses = 'border-2 px-6 py-3 font-mono uppercase transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'border-green-500 bg-black text-green-500 hover:bg-green-500 hover:text-black disabled:hover:bg-black disabled:hover:text-green-500',
    secondary: 'border-cyan-500 bg-black text-cyan-500 hover:bg-cyan-500 hover:text-black disabled:hover:bg-black disabled:hover:text-cyan-500',
    danger: 'border-red-500 bg-black text-red-500 hover:bg-red-500 hover:text-black disabled:hover:bg-black disabled:hover:text-red-500'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
