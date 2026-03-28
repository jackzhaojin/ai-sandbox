# Recipe Discovery Platform

A modern full-stack recipe discovery web application built with Next.js 15+, TypeScript, and PostgreSQL.

## Features (Planned)

- 🔍 **Recipe Search & Discovery** - Find recipes by ingredients, cuisine, dietary preferences
- 👤 **User Authentication** - Secure sign up and login with Auth.js v5
- ⭐ **Favorites System** - Save and organize your favorite recipes
- 📝 **Recipe Creation** - Share your own recipes with the community
- 🏷️ **Smart Filtering** - Filter by cooking time, difficulty, dietary tags
- 📱 **Responsive Design** - Beautiful UI that works on all devices

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Database:** PostgreSQL with Drizzle ORM (to be configured)
- **Authentication:** Auth.js v5 (to be configured)
- **Deployment:** Vercel (planned)

## Project Structure

```
recipe-discovery-platform/
├── app/
│   ├── (auth)/              # Authentication routes (login, register)
│   ├── (main)/              # Main app routes (recipes, favorites, search)
│   ├── api/                 # API route handlers
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   └── ui/                  # shadcn/ui components (to be added)
├── lib/
│   └── db/                  # Database schema and utilities (to be configured)
├── actions/                 # Server Actions (to be added)
└── public/
    └── images/              # Static images
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Development Status

**Current Phase:** Step 2 - Project Initialization ✅

### Completed
- ✅ Next.js 16 project initialized with TypeScript
- ✅ Tailwind CSS v4 configured
- ✅ ESLint configured
- ✅ Folder structure created

### Next Steps
- Step 3: Database schema design and implementation
- Step 4: Authentication system
- Step 5: Core API endpoints
- Step 6: UI components and pages
- Step 7: Integration and features
- Step 8: Testing and quality assurance

## Contributing

This is a learning/demo project. See RESEARCH.md in the parent directory for architectural decisions and technology choices.

## License

MIT
