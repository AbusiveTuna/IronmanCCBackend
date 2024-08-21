import pool from '../view/db.js';

export const saveSheetData = async (competitionId, data) => {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO sheet_data (competition_id, data)
             VALUES ($1, $2)
             ON CONFLICT (competition_id)
             DO UPDATE SET data = EXCLUDED.data`,
            [competitionId, JSON.stringify(data)]
        );
    } finally {
        client.release();
    }
};

export const getSheetData = async (competitionId) => {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT data FROM sheet_data WHERE competition_id = $1`,
            [competitionId]
        );
        return res.rows.length > 0 ? res.rows[0].data : null;
    } finally {
        client.release();
    }
};

export const savePurpleData = async (competitionId, data) => {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO purple_data (competition_id, data)
             VALUES ($1, $2)
             ON CONFLICT (competition_id)
             DO UPDATE SET data = EXCLUDED.data`,
            [competitionId, JSON.stringify(data)]
        );
    } finally {
        client.release();
    }
};

export const getPurpleData = async (competitionId) => {
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT data FROM purple_data WHERE competition_id = $1`,
            [competitionId]
        );
        return res.rows.length > 0 ? res.rows[0].data : null;
    } finally {
        client.release();
    }
};