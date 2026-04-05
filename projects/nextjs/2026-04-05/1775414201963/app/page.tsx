import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">B2B Postal Checkout Flow</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Next.js 15 + Supabase + shadcn/ui
      </p>
      <Button>Get Started</Button>
    </main>
  );
}
