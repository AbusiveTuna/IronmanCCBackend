import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const creds = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS, 'base64').toString());

const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

const doc = new GoogleSpreadsheet('1HUIruK6tVZziYXZOMDDL99HEwQh508BKpB5uZBdUtCo', serviceAccountAuth);

const updateGoogleSheet = async (data) => {
    try {

        await doc.loadInfo();
        console.log(doc.title);

        const sheet = doc.sheetsByTitle["TunaTest"];
        console.log(sheet.title);
        await sheet.addRows(data);
    } catch (error) {
        console.error('Failed to update Google Sheet:', error);
    }
};

export { updateGoogleSheet };
