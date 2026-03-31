// USDA FoodData Central — DEMO_KEY (30 req/hr, 1000/day per IP)
// Get your own free key: https://fdc.nal.usda.gov/api-guide.html
const USDA_KEY  = 'DEMO_KEY';
const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient IDs that work across SR Legacy, Foundation, and Branded data types
const N = {
  calories: [1008, 2047, 2048],
  protein:  [1003],
  fat:      [1004],
  carbs:    [1005],
  fiber:    [1079],
};

function extractNutrients(foodNutrients) {
  if (!Array.isArray(foodNutrients)) return { calories:0, protein:0, fat:0, carbs:0, fiber:0 };
  const find = ids => {
    for (const id of ids) {
      const n = foodNutrients.find(n => n.nutrientId === id || n.id === id);
      if (n && n.value != null) return Math.round(n.value * 10) / 10;
    }
    return 0;
  };
  return {
    calories: find(N.calories),
    protein:  find(N.protein),
    fat:      find(N.fat),
    carbs:    find(N.carbs),
    fiber:    find(N.fiber),
  };
}

async function searchFoods(query) {
  const params = new URLSearchParams({
    query,
    pageSize: 25,
    dataType: 'Foundation,SR Legacy,Branded',
    api_key: USDA_KEY,
  });
  const res = await fetch(`${USDA_BASE}/foods/search?${params}`);
  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit reached — wait a minute, then try again.');
    throw new Error(`Search failed (${res.status}). Check your connection.`);
  }
  const data = await res.json();
  return (data.foods || []).map(f => ({
    fdcId:           f.fdcId,
    description:     f.description,
    brandOwner:      f.brandOwner || f.brandName || '',
    dataType:        f.dataType || '',
    servingSize:     f.servingSize   || null,
    servingSizeUnit: f.servingSizeUnit || 'g',
    nutrients:       extractNutrients(f.foodNutrients),
  }));
}

function scaleNutrients(base, grams) {
  const f = grams / 100;
  return {
    calories: Math.round(base.calories * f),
    protein:  Math.round(base.protein  * f * 10) / 10,
    fat:      Math.round(base.fat      * f * 10) / 10,
    carbs:    Math.round(base.carbs    * f * 10) / 10,
    fiber:    Math.round(base.fiber    * f * 10) / 10,
  };
}
