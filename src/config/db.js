// Importing module
const mysql = require('mysql');
require('dotenv').config();

// Creating connection
var db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
});

db.connect(function (err) {
    if (err) {
        console.log('error when connecting to db:', err);
    }   
    console.log('Database connected!!!');  
});

db.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        db()
    } else {
        throw err;
    }
});

module.exports = db;