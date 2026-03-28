import { Badge } from './badge'
import { cn } from '@/lib/utils'

export type Status = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  in_review: {
    label: 'In Review',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-400 text-gray-100 border-gray-500',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft

  return (
    <Badge
      className={cn(
        'border font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

// Helper function for backward compatibility
export function getStatusColor(status: string): string {
  const config = statusConfig[status as Status]
  return config ? config.className : statusConfig.draft.className
}
