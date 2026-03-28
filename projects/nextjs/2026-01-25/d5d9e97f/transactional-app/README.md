# Transaction Manager - Next.js Transactional Application

A full-featured transactional application built with Next.js 16, demonstrating modern web development patterns with Server Components, Server Actions, and type-safe database operations.

## Features

- ✅ **Income & Expense Tracking**: Record and categorize financial transactions
- ✅ **Real-time Balance Calculation**: Automatic calculation of income, expenses, and balance
- ✅ **Transaction Management**: Create, view, and delete transactions
- ✅ **Type-Safe Database**: Prisma ORM with SQLite for local development
- ✅ **Server Components**: Optimized performance with React Server Components
- ✅ **Server Actions**: Form submissions without API routes
- ✅ **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Architecture

### Database Schema

```prisma
model Transaction {
  id          String   @id @default(cuid())
  amount      Float
  description String
  category    String
  type        String   // "income" or "expense"
  date        DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Project Structure

```
transactional-app/
├── app/
│   ├── actions/
│   │   └── transactions.ts      # Server Actions for CRUD operations
│   ├── transactions/
│   │   ├── page.tsx              # Transaction list page (Server Component)
│   │   ├── TransactionForm.tsx   # Form component (Client Component)
│   │   ├── TransactionList.tsx   # List component (Client Component)
│   │   └── [id]/
│   │       ├── page.tsx          # Transaction detail page (Server Component)
│   │       └── DeleteButton.tsx  # Delete button (Client Component)
│   ├── layout.tsx
│   └── page.tsx                  # Redirects to /transactions
├── lib/
│   └── prisma.ts                 # Prisma client singleton
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
└── prisma.config.ts              # Prisma configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Database is already set up, but if you need to reset:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Adding a Transaction

1. Fill in the transaction form on the left side
2. Select the type (Income or Expense)
3. Enter the amount, description, category, and optional date
4. Click "Add Transaction"

### Viewing Transactions

- The main page displays all transactions sorted by date
- Summary cards show total income, expenses, and balance
- Click on a transaction description to view details

### Deleting Transactions

- Click the "Delete" button on any transaction in the list
- Or navigate to the transaction detail page and click "Delete Transaction"

## Key Features Explained

### Server Components

Pages that fetch data use React Server Components for optimal performance:
- No client-side JavaScript needed for data fetching
- Direct database access without API routes
- Automatic request deduplication

### Server Actions

Form submissions use Server Actions for simplified data mutations:
- No need to create API routes
- Type-safe with TypeScript
- Automatic revalidation with `revalidatePath()`

### Type Safety

- Prisma provides end-to-end type safety from database to UI
- Zod validates form inputs before database operations
- TypeScript catches errors at compile time

## Database

The application uses SQLite for simplicity and portability:
- Database file: `dev.db`
- Schema defined in `prisma/schema.prisma`
- Migrations tracked in `prisma/migrations/`

To reset the database:
```bash
npx prisma migrate reset
```

## Environment Variables

The `.env` file is already configured:

```env
DATABASE_URL="file:./dev.db"
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (GUI for database)

## Future Enhancements

Potential features to add:
- User authentication
- Transaction filtering and search
- Data visualization (charts/graphs)
- Export transactions (CSV/PDF)
- Budget planning
- Recurring transactions
- Multi-currency support

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT

## Author

Built with Claude Code - AI-assisted development
