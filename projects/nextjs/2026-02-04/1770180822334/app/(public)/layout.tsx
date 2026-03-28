/**
 * Public Layout
 *
 * Simple passthrough layout for public routes.
 * Site-specific layouts are handled at the [siteSlug] level.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
