"use client"

import { useState, useEffect } from "react"
import { DollarSign, AlertTriangle, Shield, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type CurrencyCode = "USD" | "CAD" | "MXN"

interface CurrencyOption {
  code: CurrencyCode
  name: string
  symbol: string
  flag: string
}

const currencyOptions: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", flag: "🇲🇽" },
]

// Exchange rates relative to USD (approximate)
const exchangeRates: Record<CurrencyCode, number> = {
  USD: 1,
  CAD: 1.35,
  MXN: 17.5,
}

// Warning thresholds in USD
const WARNING_THRESHOLD_1 = 2500
const WARNING_THRESHOLD_2 = 5000
const MAX_VALUE_USD = 100000
const MIN_VALUE_USD = 1

interface DeclaredValueInputProps {
  value?: number
  currency?: CurrencyCode
  onChange: (values: { value: number; currency: CurrencyCode }) => void
  disabled?: boolean
  error?: string
}

// Convert value from one currency to USD
function toUSD(value: number, fromCurrency: CurrencyCode): number {
  return value / exchangeRates[fromCurrency]
}

// Convert value from USD to target currency
function fromUSD(valueInUSD: number, toCurrency: CurrencyCode): number {
  return valueInUSD * exchangeRates[toCurrency]
}

export function DeclaredValueInput({
  value = 0,
  currency: externalCurrency,
  onChange,
  disabled,
  error,
}: DeclaredValueInputProps) {
  // Internal currency state if not controlled externally
  const [internalCurrency, setInternalCurrency] = useState<CurrencyCode>("USD")
  const currency = externalCurrency || internalCurrency

  // Local state for input value
  const [localValue, setLocalValue] = useState<string>(value ? String(value) : "")

  // Sync with external values
  useEffect(() => {
    if (value && String(value) !== localValue) {
      setLocalValue(String(value))
    }
  }, [value])

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    if (disabled) return

    // Convert current value to new currency
    const numValue = parseFloat(localValue) || 0

    if (numValue > 0) {
      const valueInUSD = toUSD(numValue, currency)
      const newValue = fromUSD(valueInUSD, newCurrency)
      setLocalValue(newValue.toFixed(2))
    }

    if (!externalCurrency) {
      setInternalCurrency(newCurrency)
    }

    onChange({
      value: parseFloat(localValue) || 0,
      currency: newCurrency,
    })
  }

  const handleValueChange = (newValue: string) => {
    // Allow only numbers and decimal point
    if (newValue && !/^\d*\.?\d*$/.test(newValue)) return
    
    setLocalValue(newValue)
    const numValue = parseFloat(newValue) || 0
    onChange({ value: numValue, currency })
  }

  const numValue = parseFloat(localValue) || 0
  const valueInUSD = toUSD(numValue, currency)
  const currentCurrency = currencyOptions.find((c) => c.code === currency) || currencyOptions[0]

  // Determine warning level
  const showWarning1 = valueInUSD >= WARNING_THRESHOLD_1 && valueInUSD < WARNING_THRESHOLD_2
  const showWarning2 = valueInUSD >= WARNING_THRESHOLD_2 && valueInUSD <= MAX_VALUE_USD
  const exceedsMax = valueInUSD > MAX_VALUE_USD
  const belowMin = numValue > 0 && valueInUSD < MIN_VALUE_USD

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <Label htmlFor="declared-value" className="text-sm font-medium text-gray-700">
            Declared Value
          </Label>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {currencyOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleCurrencyChange(option.code)}
              disabled={disabled}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                currency === option.code
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              title={option.name}
            >
              <span>{option.flag}</span>
              <span>{option.code}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">{currentCurrency.symbol}</span>
        </div>
        <Input
          id="declared-value"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "h-10 pl-7",
            error && "border-red-500 focus-visible:ring-red-500",
            exceedsMax && "border-red-500 focus-visible:ring-red-500",
            showWarning2 && "border-amber-500 focus-visible:ring-amber-500",
            showWarning1 && "border-blue-400 focus-visible:ring-blue-400"
          )}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}

      {exceedsMax && !error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Maximum declared value is {currentCurrency.symbol}
          {fromUSD(MAX_VALUE_USD, currency).toLocaleString()} ({currency})
        </p>
      )}

      {belowMin && !error && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Minimum declared value is {currentCurrency.symbol}
          {fromUSD(MIN_VALUE_USD, currency).toFixed(2)} ({currency})
        </p>
      )}

      {/* Value Summary & Warnings */}
      {numValue > 0 && !exceedsMax && (
        <div className="space-y-2">
          {/* Show USD equivalent if not in USD */}
          {currency !== "USD" && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Approximately ${valueInUSD.toFixed(2)} USD</span>
            </div>
          )}

          {/* Warning levels */}
          {showWarning1 && (
            <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-100 rounded p-2">
              <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Enhanced coverage recommended.</span>
                <span className="block text-blue-600 mt-0.5">
                  Values over ${WARNING_THRESHOLD_1.toLocaleString()} may benefit from additional insurance.
                </span>
              </div>
            </div>
          )}

          {showWarning2 && (
            <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-100 rounded p-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">High-value shipment.</span>
                <span className="block text-amber-600 mt-0.5">
                  Values over ${WARNING_THRESHOLD_2.toLocaleString()} require signature confirmation 
                  and may have additional handling requirements.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insurance note */}
      <p className="text-xs text-gray-500">
        Standard liability coverage up to $100. Additional insurance available for high-value items.
      </p>
    </div>
  )
}

export { currencyOptions, exchangeRates, WARNING_THRESHOLD_1, WARNING_THRESHOLD_2, MAX_VALUE_USD, MIN_VALUE_USD }
export type { CurrencyCode, CurrencyOption }
