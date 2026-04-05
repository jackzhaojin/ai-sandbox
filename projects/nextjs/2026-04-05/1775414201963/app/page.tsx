export const dynamic = 'force-dynamic'

import { ShippingLayout } from "@/components/layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Demo checkout steps
const checkoutSteps = [
  { id: "sender", label: "Sender", description: "Your address" },
  { id: "recipient", label: "Recipient", description: "Their address" },
  { id: "package", label: "Package", description: "Item details" },
  { id: "shipping", label: "Shipping", description: "Select service" },
  { id: "review", label: "Review", description: "Confirm order" },
  { id: "payment", label: "Payment", description: "Pay securely" },
]

export default function Home() {
  return (
    <ShippingLayout
      title="Design System Demo"
      description="B2B Postal Checkout - Shared Components and Design System"
      steps={checkoutSteps}
      currentStep="sender"
      completedSteps={[]}
      showProgress
      userInfo={{
        name: "John Doe",
        email: "john@example.com",
        organizationName: "Acme Corp",
      }}
    >
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Design System</CardTitle>
            <CardDescription>
              Tailwind CSS v4 with custom color palette, typography, and spacing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The design system has been configured with:
            </p>
            <ul className="mt-4 list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Custom color palette (primary, semantic colors, neutral grays)</li>
              <li>Typography scale with Geist font</li>
              <li>Spacing system</li>
              <li>Responsive breakpoints</li>
              <li>WCAG 2.1 AA accessibility standards</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shared Components</CardTitle>
            <CardDescription>
              Components available in /components/shared
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Form Components</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  FormField, AddressInput, ContactInput
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Utility Components</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  CopyButton, LoadingSpinner, ErrorBoundary
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Status Components</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  StatusIndicator, FeeBadge, AvailabilityBadge
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Progress Components</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  StepIndicator, ProgressIndicator, ContextualHelp
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layout Components</CardTitle>
            <CardDescription>
              Page structure components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><strong>Header</strong> - Logo, navigation, user menu, mobile responsive</li>
              <li><strong>Footer</strong> - Multi-column B2B footer with contact info</li>
              <li><strong>Navigation</strong> - Previous/Next buttons with loading states</li>
              <li><strong>ShippingLayout</strong> - Master wrapper with progress indicator</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ShippingLayout>
  )
}
