import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FileText, LayoutDashboard, Users, Upload, LogOut, ChevronRight } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()

  const nav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ...(user?.role === 'admin' ? [
      { to: '/users', icon: Users, label: 'Manajemen User' },
      { to: '/import', icon: Upload, label: 'Import SOP' },
    ] : []),
  ]

  const roleColors = { admin: 'bg-red-100 text-red-700', approver: 'bg-purple-100 text-purple-700', editor: 'bg-blue-100 text-blue-700', viewer: 'bg-slate-100 text-slate-600' }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 text-white flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">OneLab</div>
              <div className="text-xs text-slate-400">SOP Wiki</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            {user?.avatar
              ? <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
              : <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold">{user?.name?.[0]}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColors[user?.role]}`}>{user?.role}</span>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-white transition-colors"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
