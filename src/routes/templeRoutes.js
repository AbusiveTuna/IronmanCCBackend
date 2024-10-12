import { Router } from 'express';
const router = Router();

import {  getCompetitionResults, getJustenTbow, getBingoCompetitionData, saveBingoCompetitionData } from '../models/templeModels.js';
import { getSheetData } from '../models/sheetModels.js';
import { fetchAndProcessData } from '../controllers/controller.js'
import { grabPurpleInfo } from '../controllers/sheets.js';

const compId = 26996;

/*
 * Returns: 
*/

router.get('/results', async (req, res) => {
    try {
        const data = await getCompetitionResults(compId);
        if (data) {
            res.json(data);
        } else {
            res.status(404).send('Results not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

/*
 * Returns: 
*/

router.get('/results/:skillName', async (req, res) => {
    try {
        const data = await getCompetitionResults(compId);
        const skillName = req.params.skillName;
        if (data.results[skillName]) {
            res.json(data.results[skillName]);
        } else {
            res.status(404).send('Results not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

/*
 * Returns: 
*/

router.get('/teamTotals', async (req, res) => {
    try {
        const data = await getCompetitionResults(compId);
        if (data.team_totals) {
            res.json(data.team_totals);
        } else {
            res.status(404).send('Results not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

/*
 * Returns: A confirmation that the fetch has started to run
*/

router.get('/fetchTempleData', async (req,res) => {
        res.status(200).send("Fetch started");
        fetchAndProcessData();
});

/*
 * Route: Used for grabbing sheet data for competitions
 * Returns: google sheet data 
*/

router.get('/fetchSheetData', async (req,res) => {
       const sheetData = await getSheetData(compId);
       if(sheetData) {
        res.json(sheetData);
       }
       else{
        res.status(404).send('No Sheet Data Found');
       }
});

/*
 * Route: Used for grabbing the purples information from sheets
 * Returns: purple data
*/
router.get('/fetchPurpleData', async (req,res) => {
    const purpleData = await grabPurpleInfo(compId);
    if(purpleData) {
     res.json(purpleData);
    }
    else{
     res.status(404).send('No Purple Data Found');
    }
});

/*
 * Route: Used for updating didJustenGetTbowYet 
 * Returns: KC and Current Rank for CoX
*/
router.get('/justenTbow', async (req,res) => {
    const justenData = await getJustenTbow();
    if(justenData){
        res.json(justenData);
    } else {
        res.status(404).send('No Justen Data Found');
    }
});

/*
 * Route: Get Bingo competition data
 * Returns: JSON with results for teamA and teamB
 */
router.get('/lukas-data', async (req, res) => {
    try {
        const data = await getBingoCompetitionData();
        if (data) {
            res.json(data);
        } else {
            res.status(404).send('Competition data not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

/*
 * Route: Save Bingo competition results
 * Accepts: JSON with teamA and teamB results
 */
router.post('/save-lukas-data', async (req, res) => {
    const { teamA, teamB } = req.body;
    try {
        if (!teamA || !teamB) {
            return res.status(400).send('Invalid data structure');
        }

        await saveBingoCompetitionData(teamA, teamB);
        res.status(200).send('Data saved successfully');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

export default router;