import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import { Search, Plus, Filter, FileText, ExternalLink, ChevronRight, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

const STATUS_ORDER = ['draft', 'review', 'approved', 'published']

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sops, setSops] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [departments, setDepartments] = useState([])
  const [page, setPage] = useState(1)

  const canCreate = ['admin', 'editor'].includes(user?.role)

  const fetchSOPs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 25 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (deptFilter) params.departemen = deptFilter
      const r = await api.get('/sop', { params })
      setSops(r.data.data)
      setTotal(r.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, statusFilter, deptFilter, page])

  useEffect(() => { fetchSOPs() }, [fetchSOPs])
  useEffect(() => {
    api.get('/sop/meta/departments').then(r => setDepartments(r.data))
  }, [])

  // Stats
  const stats = STATUS_ORDER.map(s => ({
    status: s,
    count: sops.filter(d => d.status === s).length
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">SOP Wiki</h1>
          <p className="text-sm text-slate-500 mt-0.5">Total {total} dokumen</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <Link to="/import" className="btn-secondary text-xs">
              <RefreshCw size={13} /> Import
            </Link>
          )}
          {canCreate && (
            <Link to="/sop/new" className="btn-primary text-xs">
              <Plus size={13} /> Buat SOP Baru
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Draft', status: 'draft', color: 'bg-slate-50 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
          { label: 'Review', status: 'review', color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
          { label: 'Approved', status: 'approved', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
          { label: 'Published', status: 'published', color: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
        ].map(({ label, status, color, text, dot }) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`card p-4 border text-left transition-all ${color} ${statusFilter === status ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${dot}`}/>
              <span className={`text-xs font-semibold uppercase tracking-wide ${text}`}>{label}</span>
            </div>
            <div className={`text-2xl font-bold ${text}`}>
              {sops.filter(d => d.status === status).length}
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8 text-sm" placeholder="Cari nomor atau judul SOP..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        {user?.role !== 'viewer' && (
          <select className="input w-40 text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">Semua Status</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        )}
        {departments.length > 0 && (
          <select className="input w-48 text-sm" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1) }}>
            <option value="">Semua Departemen</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-44">Nomor SOP</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Judul Dokumen</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Departemen</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Update</th>
              <th className="px-4 py-3 w-10"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">Memuat...</td></tr>
            ) : sops.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">Tidak ada dokumen ditemukan</td></tr>
            ) : sops.map(sop => (
              <tr key={sop.id} onClick={() => navigate(`/sop/${sop.id}`)}
                className="hover:bg-slate-50 cursor-pointer transition-colors group">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{sop.nomor_sop}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{sop.judul_sop}</div>
                  {sop.updated_by_name && <div className="text-xs text-slate-400 mt-0.5">oleh {sop.updated_by_name}</div>}
                </td>
                <td className="px-4 py-3">
                  {sop.departemen && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sop.departemen}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge-${sop.status} badge`}>{sop.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {formatDistanceToNow(new Date(sop.updated_at), { addSuffix: true, locale: id })}
                </td>
                <td className="px-4 py-3">
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 25 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Menampilkan {Math.min((page-1)*25+1, total)}–{Math.min(page*25, total)} dari {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p-1)} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page * 25 >= total} className="btn-secondary text-xs px-3 py-1.5">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
