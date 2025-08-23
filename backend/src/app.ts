import express from 'express';
import Database from './config/Database.js';

const connectToDb = () => Database.getInstance().connect();
import routerIP from "./routes/routerIP.js";
import routerUrl from "./routes/routerUrl.js";
import routerPort from "./routes/routerPort.js";
import routerRules from "./routes/routerRules.js";
import { ENV } from "./config/env.js";
import './config/Logger.js';

const app = express();

app.use(express.json({ 
    verify: (req, res, buf) => {
        console.log('Raw body:', buf.toString());
    }
}));

// Debug middleware to log raw requests
app.use((req, res, next) => {
    console.log('=== RAW REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body));
    console.log('========================');
    next();
});

app.get('/', (req, res) => {
    console.info('Hello from Express!');
    res.send('Hello from Express!');
});

app.use('/api/firewall/ip', routerIP);
app.use('/api/firewall/url', routerUrl);
app.use('/api/firewall/port', routerPort);
app.use('/api/firewall/rules', routerRules);

app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;

connectToDb().then(() => {
    app.listen(ENV.PORT, () => console.info(`Server is running on port ${ENV.PORT}`));
});
