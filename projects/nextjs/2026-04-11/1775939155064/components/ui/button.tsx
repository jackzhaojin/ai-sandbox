import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-blue-600 text-white hover:bg-blue-700": variant === "default",
            "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50": variant === "outline",
            "bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "secondary",
            "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
            "hover:bg-gray-100 text-gray-700": variant === "ghost",
            "h-11 min-h-[44px] px-4 py-2 md:h-10": size === "default",
            "h-11 min-h-[44px] rounded-md px-3 md:h-9": size === "sm",
            "h-12 min-h-[48px] rounded-md px-8 md:h-11": size === "lg",
            "h-11 min-h-[44px] w-11 md:h-10 md:w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
