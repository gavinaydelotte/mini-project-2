import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMeals, getWorkouts, getWeightEntries,
  getProfile, saveProfile, getTodayString, formatDateLong,
} from '../utils/storage'
import './Dashboard.css'

function MacroBar({ label, value, goal, color }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div className="macro-bar-row">
      <div className="macro-bar-header">
        <span className="macro-bar-label">{label}</span>
        <span className="macro-bar-values">
          <strong>{Math.round(value)}g</strong>
          <span className="text-muted"> / {goal}g</span>
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [profile, setProfile] = useState(getProfile())
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState(getProfile())
  const [meals, setMeals] = useState(getMeals())
  const [workouts, setWorkouts] = useState(getWorkouts())
  const [weightEntries, setWeightEntries] = useState(getWeightEntries())

  const today = getTodayString()
  const todayMeals = meals.filter(m => m.date === today)
  const todayWorkouts = workouts.filter(w => w.date === today)

  const totals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.nutrients.calories || 0),
      protein:  acc.protein  + (m.nutrients.protein  || 0),
      carbs:    acc.carbs    + (m.nutrients.carbs    || 0),
      fat:      acc.fat      + (m.nutrients.fat      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const calorieGoal = profile.calorieGoal || 2000
  const caloriePct  = Math.min((totals.calories / calorieGoal) * 100, 100)
  const caloriesRemaining = calorieGoal - Math.round(totals.calories)

  const sortedWeights = [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))
  const latestWeight  = sortedWeights[0]
  const prevWeight    = sortedWeights[1]
  const weightDelta   = latestWeight && prevWeight
    ? (latestWeight.weightKg - prevWeight.weightKg).toFixed(1)
    : null

  // Workout streak
  const workoutDays = new Set(workouts.map(w => w.date))
  let streak = 0
  const checkDate = new Date()
  while (workoutDays.has(checkDate.toISOString().split('T')[0])) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // This week's workouts
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const thisWeekWorkouts = workouts.filter(w => w.date >= weekStart.toISOString().split('T')[0])

  // Meal groups today
  const mealGroups = {
    breakfast: todayMeals.filter(m => m.mealType === 'breakfast'),
    lunch:     todayMeals.filter(m => m.mealType === 'lunch'),
    dinner:    todayMeals.filter(m => m.mealType === 'dinner'),
    snacks:    todayMeals.filter(m => m.mealType === 'snacks'),
  }

  function handleProfileSave() {
    const updated = {
      ...profileForm,
      calorieGoal:  Number(profileForm.calorieGoal)  || 2000,
      proteinGoalG: Number(profileForm.proteinGoalG) || 150,
      carbsGoalG:   Number(profileForm.carbsGoalG)   || 200,
      fatGoalG:     Number(profileForm.fatGoalG)     || 65,
    }
    saveProfile(updated)
    setProfile(updated)
    setShowProfileModal(false)
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="page dashboard-page">
      {/* ── Header ── */}
      <div className="dash-greeting flex-between mb-24">
        <div>
          <h1>{greeting}{profile.name ? `, ${profile.name}` : ''}!</h1>
          <p className="text-muted">{formatDateLong(today)}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setProfileForm(profile); setShowProfileModal(true) }}>
          ⚙ Profile
        </button>
      </div>

      {/* ── Setup prompt ── */}
      {!profile.name && (
        <div className="alert alert-info mb-24">
          <strong>Welcome to FitTrack!</strong> Set up your profile to personalize your calorie and macro goals.{' '}
          <button
            className="btn btn-sm btn-primary"
            style={{ marginLeft: 8 }}
            onClick={() => { setProfileForm(profile); setShowProfileModal(true) }}
          >
            Set Up Profile
          </button>
        </div>
      )}

      {/* ── Top stats ── */}
      <div className="grid-3 mb-20">
        {/* Calories */}
        <div className="stat-card dash-cal-card">
          <div className="stat-label">Calories Today</div>
          <div className="stat-value" style={{ color: totals.calories > calorieGoal ? 'var(--red)' : 'var(--text)' }}>
            {Math.round(totals.calories).toLocaleString()}
            <span className="stat-goal-label">/{calorieGoal.toLocaleString()}</span>
          </div>
          <div className="progress-bar mt-8">
            <div
              className="progress-bar-fill"
              style={{
                width: `${caloriePct}%`,
                background: totals.calories > calorieGoal
                  ? 'var(--red)'
                  : 'linear-gradient(90deg, var(--accent), var(--green))',
              }}
            />
          </div>
          <div className="stat-sub mt-4">
            {caloriesRemaining > 0
              ? `${caloriesRemaining.toLocaleString()} kcal remaining`
              : `${Math.abs(caloriesRemaining).toLocaleString()} kcal over goal`}
          </div>
        </div>

        {/* Weight */}
        <div className="stat-card">
          <div className="stat-label">Current Weight</div>
          {latestWeight ? (
            <>
              <div className="stat-value">
                {latestWeight.weightKg}
                <span className="stat-goal-label"> kg</span>
              </div>
              {weightDelta !== null && (
                <div className={`stat-sub mt-4 ${parseFloat(weightDelta) < 0 ? 'text-green' : parseFloat(weightDelta) > 0 ? 'text-red' : ''}`}>
                  {parseFloat(weightDelta) > 0 ? '▲' : parseFloat(weightDelta) < 0 ? '▼' : '–'}
                  {' '}{Math.abs(parseFloat(weightDelta))} kg from last entry
                </div>
              )}
              <div className="stat-sub mt-2">as of {latestWeight.date}</div>
            </>
          ) : (
            <div className="stat-sub mt-8">No weight logged yet.</div>
          )}
          <Link to="/progress" className="btn btn-xs btn-ghost mt-8">Log weight →</Link>
        </div>

        {/* Workouts */}
        <div className="stat-card">
          <div className="stat-label">Workouts This Week</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{thisWeekWorkouts.length}</div>
          <div className="stat-sub mt-4">
            {streak > 0 ? `🔥 ${streak}-day streak` : 'Start your streak today!'}
          </div>
          <div className="stat-sub mt-2">{workouts.length} total workouts logged</div>
          <Link to="/workouts" className="btn btn-xs btn-ghost mt-8">Log workout →</Link>
        </div>
      </div>

      {/* ── Macros row ── */}
      <div className="card mb-20">
        <div className="card-header">
          <h3>Today's Macros</h3>
          <Link to="/nutrition" className="btn btn-sm btn-ghost">+ Add Food</Link>
        </div>
        <div className="dash-macros-grid">
          <MacroBar label="Protein" value={totals.protein} goal={profile.proteinGoalG || 150} color="var(--blue)" />
          <MacroBar label="Carbohydrates" value={totals.carbs} goal={profile.carbsGoalG || 200} color="var(--orange)" />
          <MacroBar label="Fat" value={totals.fat} goal={profile.fatGoalG || 65} color="var(--accent)" />
        </div>
        <div className="dash-macro-pills mt-12">
          {[
            { label: 'Protein', value: Math.round(totals.protein), unit: 'g', color: 'var(--blue)' },
            { label: 'Carbs',   value: Math.round(totals.carbs),   unit: 'g', color: 'var(--orange)' },
            { label: 'Fat',     value: Math.round(totals.fat),     unit: 'g', color: 'var(--accent)' },
            { label: 'Fiber',   value: Math.round(todayMeals.reduce((s, m) => s + (m.nutrients.fiber || 0), 0)), unit: 'g', color: 'var(--green)' },
          ].map(m => (
            <div key={m.label} className="macro-pill" style={{ '--pill-color': m.color }}>
              <span className="macro-pill-val">{m.value}{m.unit}</span>
              <span className="macro-pill-label">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Today's meals + workout ── */}
      <div className="grid-2 mb-20">
        {/* Meals */}
        <div className="card">
          <div className="card-header">
            <h3>Today's Meals</h3>
            <Link to="/nutrition" className="btn btn-sm btn-primary">+ Log Food</Link>
          </div>
          {todayMeals.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon">🍽</div>
              <p>No meals logged today.</p>
            </div>
          ) : (
            <div className="dash-meal-groups">
              {Object.entries(mealGroups).map(([type, items]) => {
                if (!items.length) return null
                const groupCals = items.reduce((s, m) => s + (m.nutrients.calories || 0), 0)
                return (
                  <div key={type} className="dash-meal-group">
                    <div className="dash-meal-group-header">
                      <span className="dash-meal-type">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <span className="text-muted font-sm">{Math.round(groupCals)} kcal</span>
                    </div>
                    {items.map(item => (
                      <div key={item.id} className="dash-meal-item">
                        <span className="truncate">{item.description}</span>
                        <span className="text-muted font-xs">{item.nutrients.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Today's workout */}
        <div className="card">
          <div className="card-header">
            <h3>Today's Workout</h3>
            <Link to="/workouts" className="btn btn-sm btn-primary">+ Log Workout</Link>
          </div>
          {todayWorkouts.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon">🏋️</div>
              <p>No workout logged today.</p>
            </div>
          ) : (
            <div>
              {todayWorkouts.map(w => (
                <div key={w.id} className="dash-workout-item">
                  <div className="dash-workout-name">{w.name}</div>
                  <div className="flex-center gap-8 mt-4">
                    {w.durationMinutes && (
                      <span className="badge badge-purple">{w.durationMinutes} min</span>
                    )}
                    <span className="badge badge-blue">{w.exercises.length} exercises</span>
                    <span className="badge badge-green">
                      {w.exercises.reduce((s, e) => s + e.sets.length, 0)} sets
                    </span>
                  </div>
                  {w.exercises.slice(0, 3).map(ex => (
                    <div key={ex.id} className="dash-exercise-row">
                      {ex.name} — {ex.sets.length} {ex.sets.length === 1 ? 'set' : 'sets'}
                    </div>
                  ))}
                  {w.exercises.length > 3 && (
                    <div className="text-muted font-xs mt-4">+{w.exercises.length - 3} more exercises</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────── Profile Modal ─────────────── */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowProfileModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Your Profile</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowProfileModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    className="form-input"
                    placeholder="Your name"
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 28"
                    value={profileForm.age}
                    onChange={e => setProfileForm(p => ({ ...p, age: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 175"
                  value={profileForm.heightCm}
                  onChange={e => setProfileForm(p => ({ ...p, heightCm: e.target.value }))}
                />
              </div>
              <div className="divider" />
              <h4 style={{ marginBottom: 12 }}>Daily Goals</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Calorie Goal (kcal)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={profileForm.calorieGoal}
                    onChange={e => setProfileForm(p => ({ ...p, calorieGoal: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Protein Goal (g)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={profileForm.proteinGoalG}
                    onChange={e => setProfileForm(p => ({ ...p, proteinGoalG: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Carbs Goal (g)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={profileForm.carbsGoalG}
                    onChange={e => setProfileForm(p => ({ ...p, carbsGoalG: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fat Goal (g)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={profileForm.fatGoalG}
                    onChange={e => setProfileForm(p => ({ ...p, fatGoalG: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProfileSave}>Save Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
