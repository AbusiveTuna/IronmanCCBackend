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

        await doc.loadInfo();
        console.log(doc.title);

        const sheet = doc.sheetsByTitle["TunaTest"];

        const rows = Object.keys(teamTotals).map(teamName => ({
            "Team Name": teamName,
            "Score": teamTotals[teamName]
        }));

        if (!sheet) {
            sheet = await doc.addSheet({ title: "TunaTest" });
            await sheet.setHeaderRow(['Team 1', 'Team 2']);
        } else {
            await sheet.clear();
            await sheet.setHeaderRow(['Team 1', 'Team 2']);
        }

        await sheet.addRows(rows); 

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

    } catch (error) {
        console.error('Failed to update Google Sheet:', error);
    }
};

export { updateGoogleSheet };
