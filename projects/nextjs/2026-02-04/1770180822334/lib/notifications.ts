import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'

type NotificationType =
  | 'review_submitted'
  | 'review_approved'
  | 'review_rejected'
  | 'page_published'
  | 'form_submission'
  | 'page_unlocked'
  | 'comment'
  | 'system'

interface CreateNotificationParams {
  userId: string
  siteId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

/**
 * Create a notification for a user (fire-and-forget)
 */
export async function createNotification({
  userId,
  siteId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  try {
    await db.insert(notifications).values({
      userId,
      siteId: siteId || null,
      type,
      title,
      message,
      link: link || null,
      isRead: false,
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    // Don't throw - notification failures shouldn't break the main operation
  }
}

/**
 * Notify admins about a review submission
 */
export async function notifyReviewSubmitted({
  adminIds,
  siteId,
  pageName,
  pageId,
  authorName,
}: {
  adminIds: string[]
  siteId: string
  pageName: string
  pageId: string
  authorName: string
}) {
  const promises = adminIds.map((adminId) =>
    createNotification({
      userId: adminId,
      siteId,
      type: 'review_submitted',
      title: 'Review Request',
      message: `${authorName} submitted "${pageName}" for review`,
      link: `/dashboard/${siteId}/pages/${pageId}/edit`,
    })
  )
  await Promise.all(promises)
}

/**
 * Notify author about review approval
 */
export async function notifyReviewApproved({
  authorId,
  siteId,
  pageName,
  pageId,
  reviewerName,
}: {
  authorId: string
  siteId: string
  pageName: string
  pageId: string
  reviewerName: string
}) {
  await createNotification({
    userId: authorId,
    siteId,
    type: 'review_approved',
    title: 'Review Approved',
    message: `${reviewerName} approved "${pageName}"`,
    link: `/dashboard/${siteId}/pages/${pageId}/edit`,
  })
}

/**
 * Notify author about review rejection
 */
export async function notifyReviewRejected({
  authorId,
  siteId,
  pageName,
  pageId,
  reviewerName,
  reason,
}: {
  authorId: string
  siteId: string
  pageName: string
  pageId: string
  reviewerName: string
  reason?: string
}) {
  await createNotification({
    userId: authorId,
    siteId,
    type: 'review_rejected',
    title: 'Review Rejected',
    message: `${reviewerName} rejected "${pageName}"${reason ? `: ${reason}` : ''}`,
    link: `/dashboard/${siteId}/pages/${pageId}/edit`,
  })
}

/**
 * Notify page creator about publication
 */
export async function notifyPagePublished({
  creatorId,
  siteId,
  pageName,
  pageId,
}: {
  creatorId: string
  siteId: string
  pageName: string
  pageId: string
}) {
  await createNotification({
    userId: creatorId,
    siteId,
    type: 'page_published',
    title: 'Page Published',
    message: `"${pageName}" has been published`,
    link: `/dashboard/${siteId}/pages/${pageId}/edit`,
  })
}

/**
 * Notify admins about form submission
 */
export async function notifyFormSubmission({
  adminIds,
  siteId,
  formName,
  formId,
}: {
  adminIds: string[]
  siteId: string
  formName: string
  formId: string
}) {
  const promises = adminIds.map((adminId) =>
    createNotification({
      userId: adminId,
      siteId,
      type: 'form_submission',
      title: 'New Form Submission',
      message: `New submission received for "${formName}"`,
      link: `/dashboard/${siteId}/forms?formId=${formId}`,
    })
  )
  await Promise.all(promises)
}

/**
 * Notify user that a page has been unlocked
 */
export async function notifyPageUnlocked({
  userId,
  siteId,
  pageName,
  pageId,
  unlockedBy,
}: {
  userId: string
  siteId: string
  pageName: string
  pageId: string
  unlockedBy: string
}) {
  await createNotification({
    userId,
    siteId,
    type: 'page_unlocked',
    title: 'Page Unlocked',
    message: `${unlockedBy} unlocked "${pageName}"`,
    link: `/dashboard/${siteId}/pages/${pageId}/edit`,
  })
}
