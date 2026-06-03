import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SOPDetailPage from './pages/SOPDetailPage'
import SOPFormPage from './pages/SOPFormPage'
import UsersPage from './pages/UsersPage'
import ImportPage from './pages/ImportPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>
  if (!user) return children
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sop/:id" element={<SOPDetailPage />} />
          <Route path="sop/new" element={<ProtectedRoute roles={['admin','editor']}><SOPFormPage /></ProtectedRoute>} />
          <Route path="sop/:id/edit" element={<ProtectedRoute roles={['admin','editor']}><SOPFormPage /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
          <Route path="import" element={<ProtectedRoute roles={['admin']}><ImportPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
