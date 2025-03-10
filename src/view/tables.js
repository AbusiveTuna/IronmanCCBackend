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
                team_one_shot_codes JSONB NOT NULL DEFAULT '[]'::JSONB,
                team_two_shot_codes JSONB NOT NULL DEFAULT '[]'::JSONB,
                team_one_revealed JSONB DEFAULT '[]'::JSONB,
                team_two_revealed JSONB DEFAULT '[]'::JSONB
            );
        `);

        console.log("Table recreated successfully.");
    } catch (err) {
        console.error("Error recreating table:", err);
    } finally {
        client.release();
    }
};

export { createTables };
