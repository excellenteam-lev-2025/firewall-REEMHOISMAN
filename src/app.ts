import express from 'express';
import { initDb } from './db.js';
import routerIP from "./routes/routerIP.js";
import routerUrl from "./routes/routerUrl.js";
import routerPort from "./routes/routerPort.js";
import routerRules from "./routes/routerRules.js";
import { ENV } from "./config/env.js";
import { logger } from './config/Logger.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    logger.info('Hello from Express!');
    res.send('Hello from Express!');
});

app.use('/api/firewall/ip', routerIP);
app.use('/api/firewall/url', routerUrl);
app.use('/api/firewall/port', routerPort);
app.use('/api/firewall/rules', routerRules);

// error handler
app.use((err: any, req: any, res: any, next: any) => {
    logger.error(err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

// init DB and start server
initDb().then(() => {
    app.listen(ENV.PORT, () => logger.info(`Server is running on port ${ENV.PORT}`));
});
