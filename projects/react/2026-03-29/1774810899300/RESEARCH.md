# Todo App - Research and Planning Document

**Project:** Simple Todo App with React + TypeScript + Vite
**Date:** 2026-03-29
**Step:** 1 of 4 - Research and Plan Project Structure

## Executive Summary

This document outlines the research findings and implementation plan for building a simple Todo application using React, TypeScript, and Vite. The app will use modern React patterns (hooks, functional components) with TypeScript for type safety, and will be scaffolded using Vite for fast development.

---

## 1. Project Initialization

### Scaffolding Command
```bash
npm create vite@latest . -- --template react-ts
```

**Why this command:**
- Uses Vite's official React + TypeScript template
- Provides minimal setup with HMR (Hot Module Replacement)
- Includes ESLint configuration out of the box
- Sets up TypeScript configs (tsconfig.json, tsconfig.app.json, tsconfig.node.json)
- Uses the latest React 19.x and Vite 8.x

**Reference:** Based on the successful Hello World project at `/Users/jackjin/dev/ai-sandbox/projects/react/2026-03-29/1774808631099`

### Post-Scaffold Steps
```bash
npm install
npm run dev  # Starts dev server at http://localhost:5173
```

---

## 2. Project Structure

Based on best practices and the reference project, the following structure will be used:

```
todo-app/
├── src/
│   ├── main.tsx              # Entry point, renders App
│   ├── App.tsx               # Main Todo component
│   ├── App.css               # Component-specific styles
│   ├── index.css             # Global styles
│   └── types/
│       └── todo.ts           # TypeScript interfaces
├── public/                   # Static assets
├── index.html                # HTML template
├── package.json              # Dependencies
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript config (base)
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.node.json        # Node-specific TS config
├── eslint.config.js          # ESLint rules
└── README.md                 # Project documentation
```

---

## 3. TypeScript Type Definitions

### Todo Item Interface
```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}
```

**Type Safety Approach:**
- Use explicit typing with `useState` hooks: `const [todos, setTodos] = useState<Todo[]>([])`
- Use non-mutating array methods (map, filter) instead of push/splice
- Avoid direct mutation to maintain React's immutability expectations
- Use string UUIDs for unique IDs (could use `crypto.randomUUID()` or timestamp)

---

## 4. Component Architecture

### Option 1: Single Component (Recommended for Simple App)
**Structure:**
- `App.tsx` contains all logic and UI
- Inline sub-components or JSX blocks for TodoItem, AddTodo, Filters

**Pros:**
- Simplest for a small app
- All state management in one place
- Easier to understand and debug
- Follows the reference project pattern

**Cons:**
- Less reusable
- Can become complex if features grow

### Option 2: Multi-Component
**Structure:**
- `App.tsx` - Parent component, state management
- `TodoList.tsx` - Renders list of todos
- `TodoItem.tsx` - Individual todo item
- `AddTodo.tsx` - Input form for new todos
- `FilterButtons.tsx` - Filter controls

**Pros:**
- Better separation of concerns
- More reusable components
- Easier to test individually

**Cons:**
- More boilerplate
- Props drilling (unless using Context)
- Overkill for a simple todo app

**Decision:** Use **Option 1** (Single Component) for simplicity, with clear logical sections within the component.

---

## 5. State Management

### Approach: React useState Hook
```typescript
const [todos, setTodos] = useState<Todo[]>([]);
const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
```

**Why useState:**
- Sufficient for local component state
- No need for Redux/Zustand for a simple app
- Follows 2026 best practice: "choose the right level of state for the problem"
- For Todo apps, all state is UI state (no API/server state needed)

**State Operations:**
- **Add Todo:** `setTodos([...todos, newTodo])`
- **Toggle Complete:** `setTodos(todos.map(t => t.id === id ? {...t, completed: !t.completed} : t))`
- **Delete Todo:** `setTodos(todos.filter(t => t.id !== id))`
- **Filter Todos:** Computed value using `todos.filter()` based on current filter

---

## 6. Core Features

### Minimum Viable Features
1. **Add Todo** - Text input + submit button
2. **Display Todos** - List of todo items
3. **Toggle Complete** - Checkbox to mark done/undone
4. **Delete Todo** - Button to remove todo
5. **Filter Todos** - Show All / Active / Completed

### Optional Enhancements (if time permits)
- Edit existing todos
- Persist to localStorage
- Clear all completed
- Todo counter
- Animations/transitions

---

## 7. Styling Approach

### CSS Modules vs Plain CSS
**Decision:** Use plain CSS (App.css, index.css) like the reference project.

**Why:**
- Simpler for a small app
- No additional dependencies
- Consistent with Vite template defaults
- Easy to understand and maintain

**Styling Plan:**
- `index.css` - Global resets, base styles
- `App.css` - Todo-specific component styles
- Use modern CSS features (flexbox, grid, CSS variables)
- Mobile-responsive design

---

## 8. Dependencies

### Required Dependencies (from package.json)
```json
{
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/node": "^24.12.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.57.0",
    "vite": "^8.0.1"
  }
}
```

**No additional dependencies needed** - All features can be built with React core APIs.

---

## 9. Implementation Plan (High-Level)

### Step 2: Initialize Vite Project
- Navigate to project directory
- Run `npm create vite@latest . -- --template react-ts`
- Run `npm install`
- Verify dev server works with `npm run dev`
- Clean up template files (remove default Vite logo, boilerplate)

### Step 3: Implement Todo Component
- Define TypeScript interfaces in `src/types/todo.ts`
- Create state management hooks in `App.tsx`
- Build UI structure:
  - Input form for adding todos
  - Todo list rendering
  - Individual todo items with checkbox and delete button
  - Filter buttons
- Implement core functions:
  - `addTodo(text: string)`
  - `toggleTodo(id: string)`
  - `deleteTodo(id: string)`
  - `filterTodos(filter: 'all' | 'active' | 'completed')`
- Style the component with CSS

### Step 4: Build, Test, and Finalize
- Run `npm run build` to verify production build works
- Test all features manually:
  - Add multiple todos
  - Toggle completion status
  - Delete todos
  - Filter between all/active/completed views
- Fix any TypeScript errors
- Commit changes to git with descriptive message

---

## 10. Best Practices to Follow

### TypeScript
- Use explicit types for all state variables
- Define interfaces for complex objects
- Avoid `any` types
- Use type inference where possible

### React
- Use functional components only (no class components)
- Use hooks for state and side effects
- Keep components pure (no side effects in render)
- Use immutable update patterns
- Follow naming conventions (PascalCase for components, camelCase for functions)

### Code Quality
- Run ESLint before committing
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Follow single responsibility principle

### Performance
- Use `key` prop correctly in lists (use unique IDs, not array indices)
- Avoid inline function definitions in JSX (define outside render)
- Consider `useMemo` / `useCallback` for expensive computations (probably not needed for simple todo app)

---

## 11. Potential Issues and Solutions

### Issue: Unique IDs for Todos
**Solution:** Use `crypto.randomUUID()` or `Date.now() + Math.random()`

### Issue: Input State Management
**Solution:** Use controlled component with `useState` for input value

### Issue: Filter Logic
**Solution:** Compute filtered todos in render using `todos.filter()` based on current filter state

### Issue: TypeScript Errors in Strict Mode
**Solution:** Ensure all types are explicitly defined, no implicit `any`

---

## 12. Validation Criteria

### Step 1 Completion Checklist
- [x] Research Vite + React + TypeScript setup
- [x] Determine project structure
- [x] Define TypeScript interfaces
- [x] Plan state management approach
- [x] List required dependencies
- [x] Create implementation plan
- [x] Document best practices
- [x] Create this RESEARCH.md document

---

## References

### Documentation
- [Vite Getting Started Guide](https://vite.dev/guide/)
- [Complete Guide to Setting Up React with TypeScript and Vite (2026)](https://medium.com/@robinviktorsson/complete-guide-to-setting-up-react-with-typescript-and-vite-2025-468f6556aaf2)
- [React State Management Best Practices 2026](https://www.c-sharpcorner.com/article/state-management-in-react-2026-best-practices-tools-real-world-patterns/)
- [TypeScript with React Best Practices 2026](https://medium.com/@mernstackdevbykevin/typescript-with-react-best-practices-2026-78ce4546210b)

### Internal References
- Hello World Reference Project: `/Users/jackjin/dev/ai-sandbox/projects/react/2026-03-29/1774808631099`

---

## Next Steps

1. **Step 2:** Initialize Vite project with `npm create vite@latest . -- --template react-ts`
2. **Step 3:** Implement Todo component with core functionality
3. **Step 4:** Build, test, and commit to git

---

**End of Research Document**
