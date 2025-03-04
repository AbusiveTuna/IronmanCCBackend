import pool from "./view/db.js";

export const createNewGame = async (captainOne, teamOne, captainTwo, teamTwo) => {
    const client = await pool.connect();
    try {
        const shotCodes = generateShotCodes();
        const result = await client.query(
            `INSERT INTO battleship_bingo (team_one_name, captain_one_name, team_one_board, 
                                       team_two_name, captain_two_name, team_two_board, shot_codes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING competition_id`,
            [teamOne, captainOne, '[]', teamTwo, captainTwo, '[]', JSON.stringify(shotCodes)]
        );

        const competitionId = result.rows[0].competition_id;

        const captainOneId = `${captainOne}-${competitionId}`;
        const captainTwoId = `${captainTwo}-${competitionId}`;

        return { competitionId, captainOneId, captainTwoId };
    } catch (error) {
        console.error("Error creating new game:", error);
        throw error;
    } finally {
        client.release();
    }
};

export const saveBoardPlacement = async (captainName, compId, placedShips) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT captain_one_name, captain_two_name, team_one_board, team_two_board
             FROM battleship_bingo WHERE competition_id = $1`,
            [compId]
        );

        if (result.rows.length === 0) {
            console.error("Competition not found.");
            throw new Error("comp not found");
        }

        const { captain_one_name, captain_two_name, team_one_board, team_two_board } = result.rows[0];
        let columnToUpdate;

        if (captainName == captain_one_name) {
            if (team_one_board !== "[]") {
                console.log("Team One board already submitted. Cannot overwrite.");
                throw new Error("Team one board already there");
            }
            columnToUpdate = "team_one_board";
        } else if (captainName === captain_two_name) {
            if (team_two_board !== "[]") {
                console.log("Team Two board already submitted. Cannot overwrite.");
                throw new Error("Team two board already there");
            }
            columnToUpdate = "team_two_board";
        } else {
            console.log("Captain name does not match any team.");
            throw new Error("Tcant find captain");
        }

        await client.query(
            `UPDATE battleship_bingo 
             SET ${columnToUpdate} = $1 
             WHERE competition_id = $2`,
            [JSON.stringify(placedShips), compId]
        );

        return { success: true, message: "Board saved successfully." };
    } catch (error) {
        console.error("Error saving board placement:", error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
};

export const getCompetitionById = async (compId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM battleship_bingo WHERE competition_id = $1`,
            [compId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error("Error fetching competition by ID:", error);
        throw error;
    } finally {
        client.release();
    }
};

export const getAllCompetitionIds = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(`SELECT competition_id FROM battleship_bingo`);
        return result.rows.map(row => row.competition_id);
    } catch (error) {
        console.error("Error fetching all competition IDs:", error);
        throw error;
    } finally {
        client.release();
    }
};


const generateShotCodes = (count = 200) => {
    const codes = new Set();
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    while (codes.size < count) {
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        codes.add(code);
    }

    return Array.from(codes);
};
