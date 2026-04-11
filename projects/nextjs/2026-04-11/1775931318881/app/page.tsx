import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Truck, CreditCard, Calendar } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            B2B Postal Checkout
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamlined business shipping with multi-carrier rates, B2B payment methods, 
            and scheduled pickups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="p-6 rounded-lg border bg-card">
            <Package className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Ship</h3>
            <p className="text-sm text-muted-foreground">
              Enter origin, destination, and package details
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <Truck className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Compare</h3>
            <p className="text-sm text-muted-foreground">
              Get real-time quotes from multiple carriers
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <CreditCard className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Pay</h3>
            <p className="text-sm text-muted-foreground">
              Choose from 5 B2B payment methods
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <Calendar className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Schedule</h3>
            <p className="text-sm text-muted-foreground">
              Book convenient pickup time slots
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/shipments/new">
            <Button size="lg" className="px-8">
              Create New Shipment
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
