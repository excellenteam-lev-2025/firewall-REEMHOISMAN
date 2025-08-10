import express from 'express';
import {initializeDatabase } from './db.js';
import routerIP from "./routes/routerIP.js";
import routerUrl from "./routes/routerUrl.js";
import routerPort from "./routes/routerPort.js";
import routerRules from "./routes/routerRules.js";

const PORT = process.env.PORT;
const app = express();

initializeDatabase().then(()=>{
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});

app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

app.use('/api/firewall/ip', routerIP);
app.use('/api/firewall/url', routerUrl);
app.use('/api/firewall/port', routerPort);
app.use('/api/firewall/rules', routerRules);

app.use((err:any, req:any, res:any, next:any)=> {
        console.error('Error:', err);
        res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
    }
)

