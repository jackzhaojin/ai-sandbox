# Full-Stack Recipe Discovery Platform - Research & Architecture Plan

**Research Date:** January 29, 2026
**Project Type:** Full-Stack Web Application
**Target:** Recipe Discovery Platform with Authentication, Search, and User Collections

---

## Executive Summary

This document outlines the research findings and recommended technical approach for building a modern Recipe Discovery Platform using Next.js 15+, the App Router, PostgreSQL, and contemporary best practices for 2026.

**Key Recommendations:**
- ✅ Next.js 15 with App Router (not Pages Router)
- ✅ PostgreSQL with Drizzle ORM
- ✅ Auth.js (NextAuth v5) for authentication
- ✅ Server Actions for mutations, Route Handlers for public APIs
- ✅ shadcn/ui + Tailwind CSS for UI components
- ✅ React Server Components by default, Client Components only when needed

---

## 1. Framework & Architecture Selection

### 1.1 Next.js 15 with App Router

**Decision: Use App Router (not Pages Router)**

**Rationale:**
- App Router is the default standard in 2026, fully integrated with modern React features
- Provides superior performance through React Server Components (RSC)
- Enables streaming, Suspense, and progressive rendering out of the box
- Better SEO and initial page load performance
- Native support for Server Actions and Server Functions

**Key Architectural Patterns:**

1. **React Server Components (RSC)**
   - Server Components render on the server by default → better performance, smaller bundles, improved SEO
   - Use for data-heavy UI (recipe listings, search results, recipe details)
   - Use Client Components only for interactivity (forms, modals, animations, favoriting)

2. **Folder Structure**
   ```
   app/
   ├── (auth)/              # Route group for auth pages
   │   ├── login/
   │   └── register/
   ├── (main)/              # Route group for main app
   │   ├── recipes/
   │   │   ├── [id]/        # Dynamic recipe detail pages
   │   │   └── page.tsx     # Recipe listing
   │   ├── favorites/
   │   └── search/
   ├── api/                 # Route Handlers for external APIs
   ├── layout.tsx           # Root layout
   └── page.tsx             # Home page
   ```

3. **Nested Layouts**
   - Create persistent UI sections that don't remount on navigation
   - Auth layout for login/register pages
   - Main layout with navigation for authenticated app sections

4. **Rendering & Caching Strategy**
   - **Important:** Next.js 15 changed caching defaults
   - GET Route Handlers: uncached by default (was cached in v14)
   - Client Router Cache: uncached by default (was cached in v14)
   - Strategy: Choose rendering/caching per use case, not one-size-fits-all

**Sources:**
- [Next.js Best Practices in 2025: Performance & Architecture](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)
- [Next.js 15: App Router — A Complete Senior-Level Guide](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7)
- [Best Practices for Organizing Your Next.js 15 2025](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)

---

## 2. API Design: Server Actions vs Route Handlers

### 2.1 When to Use Each

**Decision: Hybrid Approach**

**Server Actions for:**
- Form submissions (creating/editing recipes, user reviews)
- Data mutations within the Next.js app
- User interactions (favoriting recipes, saving collections)
- Internal state management
- **Benefits:** Type-safe, no API endpoint needed, automatic CSRF protection

**Route Handlers for:**
- GET requests from Client Components (recipe listings, search)
- External API calls (webhooks, third-party integrations)
- Public APIs that might be consumed by mobile apps or external services
- **Benefits:** RESTful patterns, cacheable, accessible outside Next.js

**Important Evolution:**
- As of Next.js 15/React 19, Server Actions evolved into "Server Functions"
- Future: Server Functions will support all HTTP methods (not just POST)
- This may reduce need for Route Handlers in internal use cases

**Example Use Cases:**

| Feature | Approach | Reason |
|---------|----------|--------|
| Recipe listing (SSR) | Server Component fetch | No API needed, direct DB access |
| Recipe search (client) | Route Handler GET | Cacheable, called from Client Component |
| Add to favorites | Server Action | Mutation, type-safe, internal only |
| Submit recipe form | Server Action | Form mutation, automatic validation |
| Webhook for external service | Route Handler POST | External integration |
| Public recipe API | Route Handler GET | External consumption |

**Sources:**
- [Server Actions vs Route Handlers in Next.js](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)
- [Should I Use Server Actions Or APIs?](https://www.pronextjs.dev/should-i-use-server-actions-or-apis)
- [Next.js Server Actions vs API Routes: Don't Build Your App Until You Read This](https://dev.to/myogeshchavan97/nextjs-server-actions-vs-api-routes-dont-build-your-app-until-you-read-this-4kb9)

---

## 3. Database & ORM Selection

### 3.1 Database: PostgreSQL

**Decision: PostgreSQL (not MongoDB)**

**Rationale:**

✅ **Structured Data Model**
- Recipes have consistent core fields (title, description, ingredients, instructions, cooking time, servings)
- Relational model handles joins between recipes, users, ingredients, reviews efficiently
- ACID transactions ensure data integrity

✅ **Complex Queries**
- Need to filter recipes by multiple ingredients
- Search by dietary preferences, cuisine types, cooking time
- Join operations (recipes + ingredients + user favorites + reviews)

✅ **Industry Momentum in 2026**
- 55.6% developer adoption (Stack Overflow 2025)
- 73% increase in job postings
- Best risk/reward ratio for most applications
- Proven stability and performance

**When MongoDB Would Be Better:**
- Highly variable recipe schemas (significant structural differences)
- Primarily unstructured data
- Heavy write-intensive workloads
- Need for horizontal sharding at massive scale

**For Recipe App:** PostgreSQL is the clear choice due to structured, relational data patterns.

**Sources:**
- [MongoDB vs PostgreSQL in 2026: NoSQL vs SQL for Full Stack Apps](https://www.nucamp.co/blog/mongodb-vs-postgresql-in-2026-nosql-vs-sql-for-full-stack-apps)
- [PostgreSQL vs MongoDB in 2026](https://medium.com/@msbytedev/postgresql-vs-mongodb-in-2026-3b2bd231944f)
- [Why to choose PostgreSQL over MongoDB in 2026](https://dev.to/creativesuraj/why-to-choose-postgresql-over-mongodb-in-2026-onm)

### 3.2 ORM: Drizzle ORM

**Decision: Drizzle ORM (over Prisma)**

**Rationale:**

✅ **Performance & Serverless Optimization**
- ~7kb minified+gzipped (Prisma is much larger)
- Zero binary dependencies
- Negligible cold start impact (critical for serverless/edge)
- Raw SQL speed with TypeScript safety

✅ **SQL Transparency**
- Closer-to-SQL experience maintains control
- Easier to optimize queries
- Better for teams comfortable with SQL

✅ **2026 Momentum**
- Gaining rapid adoption for performance-critical apps
- Recommended for new NestJS projects (similar architecture patterns)
- Future-proof choice for serious applications

**When Prisma Would Be Better:**
- Teams prioritizing maximum developer experience over performance
- Rapid prototyping where abstraction helps
- Teams with limited SQL experience

**For Recipe App:** Drizzle provides the performance and control needed for a production recipe platform while maintaining excellent TypeScript support.

**Trade-off Acceptance:** Slightly more verbose schema definitions, but worth it for performance gains.

**Sources:**
- [Prisma vs Drizzle ORM in 2026 — What You Really Need to Know](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [Drizzle vs Prisma: Choosing the Right TypeScript ORM in 2026 (Deep Dive)](https://medium.com/@codabu/drizzle-vs-prisma-choosing-the-right-typescript-orm-in-2026-deep-dive-63abb6aa882b)
- [Best ORM for NestJS in 2025: Drizzle ORM vs TypeORM vs Prisma](https://dev.to/sasithwarnakafonseka/best-orm-for-nestjs-in-2025-drizzle-orm-vs-typeorm-vs-prisma-229c)

---

## 4. Database Schema Design

### 4.1 Core Tables

Based on research of recipe database patterns:

**1. users**
```typescript
- id (primary key, uuid)
- email (unique)
- name
- passwordHash
- createdAt
- updatedAt
```

**2. recipes**
```typescript
- id (primary key, uuid)
- userId (foreign key → users.id, creator)
- title
- description
- prepTime (minutes)
- cookTime (minutes)
- servings
- difficulty (enum: easy, medium, hard)
- cuisineType
- imageUrl (optional)
- createdAt
- updatedAt
```

**3. ingredients**
```typescript
- id (primary key, uuid)
- name (unique)
- category (enum: vegetable, protein, spice, etc.)
```

**4. recipe_ingredients** (junction table)
```typescript
- id (primary key, uuid)
- recipeId (foreign key → recipes.id)
- ingredientId (foreign key → ingredients.id)
- quantity (decimal)
- unit (enum: cup, tbsp, tsp, gram, oz, etc.)
- notes (optional: "finely chopped", "to taste")
```

**5. instructions**
```typescript
- id (primary key, uuid)
- recipeId (foreign key → recipes.id)
- stepNumber (integer)
- description (text)
- duration (optional, minutes)
```

**6. dietary_tags**
```typescript
- id (primary key, uuid)
- name (unique: vegetarian, vegan, gluten-free, dairy-free, etc.)
```

**7. recipe_dietary_tags** (junction table)
```typescript
- recipeId (foreign key → recipes.id)
- dietaryTagId (foreign key → dietary_tags.id)
- PRIMARY KEY (recipeId, dietaryTagId)
```

**8. favorites**
```typescript
- userId (foreign key → users.id)
- recipeId (foreign key → recipes.id)
- createdAt
- PRIMARY KEY (userId, recipeId)
```

**9. reviews** (optional for MVP, Phase 2)
```typescript
- id (primary key, uuid)
- userId (foreign key → users.id)
- recipeId (foreign key → recipes.id)
- rating (integer 1-5)
- comment (text, optional)
- createdAt
- updatedAt
```

### 4.2 Indexing Strategy

```sql
-- Performance-critical indexes
CREATE INDEX idx_recipes_userId ON recipes(userId);
CREATE INDEX idx_recipes_cuisineType ON recipes(cuisineType);
CREATE INDEX idx_recipe_ingredients_recipeId ON recipe_ingredients(recipeId);
CREATE INDEX idx_recipe_ingredients_ingredientId ON recipe_ingredients(ingredientId);
CREATE INDEX idx_favorites_userId ON favorites(userId);
CREATE INDEX idx_favorites_recipeId ON favorites(recipeId);
CREATE INDEX idx_reviews_recipeId ON reviews(recipeId);

-- Full-text search index for recipe titles/descriptions
CREATE INDEX idx_recipes_search ON recipes USING GIN(to_tsvector('english', title || ' ' || description));
```

### 4.3 Schema Considerations

**Structured Data for SEO:**
- 2026 trend: Structured content is essential for AI summaries and search engine visibility
- Implement Recipe Schema markup (schema.org/Recipe) in frontend
- Consistent fields enable better Google Recipe results

**Design Rationale:**
- Normalized structure prevents data duplication
- Junction tables enable flexible many-to-many relationships
- Separate instructions table allows ordered steps
- Dietary tags enable powerful filtering
- Review system can be added in Phase 2

**Sources:**
- [How to Build a Recipe Database: Tools, Schema, and Best Practices](https://www.blueberri.co/blog/creating-a-recipe-database)
- [High-Level System Architecture of a food recipe app](https://medium.com/@faizanmehmood184/high-level-system-architecture-of-a-food-recipe-app-7717388be4a6)
- [Designing a Relational Database for a Cookbook](https://dev.to/amckean12/designing-a-relational-database-for-a-cookbook-4nj6)
- [Recipe Schema Markup | Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/recipe)

---

## 5. Authentication Strategy

### 5.1 Auth.js (NextAuth v5)

**Decision: Auth.js v5 (evolution of NextAuth.js)**

**Key Developments in 2026:**
- NextAuth.js is now transitioning to Auth.js
- v5 is stable enough for production use
- NextAuth is now part of the Better Auth ecosystem
- For new projects: start with Auth.js unless there are specific feature gaps

**Why Auth.js v5:**

✅ **App Router Native Support**
- Built for App Router execution model
- Works seamlessly with Server Components, Server Actions, and SSR
- Session validation at the edge

✅ **Flexibility & Zero Vendor Lock-in**
- Complete control over authentication flows
- No SaaS dependencies
- Full ownership of user data

✅ **Security Features**
- Cookie-based sessions validated server-side and at edge
- CSRF protection built-in
- Passkeys (WebAuthn) support for modern authentication

✅ **Session Management**
- Clear session lifecycle (refresh, rotation, logout, revocation)
- Works across Node, Edge, and serverless environments

**Implementation Pattern:**
- Use Data Access Layer pattern
- Verify authentication at every data access point
- Middleware for route protection

**Alternative Considered:**
- **Clerk:** Better DX, managed service, faster setup
- **Supabase Auth:** Good if using Supabase for database
- **Auth0:** Enterprise-grade, but higher complexity

**For Recipe App:** Auth.js provides the right balance of flexibility, control, and zero cost for a recipe platform. No vendor lock-in risk.

**Sources:**
- [Top 5 authentication solutions for secure Next.js apps in 2026](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [Stop Crying Over Auth: A Senior Dev's Guide to Next.js 16 & Auth.js v5](https://javascript.plainenglish.io/stop-crying-over-auth-a-senior-devs-guide-to-next-js-15-auth-js-v5-42a57bc5b4ce)
- [Complete Authentication Guide for Next.js App Router in 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)

### 5.2 Authentication Flow

**Sign Up:**
1. User submits registration form (Server Action)
2. Validate email uniqueness
3. Hash password with bcrypt
4. Create user record in database
5. Create session via Auth.js
6. Redirect to app

**Sign In:**
1. User submits credentials (Server Action)
2. Verify email + password
3. Create session via Auth.js
4. Redirect to app

**Session Management:**
- Cookie-based sessions
- Server-side validation on every protected route
- Middleware checks auth status before rendering

**Protected Routes:**
```typescript
// middleware.ts
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/recipes/new", "/favorites", "/profile"]
}
```

---

## 6. UI Component Strategy

### 6.1 shadcn/ui + Tailwind CSS

**Decision: shadcn/ui with Tailwind CSS v4**

**Why shadcn/ui:**

✅ **Copy-Paste Components, Not Dependencies**
- Components copied directly into your codebase
- Full ownership and customization
- No fighting with package updates

✅ **Built on Solid Foundations**
- Radix UI primitives (accessibility out of the box)
- Tailwind CSS (utility-first styling)
- TypeScript support

✅ **Production-Ready**
- Used by OpenAI, Sonos, Adobe
- Extensive component library
- Active community and ecosystem

✅ **2026 Updates**
- Tailwind v4 support
- React 19 compatibility
- Improved dark mode with OKLCH colors
- `tw-animate-css` instead of deprecated `tailwindcss-animate`

**Component Strategy:**

**Use shadcn/ui for:**
- Form components (recipe creation, search filters)
- Buttons, cards, dialogs
- Navigation components
- Data display (tables for ingredients)

**Build Custom for:**
- Recipe card layouts
- Search results grid
- Recipe detail page layout
- Cooking mode interface

**Alternatives Considered:**
- **MUI:** Heavier, more opinionated, harder to customize
- **Chakra UI:** Good but less momentum in 2026
- **Pure Tailwind:** More work, no pre-built accessible components

**Sources:**
- [shadcn/ui - Next.js](https://ui.shadcn.com/docs/installation/next)
- [What Is shadcn/ui? How It's Reshaping Modern Web Development](https://codeboxr.com/what-is-shadcn-ui-how-its-reshaping-modern-web-development/)
- [UI Component Libraries: 5 Must-Try Picks for Next.js in 2025](https://varbintech.com/blog/ui-component-libraries-5-must-try-picks-for-next-js-in-2025)

---

## 7. Key Features & User Experience

### 7.1 Core Features (MVP)

Based on research of successful recipe apps in 2026:

**1. Recipe Discovery & Search**
- **Smart Search:** Filter by ingredients, dish name, cuisine type
- **Advanced Filters:**
  - Dietary preferences (vegetarian, vegan, gluten-free, dairy-free)
  - Cooking time (under 30 min, 30-60 min, 60+ min)
  - Difficulty level (easy, medium, hard)
  - Meal type (breakfast, lunch, dinner, snack, dessert)
- **Search by Available Ingredients:** "What can I cook with what I have?"

**2. Recipe Details**
- Clean, scannable layout
- Ingredients listed at top (with quantities)
- Step-by-step numbered instructions
- Cooking time breakdown (prep + cook)
- Servings with scaling capability
- High-quality recipe image
- Dietary tags clearly visible

**3. User Collections**
- **Favorites:** Bookmark recipes to personal library
- Easy add/remove with visual feedback
- Favorites accessible from user profile

**4. Recipe Creation**
- Form-based recipe submission
- Add multiple ingredients with quantities/units
- Step-by-step instruction builder
- Image upload
- Dietary tag selection

**5. Authentication**
- Sign up / Sign in
- Protected routes (create recipe, favorites)
- User profile

### 7.2 UX Best Practices

**Visual Design:**
- High-quality food photography
- Clean, minimalist layouts
- Generous whitespace
- Mobile-first responsive design

**Navigation:**
- Persistent header with search
- Clear hierarchy (Home → Category → Recipe)
- Breadcrumbs for deeper navigation

**Personalization:**
- Save dietary preferences in profile
- Filter results based on user preferences
- Recently viewed recipes

**Performance:**
- Image optimization (Next.js Image component)
- Lazy loading for recipe cards
- Skeleton loading states
- Progressive enhancement

**Accessibility:**
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Screen reader support (Radix UI provides this)

**Sources:**
- [User Experience Best Practices for Recipe Platforms](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites)
- [Case Study: Perfect Recipes App. UX Design for Cooking and Shopping](https://blog.tubikstudio.com/case-study-recipes-app-ux-design/)
- [12 Best Recipe Manager Apps (2026) - Tested & Compared](https://www.recipeone.app/blog/best-recipe-manager-apps)

---

## 8. Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | Modern React patterns, RSC, superior performance |
| **Language** | TypeScript | Type safety, better DX, fewer runtime errors |
| **Database** | PostgreSQL | Relational data model, complex queries, ACID compliance |
| **ORM** | Drizzle ORM | Performance, SQL transparency, serverless-optimized |
| **Authentication** | Auth.js v5 | Flexible, zero vendor lock-in, App Router native |
| **UI Components** | shadcn/ui + Tailwind CSS v4 | Customizable, accessible, production-ready |
| **API Layer** | Server Actions + Route Handlers | Hybrid approach for optimal DX and performance |
| **Image Handling** | Next.js Image + Cloudinary/Uploadthing | Optimization, CDN delivery, upload management |
| **Validation** | Zod | Type-safe runtime validation, works with forms |
| **Forms** | React Hook Form | Performance, minimal re-renders, Zod integration |
| **Deployment** | Vercel | Optimized for Next.js, edge functions, easy setup |

---

## 9. Project Structure

```
recipe-discovery-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              # Main app layout with nav
│   │   ├── page.tsx                # Home page
│   │   ├── recipes/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx        # Recipe detail
│   │   │   │   └── loading.tsx     # Loading state
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Create recipe (protected)
│   │   │   └── page.tsx            # Recipe listing
│   │   ├── search/
│   │   │   └── page.tsx            # Search results
│   │   ├── favorites/
│   │   │   └── page.tsx            # User favorites (protected)
│   │   └── profile/
│   │       └── page.tsx            # User profile (protected)
│   ├── api/
│   │   └── recipes/
│   │       └── route.ts            # Public recipe API
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── recipe-card.tsx
│   ├── recipe-form.tsx
│   ├── search-filters.tsx
│   └── navigation.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   ├── index.ts                # DB connection
│   │   └── migrations/
│   ├── auth.ts                     # Auth.js config
│   ├── validations.ts              # Zod schemas
│   └── utils.ts                    # Utility functions
├── actions/
│   ├── recipe-actions.ts           # Server Actions for recipes
│   ├── favorite-actions.ts         # Server Actions for favorites
│   └── auth-actions.ts             # Server Actions for auth
├── public/
│   └── images/
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Step 2)
- Initialize Next.js project with TypeScript
- Set up Tailwind CSS + shadcn/ui
- Configure ESLint, Prettier
- Set up Git repository

### Phase 2: Database & Schema (Step 3)
- Set up PostgreSQL database
- Install and configure Drizzle ORM
- Define database schema
- Create and run migrations
- Set up database connection

### Phase 3: Authentication (Step 4)
- Install and configure Auth.js v5
- Implement sign up / sign in flows
- Set up middleware for protected routes
- Create auth UI components

### Phase 4: Core API (Step 5)
- Recipe CRUD operations (Server Actions)
- Recipe listing with pagination
- Recipe search with filters
- Favorites add/remove
- Image upload handling

### Phase 5: UI & Pages (Step 6)
- Home page with featured recipes
- Recipe listing page with filters
- Recipe detail page
- Create/edit recipe forms
- User favorites page
- Search results page
- User profile

### Phase 6: Integration (Step 7)
- Connect all features
- Implement recipe search logic
- Add loading states and error handling
- Optimize images
- SEO metadata

### Phase 7: Testing & Quality (Step 8)
- Unit tests for Server Actions
- Integration tests for auth flows
- E2E tests for critical paths
- Performance optimization
- Accessibility audit
- Security review

---

## 11. Critical Design Decisions

### 11.1 Server vs Client Components

**Default: Server Components**

Use Client Components ONLY when you need:
- User interaction (onClick, onChange)
- React hooks (useState, useEffect)
- Browser APIs (localStorage, geolocation)

**Examples:**

| Component | Type | Reason |
|-----------|------|--------|
| Recipe listing page | Server | Fetch data server-side, no interactivity |
| Recipe card (display) | Server | Static content, no interaction |
| Favorite button | Client | onClick handler, state update |
| Search form | Client | Form inputs, local state |
| Recipe filter sidebar | Client | Interactive checkboxes, state |
| Recipe detail layout | Server | Static content, SEO |

### 11.2 Data Fetching

**In Server Components:**
```typescript
// Direct database query
import { db } from '@/lib/db'

export default async function RecipesPage() {
  const recipes = await db.query.recipes.findMany()
  return <RecipeList recipes={recipes} />
}
```

**In Client Components:**
```typescript
// Call Route Handler
'use client'

useEffect(() => {
  fetch('/api/recipes')
    .then(res => res.json())
    .then(setRecipes)
}, [])
```

### 11.3 Image Strategy

**Options:**
1. **Uploadthing** - File uploads for Next.js, free tier, easy setup
2. **Cloudinary** - Robust, transformations, generous free tier
3. **Vercel Blob** - Native Vercel integration, simple API

**Recommendation:** Start with Uploadthing for simplicity, can migrate to Cloudinary if advanced transformations needed.

---

## 12. Security Considerations

### 12.1 Authentication Security
- ✅ Password hashing with bcrypt (min 10 rounds)
- ✅ CSRF protection (Auth.js provides)
- ✅ Secure session cookies (httpOnly, secure, sameSite)
- ✅ Server-side session validation
- ✅ Rate limiting on auth endpoints

### 12.2 Data Validation
- ✅ Server-side validation with Zod (never trust client)
- ✅ Sanitize user inputs
- ✅ SQL injection prevention (Drizzle ORM handles)
- ✅ XSS prevention (React escapes by default)

### 12.3 Authorization
- ✅ Verify user ownership before mutations
- ✅ Protect routes with middleware
- ✅ Check permissions in Server Actions

### 12.4 API Security
- ✅ Rate limiting on public APIs
- ✅ Input validation on all endpoints
- ✅ CORS configuration
- ✅ API key for external access (if needed)

---

## 13. Performance Optimization

### 13.1 Rendering Strategy
- Static generation for public recipe pages
- Dynamic rendering for user-specific pages (favorites, profile)
- Streaming for long-loading pages
- Suspense boundaries for progressive loading

### 13.2 Caching Strategy
- Recipe listings: Cache with revalidation (ISR)
- Recipe details: Cache with on-demand revalidation
- User favorites: No caching (always fresh)
- Search results: Short-lived cache

### 13.3 Database Optimization
- Proper indexing (see schema section)
- Connection pooling
- Query optimization (select only needed fields)
- Pagination for large result sets

### 13.4 Image Optimization
- Next.js Image component (automatic optimization)
- Responsive images (srcset)
- Lazy loading below fold
- WebP format with fallbacks

---

## 14. Open Questions & Decisions Needed

### 14.1 Resolved Decisions
✅ Framework: Next.js 15 App Router
✅ Database: PostgreSQL
✅ ORM: Drizzle
✅ Auth: Auth.js v5
✅ UI: shadcn/ui + Tailwind CSS
✅ Deployment: Vercel

### 14.2 To Be Decided in Implementation
- Image upload service (Uploadthing vs Cloudinary)
- Seed data strategy for demo recipes
- Search implementation (PostgreSQL full-text vs Algolia)
- Recipe rating system (MVP or Phase 2?)
- Social features (sharing, comments - likely Phase 2)

---

## 15. Success Metrics

### 15.1 Technical Metrics
- Lighthouse score > 90 (Performance, Accessibility, SEO)
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Core Web Vitals: Green across all metrics
- Zero critical security vulnerabilities

### 15.2 Functional Metrics
- All CRUD operations working
- Auth flows complete and secure
- Search returns relevant results
- Favorites system functional
- Mobile responsive (all screen sizes)

---

## 16. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Database schema changes | Medium | Medium | Use migrations, version control |
| Auth complexity | Low | High | Use Auth.js (battle-tested) |
| Performance issues | Low | Medium | Follow Next.js best practices, monitor |
| Image upload costs | Low | Low | Start with free tier, monitor usage |
| Search scalability | Medium | Medium | Start with PG full-text, plan for Algolia |

---

## 17. Next Steps (Implementation Roadmap)

**Step 2: Initialize Project**
- ✅ This research document completes Step 1
- Next: Create Next.js project with TypeScript
- Install core dependencies (Tailwind, shadcn/ui)
- Set up project structure

**Step 3: Database Design**
- Set up PostgreSQL database
- Install Drizzle ORM
- Implement schema from this document
- Create migrations

**Step 4: Authentication**
- Install Auth.js v5
- Implement sign up/sign in
- Set up middleware
- Create auth UI

**Steps 5-8:**
- Follow the phased approach outlined in Section 10

---

## 18. References & Sources

All research sources are cited inline throughout this document. Key resources:

### Next.js & App Router
- [Next.js Best Practices in 2025: Performance & Architecture](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)
- [Next.js 15: App Router — A Complete Senior-Level Guide](https://medium.com/@livenapps/next-js-15-app-router-a-complete-senior-level-guide-0554a2b820f7)
- [Best Practices for Organizing Your Next.js 15 2025](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)

### API Design
- [Server Actions vs Route Handlers in Next.js](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)
- [Should I Use Server Actions Or APIs?](https://www.pronextjs.dev/should-i-use-server-actions-or-apis)

### Database & ORM
- [MongoDB vs PostgreSQL in 2026: NoSQL vs SQL for Full Stack Apps](https://www.nucamp.co/blog/mongodb-vs-postgresql-in-2026-nosql-vs-sql-for-full-stack-apps)
- [Prisma vs Drizzle ORM in 2026](https://medium.com/@thebelcoder/prisma-vs-drizzle-orm-in-2026-what-you-really-need-to-know-9598cf4eaa7c)
- [Drizzle vs Prisma: Choosing the Right TypeScript ORM in 2026](https://medium.com/@codabu/drizzle-vs-prisma-choosing-the-right-typescript-orm-in-2026-deep-dive-63abb6aa882b)

### Database Schema
- [How to Build a Recipe Database: Tools, Schema, and Best Practices](https://www.blueberri.co/blog/creating-a-recipe-database)
- [High-Level System Architecture of a food recipe app](https://medium.com/@faizanmehmood184/high-level-system-architecture-of-a-food-recipe-app-7717388be4a6)
- [Designing a Relational Database for a Cookbook](https://dev.to/amckean12/designing-a-relational-database-for-a-cookbook-4nj6)

### Authentication
- [Top 5 authentication solutions for secure Next.js apps in 2026](https://workos.com/blog/top-authentication-solutions-nextjs-2026)
- [Stop Crying Over Auth: A Senior Dev's Guide to Next.js 16 & Auth.js v5](https://javascript.plainenglish.io/stop-crying-over-auth-a-senior-devs-guide-to-next-js-15-auth-js-v5-42a57bc5b4ce)

### UI/UX
- [shadcn/ui - Next.js](https://ui.shadcn.com/docs/installation/next)
- [What Is shadcn/ui?](https://codeboxr.com/what-is-shadcn-ui-how-its-reshaping-modern-web-development/)
- [User Experience Best Practices for Recipe Platforms](https://www.sidechef.com/business/recipe-platform/ux-best-practices-for-recipe-sites)
- [12 Best Recipe Manager Apps (2026) - Tested & Compared](https://www.recipeone.app/blog/best-recipe-manager-apps)

---

## Conclusion

This research provides a comprehensive technical foundation for building a modern, performant, and scalable Recipe Discovery Platform using 2026 best practices. The chosen stack (Next.js 15 App Router, PostgreSQL, Drizzle ORM, Auth.js, shadcn/ui) represents the optimal balance of:

- **Performance:** Server Components, edge-ready, optimized rendering
- **Developer Experience:** TypeScript, modern tooling, type safety
- **Scalability:** Relational database, efficient ORM, serverless-ready
- **Maintainability:** Clear patterns, well-documented libraries
- **Cost Effectiveness:** Open source stack, generous free tiers

**Ready to proceed with Step 2: Project Initialization.**
