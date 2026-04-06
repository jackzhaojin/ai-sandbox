"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

export interface SuccessBannerProps {
  /** Confirmation number to display */
  confirmationNumber: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when confirmation number is copied */
  onCopy?: () => void;
  /** Custom success message */
  successMessage?: string;
  /** Subtitle text */
  subtitle?: string;
}

/**
 * SuccessBanner - Animated success confirmation banner
 *
 * Features:
 * - Animated green checkmark with CSS animation
 * - Confirmation number display with copy button
 * - QR code generation from confirmation number
 * - Accessible with proper ARIA labels
 *
 * @example
 * <SuccessBanner
 *   confirmationNumber="B2B-2024-ABC123"
 *   successMessage="Shipment Confirmed!"
 *   subtitle="Your shipment has been booked successfully."
 * />
 */
export function SuccessBanner({
  confirmationNumber,
  className,
  onCopy,
  successMessage = "Shipment Confirmed!",
  subtitle = "Your shipment has been successfully booked and confirmed.",
}: SuccessBannerProps) {
  const [showCheckmark, setShowCheckmark] = React.useState(false);

  // Trigger checkmark animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setShowCheckmark(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate QR code data (confirmation number with tracking URL)
  const qrCodeData = React.useMemo(() => {
    // In production, this would be a real tracking URL
    return `${typeof window !== "undefined" ? window.location.origin : ""}/track/${confirmationNumber}`;
  }, [confirmationNumber]);

  return (
    <Card
      className={cn(
        "overflow-hidden border-success-200 bg-gradient-to-br from-success-50 to-success-100/50",
        className
      )}
    >
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center text-center">
          {/* Animated Checkmark - Smaller on mobile */}
          <div
            className={cn(
              "relative mb-4 sm:mb-6 transition-all duration-500",
              showCheckmark ? "scale-100 opacity-100" : "scale-50 opacity-0"
            )}
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-full bg-success-400/20 animate-ping" />
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-success-500 shadow-lg shadow-success-500/30">
              <svg
                className={cn(
                  "h-8 w-8 sm:h-10 sm:w-10 text-white transition-all duration-700 ease-out",
                  showCheckmark ? "scale-100" : "scale-0"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "success-checkmark",
                    showCheckmark && "animate-checkmark"
                  )}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1
            className={cn(
              "text-xl sm:text-2xl lg:text-3xl font-bold text-success-900 mb-2 transition-all duration-500 delay-200",
              showCheckmark ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            {successMessage}
          </h1>

          {/* Subtitle */}
          <p
            className={cn(
              "text-sm sm:text-base text-success-700 mb-4 sm:mb-6 max-w-md transition-all duration-500 delay-300",
              showCheckmark ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            {subtitle}
          </p>

          {/* Confirmation Number */}
          <div
            className={cn(
              "w-full max-w-md transition-all duration-500 delay-400",
              showCheckmark ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            <div className="bg-white rounded-lg sm:rounded-xl border border-success-200 p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                Confirmation Number
              </p>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <code className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-foreground tracking-wide">
                  {confirmationNumber}
                </code>
                <CopyButton
                  text={confirmationNumber}
                  variant="outline"
                  size="sm"
                  onCopy={onCopy}
                  ariaLabel="Copy confirmation number"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                />
              </div>
            </div>
          </div>

          {/* QR Code - Smaller on mobile */}
          <div
            className={cn(
              "mt-4 sm:mt-6 transition-all duration-500 delay-500",
              showCheckmark ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            <div className="bg-white rounded-lg sm:rounded-xl border border-success-200 p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                Scan to track shipment
              </p>
              <div className="flex justify-center">
                <QRCodeSVG
                  value={qrCodeData}
                  size={96}
                  className="sm:w-32 sm:h-32"
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  aria-label={`QR code for tracking shipment ${confirmationNumber}`}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SuccessBanner;
