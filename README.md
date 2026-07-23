# SyncWatch 🍿

SyncWatch is a real-time synchronized movie watch party platform. It allows users to create virtual cinema rooms, sync video playback across all members in real-time, communicate via live chat, send animated reactions, toggle voice/video status, and interact with a Gemini-powered AI movie assistant.

---

## 🚀 Key Features

- **Real-Time Playback Synchronization**: Fully synchronized video player (play, pause, seek, speed adjustments) using Socket.io room events. If one member pauses or seeks, everyone's player stays perfectly in sync.
- **Interactive Live Chat**: Keep the conversation going with a real-time sidebar chat, featuring system messages for user join/leave events and media changes.
- **Gemini AI Movie Assistant**: A server-side Google Gemini-powered AI assistant that answers questions, provides trivia, summaries, and movie facts directly in the chat window.
- **Floating Reactions**: Express your feelings in real-time! Send emojis that float up on top of the video screen for all members to see.
- **Media Status Sync**: Control and share microphone and camera toggle states among room participants.
- **Multi-Source Video Hosting**:
  - Watch pre-seeded streaming movies (e.g. Sintel and other sci-fi clips).
  - Upload and host your own local video files to the server's uploads folder (powered by Multer).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion (Framer Motion), Lucide React
- **Backend**: Node.js, Express, Socket.io (WebSockets), Multer, TypeScript, esbuild (bundling)
- **AI Engine**: Google Gemini API via `@google/genai`

---

## 💻 Local Setup

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the Repository

```bash
git clone https://github.com/AbhimanyuGuleria/syncwatch.git
cd syncwatch
```

### 2. Install Dependencies

You can use npm to install dependencies:

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your API key:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your **Gemini API Key**:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Get a free API key at [Google AI Studio](https://aistudio.google.com/).

### 4. Run the Development Server

Start the full-stack dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## 🌐 Deployment (Render)

This project is configured with a **Render Blueprint** (`render.yaml`), making deployment straightforward.

### One-Click Deployment Steps

1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New** in the top right corner and select **Blueprint**.
3. Connect your GitHub repository (`https://github.com/AbhimanyuGuleria/syncwatch.git`).
4. Render will automatically detect the `render.yaml` configuration.
5. In the configuration fields, enter your **`GEMINI_API_KEY`** environment variable under the web service variables.
6. Click **Deploy**.

Render will automatically install dependencies, build the React SPA front-end, bundle the Express back-end, and serve the application on their global network with WebSocket support!

---

## 📁 Project Structure

```
├── dist/                # Production build output
├── src/                 # React Frontend Application
│   ├── components/      # UI components (VideoPlayer, ChatPanel, etc.)
│   ├── data/            # Pre-seeded movies dataset
│   ├── lib/             # API and socket helper instances
│   ├── App.tsx          # Main view controller
│   └── index.css        # Main stylesheet
├── server.ts            # Express + Socket.io Server logic
├── render.yaml          # Render Blueprint deployment config
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite bundler configuration
```
