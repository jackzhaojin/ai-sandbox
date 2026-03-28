'use client'

import { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export interface Notification {
  id: string
  type: 'review_submitted' | 'review_approved' | 'review_rejected' | 'page_published' | 'form_submission' | 'page_unlocked' | 'comment' | 'system' | 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read?: boolean
  isRead?: boolean
  createdAt: Date
  url?: string
  link?: string | null
}

export interface NotificationBellProps {
  notifications: Notification[]
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
}

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
  // Support both 'read' and 'isRead' properties
  const normalizedNotifications = notifications.map(n => ({
    ...n,
    read: n.read !== undefined ? n.read : (n.isRead !== undefined ? !n.isRead : false)
  }))
  const unreadCount = normalizedNotifications.filter((n) => !n.read).length
  const recentNotifications = normalizedNotifications.slice(0, 10)

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-96 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          {recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <div
                      className={cn(
                        'border-b border-gray-100 px-4 py-3 last:border-0',
                        active && 'bg-gray-50',
                        !notification.read && 'bg-blue-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 h-2 w-2 flex-shrink-0 rounded-full',
                            notification.read ? 'bg-gray-300' : 'bg-blue-600'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.read && onMarkAsRead && (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="flex-shrink-0 rounded p-1 hover:bg-gray-200"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3 text-gray-600" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Menu.Item>
              ))}
            </div>
          )}

          {recentNotifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 text-center">
              <a
                href="/dashboard/notifications"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </a>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
