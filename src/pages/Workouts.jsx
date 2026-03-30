import { useState } from 'react'
import {
  getWorkouts, addWorkout, deleteWorkout,
  getTodayString, generateId, formatDateLong,
} from '../utils/storage'
import './Workouts.css'

const CATEGORIES = [
  { value: 'strength',   label: 'Strength' },
  { value: 'cardio',     label: 'Cardio' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'flexibility',label: 'Flexibility' },
  { value: 'sport',      label: 'Sport' },
]

const COMMON_EXERCISES = {
  strength:   ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up', 'Lat Pulldown', 'Dumbbell Curl', 'Tricep Pushdown', 'Leg Press', 'Romanian Deadlift', 'Incline Bench Press', 'Cable Row', 'Face Pull'],
  cardio:     ['Running', 'Cycling', 'Rowing', 'Jump Rope', 'Elliptical', 'Swimming', 'Stair Climber', 'HIIT'],
  bodyweight: ['Push-up', 'Pull-up', 'Dip', 'Bodyweight Squat', 'Lunge', 'Plank', 'Burpee', 'Mountain Climber', 'Sit-up', 'Glute Bridge'],
  flexibility:['Yoga', 'Static Stretch', 'Foam Rolling', 'Mobility Drill'],
  sport:      ['Basketball', 'Soccer', 'Tennis', 'Swimming', 'Boxing', 'Martial Arts'],
}

function blankSet(n) {
  return { id: generateId(), setNumber: n, reps: '', weightKg: '', distanceKm: '', durationMin: '' }
}

function blankExercise() {
  return { id: generateId(), name: '', category: 'strength', sets: [blankSet(1)] }
}

function ExerciseBlock({ exercise, onChange, onRemove }) {
  const isSug = COMMON_EXERCISES[exercise.category] || []

  function updateField(field, value) {
    onChange({ ...exercise, [field]: value })
  }

  function updateCategory(cat) {
    onChange({ ...exercise, category: cat })
  }

  function addSet() {
    onChange({ ...exercise, sets: [...exercise.sets, blankSet(exercise.sets.length + 1)] })
  }

  function updateSet(setId, field, value) {
    onChange({
      ...exercise,
      sets: exercise.sets.map(s => s.id === setId ? { ...s, [field]: value } : s),
    })
  }

  function removeSet(setId) {
    const filtered = exercise.sets.filter(s => s.id !== setId)
    onChange({ ...exercise, sets: filtered.map((s, i) => ({ ...s, setNumber: i + 1 })) })
  }

  const isStrength    = exercise.category === 'strength' || exercise.category === 'bodyweight'
  const isCardio      = exercise.category === 'cardio'
  const showWeight    = exercise.category === 'strength'

  return (
    <div className="exercise-block">
      <div className="exercise-block-header">
        <div className="exercise-header-inputs">
          <div className="form-group mb-0 flex-1">
            <input
              className="form-input"
              list={`ex-list-${exercise.id}`}
              placeholder="Exercise name"
              value={exercise.name}
              onChange={e => updateField('name', e.target.value)}
            />
            <datalist id={`ex-list-${exercise.id}`}>
              {isSug.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <select
            className="form-select exercise-cat-select"
            value={exercise.category}
            onChange={e => updateCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button className="btn btn-danger btn-sm btn-icon" onClick={onRemove} title="Remove exercise">✕</button>
      </div>

      {/* Sets table */}
      <div className="sets-table-wrap">
        <table className="sets-table">
          <thead>
            <tr>
              <th>Set</th>
              {isStrength  && <th>Reps</th>}
              {showWeight  && <th>Weight (kg)</th>}
              {isCardio    && <th>Distance (km)</th>}
              {isCardio    && <th>Duration (min)</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map(set => (
              <tr key={set.id}>
                <td className="set-num">{set.setNumber}</td>
                {isStrength && (
                  <td>
                    <input
                      className="form-input input-sm set-input"
                      type="number"
                      placeholder="—"
                      value={set.reps}
                      onChange={e => updateSet(set.id, 'reps', e.target.value)}
                    />
                  </td>
                )}
                {showWeight && (
                  <td>
                    <input
                      className="form-input input-sm set-input"
                      type="number"
                      placeholder="—"
                      value={set.weightKg}
                      onChange={e => updateSet(set.id, 'weightKg', e.target.value)}
                    />
                  </td>
                )}
                {isCardio && (
                  <td>
                    <input
                      className="form-input input-sm set-input"
                      type="number"
                      placeholder="—"
                      value={set.distanceKm}
                      onChange={e => updateSet(set.id, 'distanceKm', e.target.value)}
                    />
                  </td>
                )}
                {isCardio && (
                  <td>
                    <input
                      className="form-input input-sm set-input"
                      type="number"
                      placeholder="—"
                      value={set.durationMin}
                      onChange={e => updateSet(set.id, 'durationMin', e.target.value)}
                    />
                  </td>
                )}
                <td>
                  {exercise.sets.length > 1 && (
                    <button
                      className="btn btn-ghost btn-icon btn-xs"
                      onClick={() => removeSet(set.id)}
                      title="Remove set"
                    >×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost btn-sm mt-8 add-set-btn" onClick={addSet}>
          + Add Set
        </button>
      </div>
    </div>
  )
}

function WorkoutCard({ workout, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0)

  function formatSet(set, category) {
    const parts = []
    if (set.reps)       parts.push(`${set.reps} reps`)
    if (set.weightKg)   parts.push(`${set.weightKg} kg`)
    if (set.distanceKm) parts.push(`${set.distanceKm} km`)
    if (set.durationMin)parts.push(`${set.durationMin} min`)
    return parts.join(' × ') || '—'
  }

  return (
    <div className="workout-card card">
      <div className="workout-card-header">
        <div className="workout-card-info">
          <div className="workout-card-name">{workout.name}</div>
          <div className="workout-card-date text-muted font-sm">{formatDateLong(workout.date)}</div>
        </div>
        <div className="workout-card-actions">
          <div className="flex-center gap-6 flex-wrap">
            {workout.durationMinutes && (
              <span className="badge badge-purple">{workout.durationMinutes} min</span>
            )}
            <span className="badge badge-blue">{workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}</span>
            <span className="badge badge-green">{totalSets} sets</span>
          </div>
          <div className="flex-center gap-6 mt-8">
            <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(e => !e)}>
              {expanded ? '▲ Hide' : '▼ Details'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(workout.id)}>Delete</button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="workout-card-details">
          {workout.notes && <p className="workout-notes">{workout.notes}</p>}
          {workout.exercises.map(ex => {
            const isStrength    = ex.category === 'strength' || ex.category === 'bodyweight'
            const showWeight    = ex.category === 'strength'
            const isCardio      = ex.category === 'cardio'
            return (
              <div key={ex.id} className="workout-detail-exercise">
                <div className="workout-detail-ex-name">
                  {ex.name || 'Unnamed Exercise'}
                  <span className={`badge badge-${ex.category === 'cardio' ? 'blue' : ex.category === 'bodyweight' ? 'green' : 'purple'} ml-8`}>
                    {CATEGORIES.find(c => c.value === ex.category)?.label || ex.category}
                  </span>
                </div>
                <table className="detail-sets-table">
                  <thead>
                    <tr>
                      <th>Set</th>
                      {isStrength  && <th>Reps</th>}
                      {showWeight  && <th>Weight</th>}
                      {isCardio    && <th>Distance</th>}
                      {isCardio    && <th>Duration</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map(set => (
                      <tr key={set.id}>
                        <td>{set.setNumber}</td>
                        {isStrength  && <td>{set.reps || '—'}</td>}
                        {showWeight  && <td>{set.weightKg ? `${set.weightKg} kg` : '—'}</td>}
                        {isCardio    && <td>{set.distanceKm ? `${set.distanceKm} km` : '—'}</td>}
                        {isCardio    && <td>{set.durationMin ? `${set.durationMin} min` : '—'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WorkoutFormModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    date: getTodayString(),
    durationMinutes: '',
    notes: '',
    exercises: [],
  })
  const [error, setError] = useState('')

  function updateForm(field, value) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function addExercise() {
    setForm(p => ({ ...p, exercises: [...p.exercises, blankExercise()] }))
  }

  function updateExercise(id, updated) {
    setForm(p => ({ ...p, exercises: p.exercises.map(e => e.id === id ? updated : e) }))
  }

  function removeExercise(id) {
    setForm(p => ({ ...p, exercises: p.exercises.filter(e => e.id !== id) }))
  }

  function handleSave() {
    if (!form.name.trim()) { setError('Please enter a workout name.'); return }
    if (!form.exercises.length) { setError('Add at least one exercise.'); return }
    setError('')
    onSave({
      id:              generateId(),
      ...form,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      createdAt:       new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide workout-modal">
        <div className="modal-header">
          <h2>Log Workout</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error mb-12">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Workout Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Push Day, Morning Run, Leg Day"
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => updateForm('date', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input
                className="form-input"
                type="number"
                placeholder="Optional"
                value={form.durationMinutes}
                onChange={e => updateForm('durationMinutes', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                className="form-input"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={e => updateForm('notes', e.target.value)}
              />
            </div>
          </div>

          <div className="divider" />

          <div className="exercises-section">
            <div className="flex-between mb-12">
              <h3>Exercises</h3>
              <button className="btn btn-primary btn-sm" onClick={addExercise}>+ Add Exercise</button>
            </div>

            {form.exercises.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-icon">🏋️</div>
                <p>Click "Add Exercise" to build your workout</p>
              </div>
            ) : (
              form.exercises.map(ex => (
                <ExerciseBlock
                  key={ex.id}
                  exercise={ex}
                  onChange={updated => updateExercise(ex.id, updated)}
                  onRemove={() => removeExercise(ex.id)}
                />
              ))
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Workout</button>
        </div>
      </div>
    </div>
  )
}

export default function Workouts() {
  const [workouts, setWorkouts]   = useState(getWorkouts())
  const [showForm, setShowForm]   = useState(false)
  const [filterDate, setFilterDate] = useState('')

  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt?.localeCompare(a.createdAt || ''))
  const displayed = filterDate ? sorted.filter(w => w.date === filterDate) : sorted

  // Stats
  const totalWorkouts   = workouts.length
  const totalSets       = workouts.reduce((s, w) => s + w.exercises.reduce((ss, e) => ss + e.sets.length, 0), 0)
  const weekStart       = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekKey         = weekStart.toISOString().split('T')[0]
  const thisWeekCount   = workouts.filter(w => w.date >= weekKey).length
  const lastWorkout     = sorted[0]

  function handleSave(workout) {
    addWorkout(workout)
    setWorkouts(getWorkouts())
  }

  function handleDelete(id) {
    if (!confirm('Delete this workout?')) return
    deleteWorkout(id)
    setWorkouts(getWorkouts())
  }

  return (
    <div className="page workouts-page">
      {/* ── Header ── */}
      <div className="page-header flex-between">
        <div>
          <h1>Workouts</h1>
          <p>Log exercises, track sets, reps, and weights</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Log Workout
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid-3 mb-20">
        <div className="stat-card">
          <div className="stat-label">Total Workouts</div>
          <div className="stat-value text-accent">{totalWorkouts}</div>
          <div className="stat-sub">{totalSets} total sets logged</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{thisWeekCount}</div>
          <div className="stat-sub">{thisWeekCount > 0 ? 'Keep it up!' : 'Start your week strong!'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Workout</div>
          {lastWorkout ? (
            <>
              <div className="stat-value" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px' }}>{lastWorkout.name}</div>
              <div className="stat-sub">{lastWorkout.date}</div>
            </>
          ) : (
            <div className="stat-sub mt-8">No workouts yet.</div>
          )}
        </div>
      </div>

      {/* ── History ── */}
      <div className="card">
        <div className="card-header">
          <h3>Workout History</h3>
          <div className="flex-center gap-8">
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              title="Filter by date"
            />
            {filterDate && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate('')}>Clear</button>
            )}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏋️</div>
            <p>{filterDate ? 'No workouts on this date.' : 'No workouts logged yet.'}</p>
            <button className="btn btn-primary btn-sm mt-12" onClick={() => setShowForm(true)}>Log Your First Workout</button>
          </div>
        ) : (
          <div className="workout-list">
            {displayed.map(w => (
              <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <WorkoutFormModal onSave={handleSave} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
