"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-100">
            <AlertTriangle className="h-8 w-8 text-error-600" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground">Something went wrong</h2>
          <p className="mt-2 text-muted-foreground">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
        </div>
        
        <div className="mt-6 space-y-6">
          {typeof window !== "undefined" && error && (
            <div className="rounded-md bg-muted p-4">
              <p className="mb-2 text-sm font-semibold text-error-600">Error Details:</p>
              <pre className="max-h-32 overflow-auto text-xs text-muted-foreground">
                {error.message}
                {error.stack && (
                  <>
                    {"\n\n"}
                    {error.stack}
                  </>
                )}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={reset}
              variant="default"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
