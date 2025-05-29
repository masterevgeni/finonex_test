require('dotenv').config();
const express = require('express');


const app = express();
const port = process.env.PORT;



app.post('/liveEvent', (req, res) => {
    console.log('req:', req.body);
    
     try {
    } 
    catch (error) {
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
