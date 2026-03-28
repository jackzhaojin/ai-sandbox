export default async function EditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = await params

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Visual Editor</h1>
      <p className="text-gray-600">Editing page: {pageId}</p>
      <p className="text-gray-600 mt-2">Visual editor will be implemented in later steps</p>
    </div>
  )
}
