"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { searchIngredients } from "@/actions/ingredient-actions";
import { ChevronDown } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  category: string;
}

interface IngredientAutocompleteProps {
  value: string;
  onSelect: (ingredientId: string, ingredientName: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function IngredientAutocomplete({
  value,
  onSelect,
  placeholder = "Search ingredients...",
  required = false,
}: IngredientAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search ingredients when search term changes
  useEffect(() => {
    async function search() {
      if (searchTerm.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const result = await searchIngredients(searchTerm);
        if (result.success) {
          setSuggestions(result.data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Failed to search ingredients:", error);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelect = (ingredient: Ingredient) => {
    onSelect(ingredient.id, ingredient.name);
    setSelectedName(ingredient.name);
    setSearchTerm("");
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Clear selection when user types
    if (selectedName) {
      setSelectedName("");
      onSelect("", "");
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          type="text"
          value={selectedName || searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="pr-8"
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((ingredient) => (
            <button
              key={ingredient.id}
              type="button"
              onClick={() => handleSelect(ingredient)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
            >
              <div className="font-medium text-gray-900">{ingredient.name}</div>
              <div className="text-sm text-gray-500">{ingredient.category}</div>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && searchTerm.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-4 py-3 text-sm text-gray-600">
          Searching...
        </div>
      )}

      {/* No results */}
      {!loading &&
        searchTerm.length >= 2 &&
        suggestions.length === 0 &&
        showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-4 py-3 text-sm text-gray-600">
            No ingredients found. Try a different search term.
          </div>
        )}

      {/* Hidden input to store the actual ingredient ID */}
      <input type="hidden" value={value} required={required} />
    </div>
  );
}
