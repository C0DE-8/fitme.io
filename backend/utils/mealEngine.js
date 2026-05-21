const meals = require('../data/meals.json');

function generateMealPlan(cupboardItems = []) {
  return meals.filter(meal =>
    meal.ingredients.every(ing => cupboardItems.includes(ing))
  );
}

module.exports = { generateMealPlan };
