import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const creds = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS, 'base64').toString());

const headers = ['A1', 'A4', 'A7', 'A10', 'A13', 'A16', 'A19', 'A22', 'A25', 'A28', 'A31', 'A34', 'A37', 'A40', 'A43', 'A46', 'A49', 'A60', 'A71', 'A82', 'A93', 'A104', 'A115', 'A126', 'A137', 'A148', 'A159', 'A170', 'A181', 'A192', 'A203', 'A214', 'A225', 'A236', 'A247', 'A258', 'A269', 'A280', 'A291', 'A302'];

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
    console.log("Attempting to grab google sheets info");
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle["Overall View"];
    if(sheet){
        const range = 'A1:D312';
        await sheet.loadCells(range);

        const data = [];
        
        headers.forEach((header, index) => {
            const startRowIndex = parseInt(header.substring(1)) - 1; // Convert header row to index
            const endRowIndex = index + 1 < headers.length ? parseInt(headers[index + 1].substring(1)) - 1 : 311; // End row index for this section
            
            const categoryData = {
                header: sheet.getCell(startRowIndex, 0).value,
                players: []
            };

            // Collect player data between headers
            for (let rowIndex = startRowIndex + 1; rowIndex <= endRowIndex; rowIndex++) {
                const value = sheet.getCell(rowIndex, 0).value;
                const name = sheet.getCell(rowIndex, 1).value;
                const team = sheet.getCell(rowIndex, 2).value;
                const points = sheet.getCell(rowIndex, 3).value;

                if (name && team && points) {
                    categoryData.players.push({
                        value,
                        name,
                        team,
                        points
                    });
                }
            }

            data.push(categoryData);
        });

        return data;
    }
};


export { updateGoogleSheet, grabSheetInfo };
