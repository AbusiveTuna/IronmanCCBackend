import express from 'express';
import cors from 'cors';
import { createTables } from './src/view/tables.js';
import templeRoutes from './src/routes/templeRoutes.js';
import { fetchJustenData, fetchAndProcessData } from './src/controllers/controller.js'
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(templeRoutes);


export default app;

app.listen(port, async () => {
    console.log("Running on port: " + port);
    await createTables();

    // await fetchAndProcessData();
    await fetchJustenData();

    setInterval(() => {
        // fetchAndProcessData();
        fetchJustenData();
    }, 3600000);
});
