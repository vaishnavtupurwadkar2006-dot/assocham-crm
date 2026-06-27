# ASSOCHAM AI Contact Intelligence Platform v2.0

AI-powered CRM for ASSOCHAM with Gemini Vision business card extraction, Google Sheets as the primary database, and JWT-authenticated multi-role access.

---

## Architecture

```
Frontend (Next.js 15)  →  Backend (FastAPI)  →  Google Sheets  →  Gemini AI
     Vercel                   Render               Primary DB       Vision + Search
```

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud service account with Sheets API access
- Gemini API key

### 1. Clone and set up backend

```bash
cd backend
cp .env.example .env
# Fill in your .env values (see Environment Variables section below)

pip install -r requirements.txt
```

### 2. Run the migration script (one-time)

```bash
# Copy contacts.xlsx to the backend directory, then:
python migrate.py contacts.xlsx \
  --spreadsheet-id YOUR_SPREADSHEET_ID \
  --credentials /path/to/service-account.json \
  --admin-email admin@assocham.org \
  --admin-password ChangeMe123!

# Or using environment variables:
export GOOGLE_SHEETS_SPREADSHEET_ID=your-id
export GOOGLE_SHEETS_CREDENTIALS_JSON='{"type":"service_account",...}'
export ADMIN_EMAIL=admin@assocham.org
export ADMIN_PASSWORD=ChangeMe123!
python migrate.py contacts.xlsx
```

This creates three sheet tabs in your spreadsheet:
- **Contacts** — 139 cleaned contacts from contacts.xlsx
- **Users** — with the admin account you specified
- **AuditLog** — empty, ready to receive log entries

### 3. Start the backend

```bash
python run.py
# API available at http://localhost:8000
# Docs at http://localhost:8000/api/docs
```

### 4. Set up frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm install
npm run dev
# App at http://localhost:3000
```

### 5. Log in

Navigate to `http://localhost:3000` and log in with the admin credentials from step 2.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Your Gemini API key from Google AI Studio |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ✅ | The ID from your Google Sheets URL |
| `GOOGLE_SHEETS_CREDENTIALS_JSON` | ✅ | Service account JSON (inline or file path) |
| `JWT_SECRET` | ✅ | Random 64-char hex — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATA_SOURCE` | ✅ | Set to `google_sheets` (use `mock` for dev without Sheets) |
| `GOOGLE_SHEETS_CONTACTS_SHEET_NAME` | ✅ | Default: `Contacts` |
| `GOOGLE_SHEETS_USERS_SHEET_NAME` | ✅ | Default: `Users` |
| `GOOGLE_SHEETS_AUDIT_SHEET_NAME` | ✅ | Default: `AuditLog` |
| `CORS_ORIGINS` | optional | Default: `http://localhost:3000` |
| `GEMINI_MODEL` | optional | Default: `gemini-2.5-flash` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | optional | Default: `480` (8 hours) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL, e.g. `https://your-app.onrender.com/api/v1` |

---

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or use existing)
3. Enable **Google Sheets API**
4. Create a **Service Account** (IAM & Admin → Service Accounts)
5. Download the JSON key file
6. Open your Google Sheet → Share → paste the service account email → Editor access
7. Copy the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your repo, set root directory to `backend`
4. **Build command:** `pip install -r requirements.txt`
5. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables in the Render dashboard
7. Set `CORS_ORIGINS` to your Vercel frontend URL

### Frontend → Vercel

1. Import your repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com/api/v1`
4. Deploy

---

## Business Card Workflow

```
User opens /import/business-card
  ↓
Uploads photo of business card
  ↓
POST /api/v1/business-card/extract
  → Gemini Vision extracts: name, company, email, phone, designation, etc.
  → Returns confidence score
  ↓
Review form pre-filled with extracted data (user edits if needed)
  ↓
Automatic duplicate check (runs while user reviews)
  ↓
If duplicate found → Side-by-side comparison modal
  Options: Create New / Merge / Skip
  ↓
POST /api/v1/business-card/confirm
  → Saves to Google Sheets
  → Writes to AuditLog
  ↓
Dashboard KPIs update automatically
```

---

## User Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access · Delete contacts · Manage users |
| **Staff** | Create/edit contacts · Import business cards · AI Search · Dashboard |
| **Intern** | View contacts · Search · View dashboard (read-only) |

---

## Migration Script Reference

```bash
python migrate.py [xlsx_path] [options]

Options:
  --spreadsheet-id    Google Sheets document ID
  --credentials       Path to service account JSON, or inline JSON string
  --contacts-sheet    Sheet tab name for contacts (default: Contacts)
  --users-sheet       Sheet tab name for users (default: Users)
  --audit-sheet       Sheet tab name for audit log (default: AuditLog)
  --admin-email       Admin user email (default: admin@assocham.org)
  --admin-password    Admin user password (default: ChangeMe123!)
  --admin-name        Admin user full name (default: ASSOCHAM Admin)
  --dry-run           Preview without writing to Sheets
```

---

## Project Structure

```
assocham-crm/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, security, exceptions, logging
│   │   ├── schemas/       # Pydantic models for all endpoints
│   │   ├── services/      # Business logic + repositories
│   │   └── routers/       # FastAPI route handlers
│   ├── migrate.py         # One-time data migration script
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── app/           # Next.js App Router pages
        ├── components/    # React components
        ├── context/       # Auth context
        ├── hooks/         # TanStack Query hooks
        ├── lib/           # API client + utils
        └── types/         # TypeScript interfaces
```

---

## Known Limitations

- Google Sheets has a 30s cache TTL — new contacts may take up to 30s to appear in all views
- Bulk import processes cards sequentially (0.5s delay between cards) to respect Gemini rate limits
- The Sheets API has a quota of ~300 requests/minute — avoid rapid bulk imports of 300+ cards
- JWT tokens are stored in localStorage and httpOnly cookies; rotate `JWT_SECRET` if compromised

---

## Support

Built for ASSOCHAM — Associated Chambers of Commerce and Industry of India.
