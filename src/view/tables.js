import pool from './db.js';

const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS battleship_bingo (
                competition_id SERIAL PRIMARY KEY,
                team_one_name VARCHAR(255) NOT NULL,
                captain_one_name VARCHAR(255) NOT NULL,
                team_one_board JSONB NOT NULL,
                team_two_name VARCHAR(255) NOT NULL,
                captain_two_name VARCHAR(255) NOT NULL,
                team_two_board JSONB NOT NULL,
                shot_codes JSONB NOT NULL DEFAULT '[]'::JSONB
            );
        `);
        
        console.log("Tables created successfully.");
    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        client.release();
    }
};

export { createTables };
