# Full-Stack Conversational Chat Application

A modern, real-time conversational chat application built with Next.js 15, TypeScript, and Claude Anthropic API.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **AI**: Claude Anthropic API
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **Styling**: Tailwind CSS
- **Streaming**: Vercel AI SDK

## Project Status

**Current Step**: Step 2 of 8 - Initialize project with Next.js and TypeScript ✅

### Completed Steps
- [x] Step 1: Research existing patterns and plan approach
- [x] Step 2: Initialize project with Next.js and TypeScript

### Remaining Steps
- [ ] Step 3: Design and implement database schema
- [ ] Step 4: Implement authentication system
- [ ] Step 5: Build core API endpoints
- [ ] Step 6: Create UI components and pages
- [ ] Step 7: Integration and feature completion
- [ ] Step 8: Testing and quality assurance

## Project Structure

```
chat-app/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── chat/              # Claude streaming endpoint
│   │   ├── conversations/     # Conversation CRUD
│   │   └── auth/              # Authentication routes
│   ├── actions/               # Server Actions
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   ├── chat/                  # Chat-specific components
│   └── layout/                # Layout components
├── lib/                       # Utilities and configurations
│   ├── db/                    # Database client
│   ├── anthropic/             # Claude API client
│   ├── auth/                  # Auth configuration
│   └── utils.ts               # Utility functions
├── prisma/                    # Database schema and migrations
│   └── schema.prisma          # Prisma schema
├── types/                     # TypeScript type definitions
│   ├── chat.ts                # Chat types
│   └── api.ts                 # API types
└── public/                    # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database (local or hosted)
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `ANTHROPIC_API_KEY`: Your Claude API key
   - `NEXTAUTH_SECRET`: Secret for JWT encryption (generate with `openssl rand -base64 32`)

3. **Set up the database** (Step 3)
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Decisions

See [RESEARCH.md](../RESEARCH.md) for detailed research findings and architectural decisions.

### Key Decisions

- **Next.js App Router**: Modern server-first architecture with Server Components
- **Edge Runtime**: For optimal streaming performance
- **PostgreSQL + Prisma**: Type-safe database access with proper relational modeling
- **Server-Sent Events**: For streaming AI responses (simpler than WebSockets)
- **TypeScript**: Full type safety across the stack

## Features (Planned)

- Real-time chat interface with Claude AI
- Message history persistence
- User authentication
- Multiple conversation management
- Streaming AI responses
- Responsive design

## Development Notes

- Database schema implementation: **Step 3**
- Authentication implementation: **Step 4**
- API endpoints implementation: **Step 5**
- UI components implementation: **Step 6**

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)

## License

Private project - All rights reserved
