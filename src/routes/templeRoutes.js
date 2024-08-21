import { Router } from 'express';
const router = Router();

import {  getCompetitionResults, getJustenTbow } from '../models/templeModels.js';
import { getSheetData } from '../models/sheetModels.js';
import { fetchAndProcessData } from '../controllers/controller.js'

const compId = 26996;

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

router.get('/fetchTempleData', async (req,res) => {
    if (isFetching) {
        res.status(200).send("Fetch already running");
    }
    else {
        fetchAndProcessData();
        res.status(200).send("Fetch started");
    }
});

router.get('/fetchSheetData', async (req,res) => {
       const sheetData = await getSheetData(compId);
       if(sheetData) {
        res.json(sheetData);
       }
       else{
        res.status(404).send('No Sheet Data Found');
       }
});

router.get('/fetchPurpleData', async (req,res) => {
    const purpleData = await grabPurpleInfo(compId);
    if(purpleData) {
     res.json(purpleData);
    }
    else{
     res.status(404).send('No Purple Data Found');
    }
});

router.get('/justenTbow', async (req,res) => {
    const justenData = await getJustenTbow();
    if(justenData){
        res.json(justenData);
    } else {
        res.status(404).send('No Justen Data Found');
    }
});

export default router;