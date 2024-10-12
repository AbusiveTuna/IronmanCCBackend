import pool from '../view/db.js';

export const saveJustenTbow = async (kc, rank) => {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO justen_tbow (id, kc, rank)
             VALUES (1, $1, $2)
             ON CONFLICT (id)
             DO UPDATE SET kc = EXCLUDED.kc, rank = EXCLUDED.rank`,
            [kc, rank]
        );
    } finally {
        client.release();
    }
};

export const getJustenTbow = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT kc, rank FROM justen_tbow WHERE id = 1`
        );
        return res.rows[0] ? { kc: res.rows[0].kc, rank: res.rows[0].rank } : null;
    } finally {
        client.release();
    }
};

export const saveTempleData = async (competitionId, results) => {
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

export const getLatestTempleData = async (competitionId) => {
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

export const saveCompetitionResults = async (competitionId, results, teamTotals) => {
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

export const getCompetitionResults = async (competitionId) => {
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

export const getBingoCompetitionData = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT team_a_results, team_b_results FROM bingo_competition LIMIT 1'
        );

        if (result.rowCount === 0) {
            return null; // No data found
        }

        return result.rows[0];  // Return the first row
    } catch (error) {
        console.error("Error fetching competition data:", error.message);
        throw new Error("Database error");
    } finally {
        client.release();
    }
};


export const saveBingoCompetitionData = async (teamA, teamB) => {
    const client = await pool.connect();
    try {
        const validTeamA = JSON.stringify(teamA);
        const validTeamB = JSON.stringify(teamB);

        const result = await client.query('SELECT id FROM bingo_competition LIMIT 1');

        if (result.rowCount === 0) {
            await client.query(
                `
                INSERT INTO bingo_competition (team_a_results, team_b_results, created_at)
                VALUES ($1::jsonb, $2::jsonb, NOW())
                `,
                [validTeamA, validTeamB]
            );
        } else {
            // Update existing data
            await client.query(
                `
                UPDATE bingo_competition
                SET team_a_results = $1::jsonb, team_b_results = $2::jsonb, created_at = NOW()
                WHERE id = $3
                `,
                [validTeamA, validTeamB, result.rows[0].id]
            );
        }
    } catch (error) {
        console.error("Error saving competition data:", error.message);
        throw new Error("Database error");
    } finally {
        client.release();
    }
};



