# Retro Analytics Dashboard

A full-stack analytics dashboard with a retro CRT monitor aesthetic, built with Next.js 15+ and TypeScript.

## Project Overview

This project recreates the nostalgic look and feel of 1970s-1980s CRT terminal monitors with modern web technologies. It features green phosphor styling, scanline effects, and a terminal-like interface for displaying analytics data.

## Technology Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom retro CSS
- **Font:** VT323 (retro terminal font)
- **Database:** PostgreSQL (to be configured)
- **ORM:** Drizzle ORM (to be configured)
- **Auth:** Auth.js/NextAuth (to be configured)
- **State Management:** TanStack Query + Zustand (to be configured)
- **Charts:** Recharts (to be configured)

See `TECH_STACK.md` for complete details and `RESEARCH.md` for architecture decisions.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
/app                      # Next.js App Router pages
  /analytics             # Analytics feature pages
  /reports               # Reports feature pages
  /dashboard             # Dashboard pages
  /settings              # Settings pages
  /api                   # API routes
    /analytics           # Analytics endpoints
    /auth                # Auth endpoints
  layout.tsx             # Root layout
  page.tsx               # Home page

/components              # React components
  /ui                    # Reusable UI components
  /charts                # Chart components
  /retro                 # Retro-themed components

/lib                     # Utility libraries
  /db                    # Database utilities
  /auth                  # Auth configuration
  /utils                 # Helper functions

/store                   # Zustand stores

/styles                  # CSS files
  /retro                 # CRT effects and retro styling
  globals.css            # Global styles

/public                  # Static assets
```

## Development Status

- ✅ **Step 1:** Research & Planning (Complete)
- ✅ **Step 2:** Project Initialization (Complete)
- ⏭️ **Step 3:** Database Schema Design (Next)
- ⏭️ **Step 4:** Authentication System
- ⏭️ **Step 5:** Core API Endpoints
- ⏭️ **Step 6:** UI Components & CRT Effects
- ⏭️ **Step 7:** Integration & Feature Completion
- ⏭️ **Step 8:** Testing & Quality Assurance

## Design Theme

The application uses a retro green phosphor CRT monitor aesthetic:

- **Background:** Pure black (#000000)
- **Primary Text:** Bright green (#00ff00)
- **Secondary Text:** Medium green (#00cc00)
- **Accent:** Cyan-green (#00ff88)
- **Typography:** VT323 monospace font (uppercase preferred)
- **Effects:** Scanlines, screen glow, CRT curvature (to be implemented)

## License

Private project - All rights reserved

## Next Steps

1. Set up PostgreSQL database and Drizzle ORM (Step 3)
2. Configure authentication with Auth.js (Step 4)
3. Build API endpoints and data layer (Step 5)
4. Create retro UI components and CRT effects (Step 6)
