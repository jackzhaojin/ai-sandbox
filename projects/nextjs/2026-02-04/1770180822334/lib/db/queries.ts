import { eq, and, desc } from 'drizzle-orm'
import { db } from './index'
import {
  profiles,
  sites,
  pages,
  pageVersions,
  templates,
  components,
  media,
  mediaFolders,
  contentFragments
} from './schema'

/**
 * User/Profile queries
 */

export async function getUserById(userId: string) {
  return await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  })
}

export async function getUserByEmail(email: string) {
  return await db.query.profiles.findFirst({
    where: eq(profiles.email, email),
  })
}

export async function updateUserProfile(userId: string, data: Partial<typeof profiles.$inferInsert>) {
  return await db
    .update(profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(profiles.id, userId))
    .returning()
}

/**
 * Site queries
 */

export async function getSitesByUser(userId: string) {
  return await db.query.sites.findMany({
    where: eq(sites.createdBy, userId),
    orderBy: [desc(sites.createdAt)],
  })
}

export async function getSiteBySlug(slug: string) {
  return await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  })
}

export async function getSiteById(siteId: string) {
  return await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
  })
}

/**
 * Page queries
 */

export async function getPagesBySite(siteId: string) {
  return await db.query.pages.findMany({
    where: eq(pages.siteId, siteId),
    orderBy: [desc(pages.updatedAt)],
  })
}

export async function getPageById(pageId: string) {
  return await db.query.pages.findFirst({
    where: eq(pages.id, pageId),
  })
}

export async function getPageByPath(siteId: string, path: string) {
  return await db.query.pages.findFirst({
    where: and(
      eq(pages.siteId, siteId),
      eq(pages.path, path)
    ),
  })
}

export async function getPublishedPages(siteId: string) {
  return await db.query.pages.findMany({
    where: and(
      eq(pages.siteId, siteId),
      eq(pages.status, 'published')
    ),
    orderBy: [desc(pages.publishedAt)],
  })
}

/**
 * Page Version queries
 */

export async function getPageVersions(pageId: string) {
  return await db.query.pageVersions.findMany({
    where: eq(pageVersions.pageId, pageId),
    orderBy: [desc(pageVersions.versionNumber)],
  })
}

export async function getLatestPageVersion(pageId: string) {
  return await db.query.pageVersions.findFirst({
    where: eq(pageVersions.pageId, pageId),
    orderBy: [desc(pageVersions.versionNumber)],
  })
}

export async function getPageWithVersion(pageId: string, versionId?: string) {
  const page = await getPageById(pageId)
  if (!page) return null

  const version = versionId
    ? await db.query.pageVersions.findFirst({
        where: eq(pageVersions.id, versionId),
      })
    : await getLatestPageVersion(pageId)

  return { page, version }
}

/**
 * Template queries
 */

export async function getTemplatesBySite(siteId: string) {
  return await db.query.templates.findMany({
    where: eq(templates.siteId, siteId),
    orderBy: [desc(templates.createdAt)],
  })
}

export async function getSystemTemplates() {
  return await db.query.templates.findMany({
    where: eq(templates.isSystem, true),
  })
}

/**
 * Component queries
 */

export async function getActiveComponents() {
  return await db.query.components.findMany({
    where: eq(components.isActive, true),
  })
}

export async function getComponentsByCategory(category: string) {
  return await db.query.components.findMany({
    where: and(
      eq(components.category, category as any),
      eq(components.isActive, true)
    ),
  })
}

/**
 * Media queries
 */

export async function getMediaBySite(siteId: string, folderId?: string) {
  const where = folderId
    ? and(eq(media.siteId, siteId), eq(media.folderId, folderId))
    : eq(media.siteId, siteId)

  return await db.query.media.findMany({
    where,
    orderBy: [desc(media.uploadedAt)],
  })
}

export async function getMediaFoldersBySite(siteId: string) {
  return await db.query.mediaFolders.findMany({
    where: eq(mediaFolders.siteId, siteId),
  })
}

/**
 * Content Fragment queries
 */

export async function getContentFragmentsBySite(siteId: string) {
  return await db.query.contentFragments.findMany({
    where: eq(contentFragments.siteId, siteId),
    orderBy: [desc(contentFragments.updatedAt)],
  })
}

export async function getContentFragmentsByType(siteId: string, type: string) {
  return await db.query.contentFragments.findMany({
    where: and(
      eq(contentFragments.siteId, siteId),
      eq(contentFragments.type, type as any)
    ),
  })
}
