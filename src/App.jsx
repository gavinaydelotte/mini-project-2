import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Workouts from './pages/Workouts'
import Progress from './pages/Progress'

export default function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path="/"           element={<Dashboard />} />
        <Route path="/nutrition"  element={<Nutrition />} />
        <Route path="/workouts"   element={<Workouts />} />
        <Route path="/progress"   element={<Progress />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
