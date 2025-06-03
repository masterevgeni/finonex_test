# ETL System - Client-Server-Database

This is a progect that process revenue events via a client-server architecture with PostgreSQL database storage.

## System Architecture

- **Client**: Reads events from `events.jsonl` and sends them to the server
- **Server**: 
    1. '/liveEvent'->               Receives events via HTTP API and stores them in a local file
    2. '/userEvents/:userid' ->     Getting user revenue from db by user name 
- **Data Processor**: 
    1. Processes stored events.
    2. Updates user revenue in the database
    3. Clean inserted lines from server event file

## Installation & Setup

### 1. Clone and Install Dependencies
```bash
git clone <https://github.com/masterevgeni/finonex_test.git>
cd finonex_test
npm install
```

### 2. Database Setup
```bash
# Use pgadmin and run commands from db.sql file to set table
```

### 3. Create .env file in root folder
.env file should include next params
```
1. SERVER_URL=http://localhost:<SET_YOUR>/liveEvent
2. AUTH_SECRET=<SET_YOUR>
3. STREAM_FILE=data/events.jsonl
4. SERVER_EVENTS=data/server_events.jsonl
5. TEMP_SERVER_FILE=data/server_events_temp.jsonl
6. SERVER_PORT=<SET_YOUR>
7. SERVER_MAX_FiLE_SIZE='10mb'
8. DB_USER=<SET_YOUR>
9. DB_HOST=localhost
10. DB_NAME=postgres
11. DB_PASSWORD=<SET_YOUR>
12. DB_PORT=5432
```
### 4. Create Sample Events File
Create a file called `events.jsonl` in the project root with sample data:
```
{ "userId": "user1", "name": "add_revenue", "value": 98 }
{ "userId": "user1", "name": "subtract_revenue", "value": 72 }
{ "userId": "user2", "name": "add_revenue", "value": 70 }
{ "userId": "user1", "name": "add_revenue", "value": 1 }
{ "userId": "user2", "name": "subtract_revenue", "value": 12 }
```

## Running the System ( use termnal )

### Step 1: Start the Server
```bash
npm start
# or
node server.js
```
The server will start on http://localhost:<SERVER_PORT> from .env file

### Step 2: Run the Client (in a new terminal)
```bash
npm run client
# or
node client.js
```
This will read events from `events.jsonl` and send them to the server.

### Step 3: Process the Data (in a new terminal)
```bash
npm run process
# or
node data_processor.js
```
This will process events stored by the server and update the database.

## File Structure

```
FINONEX_TEST/
├── server.js              # HTTP server with API endpoints
├── client.js              # Client that sends events to server
├── data_processor.js      # Processes events and updates database
├── db.sql                 # Database schema
├── package.json           # Node.js dependencies
├── README.md             # This file
├── data/events.jsonl          # Input events file (create this)
└── data/server_events.jsonl   # Events stored by server (auto-created)
```