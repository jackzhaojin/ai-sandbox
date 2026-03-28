"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getDietaryTags } from "@/actions/dietary-tag-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export interface FilterOptions {
  difficulty?: "easy" | "medium" | "hard" | null;
  cuisineType?: string | null;
  maxTime?: number | null;
  dietaryTags?: string[];
}

interface SearchFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableCuisines?: string[];
  availableDietaryTags?: string[];
}

export function SearchFilters({
  onFilterChange,
  availableCuisines = [
    "Italian",
    "Chinese",
    "Mexican",
    "Indian",
    "Japanese",
    "Thai",
    "French",
    "Mediterranean",
    "American",
  ],
  availableDietaryTags = [],
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    difficulty: null,
    cuisineType: null,
    maxTime: null,
    dietaryTags: [],
  });

  const [loadedDietaryTags, setLoadedDietaryTags] = useState<string[]>([]);

  // Load dietary tags from database on mount
  useEffect(() => {
    async function loadTags() {
      const result = await getDietaryTags();
      if (result.success) {
        setLoadedDietaryTags(result.data.map((tag) => tag.name));
      }
    }
    loadTags();
  }, []);

  // Use loaded tags if availableDietaryTags is empty (from props)
  const dietaryTagsToShow =
    availableDietaryTags.length > 0 ? availableDietaryTags : loadedDietaryTags;

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleDietaryTag = (tag: string) => {
    const currentTags = filters.dietaryTags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    updateFilter("dietaryTags", newTags);
  };

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {
      difficulty: null,
      cuisineType: null,
      maxTime: null,
      dietaryTags: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters =
    filters.difficulty ||
    filters.cuisineType ||
    filters.maxTime ||
    (filters.dietaryTags && filters.dietaryTags.length > 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-sm text-gray-600"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          value={filters.difficulty || "all"}
          onValueChange={(value) =>
            updateFilter("difficulty", value === "all" ? null : value)
          }
        >
          <SelectTrigger id="difficulty">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cuisine Type */}
      <div className="space-y-2">
        <Label htmlFor="cuisine">Cuisine Type</Label>
        <Select
          value={filters.cuisineType || "all"}
          onValueChange={(value) =>
            updateFilter("cuisineType", value === "all" ? null : value)
          }
        >
          <SelectTrigger id="cuisine">
            <SelectValue placeholder="Select cuisine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cuisines</SelectItem>
            {availableCuisines.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Max Time */}
      <div className="space-y-2">
        <Label htmlFor="maxTime">Maximum Time</Label>
        <Select
          value={filters.maxTime?.toString() || "all"}
          onValueChange={(value) =>
            updateFilter("maxTime", value === "all" ? null : parseInt(value))
          }
        >
          <SelectTrigger id="maxTime">
            <SelectValue placeholder="Select max time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Duration</SelectItem>
            <SelectItem value="15">Under 15 min</SelectItem>
            <SelectItem value="30">Under 30 min</SelectItem>
            <SelectItem value="60">Under 1 hour</SelectItem>
            <SelectItem value="120">Under 2 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dietary Tags */}
      <div className="space-y-2">
        <Label>Dietary Preferences</Label>
        <div className="flex flex-wrap gap-2">
          {dietaryTagsToShow.map((tag) => {
            const isSelected = filters.dietaryTags?.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleDietaryTag(tag)}
              >
                {tag}
              </Badge>
            );
          })}
          {dietaryTagsToShow.length === 0 && (
            <p className="text-gray-500 text-sm">Loading dietary tags...</p>
          )}
        </div>
      </div>
    </div>
  );
}
