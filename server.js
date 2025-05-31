
const express = require('express');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const secret = process.env.AUTH_SECRET;
    if (authHeader !== secret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.post('/liveEvent', [authenticate], (req, res) => {
    try {
        const event = req.body;
        const eventsFile = process.env.SERVER_EVENTS;
        const eventLine = JSON.stringify(event) + '\n';
        fs.appendFileSync(eventsFile, eventLine);
        return res.status(201).json({ message: 'Event saved successfully' });

    } catch (error) {
        console.error('Error processing event:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/userEvents/:userid', async (req, res) => {
    console.log('req:', req.params);
    try {
    }
    catch (error) {
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
