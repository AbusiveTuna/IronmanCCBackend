import { Router } from 'express';
import express from 'express';
import { createNewGame, saveBoardPlacement, getCompetitionById, getAllCompetitionIds } from './battleshipModels.js';

const router = Router();
router.use(express.json());

router.post('/battleship-new-game', async (req, res) => {
    const { captainOne, teamOne, captainTwo, teamTwo } = req.body;
    console.log("Attempting to create new game for: ", captainOne, teamOne, captainTwo, teamTwo);

    if (!captainOne || !teamOne || !captainTwo || !teamTwo) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const result = await createNewGame(captainOne, teamOne, captainTwo, teamTwo);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to create game." });
    }
});

router.post('/battleship-save-board', async (req, res) => {
    const { captainName, compId, placedShips } = req.body;

    console.log("Attempting to save board for:", captainName, "Competition ID:", compId);

    if (!captainName || !compId || !placedShips || placedShips.length === 0) {
        return res.status(400).json({ error: "Invalid board data." });
    }

    try {
        const result = await saveBoardPlacement(captainName, compId, placedShips);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ message: "Board saved successfully." });

    } catch (error) {
        console.error("Error saving board:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.get("/battleship-game/:compId", async (req, res) => {
    const { compId } = req.params;

    try {
        const gameData = await getMaskedGameState(compId);
        if (!gameData) {
            return res.status(404).json({ error: "Competition not found." });
        }

        res.json(gameData);
    } catch (error) {
        console.error("Error fetching game data:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.get("/admin-battleship-game/:compId", async (req, res) => {
    const { compId } = req.params;

    try {
        const gameData = await getCompetitionById(compId);
        if (!gameData) {
            return res.status(404).json({ error: "Competition not found." });
        }

        res.json(gameData);
    } catch (error) {
        console.error("Error retrieving competition:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

router.get("/battleship-all-games", async (req, res) => {
    try {
        const competitionIds = await getAllCompetitionIds();
        res.json({ competitionIds });
    } catch (error) {
        console.error("Error retrieving competition IDs:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

export default router;