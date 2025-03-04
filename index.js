import express from 'express';
import cors from 'cors';
import { createTables } from './src/view/tables.js'
import battleshipRoutes from './battleshipRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: "*", // Allows any frontend to access the backend
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization"
}));

// Middleware to handle preflight requests manually (if necessary)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200); // Respond to preflight requests immediately
    }

    next();
});

app.use(express.json())
app.use(battleshipRoutes);

export default app;

app.listen(port, async () => {
    console.log("Running on port: " + port);
    await createTables();

    setInterval(() => {

    }, 3600000);
});
