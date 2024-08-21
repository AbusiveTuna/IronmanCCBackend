import pool from './db.js';

const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS temple_competition_data (
                competition_id INTEGER PRIMARY KEY,
                results JSONB NOT NULL
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS competition_results (
                competition_id INTEGER PRIMARY KEY,
                results JSONB NOT NULL,
                team_totals JSONB NOT NULL
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS sheet_data (
                competition_id INTEGER PRIMARY KEY,
                data JSONB NOT NULL
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS purple_data (
                competition_id INTEGER PRIMARY KEY,
                data JSONB NOT NULL
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS justen_tbow (
                id SERIAL PRIMARY KEY,
                kc INTEGER NOT NULL,
                rank INTEGER NOT NULL
            )
        `);

    } finally {
        client.release();
    }
};

export { createTables };