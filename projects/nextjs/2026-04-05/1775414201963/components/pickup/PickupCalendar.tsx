"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateAvailabilityStatus } from "@/types/pickup";
import {
  formatDate,
  parseDate,
  isWeekend,
  isFederalHoliday,
  getFederalHolidays,
  getMinimumPickupDate,
  getMaximumPickupDate,
  getDateAvailability,
  isDateNavigable,
  AvailabilityOptions,
} from "@/lib/pickup/date-utils";

// ============================================
// TYPES
// ============================================

export interface PickupCalendarProps {
  /** Currently selected date (ISO string YYYY-MM-DD) */
  selectedDate?: string;
  /** Callback when a date is selected */
  onDateSelect?: (date: string) => void;
  /** Minimum lead time in business days (default: 3) */
  minLeadTimeDays?: number;
  /** Maximum days in advance (default: 90) */
  maxAdvanceDays?: number;
  /** Whether weekend pickup is available */
  weekendPickupAvailable?: boolean;
  /** Whether premium weekend service is allowed */
  premiumWeekendAllowed?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether the calendar is disabled */
  disabled?: boolean;
  /** Reference date for calculations (defaults to today, useful for testing) */
  referenceDate?: Date;
}

interface DayCellProps {
  date: Date;
  status: DateAvailabilityStatus;
  reason?: string;
  isSelected: boolean;
  isToday: boolean;
  isPast: boolean;
  isOutsideMonth: boolean;
  onSelect: (date: Date) => void;
  disabled?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ============================================
// DAY CELL COMPONENT
// ============================================

function DayCell({
  date,
  status,
  reason,
  isSelected,
  isToday,
  isPast,
  isOutsideMonth,
  onSelect,
  disabled,
}: DayCellProps) {
  const isUnavailable = status === "unavailable";
  const isLimited = status === "limited";
  const isAvailable = status === "available";

  const handleClick = () => {
    if (!isUnavailable && !disabled && !isPast) {
      onSelect(date);
    }
  };

  // Base cell styles
  const cellClasses = cn(
    "relative h-10 w-10 rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Outside month styling
    isOutsideMonth && "text-muted-foreground/50",
    // Past dates
    isPast && "text-muted-foreground/30 cursor-not-allowed",
    // Available date
    isAvailable && !isSelected && !isPast && [
      "bg-success-100 text-success-800 hover:bg-success-200 cursor-pointer",
      "dark:bg-success-900/30 dark:text-success-200 dark:hover:bg-success-900/50",
    ],
    // Limited availability
    isLimited && !isSelected && !isPast && [
      "bg-warning-100 text-warning-800 hover:bg-warning-200 cursor-pointer",
      "dark:bg-warning-900/30 dark:text-warning-200 dark:hover:bg-warning-900/50",
    ],
    // Unavailable date
    isUnavailable && [
      "bg-gray-100 text-gray-400 cursor-not-allowed",
      "dark:bg-gray-800/50 dark:text-gray-600",
    ],
    // Selected state (overrides availability colors)
    isSelected && [
      "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground font-semibold",
      "hover:bg-primary/90 cursor-pointer",
    ],
    // Disabled state
    disabled && "opacity-50 cursor-not-allowed pointer-events-none"
  );

  // Dot indicator for today
  const todayIndicator = isToday && (
    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-70" />
  );

  const dayContent = (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUnavailable || disabled || isPast}
      className={cellClasses}
      aria-label={formatDate(date)}
      aria-selected={isSelected}
      aria-disabled={isUnavailable || isPast}
    >
      <span>{date.getDate()}</span>
      {todayIndicator}
    </button>
  );

  // Wrap with tooltip if there's a reason for unavailability or limited status
  if ((isUnavailable || isLimited) && reason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-center">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
            <span>{reason}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return dayContent;
}

// ============================================
// MAIN CALENDAR COMPONENT
// ============================================

/**
 * PickupCalendar - Interactive calendar for selecting pickup dates
 *
 * Features:
 * - Month grid display with forward/back navigation
 * - Date range constraints (cannot go before today or beyond 90 days)
 * - Date state indicators: Available (green), Limited (yellow), Unavailable (gray), Selected (primary ring), Today (dot), Past (dimmed)
 * - Unavailability calculation based on: past dates, weekends, federal holidays, minimum 3 business days lead time, beyond 90 days
 * - Hover tooltips showing unavailability reasons
 * - Date selection that triggers time slot display
 */
export function PickupCalendar({
  selectedDate,
  onDateSelect,
  minLeadTimeDays = 3,
  maxAdvanceDays = 90,
  weekendPickupAvailable = false,
  premiumWeekendAllowed = false,
  className,
  disabled = false,
  referenceDate = new Date(),
}: PickupCalendarProps) {
  // Normalize reference date to midnight
  const today = React.useMemo(() => {
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [referenceDate]);

  // Current month being displayed
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const minDate = getMinimumPickupDate(minLeadTimeDays, today);
    return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  });

  // Pre-calculate federal holidays for the current and next year
  const federalHolidays = React.useMemo(() => {
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    return [...getFederalHolidays(currentYear), ...getFederalHolidays(nextYear)];
  }, [today]);

  // Availability options
  const availabilityOptions: AvailabilityOptions = React.useMemo(
    () => ({
      minLeadTimeDays,
      maxAdvanceDays,
      weekendPickupAvailable,
      premiumWeekendAllowed,
      federalHolidays,
    }),
    [minLeadTimeDays, maxAdvanceDays, weekendPickupAvailable, premiumWeekendAllowed, federalHolidays]
  );

  // Calculate min/max dates for navigation
  const minDate = React.useMemo(
    () => getMinimumPickupDate(minLeadTimeDays, today),
    [minLeadTimeDays, today]
  );
  const maxDate = React.useMemo(
    () => getMaximumPickupDate(maxAdvanceDays, today),
    [maxAdvanceDays, today]
  );

  // Navigation handlers
  const canGoToPreviousMonth = React.useMemo(() => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const lastDayOfPrevMonth = new Date(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1,
      0
    );
    return isDateNavigable(lastDayOfPrevMonth, { maxAdvanceDays }, today);
  }, [currentMonth, maxAdvanceDays, today]);

  const canGoToNextMonth = React.useMemo(() => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return isDateNavigable(nextMonth, { maxAdvanceDays }, today);
  }, [currentMonth, maxAdvanceDays, today]);

  const goToPreviousMonth = () => {
    if (canGoToPreviousMonth) {
      setCurrentMonth((prev) => {
        const newMonth = new Date(prev);
        newMonth.setMonth(newMonth.getMonth() - 1);
        return newMonth;
      });
    }
  };

  const goToNextMonth = () => {
    if (canGoToNextMonth) {
      setCurrentMonth((prev) => {
        const newMonth = new Date(prev);
        newMonth.setMonth(newMonth.getMonth() + 1);
        return newMonth;
      });
    }
  };

  // Date selection handler
  const handleDateSelect = (date: Date) => {
    if (disabled) return;
    const dateString = formatDate(date);
    onDateSelect?.(dateString);
  };

  // Generate calendar grid
  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Start from the beginning of the week containing the first day
    const startOfGrid = new Date(firstDayOfMonth);
    startOfGrid.setDate(startOfGrid.getDate() - firstDayOfMonth.getDay());

    // End at the end of the week containing the last day
    const endOfGrid = new Date(lastDayOfMonth);
    const daysToAdd = 6 - lastDayOfMonth.getDay();
    endOfGrid.setDate(endOfGrid.getDate() + daysToAdd);

    // Generate all days
    const days: Array<{
      date: Date;
      isOutsideMonth: boolean;
      status: DateAvailabilityStatus;
      reason?: string;
      isSelected: boolean;
      isToday: boolean;
      isPast: boolean;
    }> = [];

    const current = new Date(startOfGrid);
    while (current <= endOfGrid) {
      const dateCopy = new Date(current);
      const isOutsideMonth = dateCopy.getMonth() !== month;
      const { status, reason } = getDateAvailability(dateCopy, availabilityOptions, today);
      const isSelected = selectedDate === formatDate(dateCopy);
      const isTodayDate = formatDate(dateCopy) === formatDate(today);
      const isPast = dateCopy < today;

      days.push({
        date: dateCopy,
        isOutsideMonth,
        status,
        reason,
        isSelected,
        isToday: isTodayDate,
        isPast,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth, availabilityOptions, today, selectedDate]);

  // Group days into weeks
  const weeks = React.useMemo(() => {
    const result: typeof calendarDays[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Select Pickup Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              disabled={!canGoToPreviousMonth || disabled}
              className="h-8 w-8"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <span className="font-semibold text-foreground">
                {MONTHS[currentMonth.getMonth()]}
              </span>{" "}
              <span className="text-muted-foreground">
                {currentMonth.getFullYear()}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              disabled={!canGoToNextMonth || disabled}
              className="h-8 w-8"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => (
                  <div key={dayIndex} className="flex justify-center">
                    <DayCell
                      date={day.date}
                      status={day.status}
                      reason={day.reason}
                      isSelected={day.isSelected}
                      isToday={day.isToday}
                      isPast={day.isPast}
                      isOutsideMonth={day.isOutsideMonth}
                      onSelect={handleDateSelect}
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-border">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-success-100 border border-success-200" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-warning-100 border border-warning-200" />
                <span className="text-muted-foreground">Limited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                <span className="text-muted-foreground">Unavailable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-primary bg-primary/10" />
                <span className="text-muted-foreground">Selected</span>
              </div>
            </div>
          </div>

          {/* Selected Date Display */}
          {selectedDate && (
            <div className="pt-2 text-sm text-center">
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-medium text-foreground">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}

          {/* Constraints Info */}
          <div className="pt-2 text-xs text-muted-foreground space-y-1">
            <p>• Minimum {minLeadTimeDays} business days lead time</p>
            <p>• Maximum {maxAdvanceDays} days in advance</p>
            {!weekendPickupAvailable && <p>• Weekend pickup not available</p>}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default PickupCalendar;
