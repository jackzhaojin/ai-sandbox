"use client"

import { useState, useCallback } from "react"
import { Control, Controller, FieldErrors, UseFormSetValue } from "react-hook-form"
import { MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  SUPPORTED_COUNTRIES,
  COUNTRY_NAMES,
  STATES_BY_COUNTRY,
  LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
  CountryCode,
  LocationType,
} from "@/lib/validation"
import { useDebounce } from "@/lib/hooks"

interface AddressInputProps {
  prefix: "origin" | "destination" | "billing"
  control: Control<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  setValue: UseFormSetValue<Record<string, unknown>>
}

interface AddressSuggestion {
  id: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

export function AddressInput({ prefix, control, errors, setValue }: AddressInputProps) {
  const [addressQuery, setAddressQuery] = useState("")
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedQuery = useDebounce(addressQuery, 300)

  // Fetch address suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(
        `/api/address-search?q=${encodeURIComponent(query)}`
      )
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch {
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  // Handle address input change
  const handleAddressChange = useCallback(
    (value: string, onChange: (value: string) => void) => {
      setAddressQuery(value)
      onChange(value)
      setShowSuggestions(value.length >= 3)
      if (value.length >= 3) {
        fetchSuggestions(value)
      }
    },
    [fetchSuggestions]
  )

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: AddressSuggestion, onChange: (value: string) => void) => {
      onChange(suggestion.address)
      setValue(`${prefix}City`, suggestion.city)
      setValue(`${prefix}State`, suggestion.state)
      setValue(`${prefix}Postal`, suggestion.postalCode)
      if (suggestion.country) {
        const countryCode = suggestion.country.toUpperCase() as CountryCode
        if (SUPPORTED_COUNTRIES.includes(countryCode)) {
          setValue(`${prefix}Country`, countryCode)
        }
      }
      setShowSuggestions(false)
      setAddressQuery(suggestion.address)
    },
    [prefix, setValue]
  )

  const getFieldError = (fieldName: string) => {
    return errors[`${prefix}${fieldName}`]?.message as string | undefined
  }

  return (
    <div className="space-y-4">
      {/* Street Address with Autocomplete */}
      <Controller
        name={`${prefix}Line1`}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <Label htmlFor={`${prefix}Line1`} className="text-gray-700">
              Street Address <span className="text-red-600">*</span>
            </Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id={`${prefix}Line1`}
                {...field}
                value={field.value || addressQuery}
                onChange={(e) =>
                  handleAddressChange(e.target.value, field.onChange)
                }
                onFocus={() => setShowSuggestions((field.value || addressQuery).length >= 3)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                placeholder="Start typing to search addresses..."
                className="pl-10"
                aria-invalid={!!getFieldError("Line1")}
              />
              {isLoadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-md border border-gray-200 shadow-lg max-h-60 overflow-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    onClick={() =>
                      handleSuggestionSelect(suggestion, field.onChange)
                    }
                  >
                    <div className="font-medium">{suggestion.address}</div>
                    <div className="text-gray-500 text-xs">
                      {suggestion.city}, {suggestion.state} {suggestion.postalCode}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {getFieldError("Line1") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("Line1")}</p>
            )}
          </div>
        )}
      />

      {/* Suite/Apartment */}
      <Controller
        name={`${prefix}Line2`}
        control={control}
        render={({ field }) => (
          <div>
            <Label htmlFor={`${prefix}Line2`} className="text-gray-700">
              Suite, Apt, Unit (Optional)
            </Label>
            <Input
              id={`${prefix}Line2`}
              {...field}
              value={field.value || ""}
              placeholder="Apt 4B, Suite 100, etc."
              className="mt-1"
            />
            {getFieldError("Line2") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("Line2")}</p>
            )}
          </div>
        )}
      />

      {/* City, State, ZIP, Country Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City */}
        <Controller
          name={`${prefix}City`}
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor={`${prefix}City`} className="text-gray-700">
                City <span className="text-red-600">*</span>
              </Label>
              <Input
                id={`${prefix}City`}
                {...field}
                value={field.value || ""}
                placeholder="New York"
                className="mt-1"
                aria-invalid={!!getFieldError("City")}
              />
              {getFieldError("City") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("City")}</p>
              )}
            </div>
          )}
        />

        {/* Country */}
        <Controller
          name={`${prefix}Country`}
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor={`${prefix}Country`} className="text-gray-700">
                Country <span className="text-red-600">*</span>
              </Label>
              <Select
                value={field.value || ""}
                onChange={(value) => field.onChange(value as CountryCode)}
              >
                <SelectTrigger id={`${prefix}Country`} className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_COUNTRIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {COUNTRY_NAMES[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError("Country") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("Country")}</p>
              )}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State - Filtered by Country */}
        <Controller
          name={`${prefix}State`}
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor={`${prefix}State`} className="text-gray-700">
                State/Province <span className="text-red-600">*</span>
              </Label>
              <Controller
                name={`${prefix}Country`}
                control={control}
                render={({ field: countryField }) => {
                  const country = (countryField.value as CountryCode) || "US"
                  const states = STATES_BY_COUNTRY[country] || []

                  return (
                    <Select
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger id={`${prefix}State`} className="mt-1">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {getFieldError("State") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("State")}</p>
              )}
            </div>
          )}
        />

        {/* ZIP/Postal Code */}
        <Controller
          name={`${prefix}Postal`}
          control={control}
          render={({ field }) => (
            <div>
              <Controller
                name={`${prefix}Country`}
                control={control}
                render={({ field: countryField }) => {
                  const country = (countryField.value as CountryCode) || "US"
                  const placeholders: Record<CountryCode, string> = {
                    US: "12345 or 12345-6789",
                    CA: "A1A 1A1",
                    MX: "01000",
                  }

                  return (
                    <>
                      <Label htmlFor={`${prefix}Postal`} className="text-gray-700">
                        {country === "CA" ? "Postal Code" : country === "MX" ? "Código Postal" : "ZIP Code"}{" "}
                        <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id={`${prefix}Postal`}
                        {...field}
                        value={field.value || ""}
                        placeholder={placeholders[country]}
                        className="mt-1"
                        aria-invalid={!!getFieldError("Postal")}
                      />
                    </>
                  )
                }}
              />
              {getFieldError("Postal") && (
                <p className="mt-1 text-sm text-red-600">{getFieldError("Postal")}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Location Type */}
      <Controller
        name={`${prefix}LocationType`}
        control={control}
        render={({ field }) => (
          <div>
            <Label className="text-gray-700 mb-2 block">
              Location Type <span className="text-red-600">*</span>
            </Label>
            <RadioGroup
              value={field.value || ""}
              onChange={(value) => field.onChange(value as LocationType)}
              className="flex flex-row gap-6"
            >
              {LOCATION_TYPES.map((type) => (
                <RadioGroupItem
                  key={type}
                  value={type}
                  label={LOCATION_TYPE_LABELS[type]}
                />
              ))}
            </RadioGroup>
            {getFieldError("LocationType") && (
              <p className="mt-1 text-sm text-red-600">{getFieldError("LocationType")}</p>
            )}
          </div>
        )}
      />
    </div>
  )
}
