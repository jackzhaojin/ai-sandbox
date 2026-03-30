# V2 Smoke Test

This is a minimal "Hello World" Node.js project created to verify the v2.0 executive loop works end-to-end.

## Purpose

This smoke test validates that the executive agent can:
- Create a simple Node.js project structure
- Write basic files (index.js, package.json, README.md)
- Initialize and commit to a git repository
- Follow the plan-then-execute pattern

## Running the Project

```bash
node index.js
# Or using npm
npm start
```

Expected output: `Hello from v2 smoke test!`

## Project Structure

```
.
├── index.js       # Main entry point that prints hello message
├── package.json   # Node.js project manifest
└── README.md      # This file
```
