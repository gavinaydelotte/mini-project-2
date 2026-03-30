const KEYS = {
  MEALS: 'fittrack_meals',
  WORKOUTS: 'fittrack_workouts',
  WEIGHT: 'fittrack_weight',
  PROFILE: 'fittrack_profile',
}

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y}`
}

export function formatDateLong(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Meals ────────────────────────────────────────────────────────────────────

export function getMeals() {
  return safeGet(KEYS.MEALS, [])
}

export function addMeal(meal) {
  const meals = getMeals()
  safeSet(KEYS.MEALS, [...meals, meal])
}

export function deleteMeal(id) {
  safeSet(KEYS.MEALS, getMeals().filter(m => m.id !== id))
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

export function getWorkouts() {
  return safeGet(KEYS.WORKOUTS, [])
}

export function addWorkout(workout) {
  safeSet(KEYS.WORKOUTS, [...getWorkouts(), workout])
}

export function deleteWorkout(id) {
  safeSet(KEYS.WORKOUTS, getWorkouts().filter(w => w.id !== id))
}

// ─── Weight ───────────────────────────────────────────────────────────────────

export function getWeightEntries() {
  return safeGet(KEYS.WEIGHT, [])
}

export function addWeightEntry(entry) {
  safeSet(KEYS.WEIGHT, [...getWeightEntries(), entry])
}

export function deleteWeightEntry(id) {
  safeSet(KEYS.WEIGHT, getWeightEntries().filter(e => e.id !== id))
}

// ─── Profile ──────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  name: '',
  age: '',
  heightCm: '',
  calorieGoal: 2000,
  proteinGoalG: 150,
  carbsGoalG: 200,
  fatGoalG: 65,
}

export function getProfile() {
  return safeGet(KEYS.PROFILE, DEFAULT_PROFILE)
}

export function saveProfile(profile) {
  safeSet(KEYS.PROFILE, profile)
}
