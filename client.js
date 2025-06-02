const fs = require('fs');
const readline = require('readline');
const axios = require('axios');

require('dotenv').config();

const SERVER_URL = process.env.SERVER_URL;
const AUTH_SECRET = process.env.AUTH_SECRET;
const EVENTS_FILE = process.env.STREAM_FILE;


async function readFileAndSendEvents() {
    try {
        // Check if exists file with events 
        if (!fs.existsSync(EVENTS_FILE)) {
            console.error(`Error: ${EVENTS_FILE} file not found`);
            return;
        }

        const fileStream = fs.createReadStream(EVENTS_FILE);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const newLine of rl) {
            try {
                const event = JSON.parse(newLine);
                const response = await axios.post(SERVER_URL, event, {
                    headers: {
                        'Authorization': AUTH_SECRET,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 201) {
                    console.log(`Event was sent successfully:`, event);
                }
            }
            catch (error) {
                console.error(`Error parsing JSON: ${error?.response?.data?.error || error?.message}`);
                continue;
            }
        }

    } catch (error) {
        console.error(`Error on checking if file exsists: ${error.message}`);
        return;
    }
}

readFileAndSendEvents();