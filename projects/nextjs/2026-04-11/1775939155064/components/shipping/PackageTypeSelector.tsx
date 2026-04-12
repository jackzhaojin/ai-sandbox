"use client"

import { Mail, Box, Container, Package, LayoutGrid, Ruler } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PackageType {
  id: string
  name: string
  description: string
  maxWeight: number // in kg
  maxLength: number // in cm
  maxWidth: number // in cm
  maxHeight: number // in cm
  icon: string
}

// Package types with their limits (imperial units displayed)
const packageTypes: PackageType[] = [
  {
    id: "envelope",
    name: "Envelope",
    description: "Documents & flat items",
    maxWeight: 0.5,
    maxLength: 38,
    maxWidth: 30,
    maxHeight: 2,
    icon: "envelope",
  },
  {
    id: "small-box",
    name: "Small Box",
    description: "Up to 5 kg / 11 lbs",
    maxWeight: 5,
    maxLength: 30,
    maxWidth: 25,
    maxHeight: 20,
    icon: "box",
  },
  {
    id: "medium-box",
    name: "Medium Box",
    description: "Up to 15 kg / 33 lbs",
    maxWeight: 15,
    maxLength: 45,
    maxWidth: 35,
    maxHeight: 30,
    icon: "package",
  },
  {
    id: "large-box",
    name: "Large Box",
    description: "Up to 25 kg / 55 lbs",
    maxWeight: 25,
    maxLength: 60,
    maxWidth: 50,
    maxHeight: 40,
    icon: "container",
  },
  {
    id: "extra-large",
    name: "Extra Large",
    description: "Up to 35 kg / 77 lbs",
    maxWeight: 35,
    maxLength: 80,
    maxWidth: 60,
    maxHeight: 50,
    icon: "layout-grid",
  },
  {
    id: "pallet",
    name: "Pallet",
    description: "Freight up to 500 kg",
    maxWeight: 500,
    maxLength: 120,
    maxWidth: 100,
    maxHeight: 150,
    icon: "pallet",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Enter your dimensions",
    maxWeight: 1000,
    maxLength: 200,
    maxWidth: 150,
    maxHeight: 150,
    icon: "ruler",
  },
]

// Custom Pallet icon since it's not in lucide-react
function PalletIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="14" width="20" height="4" rx="1" />
      <rect x="4" y="18" width="3" height="4" rx="1" />
      <rect x="17" y="18" width="3" height="4" rx="1" />
      <line x1="6" y1="14" x2="6" y2="4" />
      <line x1="18" y1="14" x2="18" y2="4" />
    </svg>
  )
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  envelope: Mail,
  box: Box,
  package: Package,
  container: Container,
  "layout-grid": LayoutGrid,
  pallet: PalletIcon,
  ruler: Ruler,
}

// Convert cm to inches for display
function cmToInches(cm: number): number {
  return Math.round(cm / 2.54)
}

// Convert kg to lbs for display
function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462)
}

interface PackageTypeSelectorProps {
  value?: string
  onChange: (packageType: PackageType) => void
  disabled?: boolean
}

export function PackageTypeSelector({ value, onChange, disabled }: PackageTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Package Type</h3>
        <span className="text-xs text-gray-500">Select one</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {packageTypes.map((pkg) => {
          const Icon = iconMap[pkg.icon] || Box
          const isSelected = value === pkg.id
          const maxWeightLbs = kgToLbs(pkg.maxWeight)
          const maxLengthIn = cmToInches(pkg.maxLength)
          const maxWidthIn = cmToInches(pkg.maxWidth)
          const maxHeightIn = cmToInches(pkg.maxHeight)

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => !disabled && onChange(pkg)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200",
                "hover:border-blue-400 hover:bg-blue-50",
                isSelected
                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                  : "border-gray-200 bg-white",
                disabled && "opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-white"
              )}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  "p-2 rounded-full mb-2",
                  isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">{pkg.name}</span>
              <span className="text-xs text-gray-500 text-center mt-0.5 line-clamp-1">
                {pkg.description}
              </span>
              <div className="mt-1.5 text-[10px] text-gray-400 text-center leading-tight">
                Max: {maxLengthIn}"×{maxWidthIn}"×{maxHeightIn}"
                <br />
                {maxWeightLbs} lbs
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { packageTypes }
export { cmToInches, kgToLbs }
