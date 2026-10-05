// Local mock responses for Phase 1 AI Assistant UI prototype.
// Note: These mock responses are for UI demonstration only and do not provide medical or clinical advice.

export function getMockAIResponse(prompt) {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("meal plan") ||
    lower.includes("kế hoạch") ||
    lower.includes("3-day") ||
    lower.includes("3 day")
  ) {
    return `Here is a sample 3-day vegetarian meal plan for healthy digestion and steady energy:

DAY 1
• Breakfast: Chia seed pudding topped with fresh mango and toasted almonds.
• Lunch: Warm quinoa salad with steamed edamame, roasted peppers, and lemon vinaigrette.
• Dinner: Pan-seared sesame tempeh with sautéed bok choy and jasmine brown rice.

DAY 2
• Breakfast: Rolled oats simmered with cinnamon, hemp hearts, and sliced ripe banana.
• Lunch: Hearty red lentil soup with a slice of rustic sourdough bread.
• Dinner: Roasted sweet potato and black bean bowl with avocado cilantro drizzle.

DAY 3
• Breakfast: Green matcha smoothie bowl with spinach, kiwi, and chia seeds.
• Lunch: Mediterranean chickpea and cucumber wrap with garlic tahini spread.
• Dinner: Stir-fried lemongrass tofu with assorted mushrooms and brown rice noodles.

Estimated daily nutrition:
Calories: ~1,850 kcal
Protein: ~75 g
Fiber: ~40 g`;
  }

  if (lower.includes("protein") || lower.includes("đạm")) {
    return `Good plant-based protein sources include:
• Extra-firm Tofu (approx. 17g protein per 100g)
• Tempeh (approx. 19g protein per 100g)
• Edamame & Green Peas (approx. 11g protein per cup)
• Cooked Lentils (approx. 18g protein per cup)
• Chickpeas & Beans (approx. 15g protein per cup)
• Hemp seeds, Chia seeds, & Pumpkin seeds (5–10g per 2 tbsp)

Combining whole grains (quinoa, wild rice, oats) with legumes provides a balanced variety of essential amino acids throughout the day.`;
  }

  if (
    lower.includes("dinner") ||
    lower.includes("tối") ||
    lower.includes("eat today")
  ) {
    return `For a wholesome vegetarian dinner, try combining a plant-based protein with nutrient-dense vegetables and a whole-grain carbohydrate:

Recommended Dinner Ideas:
1. Crispy Tofu Stir-Fry: Broccoli florets, bell peppers, and snap peas tossed in ginger-soy sauce over brown rice.
2. Creamy Chickpea Coconut Curry: Simmered with spinach, diced tomatoes, and aromatic turmeric.
3. Warm Lentil Salad Bowl: Roasted beets, baby greens, roasted walnuts, and vegan feta.

Each of these meals takes under 30 minutes to prepare and provides good plant protein and fiber.`;
  }

  if (
    lower.includes("grocery") ||
    lower.includes("chợ") ||
    lower.includes("list")
  ) {
    return `Here is a foundational ChayBook Vegetarian Grocery List:

Pantry Staples:
• Grains: Quinoa, rolled oats, brown basmati rice, whole-grain sourdough
• Legumes: Canned chickpeas, dried green/red lentils, black beans
• Nuts & Seeds: Chia seeds, flaxseed meal, raw walnuts, tahini, natural peanut butter

Fresh Produce:
• Greens: Baby spinach, lacinato kale, crisp cucumbers
• Veggies: Sweet potatoes, broccoli, bell peppers, shiitake mushrooms
• Fruits: Wild blueberries, ripe bananas, lemons, avocados

Refrigerated Proteins:
• Organic firm tofu, sprouted tempeh, unsweetened soy or oat milk`;
  }

  if (lower.includes("substitut") || lower.includes("thay thế")) {
    return `Common plant-based substitutions for cooking and baking:
• Egg replacement (baking): 1 tbsp ground flaxseed mixed with 3 tbsp warm water (let sit 5 mins for 1 "flax egg").
• Cow's Milk: Unsweetened soy milk (highest protein) or oat milk (creamiest texture).
• Heavy Cream: Full-fat coconut milk or raw cashews soaked in hot water and blended until velvety.
• Meat Textures: Pressed firm tofu, seasoned pan-crisped tempeh, or rehydrated shiitake mushroom caps for rich umami flavor.`;
  }

  // Fallback response
  return "I am currently running as a Phase 1 UI demo for the ChayBook AI Assistant. Feel free to ask about vegetarian meal planning, high-protein plant foods, ingredient substitutions, or grocery lists!";
}

