import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat } from "lucide-react";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisineType?: string | null;
  imageUrl?: string | null;
  dietaryTags?: string[];
  authorName?: string;
}

export function RecipeCard({
  id,
  title,
  description,
  prepTime,
  cookTime,
  servings,
  difficulty,
  cuisineType,
  imageUrl,
  dietaryTags = [],
  authorName,
}: RecipeCardProps) {
  const totalTime = prepTime + cookTime;

  const difficultyColor = {
    easy: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hard: "bg-red-100 text-red-800 border-red-200",
  }[difficulty];

  return (
    <Link href={`/recipes/${id}`}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
        <CardHeader className="p-0">
          <div className="relative w-full h-48 bg-gray-200">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                <ChefHat className="w-16 h-16 text-orange-400" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
              {title}
            </h3>
            <Badge className={difficultyColor} variant="outline">
              {difficulty}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {description}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {cuisineType && (
              <Badge variant="secondary" className="text-xs">
                {cuisineType}
              </Badge>
            )}
            {dietaryTags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {dietaryTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{dietaryTags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{totalTime}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{servings}</span>
            </div>
          </div>
          {authorName && (
            <span className="text-xs text-gray-500">by {authorName}</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
