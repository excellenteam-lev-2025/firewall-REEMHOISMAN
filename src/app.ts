import express from 'express';
import { connectToDb } from './db.js';
import routerIP from "./routes/routerIP.js";
import routerUrl from "./routes/routerUrl.js";
import routerPort from "./routes/routerPort.js";
import routerRules from "./routes/routerRules.js";
import { ENV } from "./config/env.js";
import './config/Logger.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    console.info('Hello from Express!');
    res.send('Hello from Express!');
});

app.use('/api/firewall/ip', routerIP);
app.use('/api/firewall/url', routerUrl);
app.use('/api/firewall/port', routerPort);
app.use('/api/firewall/rules', routerRules);

// error handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

// connect DB and start server
connectToDb().then(() => {
    app.listen(ENV.PORT, () => console.info(`Server is running on port ${ENV.PORT}`));
});

export default app
