
const express = require('express');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORTs
});


app.use(express.json({ limit: process.env.SERVER_MAX_FiLE_SIZE }));

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
        if (!event || !event.userId || !event.name || event.value === undefined) {
            return res.status(400).json({ error: 'Invalid event data' });
        }
        
        const eventsFile = process.env.SERVER_EVENTS;
        const eventLine = JSON.stringify(event) + '\n';
        fs.appendFileSync(eventsFile, eventLine);
        
        return res.status(201).json({ message: 'Event saved successfully' });

    } catch (error) {
        console.error('Error processing event:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/userEvents/:userid', [authenticate], async (req, res) => {
  try {
    const userId = req.params.userid;
    
    const result = await pool.query(
      'SELECT user_id, revenue FROM users_revenue WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
