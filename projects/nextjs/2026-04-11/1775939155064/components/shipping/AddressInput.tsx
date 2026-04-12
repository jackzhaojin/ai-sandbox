"use client"

import { useState, useCallback, useId } from "react"
import { Control, Controller, FieldErrors, UseFormSetValue } from "react-hook-form"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLiveRegion } from "@/lib/accessibility"
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
  street: string
  suite?: string
  city: string
  state: string
  zip: string
  country: string
  is_residential: boolean
  location_type: 'residential' | 'commercial' | 'mixed_use'
  confidence: number
}

export function AddressInput({ prefix, control, errors, setValue }: AddressInputProps) {
  const [addressQuery, setAddressQuery] = useState("")
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const debouncedQuery = useDebounce(addressQuery, 300)
  const { announce } = useLiveRegion()
  
  // Generate unique IDs for accessibility
  const baseId = useId()
  const streetId = `${baseId}-street`
  const suiteId = `${baseId}-suite`
  const cityId = `${baseId}-city`
  const stateId = `${baseId}-state`
  const postalId = `${baseId}-postal`
  const countryId = `${baseId}-country`
  const locationTypeId = `${baseId}-location-type`
  const suggestionsId = `${baseId}-suggestions`

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
        const newSuggestions = data.suggestions || []
        setSuggestions(newSuggestions)
        // Announce suggestions to screen readers
        if (newSuggestions.length > 0) {
          announce(`${newSuggestions.length} address suggestions available. Use arrow keys to navigate.`, "polite")
        }
      }
    } catch {
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [announce])

  // Handle address input change
  const handleAddressChange = useCallback(
    (value: string, onChange: (value: string) => void) => {
      setAddressQuery(value)
      onChange(value)
      setShowSuggestions(value.length >= 3)
      setActiveSuggestionIndex(-1)
      if (value.length >= 3) {
        fetchSuggestions(value)
      }
    },
    [fetchSuggestions]
  )

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: AddressSuggestion, onChange: (value: string) => void) => {
      // Set street address (combine street + suite if present)
      const fullAddress = suggestion.suite 
        ? `${suggestion.street}, ${suggestion.suite}` 
        : suggestion.street
      onChange(fullAddress)
      setValue(`${prefix}Line1`, suggestion.street)
      if (suggestion.suite) {
        setValue(`${prefix}Line2`, suggestion.suite)
      }
      setValue(`${prefix}City`, suggestion.city)
      setValue(`${prefix}State`, suggestion.state)
      setValue(`${prefix}Postal`, suggestion.zip)
      if (suggestion.country) {
        const countryCode = suggestion.country.toUpperCase() as CountryCode
        if (SUPPORTED_COUNTRIES.includes(countryCode)) {
          setValue(`${prefix}Country`, countryCode)
        }
      }
      // Set location type based on suggestion
      if (suggestion.location_type) {
        const locationType = suggestion.location_type === 'residential' ? 'residential' : 'commercial'
        setValue(`${prefix}LocationType`, locationType)
      }
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
      setAddressQuery(fullAddress)
      // Announce selection
      announce(`Address selected: ${fullAddress}, ${suggestion.city}, ${suggestion.state}`, "polite")
    },
    [prefix, setValue, announce]
  )

  // Handle keyboard navigation in suggestions
  const handleSuggestionsKeyDown = (event: React.KeyboardEvent, fieldOnChange: (value: string) => void) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        event.preventDefault()
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case "Enter":
        event.preventDefault()
        if (activeSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[activeSuggestionIndex], fieldOnChange)
        }
        break
      case "Escape":
        event.preventDefault()
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  const getFieldError = (fieldName: string) => {
    return errors[`${prefix}${fieldName}`]?.message as string | undefined
  }

  const getErrorId = (fieldName: string) => `${baseId}-${fieldName.toLowerCase()}-error`

  return (
    <div className="space-y-4">
      {/* Street Address with Autocomplete */}
      <Controller
        name={`${prefix}Line1`}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <Label htmlFor={streetId} className="text-gray-700">
              Street Address <span className="text-red-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                id={streetId}
                {...field}
                value={field.value || addressQuery}
                onChange={(e) =>
                  handleAddressChange(e.target.value, field.onChange)
                }
                onFocus={() => setShowSuggestions((field.value || addressQuery).length >= 3)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                onKeyDown={(e) => handleSuggestionsKeyDown(e, field.onChange)}
                placeholder="Start typing to search addresses..."
                className="pl-10"
                aria-invalid={!!getFieldError("Line1")}
                aria-describedby={`${getErrorId("Line1")} ${suggestionsId}`}
                autoComplete="street-address"
                aria-autocomplete="list"
                aria-controls={showSuggestions ? suggestionsId : undefined}
                aria-activedescendant={activeSuggestionIndex >= 0 ? `${suggestionsId}-${activeSuggestionIndex}` : undefined}
              />
              {isLoadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
              )}
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                id={suggestionsId}
                role="listbox"
                aria-label="Address suggestions"
                className="absolute z-50 w-full mt-1 bg-white rounded-md border border-gray-200 shadow-lg max-h-60 overflow-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    id={`${suggestionsId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      index === activeSuggestionIndex ? "bg-gray-100" : ""
                    }`}
                    onClick={() =>
                      handleSuggestionSelect(suggestion, field.onChange)
                    }
                    tabIndex={-1}
                  >
                    <div className="font-medium">
                      {suggestion.street}
                      {suggestion.suite && <span className="text-gray-600">, {suggestion.suite}</span>}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {suggestion.location_type === 'residential' ? 'Res' : 'Comm'}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {suggestion.city}, {suggestion.state} {suggestion.zip}
                      <span className="ml-2 text-gray-400">({Math.round(suggestion.confidence * 100)}% match)</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Error Message */}
            {getFieldError("Line1") && (
              <p id={getErrorId("Line1")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert" aria-live="assertive">
                <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                {getFieldError("Line1")}
              </p>
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
            <Label htmlFor={suiteId} className="text-gray-700">
              Suite, Apt, Unit <span className="text-gray-500">(Optional)</span>
            </Label>
            <Input
              id={suiteId}
              {...field}
              value={field.value || ""}
              placeholder="Apt 4B, Suite 100, etc."
              className="mt-1"
              aria-invalid={!!getFieldError("Line2")}
              aria-describedby={getFieldError("Line2") ? getErrorId("Line2") : undefined}
              autoComplete="address-line2"
            />
            {getFieldError("Line2") && (
              <p id={getErrorId("Line2")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                {getFieldError("Line2")}
              </p>
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
              <Label htmlFor={cityId} className="text-gray-700">
                City <span className="text-red-600" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                id={cityId}
                {...field}
                value={field.value || ""}
                placeholder="New York"
                className="mt-1"
                aria-invalid={!!getFieldError("City")}
                aria-describedby={getFieldError("City") ? getErrorId("City") : undefined}
                autoComplete="address-level2"
              />
              {getFieldError("City") && (
                <p id={getErrorId("City")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  {getFieldError("City")}
                </p>
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
              <Label htmlFor={countryId} className="text-gray-700">
                Country <span className="text-red-600" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Select
                value={field.value || ""}
                onChange={(value) => field.onChange(value as CountryCode)}
              >
                <SelectTrigger id={countryId} className="mt-1" aria-describedby={getFieldError("Country") ? getErrorId("Country") : undefined}>
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
                <p id={getErrorId("Country")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  {getFieldError("Country")}
                </p>
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
              <Label htmlFor={stateId} className="text-gray-700">
                State/Province <span className="text-red-600" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
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
                      <SelectTrigger id={stateId} className="mt-1" aria-describedby={getFieldError("State") ? getErrorId("State") : undefined}>
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
                <p id={getErrorId("State")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  {getFieldError("State")}
                </p>
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
                      <Label htmlFor={postalId} className="text-gray-700">
                        {country === "CA" ? "Postal Code" : country === "MX" ? "Código Postal" : "ZIP Code"}{" "}
                        <span className="text-red-600" aria-hidden="true">*</span>
                        <span className="sr-only">(required)</span>
                      </Label>
                      <Input
                        id={postalId}
                        {...field}
                        value={field.value || ""}
                        placeholder={placeholders[country]}
                        className="mt-1"
                        aria-invalid={!!getFieldError("Postal")}
                        aria-describedby={getFieldError("Postal") ? getErrorId("Postal") : undefined}
                        autoComplete="postal-code"
                      />
                    </>
                  )
                }}
              />
              {getFieldError("Postal") && (
                <p id={getErrorId("Postal")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  {getFieldError("Postal")}
                </p>
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
          <div role="radiogroup" aria-labelledby={`${locationTypeId}-label`}>
            <Label id={`${locationTypeId}-label`} className="text-gray-700 mb-2 block">
              Location Type <span className="text-red-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <RadioGroup
              value={field.value || ""}
              onChange={(value) => field.onChange(value as LocationType)}
              className="flex flex-row gap-6"
              name={`${prefix}-location-type`}
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
              <p id={getErrorId("LocationType")} className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                {getFieldError("LocationType")}
              </p>
            )}
          </div>
        )}
      />
    </div>
  )
}
