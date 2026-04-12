"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Trash2, Package, AlertCircle, Scale } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type PieceType = "box" | "envelope" | "pallet" | "tube" | "other"

export interface Piece {
  id: string
  type: PieceType
  description: string
  length: number
  width: number
  height: number
  weight: number
}

export interface MultiPieceData {
  pieces: Piece[]
  totalWeight: number
  totalPieces: number
}

interface MultiPieceFormProps {
  value?: Piece[]
  onChange: (data: MultiPieceData) => void
  disabled?: boolean
  maxPieces?: number
}

const pieceTypeOptions: { id: PieceType; name: string }[] = [
  { id: "box", name: "Box" },
  { id: "envelope", name: "Envelope" },
  { id: "pallet", name: "Pallet" },
  { id: "tube", name: "Tube" },
  { id: "other", name: "Other" },
]

const createEmptyPiece = (): Piece => ({
  id: `piece-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: "box",
  description: "",
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
})

export function MultiPieceForm({
  value,
  onChange,
  disabled,
  maxPieces = 20,
}: MultiPieceFormProps) {
  const [pieces, setPieces] = useState<Piece[]>(value?.length ? value : [createEmptyPiece()])
  
  // Use refs to prevent infinite loops
  const isInitialRender = useRef(true)
  const prevPiecesRef = useRef<string>(JSON.stringify(pieces))

  // Sync with external values
  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(pieces)) {
      setPieces(value.length ? value : [createEmptyPiece()])
    }
  }, [])

  // Calculate totals
  const calculateTotals = useCallback((pieceList: Piece[]): { totalWeight: number; totalPieces: number } => {
    return {
      totalWeight: pieceList.reduce((sum, piece) => sum + (piece.weight || 0), 0),
      totalPieces: pieceList.length,
    }
  }, [])

  // Call onChange when pieces change
  useEffect(() => {
    const currentPiecesJson = JSON.stringify(pieces)

    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false
      prevPiecesRef.current = currentPiecesJson
      return
    }

    // Only call onChange if pieces actually changed
    if (prevPiecesRef.current !== currentPiecesJson) {
      prevPiecesRef.current = currentPiecesJson
      const totals = calculateTotals(pieces)
      onChange({
        pieces,
        totalWeight: totals.totalWeight,
        totalPieces: totals.totalPieces,
      })
    }
  }, [pieces, onChange, calculateTotals])

  const handleAddPiece = useCallback(() => {
    if (pieces.length >= maxPieces) return
    setPieces((prev) => [...prev, createEmptyPiece()])
  }, [pieces.length, maxPieces])

  const handleRemovePiece = useCallback((pieceId: string) => {
    setPieces((prev) => {
      if (prev.length <= 1) {
        // Keep at least one piece, just reset it
        return [createEmptyPiece()]
      }
      return prev.filter((p) => p.id !== pieceId)
    })
  }, [])

  const updatePiece = useCallback((pieceId: string, updates: Partial<Piece>) => {
    setPieces((prev) =>
      prev.map((piece) =>
        piece.id === pieceId ? { ...piece, ...updates } : piece
      )
    )
  }, [])

  const { totalWeight, totalPieces } = calculateTotals(pieces)
  const canAddMore = pieces.length < maxPieces

  return (
    <div className="space-y-4">
      {/* Pieces List */}
      <div className="space-y-3">
        {pieces.map((piece, index) => (
          <div
            key={piece.id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
          >
            {/* Piece Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm text-gray-900">
                  Piece {index + 1}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePiece(piece.id)}
                disabled={disabled || pieces.length === 1}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors",
                  pieces.length === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-600 hover:bg-red-50"
                )}
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>

            {/* Piece Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Type */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Type</Label>
                <select
                  value={piece.type}
                  onChange={(e) => updatePiece(piece.id, { type: e.target.value as PieceType })}
                  disabled={disabled}
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pieceTypeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1 lg:col-span-3">
                <Label className="text-xs text-gray-600">Description</Label>
                <Input
                  placeholder="Brief description of contents"
                  value={piece.description}
                  onChange={(e) => updatePiece(piece.id, { description: e.target.value })}
                  disabled={disabled}
                  className="h-9"
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Length (in)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={piece.length || ""}
                  onChange={(e) => updatePiece(piece.id, { length: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Width (in)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={piece.width || ""}
                  onChange={(e) => updatePiece(piece.id, { width: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Height (in)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={piece.height || ""}
                  onChange={(e) => updatePiece(piece.id, { height: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-9"
                />
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Weight (lbs)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={piece.weight || ""}
                  onChange={(e) => updatePiece(piece.id, { weight: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Piece Button */}
      <button
        type="button"
        onClick={handleAddPiece}
        disabled={disabled || !canAddMore}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-dashed transition-colors",
          canAddMore
            ? "border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
            : "border-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        <Plus className="h-4 w-4" />
        {canAddMore ? "Add Another Piece" : `Maximum ${maxPieces} pieces reached`}
      </button>

      {/* Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Total Pieces: <span className="font-semibold text-gray-900">{totalPieces}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Total Weight: <span className="font-semibold text-gray-900">{totalWeight.toFixed(2)} lbs</span>
            </span>
          </div>
        </div>
      </div>

      {pieces.length >= maxPieces && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span>Maximum of {maxPieces} pieces allowed per shipment</span>
        </div>
      )}
    </div>
  )
}

export type { MultiPieceFormProps }
