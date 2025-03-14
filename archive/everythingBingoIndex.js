import express from 'express';
import cors from 'cors';
import { createTables } from './everythingBingo/view/tables.js';
import templeRoutes from './everythingBingo/routes/templeRoutes.js';
import { fetchJustenData, fetchAndProcessData } from './everythingBingo/controllers/controller.js'
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())
app.use(cors());
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
