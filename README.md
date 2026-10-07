# Document & Research Intelligence Engine

A full-stack, enterprise-grade AI-powered Document Search & Retrieval-Augmented Generation (RAG) platform. It allows users to upload PDF documents, extract text using PDF parsers and Tesseract OCR, perform hybrid semantic vector search with bounding-box highlighting, and chat with documents via streaming Google Gemini AI.

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, TailwindCSS v4, TanStack Query, Axios, Lucide Icons, React PDF, Sonner.
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyMuPDF (fitz), PyTesseract, Sentence Transformers (`all-MiniLM-L6-v2`), PyJWT.
- **Database:** PostgreSQL 12+ with `pgvector` extension (384-dimensional vector embeddings).
- **AI & OCR:** Google Gemini API (`gemini-2.5-flash`), Tesseract OCR v5+.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Python 3.10+** (`python --version`)
2. **Node.js 18+ & npm** (`node --version` and `npm --version`)
3. **PostgreSQL 12+** server with superuser access.
4. **Tesseract OCR Engine** binary (v5.0+ recommended).
5. **Google Gemini API Key** (Get one free from [Google AI Studio](https://aistudio.google.com/)).

---

## 🛠️ Environment & Service Setup

### 1. PostgreSQL & `pgvector` Setup

1. Start your PostgreSQL service.
2. Open `psql` or your database GUI tool (e.g. pgAdmin, DBeaver) and create the database:
   ```sql
   CREATE DATABASE document_engine;
   ```
3. Enable the `pgvector` extension inside `document_engine`:
   ```sql
   \c document_engine;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

> **Note:** If `CREATE EXTENSION IF NOT EXISTS vector;` fails, install `pgvector` for your OS:
> - **Windows:** Download compiled binaries or build using MSVC.
> - **Ubuntu/Debian:** `sudo apt-get install postgresql-15-pgvector` (replace 15 with your PG version).
> - **macOS (Homebrew):** `brew install pgvector`

---

### 2. Tesseract OCR Setup

Tesseract is required to extract text from scanned or image-based PDF pages.

- **Windows:**
  - Download installer from [UB-Mannheim Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki).
  - Install to default path `C:\Program Files\Tesseract-OCR\tesseract.exe`.
  - Add `C:\Program Files\Tesseract-OCR` to your System `PATH` environment variable.
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt-get update && sudo apt-get install -y tesseract-ocr
  ```
- **macOS (Homebrew):**
  ```bash
  brew install tesseract
  ```

---

### 3. Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Create API Key**.
3. Copy your API key to use in the backend configuration.

---

## 🚀 Installation & Running Locally

### Quick Start (Windows)

If you are on Windows and have completed the prerequisites above, simply double-click or run:
```cmd
start.bat
```
This script validates your setup and launches both the backend and frontend in separate terminal windows.

---

### Manual Setup Step-by-Step

#### Step 1: Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell/CMD):
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   # Windows:
   copy .env.example .env

   # Linux/macOS:
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL`: Connection string to your PostgreSQL database (e.g. `postgresql://postgres:yourpassword@localhost:5432/document_engine`).
   - `TESSERACT_CMD`: Path to your Tesseract binary (e.g. `C:\Program Files\Tesseract-OCR\tesseract.exe` on Windows, or leave blank/set path for Linux/macOS).
   - `GEMINI_API_KEY`: Your Google Gemini API key.

5. Run database migrations with Alembic:
   ```bash
   alembic upgrade head
   ```

6. Start backend development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Documentation (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - API Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

#### Step 2: Frontend Setup

1. Open a new terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install Node modules:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Ensure `.env.local` exists (created automatically or copied from `.env.example`):
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
   ```

4. Start Next.js development server:
   ```bash
   npm run dev
   ```
   - Web App UI: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

### Backend Unit & Integration Tests

Run all 52 backend tests using `pytest`:
```bash
cd backend
venv\Scripts\pytest   # Windows
# or
pytest                # Linux/macOS with active venv
```

### Frontend Typecheck & Production Build

Verify frontend TypeScript types and static page generation:
```bash
cd frontend
npm run build
```

---

## ❓ Troubleshooting Common Issues

### 1. `extension "vector" is not available`
- **Cause:** `pgvector` extension is not installed in your PostgreSQL instance.
- **Solution:** Follow PostgreSQL setup instructions above to install the extension binary for your OS, then run `CREATE EXTENSION vector;`.

### 2. `TesseractNotFoundError` or OCR fails
- **Cause:** Tesseract OCR binary not found at specified path.
- **Solution:** Verify `TESSERACT_CMD` in `backend/.env` points to the exact executable file (e.g. `C:\Program Files\Tesseract-OCR\tesseract.exe`). Ensure path uses escaped backslashes or forward slashes.

### 3. `Gemini API key is not configured` (HTTP 500 error during RAG / Chat)
- **Cause:** `GEMINI_API_KEY` is missing or empty in `backend/.env`.
- **Solution:** Add a valid Gemini API key from Google AI Studio to `backend/.env` and restart the backend server.

### 4. Database Connection Refused (`psycopg2.OperationalError`)
- **Cause:** PostgreSQL is not running or credentials/port in `DATABASE_URL` are incorrect.
- **Solution:** Check PostgreSQL server status and verify username, password, host, port (default `5432`), and database name in `backend/.env`.

### 5. CORS Errors in Frontend Browser Console
- **Cause:** Backend CORS origins setting does not match frontend address.
- **Solution:** Ensure `CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]` is defined in `backend/.env`.

---

## 📜 License

This project is open-source and available under the MIT License.
