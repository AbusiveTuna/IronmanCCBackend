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

const grabPurpleInfo = async() => {
    console.log("Grabbing purple info");
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle["Overall View"];
    if(sheet){
        const range = 'E2:H9';
        await sheet.loadCells(range);

        const data = [];

        // Grab Raid names from cells E2, E5, and E8
        const raidNames = [
            sheet.getCell(1, 4).value, // E2
            sheet.getCell(4, 4).value, // E5
            sheet.getCell(7, 4).value  // E8
        ];

        // Grab team names from cells F2, F3, F5, F6, F8, F9
        const teamNames = [
            sheet.getCell(1, 5).value, // F2
            sheet.getCell(2, 5).value, // F3
            sheet.getCell(4, 5).value, // F5
            sheet.getCell(5, 5).value, // F6
            sheet.getCell(7, 5).value, // F8
            sheet.getCell(8, 5).value  // F9
        ];

        // Grab purple counts from cells G2, G3, G5, G6, G8, G9
        const purpleCounts = [
            sheet.getCell(1, 6).value, // G2
            sheet.getCell(2, 6).value, // G3
            sheet.getCell(4, 6).value, // G5
            sheet.getCell(5, 6).value, // G6
            sheet.getCell(7, 6).value, // G8
            sheet.getCell(8, 6).value  // G9
        ];

        // Grab points from cells H2, H3, H5, H6, H8, H9
        const points = [
            sheet.getCell(1, 7).value || 0, // H2
            sheet.getCell(2, 7).value || 0, // H3
            sheet.getCell(4, 7).value || 0, // H5
            sheet.getCell(5, 7).value || 0, // H6
            sheet.getCell(7, 7).value || 0, // H8
            sheet.getCell(8, 7).value || 0  // H9
        ];

        // Structure the data into 3 objects for each Raid
        for (let i = 0; i < raidNames.length; i++) {
            data.push({
                raidName: raidNames[i],
                teams: [
                    {
                        teamName: teamNames[i * 2],
                        purpleCount: purpleCounts[i * 2],
                        points: points[i * 2]
                    },
                    {
                        teamName: teamNames[i * 2 + 1],
                        purpleCount: purpleCounts[i * 2 + 1],
                        points: points[i * 2 + 1]
                    }
                ]
            });
        }

        console.log(data);
    }
};



export { updateGoogleSheet, grabSheetInfo, grabPurpleInfo };
