# 🏥 OneLab SOP Wiki

Sistem manajemen dokumen SOP berbasis web dengan fitur approval workflow, PDF generation, dan Google OAuth.

## Stack

| Komponen | Teknologi | Hosting |
|----------|-----------|--------|
| Frontend | React + Vite + Tailwind | GitHub Pages (Free) |
| Backend | Node.js + Express | Railway (Free) |
| Database | PostgreSQL | Railway (Free) |
| Auth | Google OAuth 2.0 | Free |
| PDF | Puppeteer | Di Railway |

## Fitur

- 📋 **Dashboard Wiki** — List semua SOP dengan search & filter
- 👥 **4 Role** — Admin, Approver, Editor, Viewer
- 🔄 **Workflow** — Draft → Review → Approved → Published
- 📄 **Auto PDF** — Generate PDF saat dokumen Approved/Published
- 🔗 **Google Doc Link** — Terintegrasi dengan Google Drive
- 💬 **Komentar** — Diskusi per dokumen
- 📦 **Bulk Import** — Import dari Google Sheets via copy-paste
- 🔐 **Google SSO** — Login dengan akun Google

---

## Setup: Step by Step

### 1. Clone & Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create sop-wiki --public
git push origin main
```

### 2. Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru → **APIs & Services** → **Credentials**
3. Klik **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized redirect URIs: `https://your-railway-app.railway.app/api/auth/google/callback`
6. Copy **Client ID** dan **Client Secret**

### 3. Deploy Backend ke Railway

1. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Pilih repo ini → pilih folder `backend`
3. Tambahkan **PostgreSQL** database di Railway (Add Plugin → PostgreSQL)
4. Set Environment Variables:

```env
DATABASE_URL        = (auto dari Railway PostgreSQL)
SESSION_SECRET      = (random string panjang, bisa generate: openssl rand -hex 32)
GOOGLE_CLIENT_ID    = (dari step 2)
GOOGLE_CLIENT_SECRET = (dari step 2)
GOOGLE_CALLBACK_URL = https://YOUR-APP.railway.app/api/auth/google/callback
FRONTEND_URL        = https://YOUR-USERNAME.github.io/sop-wiki
NODE_ENV            = production
```

5. Railway akan auto-detect `railway.toml` dan deploy
6. Copy URL Railway kamu (e.g. `https://sop-wiki-production.up.railway.app`)

### 4. Deploy Frontend ke GitHub Pages

1. Di repo GitHub → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Tambah Secret: `VITE_API_URL` = `https://YOUR-RAILWAY-URL.railway.app/api`
4. Di `frontend/vite.config.js` dan `frontend/src/main.jsx`, ganti `/sop-wiki` dengan nama repo kamu
5. Push ke main → GitHub Actions otomatis build & deploy

### 5. Update Google OAuth Redirect

Kembali ke Google Cloud Console, update redirect URI ke URL Railway yang benar.

---

## Cara Import Data dari Spreadsheet

1. Login sebagai Admin
2. Menu → **Import SOP**
3. Buka Google Sheets → Select semua kolom → Copy
4. Paste di kotak Import
5. Klik **Import**

---

## Role & Permission

| Aksi | Admin | Approver | Editor | Viewer |
|------|-------|----------|--------|--------|
| Lihat Published | ✅ | ✅ | ✅ | ✅ |
| Lihat semua status | ✅ | ✅ | ✅ | ❌ |
| Buat/Edit Draft | ✅ | ❌ | ✅ | ❌ |
| Submit Review | ✅ | ❌ | ✅ | ❌ |
| Approve/Reject | ✅ | ✅ | ❌ | ❌ |
| Publish | ✅ | ✅ | ❌ | ❌ |
| Download PDF | ✅ | ✅ | ✅ | ✅* |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Import Bulk | ✅ | ❌ | ❌ | ❌ |

*Viewer hanya bisa download PDF dokumen Published

**Note:** User pertama yang login otomatis jadi Admin.

---

## Development Lokal

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env dengan credentials kamu
npm install
npm run dev

# Frontend (terminal baru)
cd frontend
cp .env.example .env
# Edit VITE_API_URL=http://localhost:3001/api
npm install
npm run dev
```

Butuh PostgreSQL lokal atau bisa pakai Railway PostgreSQL langsung dengan DATABASE_URL dari Railway.
