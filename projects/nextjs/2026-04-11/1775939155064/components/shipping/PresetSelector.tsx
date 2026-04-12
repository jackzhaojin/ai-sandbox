"use client"

import { useState } from "react"
import { FileText, Cpu, Wrench, Stethoscope, Package } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PresetConfig {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  packageType: string
  length: number
  width: number
  height: number
  weight: number
  declaredValue: number
  contentsCategory: string
}

const presets: PresetConfig[] = [
  {
    id: "standard-documents",
    name: "Standard Documents",
    description: "Letters, contracts, legal papers",
    icon: <FileText className="h-6 w-6" />,
    packageType: "envelope",
    length: 12,
    width: 9,
    height: 0.5,
    weight: 0.5,
    declaredValue: 50,
    contentsCategory: "documents",
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Laptops, tablets, accessories",
    icon: <Cpu className="h-6 w-6" />,
    packageType: "small-box",
    length: 14,
    width: 10,
    height: 4,
    weight: 3,
    declaredValue: 1200,
    contentsCategory: "electronics",
  },
  {
    id: "industrial-parts",
    name: "Industrial Parts",
    description: "Machinery components, hardware",
    icon: <Wrench className="h-6 w-6" />,
    packageType: "medium-box",
    length: 18,
    width: 14,
    height: 10,
    weight: 8,
    declaredValue: 500,
    contentsCategory: "industrial",
  },
  {
    id: "medical-supplies",
    name: "Medical Supplies",
    description: "Pharmaceuticals, equipment",
    icon: <Stethoscope className="h-6 w-6" />,
    packageType: "small-box",
    length: 12,
    width: 8,
    height: 6,
    weight: 2,
    declaredValue: 800,
    contentsCategory: "medical",
  },
  {
    id: "trade-show",
    name: "Trade Show Materials",
    description: "Banners, displays, samples",
    icon: <Package className="h-6 w-6" />,
    packageType: "large-box",
    length: 24,
    width: 18,
    height: 12,
    weight: 15,
    declaredValue: 1500,
    contentsCategory: "other",
  },
]

interface PresetSelectorProps {
  onSelect: (preset: PresetConfig) => void
  selectedId?: string
}

export function PresetSelector({ onSelect, selectedId }: PresetSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Quick Select Preset</h3>
        <span className="text-xs text-gray-500">Click a card to auto-fill</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 text-left",
              "hover:border-blue-400 hover:bg-blue-50",
              selectedId === preset.id
                ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                : "border-gray-200 bg-white"
            )}
            aria-pressed={selectedId === preset.id}
          >
            <div
              className={cn(
                "p-2 rounded-full mb-2",
                selectedId === preset.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {preset.icon}
            </div>
            <span className="text-sm font-medium text-gray-900 text-center">{preset.name}</span>
            <span className="text-xs text-gray-500 text-center mt-1 line-clamp-2">
              {preset.description}
            </span>
            <div className="mt-2 text-xs text-gray-400 text-center">
              {preset.length}"×{preset.width}"×{preset.height}" • {preset.weight} lbs
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export { presets }
export type { PresetConfig }
