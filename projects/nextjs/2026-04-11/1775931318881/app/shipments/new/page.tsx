import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewShipmentPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-4">Create New Shipment</h1>
          <p className="text-muted-foreground mb-8">
            This page will contain the shipment creation wizard.
            <br />
            Step 3 will implement the origin/destination address form.
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-sm">
            Coming in Step 3
          </div>
        </div>
      </main>
    </div>
  );
}
