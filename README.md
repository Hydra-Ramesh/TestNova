# TestNova — AI-Powered CBT Platform

> AI-powered Computer Based Test platform for JEE Main, JEE Advanced, and NEET with unlimited mock test generation, real CBT simulation, deep analytics, and AI tutoring.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Redux Toolkit, Recharts, Socket.IO Client |
| Backend | Node.js, Express.js, Socket.IO, JWT, Mongoose |
| AI Service | Python FastAPI, Groq LLM, LangChain, RAG Pipeline |
| Database | MongoDB |
| Vector DB | Qdrant |
| Cache | Redis |
| Email | Resend |
| Deploy | Docker, Nginx |

## 📦 Project Structure

```
Testnova/
├── frontend/          # React SPA (Vite + Tailwind)
├── backend/           # Express.js REST API + WebSocket
├── ai-service/        # Python FastAPI AI microservice
├── docker/            # Docker Compose + Dockerfiles
├── nginx/             # Reverse proxy config
└── .env.example       # Environment variables
```

## 🛠️ Quick Start (Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Docker)
- Redis (optional, for caching)
- Qdrant (optional, for RAG)

### 1. Clone & Environment Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. AI Service (with venv)

```bash
cd ai-service
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```

### 5. Infrastructure (Docker)

```bash
cd docker
docker-compose up mongodb redis qdrant
```

## 🐳 Full Docker Deployment

```bash
cd docker
docker-compose up --build
```

Access the app at `http://localhost`

## 🔑 Environment Variables

| Variable | Description |
|----------|------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Resend email API key |
| `GROQ_KEY_1..10` | Groq API keys (up to 10) |
| `QDRANT_HOST` | Qdrant vector DB host |
| `REDIS_HOST` | Redis cache host |

## 📋 Features

- ✅ JWT Authentication (Register/Login/Reset Password/Email Verify)
- ✅ AI Question Generation (Groq + RAG)
- ✅ Real CBT Exam Interface (Palette, Timer, Navigation)
- ✅ Anti-Cheating (Tab switch, Copy/Paste, Right-click detection)
- ✅ Auto-Save via WebSocket
- ✅ Scientific Calculator
- ✅ Detailed Analysis with Solutions
- ✅ AI Tutor Chatbot
- ✅ PDF Scorecard Download
- ✅ Performance Analytics (Charts, Trends)
- ✅ Admin Panel (Syllabus, Questions, Users)
- ✅ Groq Multi-Key Rotation (10 keys)
- ✅ Redis Caching (6hr TTL)
- ✅ Dark Mode UI
- ✅ Fully Responsive

## 📊 API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify/:token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`
- `GET /api/auth/me`

### Exams
- `GET /api/exams/config`
- `POST /api/exams/generate`
- `GET /api/exams/:id/start`
- `POST /api/exams/:id/submit`

### Results
- `GET /api/results`
- `GET /api/results/analytics`
- `GET /api/results/:id`
- `GET /api/results/:id/scorecard`

### Chatbot
- `POST /api/chatbot/message`
- `GET /api/chatbot/explain/:questionId`

### Admin
- `GET /api/admin/stats`
- `GET/POST/DELETE /api/admin/syllabus`
- `GET/POST/DELETE /api/admin/questions`

### AI Service
- `POST /ai/api/generate/questions`
- `POST /ai/api/explain/solution`
- `POST /ai/api/chatbot/message`
- `POST /ai/api/embeddings/process`

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `exam_start` | Client→Server | Start exam session |
| `answer_update` | Client→Server | Auto-save answer |
| `timer_sync` | Client→Server | Sync remaining time |
| `violation` | Client→Server | Report anti-cheat violation |
| `exam_submit` | Client→Server | Submit exam |
| `warning_event` | Server→Client | Show warning to user |
| `exam_terminated` | Server→Client | Auto-terminate exam |
| `answer_saved` | Server→Client | Confirm answer saved |

## License

MIT
