
# 🚀 Vercel Deployment Guide: TravelTales (Railway Database)

This guide covers deploying the Frontend and Backend on **Vercel**, while using **Railway** for the Database.

---

## Part 1: Prerequisites
1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **Railway Account**: Sign up at [railway.app](https://railway.app).
3.  **GitHub Repo**: Ensure your latest code (with root `vercel.json`) is pushed to GitHub.

---

## Part 2: Database Setup (Railway)
We will use **Railway** for the persistent PostgreSQL database.

1.  Login to [Railway.app](https://railway.app).
2.  Click **New Project** -> **Provision PostgreSQL**.
3.  Once the database is created, click on the **PostgreSQL** service.
4.  Go to the **Variables** tab.
5.  Copy the **`DATABASE_URL`**.

---

## Part 3: Deploying the Application to Vercel

1.  Go to Vercel Dashboard -> **Add New...** -> **Project**.
2.  Import your GitHub Repository (`TravelTales`).
3.  **Configure Project**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: Leave as `./` (Since we have `vercel.json` at root).
    *   **Environment Variables**: Add the following:
        *   `DATABASE_URL`: (Paste the link from Railway Part 2).
        *   `GROQ_API_KEY`: Your key.
        *   `JWT_SECRET`: A random string.
        *   `NODE_ENV`: `production`.

---

## Part 3.1: Build & Development Settings
Vercel will auto-detect settings, but ensure these are set:
-   **Build Command**: `cd client && npm install && npm run build`
-   **Output Directory**: `client/dist`
-   **Install Command**: `npm install` (at root)

---

## 🔍 Why this setup?
-   **Reliable Database**: Railway's PostgreSQL is persistent and powerful.
-   **Unified Hosting**: Both your Frontend and Backend API live on Vercel for fast performance and simple routing.

---

## ✅ Deployment Checklist
- [ ] Root `vercel.json` exists in code.
- [ ] `server/index.js` exports `app`.
- [ ] Railway `DATABASE_URL` is pasted into Vercel environment variables.
