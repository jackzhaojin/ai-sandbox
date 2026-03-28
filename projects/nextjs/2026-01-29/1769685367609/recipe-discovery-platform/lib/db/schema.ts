import { pgTable, uuid, varchar, text, integer, decimal, timestamp, pgEnum, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);
export const ingredientCategoryEnum = pgEnum('ingredient_category', [
  'vegetable',
  'fruit',
  'protein',
  'dairy',
  'grain',
  'spice',
  'condiment',
  'oil',
  'sweetener',
  'other'
]);
export const unitEnum = pgEnum('unit', [
  'cup',
  'tbsp',
  'tsp',
  'gram',
  'kg',
  'oz',
  'lb',
  'ml',
  'liter',
  'pinch',
  'piece',
  'whole',
  'to_taste'
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Recipes table
export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  prepTime: integer('prep_time').notNull(), // in minutes
  cookTime: integer('cook_time').notNull(), // in minutes
  servings: integer('servings').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  cuisineType: varchar('cuisine_type', { length: 100 }),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('idx_recipes_user_id').on(table.userId),
    cuisineTypeIdx: index('idx_recipes_cuisine_type').on(table.cuisineType),
  };
});

// Ingredients table
export const ingredients = pgTable('ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  category: ingredientCategoryEnum('category').notNull(),
});

// Recipe ingredients junction table
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unit: unitEnum('unit').notNull(),
  notes: varchar('notes', { length: 255 }), // e.g., "finely chopped", "to taste"
}, (table) => {
  return {
    recipeIdIdx: index('idx_recipe_ingredients_recipe_id').on(table.recipeId),
    ingredientIdIdx: index('idx_recipe_ingredients_ingredient_id').on(table.ingredientId),
  };
});

// Instructions table
export const instructions = pgTable('instructions', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  description: text('description').notNull(),
  duration: integer('duration'), // optional, in minutes
}, (table) => {
  return {
    recipeIdIdx: index('idx_instructions_recipe_id').on(table.recipeId),
  };
});

// Dietary tags table
export const dietaryTags = pgTable('dietary_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

// Recipe dietary tags junction table
export const recipeDietaryTags = pgTable('recipe_dietary_tags', {
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  dietaryTagId: uuid('dietary_tag_id').notNull().references(() => dietaryTags.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.recipeId, table.dietaryTagId] }),
  };
});

// Favorites table
export const favorites = pgTable('favorites', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.recipeId] }),
    userIdIdx: index('idx_favorites_user_id').on(table.userId),
    recipeIdIdx: index('idx_favorites_recipe_id').on(table.recipeId),
  };
});

// Reviews table (for future Phase 2)
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    recipeIdIdx: index('idx_reviews_recipe_id').on(table.recipeId),
    userIdIdx: index('idx_reviews_user_id').on(table.userId),
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  recipes: many(recipes),
  favorites: many(favorites),
  reviews: many(reviews),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  recipeIngredients: many(recipeIngredients),
  instructions: many(instructions),
  recipeDietaryTags: many(recipeDietaryTags),
  favorites: many(favorites),
  reviews: many(reviews),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipeIngredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const instructionsRelations = relations(instructions, ({ one }) => ({
  recipe: one(recipes, {
    fields: [instructions.recipeId],
    references: [recipes.id],
  }),
}));

export const dietaryTagsRelations = relations(dietaryTags, ({ many }) => ({
  recipeDietaryTags: many(recipeDietaryTags),
}));

export const recipeDietaryTagsRelations = relations(recipeDietaryTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeDietaryTags.recipeId],
    references: [recipes.id],
  }),
  dietaryTag: one(dietaryTags, {
    fields: [recipeDietaryTags.dietaryTagId],
    references: [dietaryTags.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [favorites.recipeId],
    references: [recipes.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [reviews.recipeId],
    references: [recipes.id],
  }),
}));

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;

export type Instruction = typeof instructions.$inferSelect;
export type NewInstruction = typeof instructions.$inferInsert;

export type DietaryTag = typeof dietaryTags.$inferSelect;
export type NewDietaryTag = typeof dietaryTags.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
