import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          B2B Postal Checkout
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Multi-step checkout wizard for B2B postal services
        </p>
        <div className="flex justify-center">
          <Link href="/shipments/new">
            <Button size="lg">Create New Shipment</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
