"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavorite, isFavorited } from "@/actions/favorite-actions";

interface FavoriteButtonProps {
  recipeId: string;
}

export function FavoriteButton({ recipeId }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkFavoriteStatus() {
      const result = await isFavorited(recipeId);
      if (result.success && result.data) {
        setIsFavorite(result.data.isFavorited);
      }
    }
    checkFavoriteStatus();
  }, [recipeId]);

  const handleToggleFavorite = async () => {
    setLoading(true);
    const result = await toggleFavorite(recipeId);
    if (result.success && result.data) {
      setIsFavorite(result.data.isFavorited);
    }
    setLoading(false);
  };

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      size="icon"
      onClick={handleToggleFavorite}
      disabled={loading}
      className={
        isFavorite
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "hover:bg-red-50 hover:text-red-500"
      }
    >
      <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );
}
