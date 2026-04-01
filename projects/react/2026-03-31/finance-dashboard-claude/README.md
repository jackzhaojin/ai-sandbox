# Personal Finance Dashboard

A polished, production-quality personal finance dashboard built with React, TypeScript, and Tailwind CSS. Part of a 4-way vendor comparison to evaluate output quality.

## Features

- **Summary Cards**: Display income, expenses, savings, and net worth with icons and color coding
- **Trend Visualization**: Line chart showing monthly income vs expenses trends (6-12 months)
- **Category Breakdown**: Donut/pie chart showing expense distribution by category
- **Transaction Management**: Sortable and filterable transaction table with search
- **Budget Tracking**: Progress bars for each budget category with color-coded thresholds (green/yellow/red)
- **Dark Mode**: Toggle between light and dark themes with localStorage persistence
- **Responsive Design**: Clean, optimized layout for mobile, tablet, and desktop

## Tech Stack

- **React 18** with TypeScript (strict mode)
- **Vite** for fast development and optimized builds
- **Tailwind CSS v4** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Header.tsx              # App header with theme toggle
│   ├── SummaryCards.tsx        # Financial summary cards
│   ├── TrendChart.tsx          # Income vs expenses line chart
│   ├── CategoryChart.tsx       # Expense category pie chart
│   ├── TransactionsTable.tsx   # Sortable transactions table
│   └── BudgetProgress.tsx      # Budget progress bars
├── context/
│   └── ThemeContext.tsx        # Dark/light theme management
├── data/
│   └── mockData.ts             # Mock financial data
├── App.tsx                     # Main app component
├── main.tsx                    # App entry point
└── index.css                   # Tailwind CSS imports

```

## Definition of Done ✅

**Build**:
- ✅ Project builds without errors (`npm run build`)
- ✅ Dev server starts (`npm run dev`)
- ✅ No TypeScript errors in strict mode

**Functionality**:
- ✅ Header with user greeting and current date
- ✅ Summary cards row: income, expenses, savings, net worth with icons and color coding
- ✅ Line chart showing monthly income vs expenses trends (6 months of mock data)
- ✅ Donut/pie chart showing expense categories breakdown
- ✅ Recent transactions table - sortable by date/amount/description, filterable by category
- ✅ Budget progress bars per category with color-coded thresholds (green/yellow/red)
- ✅ Dark/light mode toggle that persists in localStorage
- ✅ Responsive design - clean layout on mobile, tablet, and desktop

**Visual Quality**:
- ✅ Consistent color palette and typography
- ✅ Smooth transitions and hover effects
- ✅ Proper spacing, alignment, and visual hierarchy
- ✅ Cards with subtle shadows and rounded corners
- ✅ Icons for categories and navigation

**Code Quality**:
- ✅ TypeScript strict mode, no errors
- ✅ Clean component structure (separate components per section)
- ✅ Mock data in a dedicated file/module
- ✅ Git committed with clean status

## Data

All data is mock data - no backend or API calls. The app uses static data defined in `src/data/mockData.ts`.

## License

MIT
