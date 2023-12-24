// Importing module
const mysql = require('mysql');
require('dotenv').config();

// Creating connection
function createConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DBNAME,
    });
}

function handleDatabase(callback) {
    const connection = createConnection();
    
    connection.connect((err) => {
        if (err) {
          console.error('Error connecting to database:', err.message);
          return;
        }
    
        console.log('Connected to database');
    
        // Gọi hàm callback để thực hiện các hàm xử lý database
        callback(connection);
    
        // Sau khi hoàn thành xử lý, đóng kết nối
        connection.end();
        console.log('Close connect to database');
      });
}


module.exports = handleDatabase;