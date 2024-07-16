import { GoogleSpreadsheet } from 'google-spreadsheet';

const creds = process.env.GOOGLE_CREDS;
const credsJSON = JSON.parse(Buffer.from(creds, 'base64').toString());

const doc = new GoogleSpreadsheet('1HUIruK6tVZziYXZOMDDL99HEwQh508BKpB5uZBdUtCo');

const updateGoogleSheet = async (data) => {
    try {
        await doc.useServiceAccountAuth(credsJSON);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle["TunaTest"];
        await sheet.addRows(data);
    } catch (error) {
        console.error('Failed to update Google Sheet:', error);
    }
};

export { updateGoogleSheet };
