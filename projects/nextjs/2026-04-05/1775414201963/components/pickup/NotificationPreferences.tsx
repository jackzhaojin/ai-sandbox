"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Truck,
  CheckCircle,
  Route,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// TYPES & ENUMS
// ============================================

export interface NotificationPreferencesData {
  /** Email reminder 24 hours before pickup */
  emailReminder24h: boolean;
  /** SMS reminder 2 hours before pickup */
  smsReminder2h: boolean;
  /** Call reminder 30 minutes before pickup */
  callReminder30m: boolean;
  /** Notification when driver is en route */
  driverEnRoute: boolean;
  /** Notification when pickup is completed */
  pickupCompletion: boolean;
  /** Transit updates during shipment */
  transitUpdates: boolean;
}

export interface NotificationPreferencesProps {
  /** Initial form values */
  defaultValues?: Partial<NotificationPreferencesData>;
  /** Callback when form is submitted */
  onSubmit?: (data: NotificationPreferencesData) => void;
  /** Callback when form values change */
  onChange?: (data: Partial<NotificationPreferencesData>, isValid: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Whether SMS notifications are available (requires phone number) */
  smsAvailable?: boolean;
  /** Whether phone call notifications are available */
  callsAvailable?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

export interface NotificationOption {
  id: keyof NotificationPreferencesData;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresSms?: boolean;
  requiresCalls?: boolean;
}

export const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    id: "emailReminder24h",
    label: "Email Reminder (24 hours)",
    description: "Receive an email reminder one day before your scheduled pickup",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: "smsReminder2h",
    label: "SMS Reminder (2 hours)",
    description: "Get a text message 2 hours before the driver arrives",
    icon: <MessageSquare className="h-5 w-5" />,
    requiresSms: true,
  },
  {
    id: "callReminder30m",
    label: "Call Reminder (30 minutes)",
    description: "Receive a phone call 30 minutes before arrival",
    icon: <Phone className="h-5 w-5" />,
    requiresCalls: true,
  },
  {
    id: "driverEnRoute",
    label: "Driver En Route",
    description: "Be notified when the driver is on their way to your location",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    id: "pickupCompletion",
    label: "Pickup Completion",
    description: "Confirmation when your shipment has been picked up",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    id: "transitUpdates",
    label: "Transit Updates",
    description: "Receive updates about your shipment while in transit",
    icon: <Route className="h-5 w-5" />,
  },
];

// ============================================
// ZOD SCHEMA
// ============================================

const notificationPreferencesSchema = z.object({
  emailReminder24h: z.boolean().default(true),
  smsReminder2h: z.boolean().default(false),
  callReminder30m: z.boolean().default(false),
  driverEnRoute: z.boolean().default(true),
  pickupCompletion: z.boolean().default(true),
  transitUpdates: z.boolean().default(false),
});

type NotificationPreferencesSchemaType = z.infer<typeof notificationPreferencesSchema>;

// ============================================
// NOTIFICATION OPTION CARD COMPONENT
// ============================================

interface NotificationOptionCardProps {
  option: NotificationOption;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  smsAvailable?: boolean;
  callsAvailable?: boolean;
}

function NotificationOptionCard({
  option,
  checked,
  onChange,
  disabled,
  smsAvailable,
  callsAvailable,
}: NotificationOptionCardProps) {
  // Check if this option is unavailable due to missing prerequisites
  const isUnavailable =
    (option.requiresSms && !smsAvailable) ||
    (option.requiresCalls && !callsAvailable);

  const isDisabled = disabled || isUnavailable;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200",
        checked && !isUnavailable
          ? "border-primary bg-primary/5"
          : "border-input hover:border-primary/30 hover:bg-accent/30",
        isDisabled && "opacity-50 cursor-not-allowed",
        !isDisabled && "cursor-pointer"
      )}
      onClick={() => !isDisabled && onChange(!checked)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        disabled={isDisabled}
        className="mt-0.5"
      />
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {option.icon}
      </div>
      <div className="flex-grow min-w-0">
        <FormLabel
          className={cn(
            "text-sm font-semibold cursor-pointer",
            isDisabled && "cursor-not-allowed"
          )}
          onClick={(e) => {
            e.preventDefault();
            !isDisabled && onChange(!checked);
          }}
        >
          {option.label}
        </FormLabel>
        <p className="text-sm text-muted-foreground mt-0.5">
          {option.description}
        </p>
        {isUnavailable && (
          <p className="text-xs text-warning-600 mt-1.5">
            {option.requiresSms && !smsAvailable && (
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Requires a mobile phone number
              </span>
            )}
            {option.requiresCalls && !callsAvailable && (
              <span className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Phone call notifications not available
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * NotificationPreferences - Form for selecting pickup notification preferences
 *
 * Features:
 * - Email reminder 24 hours before pickup
 * - SMS reminder 2 hours before pickup
 * - Call reminder 30 minutes before pickup
 * - Driver en route notification
 * - Pickup completion confirmation
 * - Transit updates during shipment
 *
 * Uses React Hook Form with Zod validation.
 *
 * @example
 * <NotificationPreferences
 *   smsAvailable={true}
 *   onChange={(data, isValid) => console.log('Preferences:', data)}
 * />
 */
export function NotificationPreferences({
  defaultValues,
  onSubmit,
  onChange,
  className,
  disabled = false,
  smsAvailable = true,
  callsAvailable = true,
}: NotificationPreferencesProps) {
  const form = useForm<NotificationPreferencesSchemaType>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      emailReminder24h: defaultValues?.emailReminder24h ?? true,
      smsReminder2h: defaultValues?.smsReminder2h ?? false,
      callReminder30m: defaultValues?.callReminder30m ?? false,
      driverEnRoute: defaultValues?.driverEnRoute ?? true,
      pickupCompletion: defaultValues?.pickupCompletion ?? true,
      transitUpdates: defaultValues?.transitUpdates ?? false,
    },
    mode: "onChange",
  });

  // Watch form changes for onChange callback
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const isValid = form.formState.isValid;
      onChange(value as Partial<NotificationPreferencesData>, isValid);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleSubmit = (data: NotificationPreferencesSchemaType) => {
    onSubmit?.(data as NotificationPreferencesData);
  };

  const toggleNotification = (
    field: keyof NotificationPreferencesData,
    checked: boolean
  ) => {
    form.setValue(field, checked, { shouldValidate: true });
  };

  // Get current values for all notifications
  const values = form.watch();

  // Check if any notifications are selected
  const hasNotifications = Object.values(values).some(Boolean);

  return (
    <TooltipProvider delayDuration={200}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn("space-y-6", className)}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px]">
                    <p>
                      Choose how and when you&apos;d like to be notified about
                      your pickup. We recommend keeping at least email
                      notifications enabled.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <FormDescription>
                Select the notifications you&apos;d like to receive about your
                pickup
              </FormDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {NOTIFICATION_OPTIONS.map((option) => (
                  <FormField
                    key={option.id}
                    control={form.control}
                    name={option.id}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <NotificationOptionCard
                            option={option}
                            checked={field.value}
                            onChange={(checked) =>
                              toggleNotification(option.id, checked)
                            }
                            disabled={disabled}
                            smsAvailable={smsAvailable}
                            callsAvailable={callsAvailable}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {!hasNotifications && !disabled && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    <Info className="h-4 w-4 inline mr-1" />
                    You&apos;ll still receive essential notifications like
                    pickup confirmation via email
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selected Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_OPTIONS.filter((opt) => values[opt.id]).length ===
                0 ? (
                  <span className="text-sm text-muted-foreground">
                    No optional notifications selected
                  </span>
                ) : (
                  NOTIFICATION_OPTIONS.filter((opt) => values[opt.id]).map(
                    (opt) => (
                      <span
                        key={opt.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {React.cloneElement(opt.icon as React.ReactElement, {
                          className: "h-3 w-3",
                        })}
                        {opt.label}
                      </span>
                    )
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button (optional - can be controlled externally) */}
          {onSubmit && (
            <div className="pt-4">
              <Button
                type="submit"
                disabled={disabled}
                className="w-full"
              >
                Save Preferences
              </Button>
            </div>
          )}
        </form>
      </Form>
    </TooltipProvider>
  );
}

export default NotificationPreferences;
