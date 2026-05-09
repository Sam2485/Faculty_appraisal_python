import { Routes, Route, Navigate } from 'react-router-dom'
import { api } from './api/client'

// ---------------------------------------------------------------------------
// Add your page imports here as you build them, e.g.:
//   import Login from './pages/Login'
//   import Dashboard from './pages/Dashboard'
// ---------------------------------------------------------------------------

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('admin_token')
  const profile = api.getProfile()
  if (!token || profile?.appraisal_role !== 'admin') {
    return <Navigate to="/login" replace />
  }
  return children
}

// Temporary placeholder — replace with real pages as they are built
function Placeholder({ name }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>{name}</h2>
      <p style={{ color: '#64748b' }}>Page not yet implemented.</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Placeholder name="Login" />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Placeholder name="Dashboard" />
          </ProtectedRoute>
        }
      />

      {/* Add nested routes here as pages are built */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
