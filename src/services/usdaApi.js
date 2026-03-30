// USDA FoodData Central API
// DEMO_KEY: 30 requests/hour, 1000 requests/day per IP.
// Get your own free key at https://fdc.nal.usda.gov/api-guide.html
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1'
const API_KEY = 'DEMO_KEY'

// Nutrient IDs from USDA FoodData Central
const NUTRIENT_IDS = {
  calories: [1008, 2047, 2048],   // Energy (kcal) — varies by data type
  protein:  [1003],
  fat:      [1004],
  carbs:    [1005],
  fiber:    [1079],
}

function extractNutrients(foodNutrients) {
  if (!Array.isArray(foodNutrients)) return { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }

  const find = (ids) => {
    for (const id of ids) {
      const n = foodNutrients.find(n => n.nutrientId === id || n.id === id)
      if (n && n.value != null) return Math.round(n.value * 10) / 10
    }
    return 0
  }

  return {
    calories: find(NUTRIENT_IDS.calories),
    protein:  find(NUTRIENT_IDS.protein),
    fat:      find(NUTRIENT_IDS.fat),
    carbs:    find(NUTRIENT_IDS.carbs),
    fiber:    find(NUTRIENT_IDS.fiber),
  }
}

function normalizeFood(food) {
  return {
    fdcId:           food.fdcId,
    description:     food.description,
    brandOwner:      food.brandOwner || food.brandName || '',
    dataType:        food.dataType || '',
    servingSize:     food.servingSize || null,
    servingSizeUnit: food.servingSizeUnit || 'g',
    nutrients:       extractNutrients(food.foodNutrients),
  }
}

export async function searchFoods(query) {
  const params = new URLSearchParams({
    query,
    pageSize: 20,
    dataType: 'Foundation,SR Legacy,Branded',
    api_key: API_KEY,
  })
  const res = await fetch(`${BASE_URL}/foods/search?${params}`)
  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit reached. Wait a minute before searching again.')
    throw new Error(`Search failed (${res.status}). Try again.`)
  }
  const data = await res.json()
  return (data.foods || []).map(normalizeFood)
}

// Scale all nutrient values from per-100g base to a given gram amount
export function scaleNutrients(baseNutrients, grams) {
  const f = grams / 100
  return {
    calories: Math.round(baseNutrients.calories * f),
    protein:  Math.round(baseNutrients.protein  * f * 10) / 10,
    fat:      Math.round(baseNutrients.fat       * f * 10) / 10,
    carbs:    Math.round(baseNutrients.carbs     * f * 10) / 10,
    fiber:    Math.round(baseNutrients.fiber     * f * 10) / 10,
  }
}
