const mysql = require('mysql2/promise');

const connection_pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 's$fes47j#@Rfs',
  database: 'carbooking_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = connection_pool;
