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

const grabSheetInfo = async() => {
    let sheet = doc.sheetsByTitle["TunaTotal"];
    if(sheet){
        
    }
}

export { updateGoogleSheet };
