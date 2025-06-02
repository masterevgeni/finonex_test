const fs = require('fs');
const readline = require('readline');
const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const EVENTS_FILE = process.env.SERVER_EVENTS;
const TEMP_FILE = process.env.TEMP_SERVER_FILE;


async function processEvents() {
    try {
        // Check if events file exists
        if (!fs.existsSync(EVENTS_FILE)) {
            console.error(`Error: ${EVENTS_FILE} file not found`);
            return;
        }

        // Reading stream from events file    
        const fileStream = fs.createReadStream(EVENTS_FILE);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        // Create temporary file for unprocessed events
        const tempStream = fs.createWriteStream(TEMP_FILE);

        // Store revenue calculations per user
        const userRevenues = new Map();
        const processedLines = new Set();
        let eventCount = 0;
        let lineNumber = 0;

        // Read each events and calculate revenue per user
        for await (const line of rl) {
            lineNumber++;

            try {
                const event = JSON.parse(line);
                eventCount++;

                const { userId, name, value } = event;

                if (!userId || !name || value === undefined) {
                    console.warn(`Warning: Invalid event at line ${lineNumber}:`, event);
                    // Keep invalid lines in the file
                    tempStream.write(line + '\n');
                    continue;
                }

                // Calculate revenue change
                let revenueChange = 0;
                if (name === 'add_revenue') {
                    revenueChange = parseInt(value);
                } else if (name === 'subtract_revenue') {
                    revenueChange = -parseInt(value);
                } else {
                    console.warn(`Warning: Unknown event name '${name}' at line ${lineNumber}`);
                    // Keep unknown event types in the file
                    tempStream.write(line + '\n');
                    continue;
                }

                // Add to user's total revenue change
                if (userRevenues.has(userId)) {
                    userRevenues.set(userId, userRevenues.get(userId) + revenueChange);
                } else {
                    userRevenues.set(userId, revenueChange);
                }

                // Mark this line as processed
                processedLines.add(lineNumber);

            } catch (error) {
                console.error(`Error parsing event at line ${lineNumber}:`, error.message);
                // Keep unparseable lines in the file
                tempStream.write(line + '\n');
            }

        }

        console.log(`Processed ${eventCount} events for ${userRevenues.size} users`);

        // Update database for each user
        let updatedUsers = 0;
        let newUsers = 0;
        let failedUpdates = new Set();

        for (const [userId, revenueChange] of userRevenues) {
            try {
                // Use UPSERT (INSERT ... ON CONFLICT) to handle concurrent updates
                const result = await pool.query(`
          INSERT INTO users_revenue (user_id, revenue) 
          VALUES ($1, $2)
          ON CONFLICT (user_id) 
          DO UPDATE SET revenue = users_revenue.revenue + $2
          RETURNING revenue
        `, [userId, revenueChange]);

                if (result.rows.length > 0) {
                    const newRevenue = result.rows[0].revenue;
                    console.log(`Updated user ${userId}: revenue change ${revenueChange >= 0 ? '+' : ''}${revenueChange}, new total: ${newRevenue}`);

                    if (Math.abs(newRevenue) === Math.abs(revenueChange)) {
                        newUsers++;
                    } else {
                        updatedUsers++;
                    }
                }
            } catch (error) {
                console.error(`Error updating user ${userId}:`, error.message);
                failedUpdates.add(userId);
            }
        }

        tempStream.end();

        // Restore  lines to the temp file in case of failed updates
        if (failedUpdates.size > 0) {
            console.log(`Restoring ${failedUpdates.size} failed updates to file...`);

            const originalStream = fs.createReadStream(EVENTS_FILE);
            const originalRl = readline.createInterface({
                input: originalStream,
                crlfDelay: Infinity
            });

            const appendStream = fs.createWriteStream(TEMP_FILE, { flags: 'a' });
            let currentLine = 0;

            for await (const line of originalRl) {
                currentLine++;
                if (line.trim()) {
                    try {
                        const event = JSON.parse(line);
                        const { userId } = event;

                        if (failedUpdates.has(userId)) {
                            appendStream.write(line + '\n');
                        }
                    } catch (error) {
                        console.error(`Error parsing event at line ${currentLine}:`, error.message);
                    }
                }
            }

            appendStream.end();
        }

        // Replace original file with temporary file
        await new Promise((resolve, reject) => {
            fs.rename(TEMP_FILE, EVENTS_FILE, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        console.log(`Total events processed: ${eventCount}`);
        console.log(`Users affected: ${userRevenues.size}`);

    } catch (error) {
        console.error('Error processing events:', error.message);

        // Clean up temporary file if it exists
        if (fs.existsSync(TEMP_FILE)) {
            fs.unlinkSync(TEMP_FILE);
        }
    } finally {
        await pool.end();
    }
}

// Check command line arguments for custom file
const customFile = process.argv[2];
if (customFile) {
    console.log(`Using custom events file: ${customFile}`);
    // You can modify EVENTS_FILE here if needed
}

// Run the data processor
console.log('Starting data processor...');
processEvents();