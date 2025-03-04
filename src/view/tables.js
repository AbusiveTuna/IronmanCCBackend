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
        
        const result = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name='battleship_bingo' AND column_name IN ('team_one_revealed', 'team_two_revealed');
        `);
    
        const existingColumns = result.rows.map(row => row.column_name);
    
        if (!existingColumns.includes('team_one_revealed')) {
            await client.query(`ALTER TABLE battleship_bingo ADD COLUMN team_one_revealed JSONB DEFAULT '[]'`);
        }
        if (!existingColumns.includes('team_two_revealed')) {
            await client.query(`ALTER TABLE battleship_bingo ADD COLUMN team_two_revealed JSONB DEFAULT '[]'`);
        }
        
        console.log("Tables created successfully.");
    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        client.release();
    }
};

export { createTables };
