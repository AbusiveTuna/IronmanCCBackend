import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const creds = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS, 'base64').toString());

const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

const doc = new GoogleSpreadsheet('1HUIruK6tVZziYXZOMDDL99HEwQh508BKpB5uZBdUtCo', serviceAccountAuth);

const updateGoogleSheet = async (latestResults, teamTotals) => {
    try {
        console.log("Attempting to grab google sheets info");
        await doc.loadInfo();
        console.log("Success! Updating Team Totals");
        await updateTeamTotals(teamTotals);
        // console.log("Success! Updating Skill Sheets");
        // await updateSkillSheets(latestResults);
    } catch (error) {
        console.error('Failed to update Google Sheet:', error);
    }
};

const updateTeamTotals = async(teamTotals) => {
    let sheet = doc.sheetsByTitle["TunaTotal"];
    const teamNames = Object.keys(teamTotals);
    const headers = ['', ...teamNames]; 

    if (!sheet) {
        sheet = await doc.addSheet({ title: "TunaTotal" });
        await sheet.setHeaderRow(headers);
    } else {
        await sheet.clear();
        await sheet.setHeaderRow(headers);
    }

   
    const pointsRow = ['Total Points:']; 
    teamNames.forEach(teamName => {
        pointsRow.push(teamTotals[teamName]); 
    });

    await sheet.addRow(pointsRow); 
};

const updateSkillSheets = async (latestResults) => {
    for (const skill in latestResults) {
        let sheet = doc.sheetsByTitle[skill];

        if (!sheet) {
            sheet = await doc.addSheet({ title: skill });
            await sheet.setHeaderRow(['Player Name', 'Team Name', 'XP Gained', 'Points']);
        } else {
            await sheet.clear();
            await sheet.setHeaderRow(['Player Name', 'Team Name', 'XP Gained', 'Points']); 
        }

        
        const rows = latestResults[skill].map(player => ({
            'Player Name': player.playerName,
            'Team Name': player.teamName,
            'XP Gained': player.xpGained,
            'Points': player.points
        }));

        
        await sheet.addRows(rows);
    }
};

export { updateGoogleSheet };
