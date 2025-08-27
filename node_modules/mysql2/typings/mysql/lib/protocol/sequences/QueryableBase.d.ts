const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// password generator
app.get('/password/:pass', (req, res) => {
    const password = req.params.pass;
    bcrypt.hash(password, 10, function(err, hash) {
        if(err) {
            return res.status(500).send('Hashing error');
        }
        res.send(hash);
    });
});


// login
app.post('/login', (req, res) => {
    const {username, password} = req.body;
    const sql = "SELECT id, password FROM users WHERE username = ?";
    con.query(sql, [username], function(err, results) {
        if(err) {
            return res.status(500).send("Database server error");
        }
        if(results.length != 1) {
            return res.status(401).send("Wrong username");
        }
        // compare passwords
        bcrypt.compare(password, results[0].password, function(err, same) {
            if(err) {
                return res.status(500).send("Hashing error");
            }
            if(same) {
                return res.send("Login OK");
            }
            return res.status(401).send("Wrong password");
        });
    })
});


// ---------- Server starts here ---------
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at ' + PORT);
});
