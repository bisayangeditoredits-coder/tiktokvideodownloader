# TikSave Pro

## Features
- Download TikTok videos without watermark
- HD, SD, and Audio-only downloads
- Batch download up to 5 videos
- PWA — installable on mobile
- No login required
- Download history (local)

## Local Development
```bash
# Clone
git clone https://github.com/bisayangeditoredits-coder/tiktokvideodownloader.git
cd tiktokvideodownloader

# Backend
cd backend
npm install
cp .env.example .env
npm start

# Frontend
cd ../frontend
# Open index.html in browser OR use Live Server
```

## Environment Variables
PORT=3001
FRONTEND_URL=http://localhost:5500

## Deploy
- Frontend: Connect `/frontend` to Vercel
- Backend: Connect `/backend` to Render
- Set `FRONTEND_URL` env var on Render to your Vercel URL

[![Deploy Frontend](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bisayangeditoredits-coder/tiktokvideodownloader)
