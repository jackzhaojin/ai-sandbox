export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Recipe Detail</h1>
      <p className="text-gray-600">Detail for recipe {id} will go here.</p>
    </main>
  );
}
