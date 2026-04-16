# OpenChatRoom 🚀

A powerful, modern, real-time chat application built for speed and scalability. OpenChatRoom supports public communities, private user spaces, real-time messaging, and file sharing.

![OpenChatRoom Demo](https://via.placeholder.com/800x400?text=OpenChatRoom+Preview)

## ✨ Features

*   **Real-time Messaging**: Instant communication using WebSockets (FastAPI + Redis Pub/Sub).
*   **Room Management**:
    *   **Community Rooms**: Admin-managed public spaces.
    *   **User Spaces**: Create your own public or private rooms.
    *   **Invite System**: Generate shareable links to invite friends to private rooms.
*   **File Sharing**: Secure file uploads (MinIO / S3 compatible).
*   **Roles & Permissions**: Admin and User roles with specific privileges (e.g., Admin badges, room deletion).
*   **Persistence**: PostgreSQL storage for users, rooms, and message history.
*   **Responsive UI**: A beautiful, modern React interface built with TailwindCSS and Framer Motion.

## 🛠️ Tech Stack

### Backend
*   **Language**: Python 3.11+
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Async, High performance)
*   **Database**: PostgreSQL (Store) + Redis (Cache & Pub/Sub)
*   **ORM**: SQLAlchemy (Async)
*   **Storage**: MinIO / AWS S3 compatibility

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: TailwindCSS
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **State Management**: React Hooks

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm
*   Python 3.10+
*   PostgreSQL
*   Redis
*   MinIO (Optional, for local file upload testing)

### 1. Clone the Repository
```bash
git clone https://github.com/rahulheree/openchatroomm.git
cd openchatroomm
```

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd chat-app-backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `chat-app-backend/` (see `.env.example` if available) or set these variables:
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379
SESSION_SECRET_KEY=supersecretkey
# MinIO / S3 Headers
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=chat-files
MINIO_SECURE=False
```

Run the server:
```bash
python -m uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd openchatroom-frontend
```

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```
The app will run at `http://localhost:5173`.

## 📦 Deployment

This project is optimized for free-tier deployment:
*   **Frontend**: Vercel / Netlify
*   **Backend**: Render / Railway
*   **Database**: Supabase / Neon
*   **Redis**: Upstash
*   **Storage**: Supabase Storage

See [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
