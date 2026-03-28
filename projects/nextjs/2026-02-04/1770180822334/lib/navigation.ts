// Navigation utilities for breadcrumb generation and menu processing

export interface MenuItem {
  id: string
  type: 'page' | 'url' | 'fragment' | 'divider'
  label: string
  icon?: string
  target?: '_self' | '_blank'
  cssClass?: string
  pageId?: string
  url?: string
  fragmentId?: string
  children?: MenuItem[]
}

export interface BreadcrumbItem {
  label: string
  href: string
  pageId: string
}

/**
 * Find a page in the menu tree and build breadcrumb trail
 */
export function findPageInMenu(
  items: MenuItem[],
  pageId: string,
  trail: BreadcrumbItem[] = []
): BreadcrumbItem[] | null {
  for (const item of items) {
    if (item.type === 'page' && item.pageId === pageId) {
      // Found the page - return the trail with this item
      return [...trail, { label: item.label, href: '#', pageId: item.pageId }]
    }

    if (item.children && item.children.length > 0) {
      // Add this item to the trail and search children
      const childTrail = findPageInMenu(
        item.children,
        pageId,
        item.type === 'page' && item.pageId
          ? [...trail, { label: item.label, href: '#', pageId: item.pageId }]
          : trail
      )

      if (childTrail) {
        return childTrail
      }
    }
  }

  return null
}

/**
 * Generate breadcrumb trail for a page
 * Searches all menus and builds the trail from the first match
 */
export function generateBreadcrumbs(
  allMenus: { items: MenuItem[] }[],
  pageId: string,
  currentPageTitle: string
): BreadcrumbItem[] {
  // Always start with Home
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', pageId: 'home' }
  ]

  // Search all menus for the page
  for (const menu of allMenus) {
    const trail = findPageInMenu(menu.items, pageId)
    if (trail) {
      // Found the page - use this trail
      // Skip the first item if it's a duplicate of Home
      const uniqueTrail = trail.filter(
        item => item.pageId !== 'home' && item.pageId !== breadcrumbs[0].pageId
      )
      breadcrumbs.push(...uniqueTrail)
      break
    }
  }

  // If no trail was found or current page is not in the trail, add it
  const lastItem = breadcrumbs[breadcrumbs.length - 1]
  if (lastItem.pageId !== pageId) {
    breadcrumbs.push({ label: currentPageTitle, href: '#', pageId })
  }

  return breadcrumbs
}

/**
 * Flatten menu items for easier rendering
 */
export function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  const flattened: MenuItem[] = []

  for (const item of items) {
    flattened.push(item)
    if (item.children) {
      flattened.push(...flattenMenuItems(item.children))
    }
  }

  return flattened
}

/**
 * Get max depth of menu tree
 */
export function getMenuDepth(items: MenuItem[], currentDepth: number = 1): number {
  if (items.length === 0) return 0

  const depths = items.map(item => {
    if (item.children && item.children.length > 0) {
      return getMenuDepth(item.children, currentDepth + 1)
    }
    return currentDepth
  })

  return Math.max(...depths)
}

/**
 * Count total menu items including nested
 */
export function countMenuItems(items: MenuItem[]): number {
  return items.reduce((count, item) => {
    return count + 1 + (item.children ? countMenuItems(item.children) : 0)
  }, 0)
}

/**
 * Validate menu structure
 */
export interface MenuValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateMenu(
  items: MenuItem[],
  maxItems: number = 50,
  maxDepth: number = 3
): MenuValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Check item count
  const totalItems = countMenuItems(items)
  if (totalItems > maxItems) {
    errors.push(`Menu has ${totalItems} items, maximum is ${maxItems}`)
  }

  // Check depth
  const depth = getMenuDepth(items)
  if (depth > maxDepth) {
    errors.push(`Menu depth is ${depth}, maximum is ${maxDepth}`)
  }

  // Check for items without required fields
  const flatItems = flattenMenuItems(items)
  for (const item of flatItems) {
    if (item.type !== 'divider' && !item.label) {
      warnings.push(`Item ${item.id} is missing a label`)
    }

    if (item.type === 'page' && !item.pageId) {
      warnings.push(`Page item "${item.label}" is not linked to a page`)
    }

    if (item.type === 'url' && !item.url) {
      warnings.push(`URL item "${item.label}" is missing a URL`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
