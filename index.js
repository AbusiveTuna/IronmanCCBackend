

import express from 'express';
import axios from 'axios';
import { templeMap } from './resources/2024_templeMap.js';
import { updateGoogleSheet } from './sheets.js';
import { createTable, saveTempleData, getLatestTempleData, saveCompetitionResults, getCompetitionResults } from './database.js';

const app = express();
const port = process.env.PORT || 3000;
const compId = 24737 //26996;

let templeSkills = [];
let isFetching = false;

// Define combined categories
const combinedSkillsMap = {
    "Combined_DKS": ["Dagannoth_Prime", "Dagannoth_Rex", "Dagannoth_Supreme"]
};

const getTempleSkills = () => {
    templeSkills = templeMap.map(row => row[row.length - 1]);
};

const fetchCompetitionInfo = async () => {
    if (isFetching) {
        console.log("Fetch operation already in progress...");
        return;
    }
    isFetching = true;

    let results = {};
    for (const skill of templeSkills) {
        await fetchSkillData(skill, results);
    }

    // Manually combine Dagannoth Prime, Rex, and Supreme into Combined_DKS
    combineDKSResults(results);

    await saveTempleData(compId, results);
    isFetching = false;
};

const fetchSkillData = async (skill, results) => {
    try {
        console.log("Fetching data for " + skill);
        const response = await axios.get(`https://templeosrs.com/api/competition_info.php?id=${compId}&skill=${skill}`);
        const data = response.data.data;

        if (!results[skill]) {
            results[skill] = [];
        }

        data.participants.forEach(participant => {
            results[skill].push({
                playerName: participant.username,
                xpGained: participant.xp_gained,
                teamName: participant.team_name
            });
        });

    } catch (error) {
        console.error(`Error fetching data for skill ${skill}:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
};

const combineDKSResults = (results) => {
    const combinedSkill = "Combined_DKS";
    results[combinedSkill] = [];

    for (const subSkill of combinedSkillsMap[combinedSkill]) {
        if (results[subSkill]) {
            results[subSkill].forEach(participant => {
                const existingParticipant = results[combinedSkill].find(p => p.playerName === participant.playerName);
                if (existingParticipant) {
                    existingParticipant.xpGained += participant.xpGained;
                } else {
                    results[combinedSkill].push({ ...participant });
                }
            });
        }
    }
};

const getAndSortLatestResults = async () => {
    const latestResults = await getLatestTempleData(compId);

    for (const skillIndex in latestResults) {
        if (Array.isArray(latestResults[skillIndex])) {
            latestResults[skillIndex] = latestResults[skillIndex].filter(player => player.xpGained > 0);

            latestResults[skillIndex].sort((a, b) => b.xpGained - a.xpGained);

            let topPlayers = [];
            for (let i = 0; i < latestResults[skillIndex].length; i++) {
                if (i < 10 || (i >= 10 && latestResults[skillIndex][i].xpGained === latestResults[skillIndex][i - 1].xpGained)) {
                    topPlayers.push(latestResults[skillIndex][i]);
                } else {
                    break;
                }
            }
            latestResults[skillIndex] = topPlayers;
        }
    }

    return latestResults;
};

const assignPoints = (sortedResults) => {
    const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

    for (const skill in sortedResults) {
        if (Array.isArray(sortedResults[skill])) {
            let currentPointsIndex = 0;

            for (let i = 0; i < sortedResults[skill].length; i++) {
                if (i > 0 && sortedResults[skill][i].xpGained === sortedResults[skill][i - 1].xpGained) {
                    sortedResults[skill][i].points = sortedResults[skill][i - 1].points;
                } else {
                    sortedResults[skill][i].points = points[currentPointsIndex] || 0;
                }
                currentPointsIndex++;
            }
        }
    }

    return sortedResults;
};

const getTeamTotals = (results) => {
    const teamTotals = {};

    for (const skill in results) {
        if (Array.isArray(results[skill])) {
            results[skill].forEach(player => {
                if (!teamTotals[player.teamName]) {
                    teamTotals[player.teamName] = 0;
                }
                teamTotals[player.teamName] += player.points;
            });
        }
    }

    return teamTotals;
};

const fetchAndProcessData = async () => {
    console.log("Starting Temple Fetch");
    await fetchCompetitionInfo();
    let latestResults = await getAndSortLatestResults();
    latestResults = assignPoints(latestResults);
    const teamTotals = getTeamTotals(latestResults);

    await saveCompetitionResults(compId, latestResults, teamTotals);

    updateGoogleSheet(latestResults, teamTotals);
};

app.get('/results', async (req, res) => {
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

app.get('/results/:skillName', async (req, res) => {
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

app.get('/teamTotals', async (req, res) => {
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

app.get('/fetchTempleData', async (req, res) => {
    if (isFetching) {
        res.status(200).send("Fetch already running");
    } else {
        fetchAndProcessData();
        res.status(200).send("Fetch started");
    }
});

app.listen(port, async () => {
    console.log("Running on port: " + port);
    await createTable();
    getTempleSkills();

    await fetchAndProcessData();

    setInterval(() => {
        fetchAndProcessData();
    }, 3600000);
});
