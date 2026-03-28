import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { db } from './index';
import {
  users,
  recipes,
  ingredients,
  recipeIngredients,
  instructions,
  dietaryTags,
  recipeDietaryTags,
} from './schema';
import * as bcrypt from 'bcryptjs';

/**
 * Seed database with initial data
 *
 * This script creates:
 * - Sample users
 * - Common ingredients
 * - Sample recipes with instructions
 * - Dietary tags
 *
 * Run with: npm run db:seed
 */
async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create sample users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const [user1, user2] = await db.insert(users).values([
      {
        email: 'chef@example.com',
        name: 'Chef Alice',
        passwordHash: hashedPassword,
      },
      {
        email: 'baker@example.com',
        name: 'Baker Bob',
        passwordHash: hashedPassword,
      },
    ]).returning();

    console.log('✅ Users created');

    // 2. Create dietary tags
    console.log('Creating dietary tags...');
    const [vegetarianTag, veganTag, glutenFreeTag, dairyFreeTag, ketoTag] = await db.insert(dietaryTags).values([
      { name: 'Vegetarian' },
      { name: 'Vegan' },
      { name: 'Gluten-Free' },
      { name: 'Dairy-Free' },
      { name: 'Keto' },
    ]).returning();

    console.log('✅ Dietary tags created');

    // 3. Create common ingredients
    console.log('Creating ingredients...');
    const ingredientsList = await db.insert(ingredients).values([
      // Vegetables
      { name: 'Tomato', category: 'vegetable' },
      { name: 'Onion', category: 'vegetable' },
      { name: 'Garlic', category: 'vegetable' },
      { name: 'Bell Pepper', category: 'vegetable' },
      { name: 'Spinach', category: 'vegetable' },
      { name: 'Carrot', category: 'vegetable' },
      { name: 'Broccoli', category: 'vegetable' },

      // Proteins
      { name: 'Chicken Breast', category: 'protein' },
      { name: 'Ground Beef', category: 'protein' },
      { name: 'Salmon', category: 'protein' },
      { name: 'Eggs', category: 'protein' },
      { name: 'Tofu', category: 'protein' },

      // Dairy
      { name: 'Milk', category: 'dairy' },
      { name: 'Cheese', category: 'dairy' },
      { name: 'Butter', category: 'dairy' },
      { name: 'Greek Yogurt', category: 'dairy' },

      // Grains
      { name: 'Pasta', category: 'grain' },
      { name: 'Rice', category: 'grain' },
      { name: 'Flour', category: 'grain' },
      { name: 'Bread', category: 'grain' },

      // Spices
      { name: 'Salt', category: 'spice' },
      { name: 'Black Pepper', category: 'spice' },
      { name: 'Paprika', category: 'spice' },
      { name: 'Cumin', category: 'spice' },
      { name: 'Oregano', category: 'spice' },
      { name: 'Basil', category: 'spice' },

      // Oils & Condiments
      { name: 'Olive Oil', category: 'oil' },
      { name: 'Vegetable Oil', category: 'oil' },
      { name: 'Soy Sauce', category: 'condiment' },
      { name: 'Lemon Juice', category: 'condiment' },
    ]).returning();

    console.log('✅ Ingredients created');

    // Helper to find ingredient by name
    const getIngredient = (name: string) => ingredientsList.find(i => i.name === name);

    // 4. Create sample recipes
    console.log('Creating recipes...');

    // Recipe 1: Classic Spaghetti Carbonara
    const [recipe1] = await db.insert(recipes).values({
      userId: user1.id,
      title: 'Classic Spaghetti Carbonara',
      description: 'A traditional Italian pasta dish with eggs, cheese, and pancetta. Creamy, rich, and absolutely delicious.',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      difficulty: 'medium',
      cuisineType: 'Italian',
      imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
    }).returning();

    await db.insert(recipeIngredients).values([
      { recipeId: recipe1.id, ingredientId: getIngredient('Pasta')!.id, quantity: '400', unit: 'gram' },
      { recipeId: recipe1.id, ingredientId: getIngredient('Eggs')!.id, quantity: '4', unit: 'whole' },
      { recipeId: recipe1.id, ingredientId: getIngredient('Cheese')!.id, quantity: '100', unit: 'gram', notes: 'Pecorino Romano, grated' },
      { recipeId: recipe1.id, ingredientId: getIngredient('Black Pepper')!.id, quantity: '1', unit: 'tsp' },
      { recipeId: recipe1.id, ingredientId: getIngredient('Salt')!.id, quantity: '1', unit: 'to_taste' },
    ]);

    await db.insert(instructions).values([
      { recipeId: recipe1.id, stepNumber: 1, description: 'Bring a large pot of salted water to boil. Cook pasta according to package directions until al dente.' },
      { recipeId: recipe1.id, stepNumber: 2, description: 'While pasta cooks, whisk eggs and grated cheese together in a bowl. Add plenty of black pepper.' },
      { recipeId: recipe1.id, stepNumber: 3, description: 'Reserve 1 cup of pasta water, then drain pasta.' },
      { recipeId: recipe1.id, stepNumber: 4, description: 'Working quickly, toss hot pasta with egg mixture, adding pasta water gradually to create a creamy sauce.' },
      { recipeId: recipe1.id, stepNumber: 5, description: 'Serve immediately with extra cheese and black pepper.' },
    ]);

    await db.insert(recipeDietaryTags).values([
      { recipeId: recipe1.id, dietaryTagId: vegetarianTag.id },
    ]);

    // Recipe 2: Grilled Chicken Salad
    const [recipe2] = await db.insert(recipes).values({
      userId: user1.id,
      title: 'Mediterranean Grilled Chicken Salad',
      description: 'A healthy and flavorful salad with grilled chicken, fresh vegetables, and a lemon vinaigrette.',
      prepTime: 15,
      cookTime: 15,
      servings: 2,
      difficulty: 'easy',
      cuisineType: 'Mediterranean',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    }).returning();

    await db.insert(recipeIngredients).values([
      { recipeId: recipe2.id, ingredientId: getIngredient('Chicken Breast')!.id, quantity: '300', unit: 'gram' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Spinach')!.id, quantity: '2', unit: 'cup' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Tomato')!.id, quantity: '2', unit: 'whole', notes: 'cherry tomatoes, halved' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Bell Pepper')!.id, quantity: '1', unit: 'whole', notes: 'sliced' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Olive Oil')!.id, quantity: '3', unit: 'tbsp' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Lemon Juice')!.id, quantity: '2', unit: 'tbsp' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Garlic')!.id, quantity: '2', unit: 'piece', notes: 'minced' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Salt')!.id, quantity: '1', unit: 'to_taste' },
      { recipeId: recipe2.id, ingredientId: getIngredient('Black Pepper')!.id, quantity: '1', unit: 'to_taste' },
    ]);

    await db.insert(instructions).values([
      { recipeId: recipe2.id, stepNumber: 1, description: 'Season chicken breasts with salt, pepper, and olive oil.' },
      { recipeId: recipe2.id, stepNumber: 2, description: 'Grill chicken over medium-high heat for 6-7 minutes per side, until cooked through.', duration: 15 },
      { recipeId: recipe2.id, stepNumber: 3, description: 'Let chicken rest for 5 minutes, then slice.' },
      { recipeId: recipe2.id, stepNumber: 4, description: 'In a large bowl, combine spinach, tomatoes, and bell pepper.' },
      { recipeId: recipe2.id, stepNumber: 5, description: 'Whisk together olive oil, lemon juice, and garlic for the dressing.' },
      { recipeId: recipe2.id, stepNumber: 6, description: 'Toss salad with dressing, top with sliced chicken, and serve.' },
    ]);

    await db.insert(recipeDietaryTags).values([
      { recipeId: recipe2.id, dietaryTagId: glutenFreeTag.id },
      { recipeId: recipe2.id, dietaryTagId: dairyFreeTag.id },
    ]);

    // Recipe 3: Vegan Buddha Bowl
    const [recipe3] = await db.insert(recipes).values({
      userId: user2.id,
      title: 'Vegan Buddha Bowl',
      description: 'A colorful and nutritious bowl packed with roasted vegetables, quinoa, and tahini dressing.',
      prepTime: 20,
      cookTime: 30,
      servings: 2,
      difficulty: 'easy',
      cuisineType: 'Asian-Fusion',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    }).returning();

    await db.insert(recipeIngredients).values([
      { recipeId: recipe3.id, ingredientId: getIngredient('Rice')!.id, quantity: '1', unit: 'cup', notes: 'quinoa or brown rice' },
      { recipeId: recipe3.id, ingredientId: getIngredient('Tofu')!.id, quantity: '200', unit: 'gram', notes: 'cubed' },
      { recipeId: recipe3.id, ingredientId: getIngredient('Broccoli')!.id, quantity: '1', unit: 'cup', notes: 'florets' },
      { recipeId: recipe3.id, ingredientId: getIngredient('Carrot')!.id, quantity: '2', unit: 'whole', notes: 'sliced' },
      { recipeId: recipe3.id, ingredientId: getIngredient('Spinach')!.id, quantity: '1', unit: 'cup' },
      { recipeId: recipe3.id, ingredientId: getIngredient('Olive Oil')!.id, quantity: '2', unit: 'tbsp' },
      { recipeId: recipe3.id, ingredientId: getIngredient('Soy Sauce')!.id, quantity: '2', unit: 'tbsp' },
      { recipeId: recipe3.id, ingredientId: getIngredient('Garlic')!.id, quantity: '2', unit: 'piece', notes: 'minced' },
    ]);

    await db.insert(instructions).values([
      { recipeId: recipe3.id, stepNumber: 1, description: 'Cook quinoa or rice according to package directions.' },
      { recipeId: recipe3.id, stepNumber: 2, description: 'Preheat oven to 400°F (200°C).' },
      { recipeId: recipe3.id, stepNumber: 3, description: 'Toss broccoli and carrots with olive oil, salt, and pepper. Roast for 20-25 minutes.', duration: 25 },
      { recipeId: recipe3.id, stepNumber: 4, description: 'Pan-fry tofu cubes with soy sauce and garlic until golden.', duration: 10 },
      { recipeId: recipe3.id, stepNumber: 5, description: 'Assemble bowls with quinoa, roasted vegetables, tofu, and fresh spinach.' },
      { recipeId: recipe3.id, stepNumber: 6, description: 'Drizzle with additional soy sauce or tahini dressing and serve.' },
    ]);

    await db.insert(recipeDietaryTags).values([
      { recipeId: recipe3.id, dietaryTagId: veganTag.id },
      { recipeId: recipe3.id, dietaryTagId: vegetarianTag.id },
      { recipeId: recipe3.id, dietaryTagId: dairyFreeTag.id },
    ]);

    console.log('✅ Recipes created');

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`- Users: 2`);
    console.log(`- Ingredients: ${ingredientsList.length}`);
    console.log(`- Dietary Tags: 5`);
    console.log(`- Recipes: 3`);
    console.log('');
    console.log('🔑 Test credentials:');
    console.log('- Email: chef@example.com');
    console.log('- Email: baker@example.com');
    console.log('- Password: password123');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
