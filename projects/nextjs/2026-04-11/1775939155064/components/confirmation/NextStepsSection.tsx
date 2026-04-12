'use client'

import { CheckCircle, Circle, ClipboardList, Truck, Package } from 'lucide-react'
import { ConfirmationSection } from './ConfirmationSection'
import type { NextStepsData } from './types'
import { cn } from '@/lib/utils'

interface NextStepsSectionProps {
  data: NextStepsData
}

export function NextStepsSection({ data }: NextStepsSectionProps) {
  const beforePickupCompleted = data.beforePickup.filter(t => t.completed).length
  const beforePickupTotal = data.beforePickup.length
  const afterPickupCompleted = data.afterPickup.filter(t => t.completed).length
  const afterPickupTotal = data.afterPickup.length

  return (
    <ConfirmationSection
      title="Next Steps"
      icon={<ClipboardList className="w-4 h-4 text-blue-600" />}
      defaultExpanded={true}
    >
      {/* Before Pickup Checklist */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-500" />
          Before Pickup
          <span className="ml-auto text-xs font-normal text-gray-500 normal-case">
            {beforePickupCompleted}/{beforePickupTotal} completed
          </span>
        </h4>
        <ul className="space-y-2">
          {data.beforePickup.map((task, index) => (
            <li
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                task.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {task.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <span
                className={cn(
                  'text-sm',
                  task.completed ? 'text-green-800 line-through' : 'text-gray-700'
                )}
              >
                {task.task}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* After Pickup Checklist */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-500" />
          After Pickup
          <span className="ml-auto text-xs font-normal text-gray-500 normal-case">
            {afterPickupCompleted}/{afterPickupTotal} completed
          </span>
        </h4>
        <ul className="space-y-2">
          {data.afterPickup.map((task, index) => (
            <li
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                task.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {task.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <span
                className={cn(
                  'text-sm',
                  task.completed ? 'text-green-800 line-through' : 'text-gray-700'
                )}
              >
                {task.task}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ConfirmationSection>
  )
}
