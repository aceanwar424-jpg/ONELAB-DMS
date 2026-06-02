import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'

export default function SOPFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nomor_sop: '', judul_sop: '', departemen: '', link_google_doc: '', content: ''
  })

  useEffect(() => {
    if (isEdit) {
      api.get(`/sop/${id}`)
        .then(r => setForm({
          nomor_sop: r.data.nomor_sop || '',
          judul_sop: r.data.judul_sop || '',
          departemen: r.data.departemen || '',
          link_google_doc: r.data.link_google_doc || '',
          content: r.data.content || '',
        }))
        .catch(() => { toast.error('Dokumen tidak ditemukan'); navigate('/dashboard') })
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async () => {
    if (!form.nomor_sop || !form.judul_sop) {
      toast.error('Nomor dan judul SOP wajib diisi')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/sop/${id}`, form)
        toast.success('Dokumen berhasil diupdate')
        navigate(`/sop/${id}`)
      } else {
        const r = await api.post('/sop', form)
        toast.success('Dokumen berhasil dibuat')
        navigate(`/sop/${r.data.id}`)
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  if (loading) return <div className="p-8 text-center text-slate-400">Memuat...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="card p-6">
        <h1 className="text-lg font-bold text-slate-900 mb-6">{isEdit ? 'Edit Dokumen SOP' : 'Buat Dokumen SOP Baru'}</h1>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nomor SOP *</label>
              <input className="input" placeholder="e.g. CLN-FAR/L1/001" value={form.nomor_sop} onChange={set('nomor_sop')} />
            </div>
            <div>
              <label className="label">Departemen</label>
              <input className="input" placeholder="e.g. Farmasi" value={form.departemen} onChange={set('departemen')} />
            </div>
          </div>

          <div>
            <label className="label">Judul SOP *</label>
            <input className="input" placeholder="Masukkan judul dokumen SOP" value={form.judul_sop} onChange={set('judul_sop')} />
          </div>

          <div>
            <label className="label">Link Google Doc</label>
            <input className="input" placeholder="https://docs.google.com/..." value={form.link_google_doc} onChange={set('link_google_doc')} />
            <p className="text-xs text-slate-400 mt-1">Link ke dokumen lengkap di Google Drive</p>
          </div>

          <div>
            <label className="label">Ringkasan / Konten (opsional)</label>
            <textarea className="input h-40 resize-none" placeholder="Tuliskan ringkasan atau konten SOP di sini..." value={form.content} onChange={set('content')} />
            <p className="text-xs text-slate-400 mt-1">Akan ditampilkan di halaman detail dan di-include dalam PDF</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => navigate(-1)} className="btn-secondary">Batal</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            <Save size={14} /> {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Dokumen'}
          </button>
        </div>
      </div>
    </div>
  )
}
