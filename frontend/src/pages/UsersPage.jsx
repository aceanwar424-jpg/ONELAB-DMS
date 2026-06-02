import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Users, Shield } from 'lucide-react'

const ROLES = ['admin', 'approver', 'editor', 'viewer']
const ROLE_DESC = {
  admin: 'Akses penuh ke semua fitur',
  approver: 'Dapat approve dan publish dokumen',
  editor: 'Dapat membuat dan mengedit draft',
  viewer: 'Hanya bisa melihat dokumen published'
}

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Gagal memuat users'))
      .finally(() => setLoading(false))
  }, [])

  const updateRole = async (userId, role) => {
    try {
      const r = await api.put(`/users/${userId}/role`, { role })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: r.data.role } : u))
      toast.success('Role berhasil diupdate')
    } catch (e) { toast.error('Gagal update role') }
  }

  const roleColors = { admin: 'bg-red-100 text-red-700', approver: 'bg-purple-100 text-purple-700', editor: 'bg-blue-100 text-blue-700', viewer: 'bg-slate-100 text-slate-600' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
          <Users size={16} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Manajemen User</h1>
          <p className="text-sm text-slate-500">{users.length} pengguna terdaftar</p>
        </div>
      </div>

      {/* Role reference */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {ROLES.map(role => (
          <div key={role} className="card p-3">
            <span className={`badge ${roleColors[role]} mb-2`}>{role}</span>
            <p className="text-xs text-slate-500 leading-relaxed">{ROLE_DESC[role]}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pengguna</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={3} className="py-8 text-center text-slate-400">Memuat...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {u.avatar
                      ? <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                      : <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">{u.name?.[0]}</div>
                    }
                    <div>
                      <div className="font-medium text-slate-900">{u.name}</div>
                      {u.id === me?.id && <span className="text-xs text-slate-400">(kamu)</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  {u.id === me?.id ? (
                    <span className={`badge ${roleColors[u.role]}`}>{u.role}</span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className="input text-xs py-1 w-32"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
