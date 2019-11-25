var mysql = require('mysql');
var config = require('../config/dbconfig')

var db = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
});

db.connect();
module.exports = db;