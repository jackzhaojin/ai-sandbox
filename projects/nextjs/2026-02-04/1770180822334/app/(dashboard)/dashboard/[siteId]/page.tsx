'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  CheckCircle2,
  FileEdit,
  Clock,
  Image,
  FileCheck,
  Plus,
  ExternalLink,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

// Placeholder data
const stats = [
  {
    title: 'Total Pages',
    value: '24',
    icon: FileText,
    description: '+3 from last month',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Published',
    value: '18',
    icon: CheckCircle2,
    description: '75% of total pages',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Drafts',
    value: '4',
    icon: FileEdit,
    description: '2 ready for review',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    title: 'In Review',
    value: '2',
    icon: Clock,
    description: 'Awaiting approval',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Media Files',
    value: '156',
    icon: Image,
    description: '2.4 GB used',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    title: 'Form Submissions',
    value: '89',
    icon: FileCheck,
    description: '+12 this week',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
]

const recentPages = [
  {
    id: '1',
    title: 'Home Page',
    status: 'published',
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    updatedBy: 'John Doe',
  },
  {
    id: '2',
    title: 'About Us',
    status: 'draft',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    updatedBy: 'Jane Smith',
  },
  {
    id: '3',
    title: 'Contact Page',
    status: 'in_review',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    updatedBy: 'Bob Johnson',
  },
  {
    id: '4',
    title: 'Services',
    status: 'published',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    updatedBy: 'Alice Williams',
  },
]

const recentActivity = [
  {
    id: '1',
    type: 'page_published',
    message: 'Published "Home Page"',
    user: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '2',
    type: 'page_created',
    message: 'Created new page "Blog Post 1"',
    user: 'Jane Smith',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: '3',
    type: 'media_uploaded',
    message: 'Uploaded 5 images to Media Library',
    user: 'Bob Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: '4',
    type: 'form_submission',
    message: 'New form submission received',
    user: 'System',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
  },
]

const formSubmissions = [
  {
    id: '1',
    formName: 'Contact Form',
    submittedBy: 'visitor@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'new',
  },
  {
    id: '2',
    formName: 'Newsletter Signup',
    submittedBy: 'subscriber@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    status: 'read',
  },
  {
    id: '3',
    formName: 'Contact Form',
    submittedBy: 'customer@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 150),
    status: 'read',
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge variant="success">Published</Badge>
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'in_review':
      return <Badge variant="warning">In Review</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function DashboardPage() {
  const params = useParams()
  const siteId = params.siteId as string

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening with your site.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/dashboard/${siteId}/pages/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New Page
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/${siteId}/media`}>
                <Image className="h-4 w-4 mr-2" />
                Upload Media
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={`https://mywebsite.com`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Site
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent pages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Pages</CardTitle>
              <Link
                href={`/dashboard/${siteId}/pages`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
            <CardDescription>Latest updates to your pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/${siteId}/pages/${page.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {page.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      Updated {formatDistanceToNow(page.updatedAt, { addSuffix: true })} by{' '}
                      {page.updatedBy}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">{getStatusBadge(page.status)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link
                href={`/dashboard/${siteId}/activity`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
            <CardDescription>Latest actions on your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user} •{' '}
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Form Submissions</CardTitle>
            <Link
              href={`/dashboard/${siteId}/forms`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <CardDescription>Latest form submissions from your site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{submission.formName}</p>
                  <p className="text-sm text-gray-500">
                    From {submission.submittedBy} •{' '}
                    {formatDistanceToNow(submission.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {submission.status === 'new' ? (
                    <Badge variant="default">New</Badge>
                  ) : (
                    <Badge variant="secondary">Read</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
