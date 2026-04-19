export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Edit Recipe</h1>
      <p className="text-gray-600">Edit recipe form for {id} will go here.</p>
    </main>
  );
}
