
# 🚀 Vercel Deployment Guide: TravelTales

This guide covers deploying the Frontend, Backend, and Database using Vercel.

---

## Part 1: Prerequisites
1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub Repo**: Ensure your latest code (with `vercel.json`) is pushed to GitHub.

---

## Part 2: Database Setup (Vercel Marketplace / Neon)
Vercel now uses **Marketplace Integrations** for databases. The official Vercel Postgres is powered by **Neon**.

1.  Go to your Vercel Project Dashboard.
2.  Click on the **Storage** tab.
3.  If you don't see "Create Database", click **Connect Store** or **Browse Marketplace**.
4.  Search for **"Vercel Postgres"** (or **Neon**) and click **Install/Integrate**.
5.  Select your **TravelTales** project and region.
6.  Once created, go to the **.env.local** tab in the database view.
7.  **Copy the variables**: `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`.
    *   **Where to find it?** inside the Storage tab, look for a sub-menu called **".env.local"**, **"Quickstart"**, or **"Connection Details"**. You will see a button to "Show Secret" or "Copy Snippet".

> **Alternative**: If you still can't find it, go directly to [vercel.com/marketplace/vercel-postgres](https://vercel.com/marketplace/vercel-postgres) and click "Add Integration".

---

## Part 3: Deploying the Application

1.  Go to Vercel Dashboard -> **Add New...** -> **Project**.
2.  Import your GitHub Repository (`TravelTales`).
3.  **Configure Project**:
    *   **Framework Preset**: Select **Vite**.
    *   **Root Directory**: Leave as `./` (Since we have `vercel.json` at root).
    *   **Environment Variables**: Add the following:
        *   `GROQ_API_KEY`: Your key from Groq Console.
        *   `JWT_SECRET`: A random string (e.g., `my_secret_key_123`).
        *   `POSTGRES_URL`, `POSTGRES_USER`, etc. (Paste the values from Part 2).
        *   `NODE_ENV`: `production`.
4.  **Click Deploy**.

---

## Part 3.1: Build & Development Settings
If Vercel asks for specific build commands (it usually auto-detects, but just in case):

-   **Build Command**: `cd client && npm install && npm run build`
-   **Output Directory**: `client/dist`
-   **Install Command**: `npm install` (at root, or Vercel will handle it)

> [!TIP]
> Since we have a `vercel.json` at the root, Vercel will use the instructions there to build the server (Serverless Functions) and the client (Static Build).

---

## Part 4: Finalizing Configuration

1.  After deployment, Vercel will build both the Client (Vite) and Server (Node.js).
2.  The `vercel.json` file I added acts as the traffic controller:
    *   Requests to `/api/*` -> Route to Server Function.
    *   Requests to `/*` -> Route to React Client.
3.  **Database Migration**:
    *   Vercel might not run your local `db.js` initialization automatically.
    *   You may need to connect to the database via command line or a GUI (like pgAdmin) using the connection string to create the initial tables (`users`, `itineraries`, `feedbacks`).
    *   *Alternatively*, since our `db.js` has `CREATE TABLE IF NOT EXISTS` queries, they might run on the first API hit! (Try logging in to trigger it).

---

## 🎉 Common Troubleshooting

*   **Error: "Function not found"**: Check if `vercel.json` is at the root directory.
*   **Error: "Database connection failed"**: Ensure you added the `POSTGRES_URL` to the Environment Variables in Vercel Settings.
*   **Localhost works but Vercel doesn't**: Open the **Logs** tab in Vercel to see server-side errors.

**You are ready to launch! 🚀**
