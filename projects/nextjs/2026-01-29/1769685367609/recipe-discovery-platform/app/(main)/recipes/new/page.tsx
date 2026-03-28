import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";

export default async function NewRecipePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Recipe
        </h1>
        <p className="text-gray-600">
          Share your culinary creation with the community
        </p>
      </div>

      <RecipeForm />
    </div>
  );
}
