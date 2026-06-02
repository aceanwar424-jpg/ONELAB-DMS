import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, ExternalLink, Download, Edit, Send, CheckCircle, XCircle, Globe, Archive, MessageSquare, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const STATUS_LABELS = { draft: 'Draft', review: 'Menunggu Review', approved: 'Disetujui', published: 'Published' }
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function SOPDetailPage() {
  const { id: sopId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sop, setSop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(null) // action name
  const [note, setNote] = useState('')

  useEffect(() => {
    api.get(`/sop/${sopId}`)
      .then(r => setSop(r.data))
      .catch(() => { toast.error('Dokumen tidak ditemukan'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [sopId])

  const doTransition = async (action) => {
    setActionLoading(true)
    try {
      const r = await api.post(`/sop/${sopId}/transition`, { action, notes: note })
      setSop(prev => ({ ...prev, ...r.data }))
      toast.success(`Berhasil: ${action}`)
      setShowNoteModal(null)
      setNote('')
      // Refresh full doc for history
      const full = await api.get(`/sop/${sopId}`)
      setSop(full.data)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Gagal')
    } finally {
      setActionLoading(false)
    }
  }

  const submitComment = async () => {
    if (!comment.trim()) return
    try {
      const r = await api.post(`/sop/${sopId}/comments`, { comment })
      setSop(prev => ({ ...prev, comments: [...(prev.comments || []), r.data] }))
      setComment('')
      toast.success('Komentar ditambahkan')
    } catch (e) { toast.error('Gagal mengirim komentar') }
  }

  const downloadPDF = () => {
    window.open(`${API_URL}/pdf/${sopId}`, '_blank')
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Memuat...</div>
  if (!sop) return null

  const canEdit = ['admin', 'editor'].includes(user?.role) && ['draft', 'review'].includes(sop.status)
  const canSubmitReview = ['admin', 'editor'].includes(user?.role) && sop.status === 'draft'
  const canApprove = ['admin', 'approver'].includes(user?.role) && sop.status === 'review'
  const canPublish = ['admin', 'approver'].includes(user?.role) && sop.status === 'approved'
  const canDownloadPDF = ['approved', 'published'].includes(sop.status)
  const canUnpublish = user?.role === 'admin' && sop.status === 'published'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
        <ArrowLeft size={14} /> Kembali ke Dashboard
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-4">
          {/* Header card */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{sop.nomor_sop}</span>
                  <span className={`badge badge-${sop.status}`}>{STATUS_LABELS[sop.status]}</span>
                  <span className="text-xs text-slate-400">v{sop.version}.0</span>
                </div>
                <h1 className="text-lg font-bold text-slate-900">{sop.judul_sop}</h1>
                {sop.departemen && <p className="text-sm text-slate-500 mt-1">{sop.departemen}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
              {sop.link_google_doc && (
                <a href={sop.link_google_doc} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                  <ExternalLink size={13} /> Buka Google Doc
                </a>
              )}
              {canDownloadPDF && (
                <button onClick={downloadPDF} className="btn-primary text-xs">
                  <Download size={13} /> Download PDF
                </button>
              )}
              {canEdit && (
                <Link to={`/sop/${sopId}/edit`} className="btn-secondary text-xs">
                  <Edit size={13} /> Edit
                </Link>
              )}
              {canSubmitReview && (
                <button onClick={() => setShowNoteModal('submit_review')} className="btn-secondary text-xs text-amber-700 border-amber-200 hover:bg-amber-50">
                  <Send size={13} /> Submit Review
                </button>
              )}
              {canApprove && (
                <>
                  <button onClick={() => setShowNoteModal('approve')} className="btn-secondary text-xs text-blue-700 border-blue-200 hover:bg-blue-50">
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button onClick={() => setShowNoteModal('reject')} className="btn-secondary text-xs text-red-700 border-red-200 hover:bg-red-50">
                    <XCircle size={13} /> Reject
                  </button>
                </>
              )}
              {canPublish && (
                <button onClick={() => setShowNoteModal('publish')} className="btn-primary text-xs bg-green-600 hover:bg-green-700">
                  <Globe size={13} /> Publish
                </button>
              )}
              {canUnpublish && (
                <button onClick={() => setShowNoteModal('unpublish')} className="btn-secondary text-xs text-slate-500">
                  <Archive size={13} /> Unpublish
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {sop.content && (
            <div className="card p-5">
              <h2 className="label mb-3">Konten SOP</h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{sop.content}</div>
            </div>
          )}

          {/* Comments */}
          <div className="card p-5">
            <h2 className="label mb-4 flex items-center gap-2"><MessageSquare size={13} /> Komentar ({sop.comments?.length || 0})</h2>
            <div className="space-y-3 mb-4">
              {(sop.comments || []).map(c => (
                <div key={c.id} className="flex gap-3">
                  {c.avatar
                    ? <img src={c.avatar} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />
                    : <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">{c.name?.[0]}</div>
                  }
                  <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{c.name}</span>
                      <span className="text-xs text-slate-400">{format(new Date(c.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                    </div>
                    <p className="text-sm text-slate-600">{c.comment}</p>
                  </div>
                </div>
              ))}
              {(!sop.comments || sop.comments.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada komentar</p>
              )}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="Tambah komentar..."
                value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()} />
              <button onClick={submitComment} disabled={!comment.trim()} className="btn-primary text-xs">Kirim</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Meta info */}
          <div className="card p-4">
            <h3 className="label mb-3">Informasi Dokumen</h3>
            <dl className="space-y-3">
              {[
                { label: 'Dibuat oleh', value: sop.created_by_name },
                { label: 'Terakhir edit', value: sop.updated_by_name },
                { label: 'Disetujui oleh', value: sop.approved_by_name },
                { label: 'Tanggal dibuat', value: sop.created_at ? format(new Date(sop.created_at), 'dd MMM yyyy', { locale: id }) : null },
                { label: 'Tanggal disetujui', value: sop.approved_at ? format(new Date(sop.approved_at), 'dd MMM yyyy', { locale: id }) : null },
                { label: 'Tanggal publish', value: sop.published_at ? format(new Date(sop.published_at), 'dd MMM yyyy', { locale: id }) : null },
              ].filter(d => d.value).map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm font-medium text-slate-700 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* History */}
          <div className="card p-4">
            <h3 className="label mb-3 flex items-center gap-1.5"><Clock size={11} /> Riwayat</h3>
            <div className="space-y-2.5">
              {(sop.history || []).slice(0, 10).map(h => (
                <div key={h.id} className="flex gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5"/>
                  <div>
                    <span className="font-medium text-slate-700 capitalize">{h.action.replace('_', ' ')}</span>
                    {h.new_status && <span className="text-slate-400"> → <span className={`badge-${h.new_status} badge text-xs`}>{h.new_status}</span></span>}
                    <div className="text-slate-400">{h.name} · {format(new Date(h.performed_at), 'dd MMM HH:mm', { locale: id })}</div>
                    {h.notes && <div className="text-slate-500 italic mt-0.5">"{h.notes}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-slate-900 mb-1 capitalize">{showNoteModal.replace('_', ' ')}</h3>
            <p className="text-sm text-slate-500 mb-4">Tambahkan catatan (opsional)</p>
            <textarea className="input w-full h-24 text-sm resize-none" placeholder="Catatan..."
              value={note} onChange={e => setNote(e.target.value)} />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => { setShowNoteModal(null); setNote('') }} className="btn-secondary text-xs">Batal</button>
              <button onClick={() => doTransition(showNoteModal)} disabled={actionLoading} className="btn-primary text-xs">
                {actionLoading ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
