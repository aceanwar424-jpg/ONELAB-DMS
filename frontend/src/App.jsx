import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import SOPDetailPage from './pages/SOPDetailPage'
import SOPFormPage from './pages/SOPFormPage'
import UsersPage from './pages/UsersPage'
import ImportPage from './pages/ImportPage'

const mockUser = { id: 1, name: 'Admin', email: 'admin@onelab.com', role: 'admin', avatar: null }

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Layout user={mockUser} />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sop/:id" element={<SOPDetailPage />} />
          <Route path="sop/new" element={<SOPFormPage />} />
          <Route path="sop/:id/edit" element={<SOPFormPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Routes>
    </>
  )
}
