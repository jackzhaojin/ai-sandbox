# Music Player

A modern, full-stack music streaming platform built with Next.js 16, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (New York style)
- **Linting:** ESLint 9

## Project Structure

```
music-player/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── player/           # Music player components
├── lib/                  # Utility functions
│   ├── types/            # TypeScript types
│   └── utils.ts          # Helper functions
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy the environment variables:

```bash
cp .env.example .env
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development

This project uses:

- **App Router** for modern routing and Server Components
- **TypeScript** with strict mode for type safety
- **Tailwind CSS 4** for styling
- **shadcn/ui** for accessible, customizable UI components

## Project Roadmap

This is the initial project setup (Step 2/8). The following steps will add:

1. ✅ Research and planning (Complete)
2. ✅ **Project initialization** (Complete) - Current step
3. 🔄 Database schema with Prisma and PostgreSQL (Next)
4. 🔄 Authentication with NextAuth.js
5. 🔄 Core API endpoints
6. 🔄 UI components and pages
7. 🔄 Integration and features
8. 🔄 Testing and QA

## Architecture

The application follows a clean architecture pattern:

- **Presentation Layer:** React components in `app/` and `components/`
- **Business Logic:** Server Actions and Route Handlers in `app/api/` (to be added)
- **Data Layer:** Prisma ORM with PostgreSQL (to be added in Step 3)

## Configuration

### TypeScript

TypeScript is configured with strict mode enabled. See `tsconfig.json` for details.

### ESLint

ESLint is configured with Next.js recommended rules. See `eslint.config.mjs` for details.

### Tailwind CSS

Tailwind CSS 4 is configured with shadcn/ui color variables. See `app/globals.css` for theme configuration.

## License

Private project - not for public distribution.
