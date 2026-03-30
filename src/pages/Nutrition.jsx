import { useState, useEffect, useRef } from 'react'
import {
  getMeals, addMeal, deleteMeal,
  getProfile, getTodayString, generateId,
} from '../utils/storage'
import { searchFoods, scaleNutrients } from '../services/usdaApi'
import './Nutrition.css'

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch',     label: 'Lunch',     icon: '☀️' },
  { key: 'dinner',    label: 'Dinner',    icon: '🌙' },
  { key: 'snacks',    label: 'Snacks',    icon: '🍎' },
]

function NutritionBadge({ value, label, color }) {
  return (
    <div className="nut-badge" style={{ '--nb-color': color }}>
      <span className="nut-badge-val">{value}</span>
      <span className="nut-badge-label">{label}</span>
    </div>
  )
}

function MacroProgress({ label, value, goal, color }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div className="nut-macro-row">
      <div className="nut-macro-header">
        <span>{label}</span>
        <span className="text-muted font-xs">{Math.round(value)}g / {goal}g</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function MealSection({ type, items, onAdd, onDelete }) {
  const total = items.reduce((s, m) => ({
    calories: s.calories + (m.nutrients.calories || 0),
    protein:  s.protein  + (m.nutrients.protein  || 0),
    carbs:    s.carbs    + (m.nutrients.carbs    || 0),
    fat:      s.fat      + (m.nutrients.fat      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  return (
    <div className="meal-section card">
      <div className="meal-section-header">
        <div className="flex-center gap-8">
          <span className="meal-icon">{type.icon}</span>
          <h3>{type.label}</h3>
          {items.length > 0 && (
            <span className="badge badge-purple">{Math.round(total.calories)} kcal</span>
          )}
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => onAdd(type.key)}>
          + Add Food
        </button>
      </div>

      {items.length === 0 ? (
        <div className="meal-empty">
          <span className="text-muted font-sm">No foods logged — click "Add Food" to search the database</span>
        </div>
      ) : (
        <div>
          <div className="meal-items-header">
            <span>Food</span>
            <span>Amount</span>
            <span>Calories</span>
            <span>P</span>
            <span>C</span>
            <span>F</span>
            <span></span>
          </div>
          {items.map(item => (
            <div key={item.id} className="meal-item-row">
              <div className="meal-item-name">
                <span className="truncate">{item.description}</span>
                {item.brandOwner && <span className="meal-item-brand truncate">{item.brandOwner}</span>}
              </div>
              <span className="meal-item-amount text-muted font-sm">{item.grams != null ? `${item.grams}g` : 'custom'}</span>
              <span className="meal-item-cal font-medium">{item.nutrients.calories}</span>
              <span className="text-muted font-sm">{Math.round(item.nutrients.protein)}g</span>
              <span className="text-muted font-sm">{Math.round(item.nutrients.carbs)}g</span>
              <span className="text-muted font-sm">{Math.round(item.nutrients.fat)}g</span>
              <button
                className="btn btn-danger btn-icon btn-xs"
                onClick={() => onDelete(item.id)}
                title="Remove"
              >✕</button>
            </div>
          ))}
          <div className="meal-subtotal">
            <span className="text-muted font-xs">Subtotal</span>
            <span></span>
            <span className="font-bold">{Math.round(total.calories)}</span>
            <span className="font-sm">{Math.round(total.protein)}g</span>
            <span className="font-sm">{Math.round(total.carbs)}g</span>
            <span className="font-sm">{Math.round(total.fat)}g</span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  )
}

function FoodSearchModal({ mealType, onAdd, onClose, onManual }) {
  const [tab, setTab]               = useState('search')
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [selected, setSelected]     = useState(null)
  const [grams, setGrams]           = useState(100)
  // Manual entry
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' })
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  // Debounced search
  useEffect(() => {
    if (tab !== 'search' || !query.trim()) {
      setResults([])
      setError('')
      return
    }
    setLoading(true)
    setError('')
    const timer = setTimeout(async () => {
      try {
        const foods = await searchFoods(query)
        setResults(foods)
        if (!foods.length) setError('No foods found for that query. Try different keywords or use manual entry.')
      } catch (err) {
        setError(err.message)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 700)
    return () => { clearTimeout(timer); setLoading(false) }
  }, [query, tab])

  const preview = selected ? scaleNutrients(selected.nutrients, grams) : null

  function handleAdd() {
    if (!selected) return
    onAdd({
      id:          generateId(),
      mealType,
      description: selected.description,
      brandOwner:  selected.brandOwner,
      fdcId:       selected.fdcId,
      grams,
      nutrients:   scaleNutrients(selected.nutrients, grams),
      addedAt:     new Date().toISOString(),
    })
    // Allow adding another without closing
    setSelected(null)
    setGrams(100)
    setQuery('')
    setResults([])
  }

  function handleManualAdd() {
    if (!manual.name.trim() || !manual.calories) return
    onAdd({
      id:          generateId(),
      mealType,
      description: manual.name.trim(),
      brandOwner:  '',
      fdcId:       null,
      grams:       null,
      nutrients: {
        calories: Number(manual.calories) || 0,
        protein:  Number(manual.protein)  || 0,
        carbs:    Number(manual.carbs)    || 0,
        fat:      Number(manual.fat)      || 0,
        fiber:    Number(manual.fiber)    || 0,
      },
      addedAt: new Date().toISOString(),
    })
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' })
    onClose()
  }

  const mealLabel = MEAL_TYPES.find(t => t.key === mealType)?.label || mealType

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2>Add Food to {mealLabel}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="tabs">
            <button className={`tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>Search Database</button>
            <button className={`tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>Manual Entry</button>
          </div>

          {tab === 'search' && (
            <div>
              <div className="search-bar-wrap">
                <span className="search-icon">🔍</span>
                <input
                  ref={inputRef}
                  className="form-input search-input"
                  placeholder="Search USDA food database... (e.g. chicken breast, apple, oatmeal)"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(null) }}
                />
                {loading && <div className="spinner" />}
              </div>
              <div className="alert alert-info font-xs mb-12">
                Powered by USDA FoodData Central. Uses DEMO_KEY — limited to ~30 searches/hour.
                <a href="https://fdc.nal.usda.gov/api-guide.html" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', marginLeft: 4 }}>Get a free key</a>
              </div>

              {error && !loading && <div className="alert alert-error">{error}</div>}

              {!selected && results.length > 0 && (
                <div className="search-results">
                  <div className="search-results-label">
                    {results.length} results — click to select
                  </div>
                  {results.map(food => (
                    <button
                      key={food.fdcId}
                      className="search-result-item"
                      onClick={() => setSelected(food)}
                    >
                      <div className="search-result-name">{food.description}</div>
                      <div className="search-result-meta">
                        {food.brandOwner && <span className="text-muted">{food.brandOwner} · </span>}
                        <span className="badge badge-purple">{food.nutrients.calories} kcal</span>
                        <span className="badge badge-blue">P: {food.nutrients.protein}g</span>
                        <span className="badge badge-orange">C: {food.nutrients.carbs}g</span>
                        <span className="text-muted font-xs">per 100g</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="food-add-panel">
                  <div className="food-add-header">
                    <div>
                      <div className="food-add-name">{selected.description}</div>
                      {selected.brandOwner && <div className="text-muted font-sm">{selected.brandOwner}</div>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>← Back</button>
                  </div>

                  <div className="food-base-macros">
                    <span className="text-muted font-xs">Per 100g:</span>
                    {[
                      { label: 'Calories', value: selected.nutrients.calories, unit: 'kcal' },
                      { label: 'Protein',  value: selected.nutrients.protein,  unit: 'g' },
                      { label: 'Carbs',    value: selected.nutrients.carbs,    unit: 'g' },
                      { label: 'Fat',      value: selected.nutrients.fat,      unit: 'g' },
                    ].map(n => (
                      <span key={n.label} className="food-base-macro">
                        <strong>{n.value}</strong> {n.unit} {n.label}
                      </span>
                    ))}
                    {selected.servingSize && (
                      <span className="badge badge-blue">Serving: {selected.servingSize}{selected.servingSizeUnit}</span>
                    )}
                  </div>

                  <div className="form-group mt-12">
                    <label className="form-label">Amount (grams)</label>
                    <div className="amount-row">
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        value={grams}
                        onChange={e => setGrams(Math.max(1, Number(e.target.value) || 1))}
                      />
                      {selected.servingSize && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setGrams(Math.round(selected.servingSize))}
                        >
                          Use serving ({Math.round(selected.servingSize)}{selected.servingSizeUnit})
                        </button>
                      )}
                    </div>
                  </div>

                  {preview && (
                    <div className="food-preview">
                      <span className="text-muted font-xs">For {grams}g:</span>
                      <div className="food-preview-grid">
                        <div className="food-preview-item">
                          <div className="food-preview-val" style={{ color: 'var(--accent)' }}>{preview.calories}</div>
                          <div className="food-preview-label">kcal</div>
                        </div>
                        <div className="food-preview-item">
                          <div className="food-preview-val" style={{ color: 'var(--blue)' }}>{preview.protein}g</div>
                          <div className="food-preview-label">Protein</div>
                        </div>
                        <div className="food-preview-item">
                          <div className="food-preview-val" style={{ color: 'var(--orange)' }}>{preview.carbs}g</div>
                          <div className="food-preview-label">Carbs</div>
                        </div>
                        <div className="food-preview-item">
                          <div className="food-preview-val" style={{ color: 'var(--accent)' }}>{preview.fat}g</div>
                          <div className="food-preview-label">Fat</div>
                        </div>
                        {preview.fiber > 0 && (
                          <div className="food-preview-item">
                            <div className="food-preview-val" style={{ color: 'var(--green)' }}>{preview.fiber}g</div>
                            <div className="food-preview-label">Fiber</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-16 flex-end">
                    <button className="btn btn-primary" onClick={handleAdd} disabled={!preview}>
                      Add to {mealLabel}
                    </button>
                  </div>
                </div>
              )}

              {!loading && !error && !query && (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <p>Type a food name to search the USDA food database</p>
                  <p className="font-xs mt-4">Contains 400,000+ foods with complete nutritional data</p>
                </div>
              )}
            </div>
          )}

          {tab === 'manual' && (
            <div>
              <div className="form-group">
                <label className="form-label">Food Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Homemade chicken soup"
                  value={manual.name}
                  onChange={e => setManual(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Calories (kcal) *</label>
                  <input className="form-input" type="number" placeholder="0" value={manual.calories}
                    onChange={e => setManual(p => ({ ...p, calories: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Protein (g)</label>
                  <input className="form-input" type="number" placeholder="0" value={manual.protein}
                    onChange={e => setManual(p => ({ ...p, protein: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Carbohydrates (g)</label>
                  <input className="form-input" type="number" placeholder="0" value={manual.carbs}
                    onChange={e => setManual(p => ({ ...p, carbs: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fat (g)</label>
                  <input className="form-input" type="number" placeholder="0" value={manual.fat}
                    onChange={e => setManual(p => ({ ...p, fat: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fiber (g)</label>
                <input className="form-input" type="number" placeholder="0" value={manual.fiber}
                  onChange={e => setManual(p => ({ ...p, fiber: e.target.value }))} />
              </div>
              <div className="flex-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleManualAdd}
                  disabled={!manual.name.trim() || !manual.calories}
                >
                  Add to {mealLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [date, setDate]     = useState(getTodayString())
  const [meals, setMeals]   = useState(getMeals())
  const [modal, setModal]   = useState(null)   // null | mealType key
  const profile             = getProfile()

  const dateMeals  = meals.filter(m => m.date === date)
  const mealGroups = Object.fromEntries(
    MEAL_TYPES.map(t => [t.key, dateMeals.filter(m => m.mealType === t.key)])
  )

  const totals = dateMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.nutrients.calories || 0),
      protein:  acc.protein  + (m.nutrients.protein  || 0),
      carbs:    acc.carbs    + (m.nutrients.carbs    || 0),
      fat:      acc.fat      + (m.nutrients.fat      || 0),
      fiber:    acc.fiber    + (m.nutrients.fiber    || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  )

  const calorieGoal = profile.calorieGoal || 2000
  const calPct      = Math.min((totals.calories / calorieGoal) * 100, 100)
  const isToday     = date === getTodayString()

  function handleAdd(entry) {
    addMeal({ ...entry, date })
    setMeals(getMeals())
  }

  function handleDelete(id) {
    deleteMeal(id)
    setMeals(getMeals())
  }

  return (
    <div className="page nutrition-page">
      {/* ── Header ── */}
      <div className="page-header flex-between">
        <div>
          <h1>Nutrition</h1>
          <p>Track your daily food intake and macros</p>
        </div>
        <div className="flex-center gap-8">
          <label className="form-label mb-0" htmlFor="nut-date">Date:</label>
          <input
            id="nut-date"
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* ── Daily Summary ── */}
      <div className="card nut-summary mb-20">
        <div className="nut-summary-top flex-between mb-12">
          <h3>{isToday ? "Today's Summary" : `Summary for ${date}`}</h3>
          <span
            className={`badge ${totals.calories > calorieGoal ? 'badge-red' : totals.calories > calorieGoal * 0.9 ? 'badge-orange' : 'badge-green'}`}
          >
            {Math.round(totals.calories)} / {calorieGoal} kcal
          </span>
        </div>

        <div className="progress-bar mb-4">
          <div
            className="progress-bar-fill"
            style={{
              width: `${calPct}%`,
              background: totals.calories > calorieGoal
                ? 'var(--red)'
                : 'linear-gradient(90deg, var(--accent), var(--green))',
              height: 12,
            }}
          />
        </div>
        <div className="text-muted font-xs mb-16">
          {totals.calories > calorieGoal
            ? `${Math.round(totals.calories - calorieGoal)} kcal over goal`
            : `${Math.round(calorieGoal - totals.calories)} kcal remaining`}
        </div>

        <div className="nut-summary-macros">
          <NutritionBadge value={Math.round(totals.calories)} label="kcal" color="var(--accent)" />
          <NutritionBadge value={`${Math.round(totals.protein)}g`} label="Protein" color="var(--blue)" />
          <NutritionBadge value={`${Math.round(totals.carbs)}g`}   label="Carbs"   color="var(--orange)" />
          <NutritionBadge value={`${Math.round(totals.fat)}g`}     label="Fat"     color="var(--accent)" />
          <NutritionBadge value={`${Math.round(totals.fiber)}g`}   label="Fiber"   color="var(--green)" />
        </div>

        <div className="nut-macro-bars mt-16">
          <MacroProgress label="Protein"       value={totals.protein} goal={profile.proteinGoalG || 150} color="var(--blue)" />
          <MacroProgress label="Carbohydrates" value={totals.carbs}   goal={profile.carbsGoalG || 200}   color="var(--orange)" />
          <MacroProgress label="Fat"           value={totals.fat}     goal={profile.fatGoalG || 65}       color="var(--accent)" />
        </div>
      </div>

      {/* ── Meal sections ── */}
      {MEAL_TYPES.map(type => (
        <MealSection
          key={type.key}
          type={type}
          items={mealGroups[type.key]}
          onAdd={setModal}
          onDelete={handleDelete}
        />
      ))}

      {/* ── Modal ── */}
      {modal && (
        <FoodSearchModal
          mealType={modal}
          onAdd={handleAdd}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
