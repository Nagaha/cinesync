# CineSync

Real-time watch party platform for watching videos together.

## Features
- Room creation with shareable codes
- YouTube video sync
- Real-time chat
- Camera & microphone (WebRTC)

## Deploy on Render

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "CineSync"
git remote add origin https://github.com/YOUR_USERNAME/cinesync.git
git push -u origin main
```

### 2. Deploy Backend
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Root Directory: `server`
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Deploy & copy URL (e.g., `https://cinesync-server.onrender.com`)

### 3. Deploy Frontend
1. New → Static Site
2. Connect same repo
3. Settings:
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. Environment → Variables:
   - `VITE_API_URL` = Your backend URL

### 4. Update Client Config
In `client/vite.config.ts`, set your backend URL:
```typescript
const apiUrl = 'https://your-backend-url.onrender.com';
```

## Local Development
```bash
npm install
npm run dev
```
Server: http://localhost:3001
Client: http://localhost:5173
