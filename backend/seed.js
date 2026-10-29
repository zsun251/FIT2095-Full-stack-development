// ============================================
// Demo data seeder
// Creates a demo chef account with sample recipes and inventory.
// Safe to re-run: only the demo account and its own data are replaced.
// Usage: npm run seed
// ============================================

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Recipe = require('./models/Recipe');
const UserInventory = require('./models/UserInventory');

const DEMO_USER = {
    fullname: 'Demo Chef',
    email: 'chef@demo.com',
    password: 'Demo@1234',
    phone: '+61 412 345 678',
    role: 'chef'
};

// Inventory dates must be midnight UTC
const daysFromToday = (days) => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
};

const recipes = [
    {
        title: 'Spaghetti Carbonara',
        chef: 'Demo Chef',
        ingredients: ['200g spaghetti', '2 eggs', '100g pancetta', '50g parmesan', 'Black pepper'],
        instructions: [
            'Boil the spaghetti in salted water until al dente.',
            'Fry the pancetta in a pan until crispy.',
            'Whisk the eggs with grated parmesan and black pepper.',
            'Toss the hot pasta with pancetta, then stir in the egg mixture off the heat.'
        ],
        mealType: 'Dinner',
        cuisineType: 'Italian',
        prepTime: 25,
        difficulty: 'Medium',
        servings: 2
    },
    {
        title: 'Chicken Fried Rice',
        chef: 'Demo Chef',
        ingredients: ['2 cups cooked rice', '1 chicken breast', '2 eggs', '1 cup frozen peas', '2 tbsp soy sauce'],
        instructions: [
            'Dice the chicken and stir-fry until cooked through.',
            'Push the chicken aside and scramble the eggs in the same pan.',
            'Add the rice and peas and stir-fry for five minutes.',
            'Season with soy sauce and serve hot.'
        ],
        mealType: 'Lunch',
        cuisineType: 'Asian',
        prepTime: 20,
        difficulty: 'Easy',
        servings: 3
    },
    {
        title: 'Avocado Toast',
        chef: 'Demo Chef',
        ingredients: ['2 slices sourdough', '1 ripe avocado', 'Lemon juice', 'Chilli flakes'],
        instructions: [
            'Toast the sourdough slices until golden.',
            'Mash the avocado with lemon juice and a pinch of salt.',
            'Spread the avocado on the toast and sprinkle with chilli flakes.'
        ],
        mealType: 'Breakfast',
        cuisineType: 'American',
        prepTime: 10,
        difficulty: 'Easy',
        servings: 1
    }
];

const inventory = [
    { ingredientName: 'Eggs', quantity: 12, unit: 'pieces', category: 'Dairy', purchaseDate: daysFromToday(-2), expirationDate: daysFromToday(12), location: 'Fridge', cost: 0.5 },
    { ingredientName: 'Spaghetti', quantity: 1, unit: 'kg', category: 'Grains', purchaseDate: daysFromToday(-10), expirationDate: daysFromToday(300), location: 'Pantry', cost: 3.2 },
    { ingredientName: 'Chicken Breast', quantity: 1.5, unit: 'kg', category: 'Meat', purchaseDate: daysFromToday(-1), expirationDate: daysFromToday(2), location: 'Fridge', cost: 11.99 },
    { ingredientName: 'Frozen Peas', quantity: 500, unit: 'g', category: 'Frozen', purchaseDate: daysFromToday(-20), expirationDate: daysFromToday(180), location: 'Freezer', cost: 0.01 },
    { ingredientName: 'Avocado', quantity: 1, unit: 'pieces', category: 'Fruits', purchaseDate: daysFromToday(-5), expirationDate: daysFromToday(-1), location: 'Counter', cost: 2.5 }
];

const seed = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cloudkitchen-pro';
    await mongoose.connect(uri);

    // Replace the demo account and everything it owns
    const existing = await User.findOne({ email: DEMO_USER.email });
    if (existing) {
        await Recipe.deleteMany({ userId: existing.userId });
        await UserInventory.deleteMany({ userId: existing.userId });
        await existing.deleteOne();
    }

    const user = await new User(DEMO_USER).save();

    // Save one at a time so the generated IDs don't collide
    for (const recipe of recipes) {
        await new Recipe({ ...recipe, userId: user.userId }).save();
    }
    for (const item of inventory) {
        await new UserInventory({ ...item, userId: user.userId }).save();
    }

    console.log(`Seeded ${recipes.length} recipes and ${inventory.length} inventory items`);
    console.log(`Log in with ${DEMO_USER.email} / ${DEMO_USER.password}`);
    await mongoose.disconnect();
};

seed().catch(async (error) => {
    console.error('Seeding failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
});
