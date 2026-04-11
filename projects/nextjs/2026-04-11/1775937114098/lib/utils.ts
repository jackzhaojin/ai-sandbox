import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind classes with proper precedence handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
