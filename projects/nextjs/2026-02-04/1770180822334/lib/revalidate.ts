'use server'

import { revalidatePath } from 'next/cache'

/**
 * Revalidate a published page
 *
 * Call this when a page is published to clear ISR cache
 * and regenerate the page on next request.
 *
 * @param siteSlug - Site slug
 * @param pagePath - Page path (e.g., '/' or '/about')
 */
export async function revalidatePublishedPage(siteSlug: string, pagePath: string) {
  try {
    // Build the public URL path
    const pathSegments = pagePath.split('/').filter(Boolean)
    const urlPath = `/sites/${siteSlug}${pathSegments.length > 0 ? '/' + pathSegments.join('/') : ''}`

    console.log(`Revalidating path: ${urlPath}`)
    revalidatePath(urlPath)

    return { success: true }
  } catch (error) {
    console.error('Failed to revalidate path:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Revalidate all pages for a site
 *
 * Call this when site settings are updated (theme, CSS, etc.)
 *
 * @param siteSlug - Site slug
 */
export async function revalidateSite(siteSlug: string) {
  try {
    // Revalidate the entire site path
    console.log(`Revalidating site: /sites/${siteSlug}`)
    revalidatePath(`/sites/${siteSlug}`, 'layout')

    return { success: true }
  } catch (error) {
    console.error('Failed to revalidate site:', error)
    return { success: false, error: String(error) }
  }
}
