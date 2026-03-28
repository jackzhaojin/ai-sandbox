'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'

export interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute z-50 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
            align === 'left' && 'origin-top-left left-0',
            align === 'right' && 'origin-top-right right-0'
          )}
        >
          <div className="py-1">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export interface DropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  icon?: React.ReactNode
  disabled?: boolean
}

export function DropdownItem({ children, onClick, icon, disabled }: DropdownItemProps) {
  return (
    <Menu.Item disabled={disabled}>
      {({ active }) => (
        <button
          onClick={onClick}
          className={cn(
            'flex w-full items-center gap-2 px-4 py-2 text-sm',
            active && 'bg-gray-100 text-gray-900',
            !active && 'text-gray-700',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </button>
      )}
    </Menu.Item>
  )
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-gray-200" />
}
