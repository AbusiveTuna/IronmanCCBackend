import express from 'express';
import cors from 'cors';
import { createTables } from './src/view/tables.js'
import battleshipRoutes from './src/battleshipRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())
app.use(cors({origin: '*'}));
app.use(battleshipRoutes);

export default app;

app.listen(port, async () => {
    console.log("Running on port: " + port);
    await createTables();

    setInterval(() => {

    }, 3600000);
});
