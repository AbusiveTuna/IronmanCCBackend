import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'test',
    host: 'localhost',
    database: 'ironmancc',
    password: 'test',
    port: 5432,
});

const createTable = async () => {
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
    } finally {
        client.release();
    }
};

const saveTempleData = async (competitionId, results) => {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO temple_competition_data (competition_id, results)
             VALUES ($1, $2)
             ON CONFLICT (competition_id)
             DO UPDATE SET results = EXCLUDED.results`,
            [competitionId, results]
        );
    } finally {
        client.release();
    }
};

const getLatestTempleData = async (competitionId) => {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT results FROM temple_competition_data WHERE competition_id = $1`,
            [competitionId]
        );
        return res.rows[0] ? res.rows[0].results : null;
    } finally {
        client.release();
    }
};

const saveCompetitionResults = async (competitionId, results, teamTotals) => {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO competition_results (competition_id, results, team_totals)
             VALUES ($1, $2, $3)
             ON CONFLICT (competition_id)
             DO UPDATE SET results = EXCLUDED.results, team_totals = EXCLUDED.team_totals`,
            [competitionId, results, teamTotals]
        );
    } finally {
        client.release();
    }
};

const getCompetitionResults = async (competitionId) => {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT results, team_totals FROM competition_results WHERE competition_id = $1`,
            [competitionId]
        );
        return res.rows[0] ? { results: res.rows[0].results, team_totals: res.rows[0].team_totals } : null;
    } finally {
        client.release();
    }
};

export { createTable, saveTempleData, getLatestTempleData, saveCompetitionResults, getCompetitionResults };
