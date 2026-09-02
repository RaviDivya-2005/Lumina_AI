# Lumina AI — AI-Powered Learning Platform

A full-stack web application that delivers a personalized, AI-driven learning experience. Students can chat with an AI tutor, analyze video and document content, and practice adaptive quizzes — all within a unified dashboard. Designed and developed as a college capstone project.

---

## 1. Introduction

### 1.1 Problem Statement

Traditional e-learning platforms are static and one-directional: students read content, watch videos, and take fixed quizzes. These systems have critical limitations:

- **No personalization** — every student gets the same content regardless of their level
- **Passive learning** — students cannot ask questions or get explanations tailored to them
- **Disconnected tools** — AI chat, video analysis, and quizzes exist as separate applications
- **No real-time feedback** — quiz results are stored but not analyzed for learning insights

### 1.2 Proposed Solution

Lumina AI solves these problems by integrating AI at every stage of the learning workflow:

- **AI Chat Tutor** — Students chat with an LLM-powered assistant that answers questions, explains concepts, and analyzes uploaded images, documents, and videos
- **Video & Document Analysis** — Upload or record a video/audio file and receive an AI-generated transcript and analysis
- **Adaptive Quiz System** — An admin creates quiz categories; AI generates questions automatically using Groq LLaMA 3.3 70B; students practice with a timed quiz and get instant feedback
- **Role-Based Access** — Separate dashboards and permissions for Super Admins, Admins, and Students

---

## 2. System Architecture

### 2.1 High-Level Overview

The application follows a three-tier client-server architecture:

```
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                        │
│              React 19 SPA (Single Page Application)          │
│   ┌──────────┬───────────┬──────────┬──────────┬──────────┐  │
│   │Dashboard │  AI Chat  │  Video   │  Quiz    │ Settings │  │
│   │ (Admin)  │  Tutor    │ Analysis │ Practice │ & Users  │  │
│   └──────────┴───────────┴──────────┴──────────┴──────────┘  │
│                    │ Axios HTTP / Supabase JWT Auth           │
├────────────────────┼─────────────────────────────────────────┤
│                  APPLICATION TIER                             │
│            Node.js + Express.js Proxy Server                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  Auth   │ │   Chat   │ │  Video   │ │  Quiz / ML AI   │  │
│  │ (JWT)   │ │ Streaming│ │  Proxy   │ │  Question Gen   │  │
│  └─────────┘ └──────────┘ └──────────┘ └─────────────────┘  │
│                    │ Supabase REST API                        │
├────────────────────┼─────────────────────────────────────────┤
│                    DATA TIER                                  │
│               Supabase (PostgreSQL)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │  users   │ │  chats   │ │ messages │ │  workspaces   │   │
│  │ students │ │questions │ │quiz_res  │ │ quiz_categ.   │   │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — AI Chat

```
1. Student types a message (optionally attaches image/video/document)
         │
         ▼
2. If file attached → upload to backend for pre-processing
         │   (video → Groq Whisper transcription + analysis)
         │   (document → text extraction)
         │   (image → base64 encoded inline)
         ▼
3. Message + context sent to Groq API (LLaMA 3.3 70B) via server proxy
         │
         ▼
4. Streamed response returned to frontend via SSE (Server-Sent Events)
         │
         ▼
5. Message stored in Supabase (chat session, user, timestamp)
         │
         ▼
6. UI renders Markdown-formatted response with syntax highlighting
```

### 2.3 Data Flow — Quiz

```
1. Admin creates a Category (e.g., "Python", "Mathematics")
         │
         ▼
2. Admin clicks "AI Generate" → specifies count, difficulty, topic
         │
         ▼
3. Backend sends prompt to Groq (LLaMA 3.3 70B) → returns JSON questions
         │
         ▼
4. Questions saved to Supabase (questions table, linked to category)
         │
         ▼
5. Student selects a category → starts 10-question timed quiz (10 min)
         │
         ▼
6. Student submits → backend grades answers, computes score/percentage
         │
         ▼
7. Result saved to quiz_results → visible on leaderboard & history
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Purpose | Why it was chosen |
|---|---|---|
| **React 19** | UI framework | Latest concurrent features, component-based architecture |
| **Vite 8** | Build tool | Fastest HMR (Hot Module Replacement) available |
| **Tailwind CSS 4** | Styling | Utility-first CSS with dark mode support |
| **Framer Motion** | Animations | Declarative animations for page transitions and micro-interactions |
| **Zustand** | State management | Lightweight, boilerplate-free alternative to Redux |
| **React Router 7** | Routing | Client-side navigation with protected route guards |
| **Recharts** | Charts | Responsive, composable chart components for analytics |
| **Axios** | HTTP client | Interceptors for automatic JWT token handling |
| **React Markdown** | Content rendering | Renders AI responses as formatted Markdown |
| **Lucide React** | Icons | Consistent, clean icon set |
| **Supabase JS** | Auth + DB client | Direct auth integration with Supabase backend |

### 3.2 Backend (Proxy Server)

| Technology | Purpose | Why it was chosen |
|---|---|---|
| **Node.js** | Runtime | Non-blocking I/O ideal for streaming AI responses |
| **Express.js** | Web framework | Minimal, flexible HTTP server for proxying requests |
| **Multer** | File uploads | Handles multipart form data for video/document uploads |
| **CORS** | Cross-origin control | Configurable per-origin allowlist for dev + production |
| **JSON Web Token** | Auth verification | Validates Supabase JWTs on every protected request |
| **Dotenv** | Config management | Secure environment variable loading |

### 3.3 AI & Cloud Services

| Service | Purpose | Model / API |
|---|---|---|
| **Groq API** | AI chat inference | LLaMA 3.3 70B (chat completions + streaming) |
| **Groq Whisper** | Video/audio transcription | Whisper Large V3 |
| **Groq LLaMA** | Quiz question generation | LLaMA 3.3 70B |
| **Supabase** | Auth, Database, Storage | PostgreSQL + Row-Level Security |

### 3.4 Deployment

| Platform | Serves |
|---|---|
| **Render.com** | Node.js backend (serves static frontend in production) |
| **Supabase** | PostgreSQL database + authentication |

---

## 4. Features

### 4.1 Role-Based Access Control

Three roles with completely separate dashboards and permissions:

| Role | Access | Capabilities |
|---|---|---|
| **Super Admin** | All pages | Dashboard analytics, manage all users, settings, quiz management, AI tools |
| **Admin** | Quiz management | Create categories, AI-generate questions, view student results |
| **Student** | Learning tools | AI Chat, Video Analysis, Quiz Practice |

### 4.2 AI Chat Tutor

- **Streaming responses** via Server-Sent Events (SSE) — text appears word by word
- **Multi-modal uploads** — attach images, documents, or videos to any message
- **Live Video Recording** — open webcam, record a clip, and send it directly for analysis
- **Markdown rendering** — AI responses render with headings, code blocks, lists, and tables
- **Persistent chat history** — all sessions stored in Supabase, accessible via sidebar
- **Conversation search** — search across all past chats by keyword
- **Chat management** — rename or delete individual conversations
- **Collapsible sidebar** — responsive design works on all screen sizes
- **Stop generation** — cancel AI response mid-stream

### 4.3 Video & Document Analysis

- **File upload** — drag-and-drop or click to upload (MP4, WebM, MP3, WAV, FLAC, M4A)
- **Live webcam recording** — record directly in-browser and send for analysis
- **AI transcription** — Groq Whisper converts speech to text
- **AI analysis** — LLaMA provides a structured analysis of the content
- **Copy to clipboard** — one-click copy of the full transcript and analysis
- **Tabbed interface** — switch between Upload and Record modes
- **Max file size**: 100 MB

Supported upload formats:

```
Video: .mp4, .webm, .mpeg, .ogg
Audio: .mp3, .wav, .flac, .m4a
```

### 4.4 Quiz System

**For Admins:**
- Create and manage quiz categories (Math, Science, English, Tech, History, etc.)
- AI-generate up to 20 questions per batch with configurable difficulty (Easy / Medium / Hard / Mixed) and specific subtopic focus
- Manually add, edit, or delete individual questions
- View all student quiz results in a results table

**For Students:**
- Browse available quiz categories with question counts
- Take a 10-question timed quiz (10-minute limit with countdown)
- Questions grouped by subtopic for progressive learning
- Instant results: score, percentage, correct/incorrect breakdown, explanations
- View personal quiz history with dates and scores
- Leaderboard showing top performers

### 4.5 Dashboard (Super Admin)

- **Stats cards** — total users, active students, quizzes completed, system status
- **Charts** — user activity, quiz performance trends (Bar, Line, Pie charts via Recharts)
- **Quick links** — fast navigation to all admin sections

### 4.6 Settings

- Update platform name and branding
- Manage workspace configuration
- Account details linked to authenticated Supabase session

### 4.7 Theme

- **Dark / Light mode toggle** — persisted across sessions via Zustand store
- **Collapsible navigation sidebar** — state saved to `localStorage`

---

## 5. Database Schema

The database is hosted on **Supabase (PostgreSQL)** with Row-Level Security (RLS) enabled.

### 5.1 Core Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Supabase auth users | `id`, `email`, `role`, `created_at` |
| `workspaces` | Tenant/organization | `id`, `name`, `owner_id` |
| `students` | Student profiles | `id`, `student_id`, `name`, `email`, `workspace_id` |
| `chats` | AI chat sessions | `id`, `user_id`, `title`, `created_at`, `updated_at` |
| `messages` | Chat messages | `id`, `chat_id`, `role` (user/assistant), `content`, `timestamp` |
| `quiz_categories` | Quiz subjects | `id`, `name`, `description`, `icon`, `is_active` |
| `questions` | Quiz questions | `id`, `category_id`, `question`, `options` (JSONB), `correct_answer`, `difficulty`, `explanation`, `is_active` |
| `quiz_results` | Student quiz attempts | `id`, `student_id`, `category_id`, `score`, `total_questions`, `percentage`, `answers` (JSONB), `time_taken`, `completed_at` |

### 5.2 Key Relationships

```
users ──────< chats ──────< messages
users ──────> workspaces
workspaces ──< students
students ────< quiz_results >────── quiz_categories
quiz_categories ────< questions
```

---

## 6. API Endpoints

The Express.js backend exposes endpoints under both `/api/*` and `/*` prefixes for compatibility.

### 6.1 Chat

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat` | List all chat sessions for authenticated user |
| POST | `/api/chat` | Create a new chat session |
| GET | `/api/chat/:id` | Get messages for a specific chat |
| PUT | `/api/chat/:id/rename` | Rename a chat session |
| DELETE | `/api/chat/:id` | Delete a chat session |
| GET | `/api/chat/search/:query` | Search chats by keyword |
| POST | `/api/chat/:id/message` | Send a message (non-streaming fallback) |
| POST | `/api/chat/:id/message/stream` | Send a message with SSE streaming response |

### 6.2 Video & Audio

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/video/analyze` | Upload video/audio → transcribe + analyze with AI |

### 6.3 Document

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/document/analyze` | Upload document → extract text + analyze with AI |

### 6.4 Quiz

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/quiz/categories` | List all quiz categories with question counts |
| POST | `/api/quiz/categories` | Create a new category |
| PUT | `/api/quiz/categories/:id` | Update a category |
| DELETE | `/api/quiz/categories/:id` | Delete a category |
| GET | `/api/quiz/questions` | List all questions |
| POST | `/api/quiz/questions` | Create a question manually |
| PUT | `/api/quiz/questions/:id` | Update a question |
| DELETE | `/api/quiz/questions/:id` | Delete a question |
| POST | `/api/quiz/ai-generate` | AI-generate questions for a category |
| POST | `/api/quiz/start` | Start a quiz session (returns randomized questions) |
| POST | `/api/quiz/submit` | Submit quiz answers, grade, save result |
| GET | `/api/quiz/results` | Get all quiz results |
| POST | `/api/quiz/leaderboard` | Get top 50 students by percentage |
| POST | `/api/quiz/analytics` | Aggregate quiz analytics |

### 6.5 Database Utilities

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/db/setup` | Seed initial workspace and demo data |
| GET | `/api/db/status` | Check database connection status |

---

## 7. Project Structure

```
Lumina-AI/
│
├── client/                           # React frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                  # Application entry point
│       ├── App.jsx                   # Route definitions + theme toggle
│       ├── index.css                 # Global styles, CSS variables, dark mode
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── StudentLayout.jsx # Shell for student pages (sidebar + topbar)
│       │   │   └── AdminLayout.jsx   # Shell for admin pages
│       │   └── ui/
│       │       ├── Card.jsx
│       │       ├── Button.jsx
│       │       ├── Badge.jsx
│       │       ├── Skeleton.jsx
│       │       ├── Table.jsx
│       │       ├── Charts.jsx        # Recharts wrappers (Line, Bar, Pie)
│       │       └── VideoRecordingModal.jsx  # Webcam live recording modal
│       │
│       ├── pages/
│       │   ├── Auth/
│       │   │   └── Login.jsx         # Login page (email + password)
│       │   ├── Student/
│       │   │   ├── AiChat.jsx        # AI Chat Tutor (streaming, multi-modal)
│       │   │   ├── VideoAnalysis.jsx # Video/audio transcription + analysis
│       │   │   └── Quiz.jsx          # Quiz practice for students
│       │   ├── Admin/
│       │   │   └── Quiz.jsx          # Quiz management for admins
│       │   └── SuperAdmin/
│       │       ├── Dashboard.jsx     # Analytics dashboard
│       │       └── Settings.jsx      # Platform settings
│       │
│       ├── store/
│       │   ├── authStore.js          # Authentication + user state (Zustand)
│       │   └── appStore.js           # Theme, sidebar state (Zustand)
│       │
│       └── utils/
│           ├── api.js                # Axios instance with auth interceptors
│           ├── supabase.js           # Supabase client initialization
│           └── helpers.js            # Date formatting, utilities
│
├── server/                           # Node.js + Express backend
│   ├── server.js                     # Entry point, route mounting, CORS config
│   ├── package.json
│   └── routes/
│       ├── chat.js                   # Chat sessions + AI streaming proxy
│       ├── video.js                  # Video upload + Groq Whisper transcription
│       ├── document.js               # Document upload + AI analysis
│       ├── quiz.js                   # Quiz CRUD + AI question generation
│       ├── db.js                     # Database seeding + status utilities
│       └── debug.js                  # Environment variable presence check
│   └── utils/
│       └── supabase.js               # Supabase REST API helper
│
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Environment variable template
├── supabase-schema.sql               # Full database schema (run on Supabase)
├── Dockerfile                        # Docker container definition
├── docker-compose.yml                # Multi-container orchestration
├── render.yaml                       # Render.com deployment configuration
└── README.md
```

---

## 8. Getting Started

### 8.1 Prerequisites

- **Node.js** v18+ — [Download from nodejs.org](https://nodejs.org/)
- **npm** — bundled with Node.js
- A **Supabase** account — [supabase.com](https://supabase.com) (free tier works)
- A **Groq** API key — [console.groq.com](https://console.groq.com) (free tier works)

### 8.2 Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to create all tables

### 8.3 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Server port
PORT=5000

# Supabase (Project Settings → API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend proxy URL
VITE_AI_PROXY_URL=http://localhost:5000

# Server-side (never exposed to frontend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Groq AI API key (console.groq.com)
GROQ_API_KEY=your-groq-api-key

# Allowed frontend origin
CLIENT_URL=http://localhost:5173
```

### 8.4 Install Dependencies

You need to install packages for **both** the client and the server separately.

**Step 1 — Install client (frontend) dependencies:**
```bash
cd client
npm install
```

**Step 2 — Install server (backend) dependencies:**
```bash
cd ../server
npm install
```

> ✅ You only need to run `npm install` once. After that, just use `npm run dev` to start.

---

### 8.5 Running Locally

You need **two separate terminal windows** — one for the frontend and one for the backend.

**Terminal 1 — Start the backend server:**
```bash
cd server
npm run dev
# ✅ Server running at http://localhost:5000
```

**Terminal 2 — Start the frontend:**
```bash
cd client
npm run dev
# ✅ Frontend running at http://localhost:5173
```

> 💡 **Tip:** If you get `port already in use`, Vite will automatically try the next port (5174, 5175, etc.). Just open whichever URL it shows.

Then open your browser at **http://localhost:5173**

### 8.6 First-Time Setup

After logging in for the first time:
1. Go to `/api/db/setup` to seed the initial workspace and demo data
2. Log in with your Supabase user credentials
3. The system will automatically detect your role from the database

---

## 9. Deployment

The application is configured for one-click deployment to **Render.com**.

### 9.1 Render.com (Production)

The `render.yaml` file defines the deployment:

```yaml
# The Node.js server serves both the API and the built React frontend
Build command: cd client && npm install && npm run build
Start command: cd server && node server.js
```

In production, the Express server:
1. Serves the compiled React SPA from `client/dist/`
2. Handles all API routes under `/api/*`
3. Returns `index.html` for all other routes (client-side routing)

### 9.2 Environment Variables on Render

Set all variables from `.env.example` in your Render service's **Environment** tab.

---

## 10. Security

### 10.1 Authentication

- **Supabase Auth** handles user registration, login, and JWT issuance
- **JWT Verification** — all backend routes verify the Supabase JWT before processing
- **Row-Level Security (RLS)** — Supabase enforces per-user data access at the database level

### 10.2 API Security

- **CORS** — Strict allowlist of origins (localhost ports + Render.com domain)
- **File size limits** — 50 MB JSON body limit, 100 MB video upload limit
- **Service Role Key** — never exposed to the frontend; used only server-side for privileged Supabase operations

---

## 11. Conclusion

Lumina AI demonstrates how modern web technologies and large language models can be combined to build a genuinely useful educational platform. Key achievements include:

- **Streaming AI Chat** with multi-modal support (text, image, document, video)
- **Live webcam recording** integrated directly into the chat and video analysis workflows
- **AI-powered quiz generation** using Groq LLaMA 3.3 70B — admins define the topic, AI writes the questions
- **Role-based multi-tenant architecture** with Super Admin, Admin, and Student roles
- **Full dark/light mode** with persistent theme preferences
- **Production deployment** on Render.com with a single configuration file
- **Real-time SSE streaming** — AI responses appear word-by-word for a natural feel

---

## About

**Lumina AI** — AI-Powered Learning Platform  
Built with React 19, Node.js, Groq AI, and Supabase  
Designed as a college capstone project

**Languages:** JavaScript (React + Node.js)  
**AI Models:** Groq LLaMA 3.3 70B · Groq Whisper Large V3  
**Database:** Supabase (PostgreSQL)  
**Deployment:** Render.com
