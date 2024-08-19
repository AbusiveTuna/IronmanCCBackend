import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { templeMap } from './resources/2024_templeMap.js';
import { updateGoogleSheet, grabSheetInfo, grabPurpleInfo } from './sheets.js';
import { createTable, saveTempleData, getLatestTempleData, saveCompetitionResults, getCompetitionResults, getSheetData, saveSheetData, saveJustenTbow, getJustenTbow,getPurpleData,savePurpleData  } from './database.js';

const app = express();
const port = process.env.PORT || 3000;
const compId = 26996;

app.use(cors());

let templeSkills = [];
let isFetching = false;

const getTempleSkills = () => {
    templeSkills = templeMap.map(row => row[row.length - 1]);
};

const fetchCompetitionInfo = async () => {
    // if (isFetching) {
    //     console.log("Fetch operation already in progress...");
    //     return;
    // }
    // isFetching = true; 

    // let results = {};
    // for (const skill of templeSkills) {
    //     try {
    //         console.log("Fetching data for " + skill);
    //         const response = await axios.get(`https://templeosrs.com/api/competition_info.php?id=${compId}&skill=${skill}`);
    //         const data = response.data.data;

    //         const skillIndex = data.info.skill;
    //         if (!results[skillIndex]) {
    //             results[skillIndex] = [];
    //         }

    //         data.participants.forEach(participant => {
    //             results[skillIndex].push({
    //                 playerName: participant.username,
    //                 xpGained: participant.xp_gained,
    //                 teamName: participant.team_name
    //             });
    //         });

    //     } catch (error) {
    //         console.error(`Error fetching data for skill ${skill}:`, error);
    //     }
    //     await new Promise(resolve => setTimeout(resolve, 10000));
    // }

    // await saveTempleData(compId, results);
    const sheetInfo = await grabSheetInfo();
    await saveSheetData(compId, sheetInfo);
    const purpleInfo = await grabPurpleInfo();
    await savePurpleData(compId,purpleInfo);

    isFetching = false;
};

const getAndSortLatestResults = async () => {
    const latestResults = await getLatestTempleData(compId);

    const dagannothCategories = ['Dagannoth Rex', 'Dagannoth Prime', 'Dagannoth Supreme'];
    const combinedDagannoth = {};

    dagannothCategories.forEach(category => {
        if (latestResults[category]) {
            latestResults[category].forEach(player => {
                const key = `${player.playerName}-${player.teamName}`;
                if (combinedDagannoth[key]) {
                    combinedDagannoth[key].xpGained += player.xpGained;
                } else {
                    combinedDagannoth[key] = { ...player };
                }
            });
            delete latestResults[category];
        }
    });

    latestResults['Combined_DKS'] = Object.values(combinedDagannoth);

    for (const skill in latestResults) {
        if (Array.isArray(latestResults[skill])) {
            latestResults[skill] = latestResults[skill].filter(player => player.xpGained > 0);
            latestResults[skill].sort((a, b) => b.xpGained - a.xpGained);

            let topPlayers = [];
            for (let i = 0; i < latestResults[skill].length; i++) {
                if (i < 10 || (i >= 10 && latestResults[skill][i].xpGained === latestResults[skill][i - 1].xpGained)) {
                    topPlayers.push(latestResults[skill][i]);
                } else {
                    break;
                }
            }
            latestResults[skill] = topPlayers;
        }
    }

    return latestResults;
};

//hard cut off at 10, doesnt handle ties. 
const assignPoints = (sortedResults) => {
    const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

    for (const skill in sortedResults) {
        if (Array.isArray(sortedResults[skill])) {
            for (let i = 0; i < sortedResults[skill].length; i++) {
                if (i < 10) {
                    sortedResults[skill][i].points = points[i];
                } else {
                    sortedResults[skill][i].points = 0;
                }
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

app.get('/fetchTempleData', async (req,res) => {
    if (isFetching) {
        res.status(200).send("Fetch already running");
    }
    else {
        fetchAndProcessData();
        res.status(200).send("Fetch started");
    }
});

app.get('/fetchSheetData', async (req,res) => {
       const sheetData = await getSheetData(compId);
       if(sheetData) {
        res.json(sheetData);
       }
       else{
        res.status(404).send('No Sheet Data Found');
       }
});

app.get('/fetchPurpleData', async (req,res) => {
    const purpleData = await grabPurpleInfo(compId);
    if(purpleData) {
     res.json(purpleData);
    }
    else{
     res.status(404).send('No Purple Data Found');
    }
});

app.get('/justenTbow', async (req,res) => {
    const justenData = await getJustenTbow();
    if(justenData){
        res.json(justenData);
    } else {
        res.status(404).send('No Justen Data Found');
    }
});

const fetchJustenData = async () => {
    const justenLookup = 'https://templeosrs.com/api/player_stats.php?player=Justen&bosses=39';
    const coxLookup = 'https://templeosrs.com/api/skill_hiscores.php?skill=39&gamemode=1';
    let coxKc = 0;
    let rank = 0;
    try {
        const justenResponse = await axios.get(justenLookup);
        coxKc = justenResponse.data.data['Chambers of Xeric'];

    } catch (error) {
        console.error(`Error fetching data for justen:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    try {
        const coxResponse = await axios.get(coxLookup);
        const players = coxResponse.data.data.players;
        for (const playerId in players) {
            if (players.hasOwnProperty(playerId)) {
                const player = players[playerId];
                if(player.username == "Justen"){
                    console.log(player.rank);
                    rank = player.rank
                }
            }
        }

    } catch (error) {
        console.error(`Error fetching data for cox:`, error);
    }

    await saveJustenTbow(coxKc, rank);
    return;
};

app.listen(port, async () => {
    console.log("Running on port: " + port);
    await createTable();
    getTempleSkills();

    await fetchAndProcessData();
    await fetchJustenData();

    setInterval(() => {
        fetchAndProcessData();
        fetchJustenData();
    }, 3600000);
});