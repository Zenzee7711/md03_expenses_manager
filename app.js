const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// password generator



// login


// ---------- Server starts here ---------
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at ' + PORT);
});
