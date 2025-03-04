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
            if (Array.isArray(team_one_board) && team_one_board.length > 0) {
                console.log("Team One board already submitted. Cannot overwrite.");
                throw new Error("Team one board already there");
            }
            columnToUpdate = "team_one_board";
        } else if (captainName === captain_two_name) {
            if (Array.isArray(team_two_board) && team_two_board.length > 0) {
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

export const getMaskedGameState = async (compId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT team_one_name, captain_one_name, team_one_revealed, 
                    team_two_name, captain_two_name, team_two_revealed 
             FROM battleship_bingo 
             WHERE competition_id = $1`,
            [compId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const { 
            team_one_name, captain_one_name, team_one_revealed, 
            team_two_name, captain_two_name, team_two_revealed 
        } = result.rows[0];

        return {
            competitionId: compId,
            teamOne: { 
                name: team_one_name, 
                captain: captain_one_name, 
                board: team_one_revealed || [] 
            },
            teamTwo: { 
                name: team_two_name, 
                captain: captain_two_name, 
                board: team_two_revealed || [] 
            }
        };

    } catch (error) {
        console.error("Error retrieving masked game state:", error);
        throw error;
    } finally {
        client.release();
    }
};

export const fireShot = async (compId, team, row, col, shotCode) => {
    const client = await pool.connect();
    try {
        // Fetch game data
        const gameResult = await client.query(
            `SELECT team_one_board, team_two_board, team_one_revealed, team_two_revealed, shot_codes 
             FROM battleship_bingo WHERE competition_id = $1`,
            [compId]
        );

        if (gameResult.rows.length === 0) {
            return { error: "Game not found." };
        }

        let { team_one_board, team_two_board, team_one_revealed, team_two_revealed, shot_codes } = gameResult.rows[0];

        team_one_board = JSON.parse(team_one_board);
        team_two_board = JSON.parse(team_two_board);
        team_one_revealed = JSON.parse(team_one_revealed);
        team_two_revealed = JSON.parse(team_two_revealed);
        shot_codes = JSON.parse(shot_codes);

        // Validate shot code
        if (!shot_codes.includes(shotCode)) {
            return { error: "Invalid shot code." };
        }

        // Determine which board is being fired upon
        let targetBoard = team === "teamOne" ? team_two_board : team_one_board;
        let revealedBoard = team === "teamOne" ? team_two_revealed : team_one_revealed;
        let revealedColumn = team === "teamOne" ? "team_two_revealed" : "team_one_revealed";

        // Check if the shot has already been fired
        if (revealedBoard.some((tile) => tile.row === row && tile.col === col)) {
            return { error: "This tile has already been fired upon." };
        }

        // Check if it's a hit or a miss
        const isHit = targetBoard.some((tile) => tile.row === row && tile.col === col);
        revealedBoard.push({ row, col, isHit });

        // Remove used shot code
        shot_codes = shot_codes.filter(code => code !== shotCode);

        // Update the database
        await client.query(
            `UPDATE battleship_bingo SET ${revealedColumn} = $1, shot_codes = $2 WHERE competition_id = $3`,
            [JSON.stringify(revealedBoard), JSON.stringify(shot_codes), compId]
        );

        return { row, col, isHit };

    } catch (error) {
        console.error("Error processing shot:", error);
        throw error;
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
