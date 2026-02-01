const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Support local individual params as fallback
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Test connection and initialize tables
const initDB = async () => {
    try {
        // Just verify connection
        const now = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL Connected:', now.rows[0].now);

        // Create Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                google_id VARCHAR(255) UNIQUE,
                picture VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Itineraries table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS itineraries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                destination VARCHAR(255) NOT NULL,
                plan_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('❌ Database initialization error:', err);
        // Don't crash the whole process in serverless env, but log it clearly
    }
};

initDB();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
