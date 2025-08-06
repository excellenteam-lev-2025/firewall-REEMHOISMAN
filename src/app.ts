import express from 'express';
import {initializeDatabase } from './db.js';
import routerIP from "./routes/routerIP.js";

const PORT = process.env.PORT || 3000;
const app = express();

initializeDatabase().then(()=>{
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});

app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

app.use('/api/firewall/ip', routerIP);

app.use((err:any, req:any, res:any, next:any)=> {
        console.error('Error:', err);
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    }
)

