import { NavLink } from 'react-router-dom'
import './Navbar.css'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard', icon: '⊞' },
  { to: '/nutrition', label: 'Nutrition',  icon: '🥗' },
  { to: '/workouts',  label: 'Workouts',   icon: '🏋️' },
  { to: '/progress',  label: 'Progress',   icon: '📈' },
]

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">
        <span className="nav-logo-icon">💪</span>
        <span className="nav-logo-text">FitTrack</span>
      </NavLink>

      <ul className="nav-links">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
