import pool from "./view/db.js";

export const createNewGame = async (captainOne, teamOne, captainTwo, teamTwo) => {
    const client = await pool.connect();
    try {
        const shotCodesA = generateShotCodes();
        const shotCodesB = generateShotCodes();
        const result = await client.query(
            `INSERT INTO battleship_bingo (team_one_name, captain_one_name, team_one_board, 
                                       team_two_name, captain_two_name, team_two_board, team_one_shot_codes, team_two_shot_codes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING competition_id`,
            [teamOne, captainOne, '[]', teamTwo, captainTwo, '[]', JSON.stringify(shotCodesA), JSON.stringify(shotCodesB)]
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
        console.log(`Processing shot for CompID=${compId}, Team=${team}, Row=${row}, Col=${col}, Code=${shotCode}`);

        const gameResult = await client.query(
            `SELECT team_one_board, team_two_board, team_one_name, team_two_name, team_one_revealed, team_two_revealed, team_one_shot_codes, team_two_shot_codes 
             FROM battleship_bingo WHERE competition_id = $1`,
            [compId]
        );

        if (gameResult.rows.length === 0) {
            console.error("Game not found in database.");
            return { error: "Game not found." };
        }

        let { team_one_board, team_two_board, team_one_name, team_two_name, team_one_revealed, team_two_revealed, team_one_shot_codes, team_two_shot_codes } = gameResult.rows[0];

        try {
            team_one_board = typeof team_one_board === "string" ? JSON.parse(team_one_board) : team_one_board;
            team_two_board = typeof team_two_board === "string" ? JSON.parse(team_two_board) : team_two_board;
            team_one_revealed = typeof team_one_revealed === "string" ? JSON.parse(team_one_revealed) : team_one_revealed || [];
            team_two_revealed = typeof team_two_revealed === "string" ? JSON.parse(team_two_revealed) : team_two_revealed || [];
            team_one_shot_codes = typeof team_one_shot_codes === "string" ? JSON.parse(team_one_shot_codes) : team_one_shot_codes;
            team_two_shot_codes = typeof team_two_shot_codes === "string" ? JSON.parse(team_two_shot_codes) : team_two_shot_codes;

        } catch (parseError) {
            console.error("Error parsing JSON fields:", parseError);
            return { error: `Invalid game data format: ${parseError.message}` };
        }

        console.log("Loaded game data successfully.");

        let targetBoard;
        let revealedBoard;
        let revealedColumn;
        let shot_codes;
        let other_team_codes;
        if(team == team_one_name) {
            targetBoard = team_one_board;
            revealedBoard = team_one_revealed;
            revealedColumn = "team_one_revealed";
            shot_codes = team_one_shot_codes;
            other_team_codes = team_two_shot_codes;
        } else if (team == team_two_name) {
            targetBoard = team_two_board;
            revealedBoard = team_two_revealed;
            revealedColumn = "team_two_revealed";
            shot_codes = team_two_shot_codes;
            other_team_codes = team_one_shot_codes;
        } else {
            return { error: "Could not find team:"}
        }

        if (!shot_codes.includes(shotCode)) {
            if(other_team_codes.includes(shotCode)) {
                return { error: "You're firing at your own team!" };
            } else {
                console.warn("Invalid shot code attempted:", shotCode);
                return { error: "Invalid shot code." };
            }
        }
         
        if (revealedBoard.some((tile) => tile.row === row && tile.col === col)) {
            console.warn(`Tile already fired upon: Row=${row}, Col=${col}`);
            return { error: "This tile has already been fired upon." };
        }

        const hitShip = targetBoard.some((tile) => tile.row === row && tile.col === col);
        revealedBoard.push({ row, col, isHit: true, hitShip });

        shot_codes = shot_codes.filter(code => code !== shotCode);

        console.log(`Shot result: ${hitShip ? "Hit" : "Miss"} at Row=${row}, Col=${col}`);

        await client.query(
            `UPDATE battleship_bingo SET ${revealedColumn} = $1, shot_codes = $2 WHERE competition_id = $3`,
            [JSON.stringify(revealedBoard), JSON.stringify(shot_codes), compId]
        );

        console.log("Shot successfully recorded in database.");
        return { row, col, isHit: true, hitShip }

    } catch (error) {
        console.error("Error processing shot:", error);
        return { error: "Internal server error." };
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


const generateShotCodes = (count = 100) => {
    const codes = new Set();
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    while (codes.size < count) {
        let code = "";
        for (let i = 0; i < 10; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        codes.add(code);
    }

    return Array.from(codes);
};
