import { GoogleSpreadsheet } from 'google-spreadsheet';

const creds = JSON.parse(Buffer.from(process.env.GOOGLE_CREDS, 'base64').toString());


const doc = new GoogleSpreadsheet('1HUIruK6tVZziYXZOMDDL99HEwQh508BKpB5uZBdUtCo');

const updateGoogleSheet = async (data) => {
    try {
        await doc.useServiceAccountAuth({
            client_email: creds.client_email,
            private_key: creds.private_key,
        });

        await doc.loadInfo();

        const sheet = doc.sheetsByTitle["TunaTest"];

        await sheet.addRows(data);
    } catch (error) {
        console.error('Failed to update Google Sheet:', error);
    }
};

export { updateGoogleSheet };
