import { useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'

export default function ImportPage() {
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
    return lines.slice(1).map(line => {
      const vals = line.split('\t')
      const obj = {}
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || '' })
      return obj
    }).filter(r => r.nomor_sop || r.judul_sop)
  }

  const handlePaste = (e) => {
    const text = e.target.value
    setRaw(text)
    try {
      const parsed = parseCSV(text)
      setPreview(parsed)
    } catch { setPreview([]) }
  }

  const handleImport = async () => {
    if (!preview.length) return
    setImporting(true)
    try {
      const documents = preview.map(r => ({
        nomor_sop: r.nomor_sop || r['nomor sop'] || '',
        judul_sop: r.judul_sop || r['judul sop'] || r.judul || '',
        departemen: r.departemen || r.dept || '',
        link_google_doc: r.link_google_doc || r.link || r['link google doc'] || ''
      })).filter(d => d.nomor_sop && d.judul_sop)

      const r = await api.post('/sop/import/bulk', { documents })
      setResult({ success: true, count: r.data.imported })
      toast.success(`${r.data.imported} dokumen berhasil diimport!`)
      setRaw('')
      setPreview([])
    } catch (e) {
      toast.error('Gagal import: ' + (e.response?.data?.error || e.message))
      setResult({ success: false })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
          <FileSpreadsheet size={16} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Import SOP dari Spreadsheet</h1>
          <p className="text-sm text-slate-500">Copy-paste data dari Google Sheets / Excel</p>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="label mb-3">Cara Import</h2>
        <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
          <li>Buka Google Sheets kamu (OneLab Master Data)</li>
          <li>Select semua kolom: <code className="bg-slate-100 px-1 rounded font-mono text-xs">nomor_sop, judul_sop, link_google_doc</code> (+ departemen jika ada)</li>
          <li>Copy (Ctrl+C) lalu paste di kotak di bawah</li>
          <li>Preview akan muncul otomatis, klik Import</li>
        </ol>
      </div>

      <div className="card p-5 mb-4">
        <label className="label mb-2">Paste Data Spreadsheet</label>
        <textarea
          className="input w-full h-40 font-mono text-xs resize-none"
          placeholder="nomor_sop&#9;judul_sop&#9;link_google_doc&#10;OLD/CLN-FAR/L1/001&#9;Pedoman Pelayanan Kefarmasian&#9;https://docs.google.com/..."
          value={raw}
          onChange={handlePaste}
        />
        <p className="text-xs text-slate-400 mt-1">Format: Tab-separated (langsung dari copy Google Sheets). Baris pertama = header.</p>
      </div>

      {preview.length > 0 && (
        <div className="card overflow-hidden mb-4">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">{preview.length} dokumen siap diimport</span>
          </div>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  {['Nomor SOP', 'Judul', 'Dept', 'Link'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-slate-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-600">{row.nomor_sop}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-xs truncate">{row.judul_sop || row.judul}</td>
                    <td className="px-3 py-2 text-slate-500">{row.departemen || '—'}</td>
                    <td className="px-3 py-2">{row.link_google_doc || row.link ? <span className="text-blue-500">✓</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
            <button onClick={handleImport} disabled={importing} className="btn-primary">
              <Upload size={14} /> {importing ? 'Mengimport...' : `Import ${preview.length} Dokumen`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`card p-4 flex items-center gap-3 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.success
            ? <><CheckCircle size={18} className="text-green-600"/><span className="text-sm text-green-800 font-medium">{result.count} dokumen berhasil diimport ke database!</span></>
            : <><AlertCircle size={18} className="text-red-600"/><span className="text-sm text-red-800">Import gagal, coba lagi.</span></>
          }
        </div>
      )}
    </div>
  )
}
