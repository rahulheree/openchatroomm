# How to Host OpenChatRoom Completely Free

This guide will show you how to deploy your Full Stack Chat App for free using **Render, Supabase, Upstash, and Netlify**.

## Architecture
- **Frontend**: Netlify (Free Static Hosting)
- **Backend**: Render (Free Web Service)
- **Database**: Supabase (Free PostgreSQL)
- **Redis**: Upstash (Free Redis)
- **File Storage**: Supabase Storage (Free S3-compatible object storage)

---

## Step 1: Database & Storage
You have two great options for the Database: **Supabase** or **Neon**.
*Both are excellent and free.*

### Option A: Supabase (Simplest - DB + Storage in one place)
1.  Go to [supabase.com](https://supabase.com) and Sign Up.
2.  **Create a New Project**. Name it `openchatroom-db`.
3.  **Get Database URL**:
    -   **Project Settings** > **Database**.
    -   Copy **URI** (looks like `postgres://...`). *Save this.*
4.  **Create Storage Bucket**:
    -   **Storage** (sidebar) > **New Bucket**.
    -   Name: `chat-files`. Toggle **Public** OFF (Private).
5.  **Get Storage key**:
    -   **Project Settings** > **Storage**.
    -   Copy **S3 Endpoint**, **Access Key ID**, **Secret Access Key**. *Save these.*

### Option B: Neon (Database) + Supabase (Storage)
*If you prefer Neon for the DB, you still need Supabase for file storage.*
1.  Go to [neon.tech](https://neon.tech) and Sign Up.
2.  **Create a Project**.
3.  **Get Connection String**:
    -   Copy the connection string (looks like `postgres://...`).
    -   *Use this as your `DATABASE_URL` later.*
4.  **Set up Storage**:
    -   Go to [supabase.com](https://supabase.com) and create a project just for Storage.
    -   Follow steps 4 & 5 from "Option A" above to get S3 credentials.

## Step 2: Redis (Upstash)
1.  Go to [upstash.com](https://upstash.com) and Log In.
2.  **Create Database**. Name it `openchatroom-redis`.
3.  Select **Global** (Free Tier).
4.  Copy the `REDIS_URL` (starts with `rediss://...`).

## Step 3: Backend (Render)
1.  Go to [render.com](https://render.com).
2.  **New +** > **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    -   **Name**: `openchatroom-backend`
    -   **Root Directory**: `chat-app-backend`
    -   **Runtime**: Python 3
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
    -   **Plan**: Free
5.  **Environment Variables** (Add these):
    | Key | Value |
    | --- | --- |
    | `DATABASE_URL` | Your Supabase URL (Step 1) |
    | `REDIS_URL` | Your Upstash URL (Step 2) |
    | `MINIO_ENDPOINT` | Your Supabase S3 Endpoint (remove `https://`) e.g., `xxxx.supabase.co`. *Note: If it includes scheme, remove it.* |
    | `MINIO_ACCESS_KEY` | Your Supabase Access Key |
    | `MINIO_SECRET_KEY` | Your Supabase Secret Key |
    | `MINIO_BUCKET` | `chat-files` |
    | `MINIO_SECURE` | `True` |
    | `SESSION_SECRET_KEY` | Generate a random string (e.g., `supersecretkey123`) |
    | `ALLOWED_ORIGINS` | Your Netlify URL (e.g., `https://openchatroom.netlify.app`) |
    | `PYTHON_VERSION` | `3.11.0` (Optional, good practice) |

6.  **Deploy**. Wait for it to go Live.
7.  **Copy the Backend URL**: e.g., `https://openchatroom-backend.onrender.com`.

## Step 4: Frontend (Netlify)
1.  Go to [netlify.com](https://www.netlify.com/).
2.  **Add new site** > **Import from Git**.
3.  Select your repo.
4.  **Settings**:
    -   **Base directory**: `openchatroom-frontend`
    -   **Build command**: `npm run build`
    -   **Publish directory**: `openchatroom-frontend/dist`
5.  **Environment Variables**:
    -   `VITE_API_URL`: The Render Backend URL (e.g., `https://openchatroom-backend.onrender.com`) **IMPORTANT**: Do NOT add a trailing slash.
6.  **Deploy**.
7.  **Copy the Frontend URL**: e.g., `https://openchatroom.netlify.app`.

## Step 5: Final Connection
1.  Go back to **Render** (Backend).
2.  We need to allow the Netlify Frontend to talk to the Backend (CORS).
3.  Wait... The current code in `main.py` has hardcoded CORS origins (`localhost`).
4.  **YOU MUST UPDATE `main.py`** to include your Netlify URL or allow all (for testing).
    -   Check `chat-app-backend/main.py`.
    -   Add `os.getenv("FRONTEND_URL")` to the `origins` list?
    -   Or just add `https://openchatroom.netlify.app` once you know it.
    -   *Ideally*, update `main.py` to read `ALLOWED_ORIGINS` from env.

## Troubleshooting
-   **Database Error**: "driver not found"? We patched `database.py` to handle `postgres://` -> `postgresql+asyncpg://` automatically.
-   **Images not loading**: Check `MINIO_ENDPOINT` does not have `https://` prefix, just the domain.
-   **CORS Errors**: Check Browser Console. If you see CORS error, you need to update `main.py` origins.

