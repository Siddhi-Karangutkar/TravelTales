
# 🚀 Vercel Deployment Guide: TravelTales

This guide covers deploying the Frontend, Backend, and Database using Vercel.

---

## Part 1: Prerequisites
1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub Repo**: Ensure your latest code (with `vercel.json`) is pushed to GitHub.

---

## Part 2: Database Setup (Vercel Postgres)
Since Vercel is serverless, we need a cloud database. Vercel integrates seamlessly with Vercel Postgres.

1.  Go to your Vercel Dashboard -> **Storage**.
2.  Click **Create Database** -> Select **Postgres**.
3.  Name it `traveltales-db` and select the region (closest to you, e.g., `us-east-1` or `ap-south-1`).
4.  Once created, go to the **.env.local** tab in the database view.
5.  **Copy the variables**: `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`.
    *   *You will need these in the next step.*

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
