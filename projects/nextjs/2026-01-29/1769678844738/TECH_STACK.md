# Technology Stack Summary

**Project:** Full-Stack Retro Analytics Dashboard
**Last Updated:** January 29, 2026

## Quick Reference

This document provides a quick reference for the chosen technology stack. See `RESEARCH.md` for detailed justifications and sources.

---

## Core Technologies

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom CSS (for retro effects)
- **UI Components:** Custom retro-themed components

### Backend
- **Runtime:** Node.js
- **API Layer:** Next.js API Routes (Route Handlers)
- **Pattern:** Backend-for-Frontend (BFF)

### Database
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Hosting:** Vercel Postgres (Neon) recommended

### Authentication
- **Library:** Auth.js (NextAuth.js)
- **Strategy:** Session-based with secure cookies
- **Pattern:** Data Access Layer (check auth at every data access point)

### State Management
- **Server State:** TanStack Query (React Query)
- **Client State:** Zustand
- **Theme/Global State:** React Context (minimal use)

### Data Visualization
- **Library:** Recharts
- **Styling:** Custom retro theme (green phosphor, CRT effects)

---

## Key Libraries & Dependencies

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "typescript": "^5.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "recharts": "^2.x",
    "next-auth": "^5.x",
    "drizzle-orm": "^0.x",
    "postgres": "^3.x",
    "tailwindcss": "^3.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "drizzle-kit": "^0.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

---

## Retro Design Elements

### Visual Style
- **Era:** 1970s-1980s CRT terminal monitors
- **Primary Aesthetic:** Green phosphor monitor (can switch to amber)
- **Effects:** Scanlines, screen glow, flicker animation, CRT curvature

### Typography
- **Primary Font:** VT323 (Google Fonts)
- **Fallback:** Courier New, monospace
- **Style:** UPPERCASE, monospace, terminal-style

### Color Palette (Green Phosphor)
```css
--bg-primary: #000000;
--text-primary: #00ff00;
--text-secondary: #00cc00;
--accent: #00ff88;
--glow: rgba(0, 255, 0, 0.5);
```

### Alternative (Amber Monitor)
```css
--bg-primary: #000000;
--text-primary: #ffb000;
--text-secondary: #ff8800;
--glow: rgba(255, 176, 0, 0.5);
```

---

## Architecture Patterns

### Folder Structure
```
/app
  /analytics          # Analytics feature
  /reports            # Reports feature
  /dashboard          # Main dashboard
  /settings           # Settings
  /api                # API routes
    /analytics        # Analytics endpoints
    /auth             # Auth endpoints
  layout.tsx
  page.tsx

/components
  /ui                 # Reusable UI components
  /charts             # Chart components
  /retro              # Retro-themed components

/lib
  /db                 # Database utilities
  /auth               # Auth configuration
  /utils              # Utility functions

/store                # Zustand stores

/styles
  /retro              # CRT effects CSS
  globals.css
```

### Rendering Strategy
- **Server Components:** Heavy data fetching, static content
- **SSR:** Time-sensitive analytics, real-time data
- **ISR:** Periodically refreshed reports
- **Client Components:** Interactive charts, filters, UI state

### Security Pattern
- **Middleware:** Initial routing and redirects
- **Data Access Layer:** Authentication check at every data access point
- **Server Actions:** Each action verifies auth independently
- **Avoid Layout Checks:** Due to partial rendering

---

## Performance Optimizations

1. **React Server Components** - Reduce client JS bundle
2. **Partial Prerendering** - Static shell + streamed data
3. **Code Splitting** - Lazy load charts with `next/dynamic`
4. **Data Caching** - TanStack Query + edge caching
5. **Database Indexing** - Index frequently queried columns
6. **Image Optimization** - Next.js Image component
7. **Font Optimization** - Preload VT323, use `font-display: swap`

---

## Development Tools

- **Package Manager:** npm or pnpm
- **Linting:** ESLint
- **Formatting:** Prettier
- **Version Control:** Git
- **Testing:** (TBD in Step 8)
  - Unit: Vitest or Jest
  - E2E: Playwright
- **Deployment:** Vercel (recommended)

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# OAuth Providers (if using)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## Next Steps (Implementation Order)

1. ✅ **Step 1: Research & Planning** (COMPLETE)
2. ⏭️ **Step 2: Initialize Project**
   - Create Next.js app
   - Configure TypeScript, Tailwind
   - Set up folder structure
3. **Step 3: Database Schema**
   - Design PostgreSQL schema
   - Set up Drizzle ORM
   - Create migrations
4. **Step 4: Authentication**
   - Configure Auth.js
   - Implement Data Access Layer
5. **Step 5: API Endpoints**
   - Create API routes
   - Set up TanStack Query
6. **Step 6: UI Components**
   - Build retro UI components
   - Implement CRT effects
   - Create chart components
7. **Step 7: Integration**
   - Connect all features
   - Implement Zustand stores
8. **Step 8: Testing & QA**
   - Write tests
   - Performance optimization
   - Security audit

---

## References

Full research with sources and justifications: See `RESEARCH.md`

---

**Ready for Step 2: Project Initialization**
