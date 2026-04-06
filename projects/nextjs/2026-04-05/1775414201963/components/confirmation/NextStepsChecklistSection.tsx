"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ConfirmationSection, type KeyValuePair } from "./ConfirmationSection";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  FileText,
  Printer,
  Bell,
  MapPin,
  User,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "completed" | "optional";

export interface ChecklistTask {
  id: string;
  label: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  actionUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface NextStepsChecklistSectionProps {
  /** Tasks to complete before pickup */
  beforePickupTasks: ChecklistTask[];
  /** Tasks to complete after pickup */
  afterPickupTasks: ChecklistTask[];
  /** Pickup date for context */
  pickupDate?: string;
  /** Pickup time window for context */
  pickupTimeWindow?: { start: string; end: string };
  /** Estimated delivery date for context */
  estimatedDelivery?: string;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a task checkbox is toggled */
  onTaskToggle?: (taskId: string, completed: boolean) => void;
  /** Callback when all before-pickup tasks are completed */
  onBeforePickupComplete?: () => void;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return (
        <Badge variant="outline" className="bg-destructive-50 text-destructive-600 border-destructive-200 text-xs">
          High Priority
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="bg-warning-50 text-warning-600 border-warning-200 text-xs">
          Medium
        </Badge>
      );
    case "low":
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
          Optional
        </Badge>
      );
    default:
      return null;
  }
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-success-600" />;
    case "optional":
      return <Clock className="h-5 w-5 text-muted-foreground" />;
    case "pending":
    default:
      return <AlertCircle className="h-5 w-5 text-warning-600" />;
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface TaskItemProps {
  task: ChecklistTask;
  onToggle?: (taskId: string, completed: boolean) => void;
}

function TaskItem({ task, onToggle }: TaskItemProps) {
  const isCompleted = task.status === "completed";
  const isOptional = task.status === "optional";

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        isCompleted
          ? "bg-success-50/50 border-success-200"
          : isOptional
          ? "bg-muted/30 border-border/50"
          : "bg-background border-border hover:border-primary/50"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getStatusIcon(task.status)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "font-medium",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.label}
          </span>
          {task.priority && getPriorityBadge(task.priority)}
          {isOptional && (
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          )}
        </div>
        {task.description && (
          <p
            className={cn(
              "text-sm mt-1",
              isCompleted ? "text-muted-foreground/70" : "text-muted-foreground"
            )}
          >
            {task.description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col gap-2">
        {!isOptional && (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle?.(task.id, checked as boolean)}
            aria-label={`Mark "${task.label}" as ${isCompleted ? "incomplete" : "complete"}`}
          />
        )}
        {(task.actionUrl || task.onAction) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1"
            onClick={task.onAction}
            asChild={!!task.actionUrl}
          >
            {task.actionUrl ? (
              <a href={task.actionUrl} target="_blank" rel="noopener noreferrer">
                {task.actionLabel || "Action"}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <>
                {task.actionLabel || "Action"}
                <ChevronRight className="h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ProgressHeaderProps {
  completed: number;
  total: number;
  label: string;
}

function ProgressHeader({ completed, total, label }: ProgressHeaderProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;

  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-success-600" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
        {label}
      </h4>
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isComplete ? "bg-success-500" : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * NextStepsChecklistSection - Displays actionable checklist for before and after pickup
 *
 * Features:
 * - Before pickup tasks checklist with completion tracking
 * - After pickup tasks checklist
 * - Progress indicators
 * - Priority badges for high/medium/low priority items
 * - Quick action buttons for relevant tasks
 *
 * @example
 * <NextStepsChecklistSection
 *   beforePickupTasks={[...]}
 *   afterPickupTasks={[...]}
 *   pickupDate="2024-04-08"
 * />
 */
export function NextStepsChecklistSection({
  beforePickupTasks,
  afterPickupTasks,
  pickupDate,
  pickupTimeWindow,
  estimatedDelivery,
  defaultExpanded = true,
  className,
  onTaskToggle,
  onBeforePickupComplete,
}: NextStepsChecklistSectionProps) {
  const [completedTasks, setCompletedTasks] = React.useState<Set<string>>(
    () =>
      new Set(
        beforePickupTasks
          .concat(afterPickupTasks)
          .filter((t) => t.status === "completed")
          .map((t) => t.id)
      )
  );

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    const newCompleted = new Set(completedTasks);
    if (completed) {
      newCompleted.add(taskId);
    } else {
      newCompleted.delete(taskId);
    }
    setCompletedTasks(newCompleted);
    onTaskToggle?.(taskId, completed);

    // Check if all before-pickup tasks are now complete
    const requiredBeforePickup = beforePickupTasks.filter((t) => t.status !== "optional");
    const allBeforePickupComplete = requiredBeforePickup.every(
      (t) => newCompleted.has(t.id) || t.status === "completed"
    );
    if (allBeforePickupComplete && completed) {
      onBeforePickupComplete?.();
    }
  };

  // Calculate progress
  const requiredBeforePickup = beforePickupTasks.filter((t) => t.status !== "optional");
  const beforePickupCompleted = requiredBeforePickup.filter(
    (t) => completedTasks.has(t.id) || t.status === "completed"
  ).length;

  // Merge completed state with task status
  const mergeTaskStatus = (task: ChecklistTask): ChecklistTask => ({
    ...task,
    status: completedTasks.has(task.id) ? "completed" : task.status,
  });

  const mergedBeforePickupTasks = beforePickupTasks.map(mergeTaskStatus);
  const mergedAfterPickupTasks = afterPickupTasks.map(mergeTaskStatus);

  // Build summary data
  const data: KeyValuePair[] = [
    {
      key: "Before Pickup",
      value: (
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {beforePickupCompleted}/{requiredBeforePickup.length}
          </span>
          <span className="text-muted-foreground">tasks completed</span>
        </div>
      ),
      icon: <Package className="h-4 w-4" />,
    },
    {
      key: "After Pickup",
      value: (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {mergedAfterPickupTasks.filter((t) => t.status === "completed").length} completed
          </span>
        </div>
      ),
      icon: <Truck className="h-4 w-4" />,
    },
  ];

  const allBeforePickupComplete = beforePickupCompleted === requiredBeforePickup.length;

  return (
    <ConfirmationSection
      id="next-steps"
      title="Next Steps"
      icon={<ClipboardList className="h-5 w-5" />}
      status={allBeforePickupComplete ? "confirmed" : "pending"}
      statusLabel={allBeforePickupComplete ? "Ready for Pickup" : "Action Required"}
      defaultExpanded={defaultExpanded}
      data={data}
      className={className}
    >
      <div className="space-y-6 mt-4">
        {/* Before Pickup Section */}
        <div className="bg-muted/50 rounded-lg p-4">
          <ProgressHeader
            completed={beforePickupCompleted}
            total={requiredBeforePickup.length}
            label="Before Pickup"
          />
          {pickupDate && (
            <p className="text-sm text-muted-foreground mb-3">
              Complete these tasks before your pickup on{" "}
              <span className="font-medium text-foreground">
                {new Date(pickupDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {pickupTimeWindow && ` between ${pickupTimeWindow.start} - ${pickupTimeWindow.end}`}
            </p>
          )}
          <div className="space-y-2">
            {mergedBeforePickupTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} />
            ))}
          </div>
          {allBeforePickupComplete && (
            <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success-600" />
              <span className="text-success-700 font-medium">
                All required tasks completed! You&apos;re ready for pickup.
              </span>
            </div>
          )}
        </div>

        {/* After Pickup Section */}
        <div className="bg-muted/50 rounded-lg p-4">
          <ProgressHeader
            completed={mergedAfterPickupTasks.filter((t) => t.status === "completed").length}
            total={mergedAfterPickupTasks.length}
            label="After Pickup"
          />
          {estimatedDelivery && (
            <p className="text-sm text-muted-foreground mb-3">
              Estimated delivery:{" "}
              <span className="font-medium text-foreground">
                {new Date(estimatedDelivery).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          )}
          <div className="space-y-2">
            {mergedAfterPickupTasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} />
            ))}
          </div>
        </div>

        {/* Common Tasks Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start gap-2 h-auto py-3">
            <Printer className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Print Documents</div>
              <div className="text-xs text-muted-foreground">Labels, BOL, receipts</div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-auto py-3">
            <Bell className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Set Reminders</div>
              <div className="text-xs text-muted-foreground">Pickup & delivery alerts</div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-auto py-3">
            <MapPin className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Track Shipment</div>
              <div className="text-xs text-muted-foreground">Real-time updates</div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-2 h-auto py-3">
            <RotateCcw className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Schedule Return</div>
              <div className="text-xs text-muted-foreground">Book return pickup</div>
            </div>
          </Button>
        </div>
      </div>
    </ConfirmationSection>
  );
}

export default NextStepsChecklistSection;
