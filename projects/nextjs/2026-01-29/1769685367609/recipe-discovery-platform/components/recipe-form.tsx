"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { createRecipe } from "@/actions/recipe-actions";
import { IngredientAutocomplete } from "@/components/ingredient-autocomplete";
import { getDietaryTags } from "@/actions/dietary-tag-actions";

interface Ingredient {
  ingredientId: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  notes?: string;
}

interface Instruction {
  stepNumber: number;
  description: string;
  duration?: string;
}

export function RecipeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [cuisineType, setCuisineType] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { ingredientId: "", ingredientName: "", quantity: "", unit: "cup" },
  ]);

  const [instructions, setInstructions] = useState<Instruction[]>([
    { stepNumber: 1, description: "" },
  ]);

  const [dietaryTagIds, setDietaryTagIds] = useState<string[]>([]);
  const [availableDietaryTags, setAvailableDietaryTags] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Load dietary tags on mount
  useEffect(() => {
    async function loadDietaryTags() {
      const result = await getDietaryTags();
      if (result.success) {
        setAvailableDietaryTags(result.data);
      }
    }
    loadDietaryTags();
  }, []);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { ingredientId: "", ingredientName: "", quantity: "", unit: "cup" },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { stepNumber: instructions.length + 1, description: "" },
    ]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(
      instructions
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, stepNumber: i + 1 }))
    );
  };

  const updateInstruction = (
    index: number,
    field: keyof Instruction,
    value: string | number
  ) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], [field]: value };
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createRecipe({
        title,
        description,
        prepTime: parseInt(prepTime),
        cookTime: parseInt(cookTime),
        servings: parseInt(servings),
        difficulty,
        cuisineType: cuisineType || undefined,
        imageUrl: imageUrl || undefined,
        ingredients: ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit as any,
          notes: ing.notes || undefined,
        })),
        instructions: instructions.map((inst) => ({
          stepNumber: inst.stepNumber,
          description: inst.description,
          duration: inst.duration ? parseInt(inst.duration) : undefined,
        })),
        dietaryTagIds: dietaryTagIds.length > 0 ? dietaryTagIds : [],
      });

      if (result.success && result.data) {
        router.push(`/recipes/${result.data.recipeId}`);
      } else if (!result.success) {
        setError(result.error || "Failed to create recipe");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Classic Spaghetti Carbonara"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Brief description of your recipe..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="prepTime">Prep Time (minutes) *</Label>
              <Input
                id="prepTime"
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                required
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="cookTime">Cook Time (minutes) *</Label>
              <Input
                id="cookTime"
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                required
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="servings">Servings *</Label>
              <Input
                id="servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={difficulty} onValueChange={setDifficulty as any}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cuisineType">Cuisine Type</Label>
              <Input
                id="cuisineType"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                placeholder="e.g., Italian, Chinese, Mexican"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </Card>

      {/* Ingredients */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Ingredients</h2>
          <Button type="button" onClick={addIngredient} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Ingredient
          </Button>
        </div>
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <IngredientAutocomplete
                  value={ingredient.ingredientId}
                  onSelect={(id, name) => {
                    updateIngredient(index, "ingredientId", id);
                    updateIngredient(index, "ingredientName", name);
                  }}
                  placeholder="Search and select ingredient..."
                  required
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={ingredient.quantity}
                  onChange={(e) =>
                    updateIngredient(index, "quantity", e.target.value)
                  }
                  required
                />
              </div>
              <div className="w-28">
                <Select
                  value={ingredient.unit}
                  onValueChange={(value) =>
                    updateIngredient(index, "unit", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cup">Cup</SelectItem>
                    <SelectItem value="tbsp">Tbsp</SelectItem>
                    <SelectItem value="tsp">Tsp</SelectItem>
                    <SelectItem value="gram">Gram</SelectItem>
                    <SelectItem value="oz">Oz</SelectItem>
                    <SelectItem value="lb">Lb</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Instructions</h2>
          <Button type="button" onClick={addInstruction} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Step
          </Button>
        </div>
        <div className="space-y-4">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                {instruction.stepNumber}
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Describe this step..."
                  value={instruction.description}
                  onChange={(e) =>
                    updateInstruction(index, "description", e.target.value)
                  }
                  required
                  rows={2}
                />
                <Input
                  type="number"
                  placeholder="Duration (minutes) - optional"
                  value={instruction.duration || ""}
                  onChange={(e) =>
                    updateInstruction(index, "duration", e.target.value)
                  }
                  className="w-48"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInstruction(index)}
                disabled={instructions.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Dietary Tags */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Dietary Tags (Optional)</h2>
        <div className="flex flex-wrap gap-2">
          {availableDietaryTags.map((tag) => {
            const isSelected = dietaryTagIds.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  if (isSelected) {
                    setDietaryTagIds(dietaryTagIds.filter((id) => id !== tag.id));
                  } else {
                    setDietaryTagIds([...dietaryTagIds, tag.id]);
                  }
                }}
              >
                {tag.name}
              </Badge>
            );
          })}
          {availableDietaryTags.length === 0 && (
            <p className="text-gray-500 text-sm">No dietary tags available</p>
          )}
        </div>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Recipe"}
        </Button>
      </div>
    </form>
  );
}
