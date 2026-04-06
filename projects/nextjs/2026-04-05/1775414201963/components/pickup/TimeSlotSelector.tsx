"use client";

import * as React from "react";
import { Clock, Sun, Sunset, Moon, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FeeBadge, StatusIndicator } from "@/components/shared";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// TYPES
// ============================================

export type TimeSlotPeriod = "morning" | "afternoon" | "evening";

export interface TimeSlotOption {
  id: string;
  period: TimeSlotPeriod;
  startTime: string; // HH:MM format (24-hour)
  endTime: string; // HH:MM format (24-hour)
  label: string;
  displayLabel: string;
  available: boolean;
  reason?: string; // Reason if unavailable
  fee: number;
  estimatedDuration: string;
}

export interface TimeSlotSelectorProps {
  /** Currently selected time slot ID */
  selectedSlotId?: string;
  /** Callback when a time slot is selected */
  onSelect?: (slotId: string) => void;
  /** Available time slots */
  slots?: TimeSlotOption[];
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Selected date (for display) */
  selectedDate?: string;
  /** ZIP code (for display/context) */
  zipCode?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// DEFAULT TIME SLOTS CONFIGURATION
// ============================================

export const DEFAULT_TIME_SLOTS: Omit<TimeSlotOption, "available" | "reason">[] = [
  {
    id: "morning",
    period: "morning",
    startTime: "08:00",
    endTime: "12:00",
    label: "Morning",
    displayLabel: "8:00 AM - 12:00 PM",
    fee: 0,
    estimatedDuration: "4 hour window",
  },
  {
    id: "afternoon",
    period: "afternoon",
    startTime: "12:00",
    endTime: "17:00",
    label: "Afternoon",
    displayLabel: "12:00 PM - 5:00 PM",
    fee: 0,
    estimatedDuration: "5 hour window",
  },
  {
    id: "evening",
    period: "evening",
    startTime: "17:00",
    endTime: "19:00",
    label: "Evening",
    displayLabel: "5:00 PM - 7:00 PM",
    fee: 25,
    estimatedDuration: "2 hour window",
  },
];

// ============================================
// PERIOD CONFIGURATION
// ============================================

const periodConfig: Record<TimeSlotPeriod, {
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  bgColor: string;
}> = {
  morning: {
    icon: <Sun className="h-5 w-5" />,
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-100 dark:bg-amber-900/50",
  },
  afternoon: {
    icon: <Sunset className="h-5 w-5" />,
    gradient: "from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
  },
  evening: {
    icon: <Moon className="h-5 w-5" />,
    gradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/50",
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function generateDefaultSlots(isWeekend: boolean = false): TimeSlotOption[] {
  return DEFAULT_TIME_SLOTS.map((slot) => ({
    ...slot,
    available: !isWeekend || slot.period !== "evening", // Evening not available on weekends
    reason: isWeekend && slot.period === "evening" ? "Evening pickup not available on weekends" : undefined,
    // Weekend fees
    fee: isWeekend ? (slot.period === "evening" ? 0 : 15) : slot.fee,
  }));
}

// ============================================
// TIME SLOT CARD COMPONENT
// ============================================

interface TimeSlotCardProps {
  slot: TimeSlotOption;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}

function TimeSlotCard({ slot, isSelected, isDisabled, onSelect }: TimeSlotCardProps) {
  const config = periodConfig[slot.period];
  const isUnavailable = !slot.available;

  const cardContent = (
    <div
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200",
        "bg-gradient-to-br",
        config.gradient,
        config.borderColor,
        // Selected state
        isSelected && [
          "ring-2 ring-primary ring-offset-2 border-primary",
          "shadow-md",
        ],
        // Available and not selected
        !isSelected && slot.available && !isDisabled && [
          "hover:border-primary/50 hover:shadow-sm cursor-pointer",
        ],
        // Unavailable
        isUnavailable && [
          "opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-700",
          "bg-gray-50 dark:bg-gray-900/30",
        ],
        // Disabled
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !isUnavailable && !isDisabled && onSelect()}
    >
      {/* Radio Button */}
      <div className="flex-shrink-0">
        <RadioGroupItem
          value={slot.id}
          id={`slot-${slot.id}`}
          disabled={isUnavailable || isDisabled}
          className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        />
      </div>

      {/* Period Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          config.bgColor,
          "text-foreground"
        )}
      >
        {config.icon}
      </div>

      {/* Time Slot Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={`slot-${slot.id}`}
            className={cn(
              "text-base font-semibold cursor-pointer",
              isUnavailable && "text-muted-foreground cursor-not-allowed"
            )}
          >
            {slot.label}
          </Label>
          {isSelected && (
            <StatusIndicator
              status="selected"
              size="sm"
              variant="pill"
              label="Selected"
            />
          )}
          {isUnavailable && (
            <StatusIndicator
              status="unavailable"
              size="sm"
              variant="pill"
              label="Unavailable"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {slot.displayLabel}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {slot.estimatedDuration}
        </p>
      </div>

      {/* Fee Badge */}
      <div className="flex-shrink-0 text-right">
        {slot.fee > 0 ? (
          <FeeBadge
            amount={slot.fee}
            label="Fee"
            size="sm"
          />
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-success-600 dark:text-success-400">
            <Check className="h-4 w-4" />
            Free
          </span>
        )}
      </div>

      {/* Unavailable Overlay Indicator */}
      {isUnavailable && (
        <div className="absolute inset-0 bg-background/10 rounded-lg pointer-events-none" />
      )}
    </div>
  );

  // Wrap with tooltip if unavailable
  if (isUnavailable && slot.reason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{cardContent}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{slot.reason}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * TimeSlotSelector - Component for selecting pickup time slots
 *
 * Features:
 * - 3 time slots: Morning (8am-12pm), Afternoon (12pm-5pm), Evening (5pm-7pm +$25)
 * - Visual distinction by period with icons and colors
 * - Single-selection radio behavior
 * - Availability status with tooltips for unavailable slots
 * - Fee display for premium time slots
 * - Weekend pricing adjustments
 *
 * @example
 * <TimeSlotSelector
 *   selectedSlotId="morning"
 *   onSelect={(id) => console.log('Selected:', id)}
 *   selectedDate="2026-04-15"
 *   zipCode="10001"
 * />
 */
export function TimeSlotSelector({
  selectedSlotId,
  onSelect,
  slots,
  isLoading = false,
  disabled = false,
  selectedDate,
  zipCode,
  className,
}: TimeSlotSelectorProps) {
  // Generate default slots if none provided
  const timeSlots = React.useMemo(() => {
    if (slots) return slots;
    
    // Check if selected date is a weekend
    const isWeekend = selectedDate ? (() => {
      const date = new Date(selectedDate + "T00:00:00");
      const day = date.getDay();
      return day === 0 || day === 6;
    })() : false;
    
    return generateDefaultSlots(isWeekend);
  }, [slots, selectedDate]);

  // Handle selection change
  const handleValueChange = (value: string) => {
    if (value && onSelect) {
      onSelect(value);
    }
  };

  // Calculate total fee
  const selectedSlot = timeSlots.find((s) => s.id === selectedSlotId);
  const totalFee = selectedSlot?.fee || 0;

  // Format selected date for display
  const formattedDate = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Select Pickup Time
          </CardTitle>
          {formattedDate && (
            <p className="text-sm text-muted-foreground">
              {formattedDate}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            // Loading Skeleton
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <RadioGroup
                value={selectedSlotId || ""}
                onValueChange={handleValueChange}
                className="space-y-3"
                disabled={disabled}
              >
                {timeSlots.map((slot) => (
                  <TimeSlotCard
                    key={slot.id}
                    slot={slot}
                    isSelected={selectedSlotId === slot.id}
                    isDisabled={disabled}
                    onSelect={() => handleValueChange(slot.id)}
                  />
                ))}
              </RadioGroup>

              {/* Selected Slot Summary */}
              {selectedSlot && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Selected Time:
                    </span>
                    <span className="font-medium">
                      {selectedSlot.displayLabel}
                    </span>
                  </div>
                  {totalFee > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">
                        Time Slot Fee:
                      </span>
                      <FeeBadge amount={totalFee} label="Fee" size="sm" />
                    </div>
                  )}
                </div>
              )}

              {/* ZIP Code Info */}
              {zipCode && (
                <div className="pt-2 text-xs text-muted-foreground">
                  Service area: {zipCode}
                </div>
              )}

              {/* Legend/Info */}
              <div className="pt-2 text-xs text-muted-foreground space-y-1">
                <p>• Morning and Afternoon slots are free</p>
                <p>• Evening pickup includes a $25 fee</p>
                <p>• Weekend pickups may have additional fees</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default TimeSlotSelector;
