# B2B Postal Checkout Flow

A Next.js 15 application for business-to-business postal services checkout flow.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Testing**: Playwright (E2E)

## Project Structure

```
├── app/              # Next.js App Router routes
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utilities and shared code
│   ├── supabase/    # Supabase clients
│   ├── validation/  # Zod validation schemas
│   └── utils.ts     # Utility functions
├── types/           # TypeScript type definitions
├── styles/          # Global styles
├── e2e/             # Playwright E2E tests
└── ai-docs/         # Project documentation
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run test:e2e` - Run Playwright E2E tests

## Features

- Multi-step checkout flow
- Organization management
- Address book with validation
- Shipping options and rate calculation
- Payment processing
- Order tracking

## License

Private - All rights reserved.
