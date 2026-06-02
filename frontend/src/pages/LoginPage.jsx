import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FileText } from 'lucide-react'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

  useEffect(() => { if (user) navigate('/dashboard') }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <FileText size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">OneLab SOP Wiki</h1>
          <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Dokumen SOP</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <p className="text-slate-300 text-sm text-center mb-6">
            Masuk dengan akun Google kamu untuk mengakses dokumen SOP
          </p>
          <a href={`${API_URL}/auth/google`}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white text-slate-800 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
            </svg>
            Masuk dengan Google
          </a>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          OneLab © {new Date().getFullYear()} · Akses terbatas untuk tim internal
        </p>
      </div>
    </div>
  )
}
