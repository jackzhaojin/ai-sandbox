# Database Documentation

This directory contains all database-related code for the Recipe Discovery Platform.

## Overview

The application uses:
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Migration Tool**: Drizzle Kit

## File Structure

```
lib/db/
├── schema.ts           # Database schema definitions
├── index.ts            # Database connection and client
├── seed.ts             # Seed data script
├── migrations/         # Generated migration files (auto-created)
└── README.md          # This file
```

## Database Schema

### Tables

1. **users** - User accounts
   - Authentication and profile information
   - One-to-many with recipes, favorites, and reviews

2. **recipes** - Recipe data
   - Core recipe information (title, description, times, servings)
   - Belongs to a user (creator)
   - Has many ingredients, instructions, dietary tags, favorites, and reviews

3. **ingredients** - Master ingredient list
   - Reusable ingredient catalog
   - Categorized (vegetable, protein, dairy, etc.)

4. **recipe_ingredients** - Junction table
   - Links recipes to ingredients
   - Includes quantity, unit, and preparation notes

5. **instructions** - Recipe steps
   - Ordered cooking instructions
   - Optional duration per step

6. **dietary_tags** - Dietary classifications
   - Vegetarian, Vegan, Gluten-Free, etc.
   - Reusable across recipes

7. **recipe_dietary_tags** - Junction table
   - Links recipes to dietary tags

8. **favorites** - User recipe favorites
   - Links users to their saved recipes

9. **reviews** - Recipe reviews (Phase 2)
   - User ratings and comments
   - 1-5 star rating system

### Entity Relationships

```
users (1) ──< (many) recipes
users (1) ──< (many) favorites
users (1) ──< (many) reviews

recipes (1) ──< (many) recipe_ingredients
recipes (1) ──< (many) instructions
recipes (1) ──< (many) recipe_dietary_tags
recipes (1) ──< (many) favorites
recipes (1) ──< (many) reviews

ingredients (1) ──< (many) recipe_ingredients
dietary_tags (1) ──< (many) recipe_dietary_tags
```

## Setup Instructions

### 1. Install Dependencies

Dependencies should already be installed from Step 2. If not:

```bash
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit tsx @types/bcryptjs bcryptjs
```

### 2. Set Up PostgreSQL Database

You have several options for PostgreSQL:

#### Option A: Local PostgreSQL

Install PostgreSQL locally:

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb recipe_discovery
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb recipe_discovery
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

#### Option B: Cloud Providers (Recommended for Production)

**Vercel Postgres:**
1. Go to your Vercel project
2. Navigate to Storage → Create → Postgres
3. Copy the `DATABASE_URL` connection string

**Supabase:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → Database
3. Copy the Connection String (Session Mode)

**Railway:**
1. Create a new project at [railway.app](https://railway.app)
2. Add PostgreSQL plugin
3. Copy the `DATABASE_URL` from variables

**Neon:**
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your database connection string:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/recipe_discovery"
```

### 4. Generate and Apply Migrations

Generate migration files from the schema:

```bash
npm run db:generate
```

This creates SQL migration files in `lib/db/migrations/`.

Apply migrations to your database:

```bash
npm run db:push
```

Or use the migrate command:

```bash
npm run db:migrate
```

### 5. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run db:seed
```

This creates:
- 2 sample users (chef@example.com, baker@example.com)
- 30+ common ingredients
- 5 dietary tags
- 3 sample recipes with instructions

**Test credentials:**
- Email: `chef@example.com` or `baker@example.com`
- Password: `password123`

## Available Scripts

All scripts are defined in `package.json`:

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate migration files from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:push` | Push schema directly (dev mode) |
| `npm run db:studio` | Open Drizzle Studio (visual database browser) |
| `npm run db:seed` | Seed database with sample data |

## Development Workflow

### Making Schema Changes

1. Edit `lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review migration in `lib/db/migrations/`
4. Apply migration: `npm run db:migrate`

### Querying the Database

Import the database client:

```typescript
import { db } from '@/lib/db';
import { recipes, users } from '@/lib/db/schema';

// Find all recipes
const allRecipes = await db.select().from(recipes);

// Find recipe by ID
const recipe = await db.select()
  .from(recipes)
  .where(eq(recipes.id, recipeId));

// Join recipes with user data
const recipesWithUsers = await db.select()
  .from(recipes)
  .leftJoin(users, eq(recipes.userId, users.id));
```

### Using Type-Safe Queries

Drizzle provides full TypeScript support:

```typescript
import { Recipe, NewRecipe } from '@/lib/db/schema';

// Inferred types
const recipe: Recipe = await db.select()
  .from(recipes)
  .where(eq(recipes.id, id))
  .limit(1);

// Type-safe inserts
const newRecipe: NewRecipe = {
  userId: user.id,
  title: 'New Recipe',
  description: 'Description',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'easy',
};

await db.insert(recipes).values(newRecipe);
```

## Drizzle Studio

Explore and manage your database visually:

```bash
npm run db:studio
```

This opens a web interface at `https://local.drizzle.studio` where you can:
- Browse tables and data
- Run queries
- Edit records
- View relationships

## Indexing Strategy

The schema includes performance-critical indexes:

- `idx_recipes_user_id` - Fast recipe lookup by user
- `idx_recipes_cuisine_type` - Filter recipes by cuisine
- `idx_recipe_ingredients_recipe_id` - Ingredient lookup
- `idx_recipe_ingredients_ingredient_id` - Recipes by ingredient
- `idx_favorites_user_id` - User's favorite recipes
- `idx_favorites_recipe_id` - Recipe popularity
- `idx_reviews_recipe_id` - Recipe reviews

These indexes are automatically created during migration.

## Schema Validation

All data types use TypeScript enums for validation:

```typescript
// Difficulty levels
type Difficulty = 'easy' | 'medium' | 'hard';

// Measurement units
type Unit = 'cup' | 'tbsp' | 'tsp' | 'gram' | 'kg' | 'oz' | 'lb' | ...;

// Ingredient categories
type IngredientCategory = 'vegetable' | 'protein' | 'dairy' | ...;
```

## Security Notes

- Passwords are hashed with bcrypt (10 rounds minimum)
- SQL injection prevention via Drizzle ORM parameterized queries
- Foreign key constraints enforce referential integrity
- Cascade deletes configured for data consistency

## Troubleshooting

### Connection Issues

**Error: "Cannot connect to database"**
- Check `DATABASE_URL` is correct in `.env.local`
- Verify database server is running
- Check firewall/network settings
- Confirm database exists

**Error: "SSL required"**
- For cloud providers, ensure `?sslmode=require` is in connection string

### Migration Issues

**Error: "Migration already applied"**
- Drizzle tracks applied migrations
- Check `drizzle` table in your database
- Use `npm run db:push` for development (skips migration tracking)

**Error: "Syntax error in migration"**
- Review generated SQL in `lib/db/migrations/`
- Regenerate: `npm run db:generate`

### Type Errors

**Error: "Type 'X' is not assignable to type 'Y'"**
- Ensure you're using exported types from schema
- Check enum values match schema definitions
- Regenerate types: Restart TypeScript server

## Performance Tips

1. **Use Indexes**: Already configured in schema
2. **Limit Results**: Always paginate large datasets
3. **Select Specific Columns**: Don't use `SELECT *` in production
4. **Connection Pooling**: `postgres` library handles this automatically
5. **Prepared Statements**: Drizzle uses them by default

## Next Steps

After database setup is complete, proceed to:

**Step 4: Implement authentication system**
- Auth.js v5 integration
- User registration/login flows
- Session management
- Protected routes

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle Kit CLI](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
