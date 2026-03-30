import { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine,
} from 'recharts'
import {
  getWeightEntries, addWeightEntry, deleteWeightEntry,
  getMeals, getWorkouts, getProfile,
  getTodayString, generateId, formatDate,
} from '../utils/storage'
import './Progress.css'

// ─── Custom Recharts Tooltips ─────────────────────────────────────────────────

function WeightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value" style={{ color: 'var(--green)' }}>{payload[0].value} kg</div>
    </div>
  )
}

function CalTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value" style={{ color: 'var(--accent)' }}>{payload[0].value} kcal</div>
    </div>
  )
}

function getBmiInfo(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--orange)', badge: 'badge-orange' }
  if (bmi < 25)   return { label: 'Normal weight', color: 'var(--green)',  badge: 'badge-green' }
  if (bmi < 30)   return { label: 'Overweight',    color: 'var(--orange)', badge: 'badge-orange' }
  return           { label: 'Obese',             color: 'var(--red)',    badge: 'badge-red' }
}

export default function Progress() {
  const [weightEntries, setWeightEntries] = useState(() =>
    getWeightEntries().sort((a, b) => a.date.localeCompare(b.date))
  )
  const profile  = getProfile()
  const allMeals = getMeals()

  const [form, setForm]         = useState({ date: getTodayString(), weightKg: '', notes: '' })
  const [chartRange, setChartRange] = useState(30)
  const [bmiHeight, setBmiHeight]   = useState(profile.heightCm || '')
  const [bmiWeight, setBmiWeight]   = useState('')

  // ── Weight chart data ──────────────────────────────────────────────────────

  const sortedEntries = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const chartEntries  = sortedEntries.slice(-chartRange)
  const weightData    = chartEntries.map(e => ({
    date:   e.date.slice(5),   // MM-DD
    weight: e.weightKg,
  }))

  // Min/max for Y axis domain padding
  const weights  = weightData.map(d => d.weight)
  const yMin     = weights.length ? Math.floor(Math.min(...weights) - 1) : 50
  const yMax     = weights.length ? Math.ceil(Math.max(...weights)  + 1) : 100

  // ── Calorie trend (last 14 days) ──────────────────────────────────────────

  const calData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr  = d.toISOString().split('T')[0]
    const dayMeals = allMeals.filter(m => m.date === dateStr)
    const calories = Math.round(dayMeals.reduce((s, m) => s + (m.nutrients.calories || 0), 0))
    return { date: dateStr.slice(5), calories }
  })

  // ── Workout frequency (last 30 days) ──────────────────────────────────────

  const allWorkouts = getWorkouts()
  const workoutData = Array.from({ length: 10 }, (_, i) => {
    const weekEnd   = new Date()
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    const startStr  = weekStart.toISOString().split('T')[0]
    const endStr    = weekEnd.toISOString().split('T')[0]
    const count     = allWorkouts.filter(w => w.date >= startStr && w.date <= endStr).length
    return { week: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count }
  }).reverse()

  // ── Stats ─────────────────────────────────────────────────────────────────

  const latest   = sortedEntries[sortedEntries.length - 1]
  const prev30   = sortedEntries.find(e => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return e.date >= cutoff.toISOString().split('T')[0]
  })
  const weightChange = latest && prev30 && latest.id !== prev30.id
    ? (latest.weightKg - prev30.weightKg).toFixed(1)
    : null

  const heightM  = bmiHeight ? Number(bmiHeight) / 100 : null
  const bmiVal   = bmiWeight && heightM
    ? Math.round((Number(bmiWeight) / (heightM * heightM)) * 10) / 10
    : null
  const bmiInfo  = getBmiInfo(bmiVal)

  const avgCal7  = (() => {
    const last7 = calData.slice(-7).filter(d => d.calories > 0)
    return last7.length ? Math.round(last7.reduce((s, d) => s + d.calories, 0) / last7.length) : null
  })()

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAdd() {
    if (!form.weightKg) return
    const entry = {
      id:         generateId(),
      date:       form.date,
      weightKg:   parseFloat(form.weightKg),
      notes:      form.notes,
      recordedAt: new Date().toISOString(),
    }
    addWeightEntry(entry)
    const updated = getWeightEntries().sort((a, b) => a.date.localeCompare(b.date))
    setWeightEntries(updated)
    if (!bmiWeight) setBmiWeight(form.weightKg)
    setForm({ date: getTodayString(), weightKg: '', notes: '' })
  }

  function handleDelete(id) {
    if (!confirm('Delete this weight entry?')) return
    deleteWeightEntry(id)
    setWeightEntries(getWeightEntries().sort((a, b) => a.date.localeCompare(b.date)))
  }

  return (
    <div className="page progress-page">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>Progress</h1>
        <p>Track your weight, body metrics, and nutrition trends over time</p>
      </div>

      {/* ── Log weight ── */}
      <div className="card mb-20">
        <h3 className="mb-16">Log Weight</h3>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              placeholder="e.g. 74.5"
              value={form.weightKg}
              onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input
              className="form-input"
              placeholder="e.g. morning weigh-in"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex-end">
          <button className="btn btn-green" onClick={handleAdd} disabled={!form.weightKg}>
            Add Entry
          </button>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid-3 mb-20">
        <div className="stat-card">
          <div className="stat-label">Current Weight</div>
          {latest ? (
            <>
              <div className="stat-value" style={{ color: 'var(--green)' }}>
                {latest.weightKg}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}> kg</span>
              </div>
              <div className="stat-sub">as of {latest.date}</div>
            </>
          ) : (
            <div className="stat-sub mt-8">No entries yet</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">30-Day Change</div>
          {weightChange !== null ? (
            <>
              <div
                className="stat-value"
                style={{ color: parseFloat(weightChange) < 0 ? 'var(--green)' : parseFloat(weightChange) > 0 ? 'var(--red)' : 'var(--text)' }}
              >
                {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}> kg</span>
              </div>
              <div className="stat-sub">compared to 30 days ago</div>
            </>
          ) : (
            <div className="stat-sub mt-8">Not enough data</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg. Daily Calories (7d)</div>
          {avgCal7 ? (
            <>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>
                {avgCal7.toLocaleString()}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}> kcal</span>
              </div>
              <div className="stat-sub">7-day average</div>
            </>
          ) : (
            <div className="stat-sub mt-8">No meal data</div>
          )}
        </div>
      </div>

      {/* ── Weight chart ── */}
      <div className="card mb-20">
        <div className="card-header">
          <h3>Weight Progress</h3>
          <div className="chart-range-btns">
            {[14, 30, 90].map(r => (
              <button
                key={r}
                className={`btn btn-xs ${chartRange === r ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartRange(r)}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {weightData.length < 2 ? (
          <div className="empty-state">
            <div className="empty-icon">📉</div>
            <p>Log at least 2 weight entries to see your progress chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weightData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit=" kg"
              />
              <Tooltip content={<WeightTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--green)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--green)', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: 'var(--green)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Calorie trend ── */}
      <div className="card mb-20">
        <div className="card-header">
          <h3>Calorie Intake — Last 14 Days</h3>
          {profile.calorieGoal && (
            <span className="badge badge-purple">Goal: {profile.calorieGoal} kcal</span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={calData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CalTooltip />} />
            {profile.calorieGoal && (
              <ReferenceLine
                y={profile.calorieGoal}
                stroke="var(--green)"
                strokeDasharray="5 4"
                label={{ value: 'Goal', fill: 'var(--green)', fontSize: 11 }}
              />
            )}
            <Bar
              dataKey="calories"
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Workout frequency ── */}
      <div className="card mb-20">
        <h3 className="mb-16">Workout Frequency — Last 10 Weeks</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workoutData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-label">Week of {label}</div>
                    <div className="chart-tooltip-value" style={{ color: 'var(--blue)' }}>
                      {payload[0].value} workout{payload[0].value !== 1 ? 's' : ''}
                    </div>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="count" fill="var(--blue)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── BMI Calculator ── */}
      <div className="card mb-20">
        <h3 className="mb-4">BMI Calculator</h3>
        <p className="text-muted font-sm mb-16">Body Mass Index — a screening tool, not a diagnostic measure.</p>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input
              className="form-input"
              type="number"
              placeholder="e.g. 175"
              value={bmiHeight}
              onChange={e => setBmiHeight(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              placeholder={latest ? `e.g. ${latest.weightKg}` : 'e.g. 75'}
              value={bmiWeight}
              onChange={e => setBmiWeight(e.target.value)}
            />
          </div>
        </div>
        {bmiVal && bmiInfo && (
          <div className="bmi-result">
            <div className="bmi-result-val" style={{ color: bmiInfo.color }}>{bmiVal}</div>
            <div>
              <span className={`badge ${bmiInfo.badge}`} style={{ fontSize: '0.85rem', padding: '4px 14px' }}>
                {bmiInfo.label}
              </span>
              <div className="bmi-scale mt-12">
                {[
                  { range: '< 18.5', label: 'Underweight',  color: 'var(--orange)' },
                  { range: '18.5–24.9', label: 'Normal',    color: 'var(--green)' },
                  { range: '25–29.9', label: 'Overweight',  color: 'var(--orange)' },
                  { range: '≥ 30',    label: 'Obese',       color: 'var(--red)' },
                ].map(s => (
                  <div key={s.label} className="bmi-scale-item" style={{ '--s-color': s.color }}>
                    <span className="bmi-scale-range">{s.range}</span>
                    <span className="bmi-scale-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Weight history table ── */}
      <div className="card">
        <h3 className="mb-16">Weight History</h3>
        {weightEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚖️</div>
            <p>No weight entries yet. Log your first weigh-in above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Change</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...weightEntries].sort((a, b) => b.date.localeCompare(a.date)).map((entry, i, arr) => {
                  const prevEntry = arr[i + 1]
                  const delta     = prevEntry ? (entry.weightKg - prevEntry.weightKg).toFixed(1) : null
                  return (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.date)}</td>
                      <td><strong>{entry.weightKg} kg</strong></td>
                      <td>
                        {delta !== null && (
                          <span style={{ color: parseFloat(delta) < 0 ? 'var(--green)' : parseFloat(delta) > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                            {parseFloat(delta) > 0 ? '▲ +' : parseFloat(delta) < 0 ? '▼ ' : '— '}
                            {Math.abs(parseFloat(delta))} kg
                          </span>
                        )}
                      </td>
                      <td className="text-muted font-sm">{entry.notes || '—'}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => handleDelete(entry.id)}
                        >Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
