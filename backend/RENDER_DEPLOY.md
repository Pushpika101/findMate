# Deploying the backend to Render

This document explains how to deploy the `backend/` (Node/Express + Socket.IO) to Render.com.

Prerequisites
- A GitHub repository for this project (already present).
- A Render account and GitHub connected.

Quick steps (recommended)
1. Push your current main branch to GitHub:
   ```bash
   git add .
   git commit -m "Prepare backend for Render: add start script and render manifest"
   git push origin main
   ```

2. Create a new Web Service on Render
   - In Render dashboard click "New" → "Web Service".
   - Connect the GitHub repo and select the `main` branch (or whichever branch you use).
   - For the "Root Directory" set to `/` (we use a render.yaml manifest) or leave default.
   - If creating manually, set the following build & start commands:
     - Build Command: `cd backend && npm ci`
     - Start Command: `cd backend && npm start`
   - Environment: `Node` (Render will detect this if you point to the root manifest).

3. Add required Environment Variables (Render Dashboard → Service → Environment)
   - Add secrets — do NOT commit these into repo.
   - Typical env vars used by this project:
     - `DATABASE_URL` (Postgres connection string)
     - `JWT_SECRET`
     - `CLIENT_URL_WEB` (e.g., https://your-web-app.example)
     - `CLIENT_URL_MOBILE` (your mobile app scheme or testing URL)
     - `SENDGRID_API_KEY`
     - `CLOUDINARY_URL` or individual Cloudinary vars
     - `SENTRY_DSN` (optional)
   - Render exposes a `PORT` env var automatically which the app uses.

4. Persistent storage (optional)
   - The app currently serves local files under `/uploads` for development. If you need user uploads in production, use a cloud storage provider (S3 or Cloudinary). Render does provide disks for paid plans — but ephemeral file storage is not recommended.

5. Build & Deploy
   - After setting env vars, trigger a deploy. Render will run the commands in `render.yaml` or the build/start commands you set.

6. Verify
   - Visit `https://<your-service>.onrender.com/health` to confirm the server responds.
   - Check logs for any DB connection or environment errors.

Socket.IO notes
- This app uses Socket.IO and expects to communicate with clients from mobile/web. Make sure `CLIENT_URL_WEB` and `CLIENT_URL_MOBILE` are set to the correct origin(s) and that the client-side code uses the Render service URL for socket connection.

Troubleshooting
- If the process exits with port errors, confirm `process.env.PORT` is used (it is in `server.js`).
- If missing packages occur, ensure `package.json` in `backend/` declares dependencies (it does). The build command uses `npm ci` to install pinned versions.

Security
- Never commit secrets to the repo. Use Render's dashboard to add environment variables and secrets.

That's it — once Render finishes the first deploy and the health route responds, update the client apps to use the new backend URL.
