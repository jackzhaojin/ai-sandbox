"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

export type ConfirmationSectionStatus = "confirmed" | "pending" | "processing";

export interface KeyValuePair {
  key: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
}

export interface ConfirmationSectionProps {
  /** Unique section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section icon */
  icon?: React.ReactNode;
  /** Confirmation status */
  status?: ConfirmationSectionStatus;
  /** Status label override */
  statusLabel?: string;
  /** Whether section is expanded by default */
  defaultExpanded?: boolean;
  /** Key-value pairs to display */
  data: KeyValuePair[];
  /** Additional content to render below key-value pairs */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Header action button (optional) */
  headerAction?: React.ReactNode;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStatusBadge(status: ConfirmationSectionStatus, customLabel?: string) {
  switch (status) {
    case "confirmed":
      return (
        <Badge
          variant="outline"
          className="bg-success-50 text-success-600 border-success-200"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {customLabel || "Confirmed"}
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-warning-50 text-warning-600 border-warning-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          {customLabel || "Pending"}
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-info-50 text-info-600 border-info-200"
        >
          <Clock className="h-3 w-3 mr-1 animate-spin" />
          {customLabel || "Processing"}
        </Badge>
      );
    default:
      return null;
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface DataRowProps {
  item: KeyValuePair;
  isLast?: boolean;
}

function DataRow({ item, isLast }: DataRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3",
        !isLast && "border-b border-border/50"
      )}
    >
      {item.icon && (
        <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
          {item.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{item.key}</p>
        <div className="font-medium mt-0.5 break-words">{item.value}</div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * ConfirmationSection - Collapsible confirmation section component
 *
 * Features:
 * - Chevron expand/collapse toggle
 * - Section title with status badge
 * - Content area with key-value pairs
 * - Optional custom action in header
 * - Same pattern as ReviewSection but for confirmation display
 *
 * @example
 * <ConfirmationSection
 *   id="shipment-reference"
 *   title="Shipment Reference"
 *   icon={<Package className="h-5 w-5" />}
 *   status="confirmed"
 *   data={[
 *     { key: "Confirmation #", value: "B2B-2024-ABC123", icon: <FileText className="h-4 w-4" /> },
 *   ]}
 * />
 */
export function ConfirmationSection({
  id,
  title,
  icon,
  status = "confirmed",
  statusLabel,
  defaultExpanded = true,
  data,
  children,
  className,
  onExpandedChange,
  headerAction,
}: ConfirmationSectionProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleExpandedChange = (newExpanded: boolean) => {
    setExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Collapsible open={expanded} onOpenChange={handleExpandedChange}>
        <CardHeader className="p-0">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                )}
                <div className="text-left">
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <div className="ml-2">{getStatusBadge(status, statusLabel)}</div>
              </div>

              <div className="flex items-center gap-2">
                {headerAction}
                {headerAction && <div className="w-px h-4 bg-border mx-1" />}
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-6 px-6">
            <div className="pt-4 border-t border-border/50">
              {data.map((item, index) => (
                <DataRow
                  key={index}
                  item={item}
                  isLast={index === data.length - 1}
                />
              ))}
              {children && <div className="mt-4">{children}</div>}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default ConfirmationSection;
