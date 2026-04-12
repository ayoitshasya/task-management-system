// db.js - MySQL database connection using mysql2
const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool so multiple requests can share connections
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Use promise-based pool so we can use async/await in controllers
const db = pool.promise();

module.exports = db;
