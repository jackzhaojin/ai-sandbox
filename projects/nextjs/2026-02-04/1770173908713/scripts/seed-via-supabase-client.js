/**
 * Seed database using Supabase client
 * This uses the service role key to insert data without needing DATABASE_URL
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY';

async function seed() {
  console.log('🌱 Starting database seed...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Create sample users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          email: 'chef@example.com',
          name: 'Chef Alice',
          password_hash: hashedPassword,
        },
        {
          email: 'baker@example.com',
          name: 'Baker Bob',
          password_hash: hashedPassword,
        },
      ])
      .select();

    if (usersError) throw usersError;
    console.log(`✅ Created ${users.length} users`);

    const [user1, user2] = users;

    // 2. Create dietary tags
    console.log('\nCreating dietary tags...');
    const { data: tags, error: tagsError } = await supabase
      .from('dietary_tags')
      .insert([
        { name: 'Vegetarian' },
        { name: 'Vegan' },
        { name: 'Gluten-Free' },
        { name: 'Dairy-Free' },
        { name: 'Keto' },
      ])
      .select();

    if (tagsError) throw tagsError;
    console.log(`✅ Created ${tags.length} dietary tags`);

    // 3. Create ingredients
    console.log('\nCreating ingredients...');
    const ingredientsList = [
      // Vegetables
      { name: 'Tomato', category: 'vegetable' },
      { name: 'Onion', category: 'vegetable' },
      { name: 'Garlic', category: 'vegetable' },
      { name: 'Bell Pepper', category: 'vegetable' },
      { name: 'Spinach', category: 'vegetable' },
      { name: 'Carrot', category: 'vegetable' },
      { name: 'Broccoli', category: 'vegetable' },
      { name: 'Cucumber', category: 'vegetable' },
      { name: 'Lettuce', category: 'vegetable' },

      // Proteins
      { name: 'Chicken Breast', category: 'protein' },
      { name: 'Ground Beef', category: 'protein' },
      { name: 'Salmon', category: 'protein' },
      { name: 'Eggs', category: 'protein' },
      { name: 'Tofu', category: 'protein' },
      { name: 'Chickpeas', category: 'protein' },

      // Dairy
      { name: 'Milk', category: 'dairy' },
      { name: 'Cheese', category: 'dairy' },
      { name: 'Butter', category: 'dairy' },
      { name: 'Greek Yogurt', category: 'dairy' },
      { name: 'Parmesan Cheese', category: 'dairy' },

      // Grains
      { name: 'Pasta', category: 'grain' },
      { name: 'Rice', category: 'grain' },
      { name: 'Flour', category: 'grain' },
      { name: 'Bread', category: 'grain' },
      { name: 'Quinoa', category: 'grain' },

      // Spices & Herbs
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
      { name: 'Honey', category: 'sweetener' },
    ];

    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(ingredientsList)
      .select();

    if (ingredientsError) throw ingredientsError;
    console.log(`✅ Created ${ingredients.length} ingredients`);

    // Helper to find ingredient by name
    const findIngredient = (name) => ingredients.find(i => i.name === name);

    // 4. Create recipes with full data
    console.log('\nCreating recipes...');

    // Recipe 1: Spaghetti Carbonara
    const { data: recipe1, error: recipe1Error } = await supabase
      .from('recipes')
      .insert({
        user_id: user1.id,
        title: 'Classic Spaghetti Carbonara',
        description: 'A traditional Italian pasta dish with eggs, cheese, and pancetta. Simple yet elegant.',
        prep_time: 10,
        cook_time: 20,
        servings: 4,
        difficulty: 'medium',
        cuisine_type: 'Italian',
        image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500',
      })
      .select()
      .single();

    if (recipe1Error) throw recipe1Error;

    // Add ingredients for Carbonara
    await supabase.from('recipe_ingredients').insert([
      { recipe_id: recipe1.id, ingredient_id: findIngredient('Pasta').id, quantity: 400, unit: 'gram' },
      { recipe_id: recipe1.id, ingredient_id: findIngredient('Eggs').id, quantity: 4, unit: 'piece' },
      { recipe_id: recipe1.id, ingredient_id: findIngredient('Parmesan Cheese').id, quantity: 100, unit: 'gram' },
      { recipe_id: recipe1.id, ingredient_id: findIngredient('Black Pepper').id, quantity: 1, unit: 'tsp' },
      { recipe_id: recipe1.id, ingredient_id: findIngredient('Salt').id, quantity: 1, unit: 'tsp' },
    ]);

    // Add instructions for Carbonara
    await supabase.from('instructions').insert([
      { recipe_id: recipe1.id, step_number: 1, description: 'Bring a large pot of salted water to boil and cook pasta according to package instructions.' },
      { recipe_id: recipe1.id, step_number: 2, description: 'In a bowl, whisk together eggs and grated Parmesan cheese.' },
      { recipe_id: recipe1.id, step_number: 3, description: 'Reserve 1 cup of pasta water before draining.' },
      { recipe_id: recipe1.id, step_number: 4, description: 'Add hot pasta to the egg mixture and toss quickly, adding pasta water to create a creamy sauce.' },
      { recipe_id: recipe1.id, step_number: 5, description: 'Season with freshly ground black pepper and serve immediately.' },
    ]);

    // Tag as Vegetarian
    await supabase.from('recipe_dietary_tags').insert({
      recipe_id: recipe1.id,
      dietary_tag_id: tags.find(t => t.name === 'Vegetarian').id,
    });

    console.log(`✅ Created recipe: ${recipe1.title}`);

    // Recipe 2: Grilled Chicken Salad
    const { data: recipe2, error: recipe2Error } = await supabase
      .from('recipes')
      .insert({
        user_id: user1.id,
        title: 'Mediterranean Grilled Chicken Salad',
        description: 'Fresh and healthy salad with grilled chicken, vegetables, and a lemon vinaigrette.',
        prep_time: 15,
        cook_time: 15,
        servings: 2,
        difficulty: 'easy',
        cuisine_type: 'Mediterranean',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      })
      .select()
      .single();

    if (recipe2Error) throw recipe2Error;

    await supabase.from('recipe_ingredients').insert([
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Chicken Breast').id, quantity: 2, unit: 'piece' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Lettuce').id, quantity: 4, unit: 'cup' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Tomato').id, quantity: 2, unit: 'piece' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Cucumber').id, quantity: 1, unit: 'piece' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Bell Pepper').id, quantity: 1, unit: 'piece' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Olive Oil').id, quantity: 3, unit: 'tbsp' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Lemon Juice').id, quantity: 2, unit: 'tbsp' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Salt').id, quantity: 1, unit: 'tsp' },
      { recipe_id: recipe2.id, ingredient_id: findIngredient('Black Pepper').id, quantity: 0.5, unit: 'tsp' },
    ]);

    await supabase.from('instructions').insert([
      { recipe_id: recipe2.id, step_number: 1, description: 'Season chicken breasts with salt, pepper, and olive oil.' },
      { recipe_id: recipe2.id, step_number: 2, description: 'Grill chicken for 6-7 minutes per side until cooked through.' },
      { recipe_id: recipe2.id, step_number: 3, description: 'Let chicken rest for 5 minutes, then slice.' },
      { recipe_id: recipe2.id, step_number: 4, description: 'Chop lettuce, tomatoes, cucumber, and bell pepper.' },
      { recipe_id: recipe2.id, step_number: 5, description: 'Whisk together olive oil, lemon juice, salt, and pepper for dressing.' },
      { recipe_id: recipe2.id, step_number: 6, description: 'Toss salad with dressing and top with sliced chicken.' },
    ]);

    await supabase.from('recipe_dietary_tags').insert([
      { recipe_id: recipe2.id, dietary_tag_id: tags.find(t => t.name === 'Gluten-Free').id },
      { recipe_id: recipe2.id, dietary_tag_id: tags.find(t => t.name === 'Dairy-Free').id },
    ]);

    console.log(`✅ Created recipe: ${recipe2.title}`);

    // Recipe 3: Vegan Buddha Bowl
    const { data: recipe3, error: recipe3Error } = await supabase
      .from('recipes')
      .insert({
        user_id: user2.id,
        title: 'Vegan Buddha Bowl',
        description: 'Colorful and nutritious bowl with quinoa, roasted vegetables, and tahini dressing.',
        prep_time: 15,
        cook_time: 25,
        servings: 2,
        difficulty: 'easy',
        cuisine_type: 'Asian-Fusion',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
      })
      .select()
      .single();

    if (recipe3Error) throw recipe3Error;

    await supabase.from('recipe_ingredients').insert([
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Quinoa').id, quantity: 1, unit: 'cup' },
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Chickpeas').id, quantity: 1, unit: 'cup' },
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Broccoli').id, quantity: 2, unit: 'cup' },
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Carrot').id, quantity: 2, unit: 'piece' },
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Spinach').id, quantity: 2, unit: 'cup' },
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Olive Oil').id, quantity: 2, unit: 'tbsp' },
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Soy Sauce').id, quantity: 1, unit: 'tbsp' },
      { recipe_id: recipe3.id, ingredient_id: findIngredient('Lemon Juice').id, quantity: 1, unit: 'tbsp' },
    ]);

    await supabase.from('instructions').insert([
      { recipe_id: recipe3.id, step_number: 1, description: 'Cook quinoa according to package instructions.' },
      { recipe_id: recipe3.id, step_number: 2, description: 'Chop carrots and broccoli into bite-sized pieces.' },
      { recipe_id: recipe3.id, step_number: 3, description: 'Roast chickpeas and vegetables with olive oil at 400°F for 20 minutes.' },
      { recipe_id: recipe3.id, step_number: 4, description: 'Massage fresh spinach with lemon juice and a pinch of salt.' },
      { recipe_id: recipe3.id, step_number: 5, description: 'Assemble bowls with quinoa base, roasted vegetables, and fresh spinach.' },
      { recipe_id: recipe3.id, step_number: 6, description: 'Drizzle with soy sauce and serve warm.' },
    ]);

    await supabase.from('recipe_dietary_tags').insert([
      { recipe_id: recipe3.id, dietary_tag_id: tags.find(t => t.name === 'Vegan').id },
      { recipe_id: recipe3.id, dietary_tag_id: tags.find(t => t.name === 'Vegetarian').id },
      { recipe_id: recipe3.id, dietary_tag_id: tags.find(t => t.name === 'Dairy-Free').id },
    ]);

    console.log(`✅ Created recipe: ${recipe3.title}`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  🥕 Ingredients: ${ingredients.length}`);
    console.log(`  🏷️  Dietary Tags: ${tags.length}`);
    console.log(`  🍽️  Recipes: 3`);
    console.log('\nTest credentials:');
    console.log('  Email: chef@example.com');
    console.log('  Password: password123');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

seed();
