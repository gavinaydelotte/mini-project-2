// ── localStorage helpers ──────────────────────────────────────────────────────

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function safeSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${m}/${d}/${y}`;
}

function fmtDateLong(str) {
  if (!str) return '';
  return new Date(str + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}

// ── Meals ─────────────────────────────────────────────────────────────────────
function getMeals()        { return safeGet('ft_meals', []); }
function addMeal(meal)     { safeSet('ft_meals', [...getMeals(), meal]); }
function deleteMeal(id)    { safeSet('ft_meals', getMeals().filter(m => m.id !== id)); }

// ── Workouts ──────────────────────────────────────────────────────────────────
function getWorkouts()     { return safeGet('ft_workouts', []); }
function addWorkout(w)     { safeSet('ft_workouts', [...getWorkouts(), w]); }
function deleteWorkout(id) { safeSet('ft_workouts', getWorkouts().filter(w => w.id !== id)); }

// ── Weight ────────────────────────────────────────────────────────────────────
function getWeights()      { return safeGet('ft_weight', []); }
function addWeight(e)      { safeSet('ft_weight', [...getWeights(), e]); }
function deleteWeight(id)  { safeSet('ft_weight', getWeights().filter(e => e.id !== id)); }

// ── Profile ───────────────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  name: '', age: '', heightCm: '',
  calorieGoal: 2000, proteinGoal: 150, carbsGoal: 200, fatGoal: 65
};
function getProfile()      { return safeGet('ft_profile', DEFAULT_PROFILE); }
function saveProfile(p)    { safeSet('ft_profile', p); }
