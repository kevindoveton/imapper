var sqlite3 = require('sqlite3');
var sha512 = require('js-sha512');
var db;

// auth database structure
// CREATE TABLE "users" ( `uid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `username` TEXT NOT NULL, `password` TEXT NOT NULL, `salt` TEXT NOT NULL)

var auth = function(opts, callback) {
	var loginStatus = null;

    db.get("SELECT * FROM `users` WHERE username == ?", [opts.username], function(err, row) {

        if (row !== undefined)
        {
            if (sha512(row.salt + opts.password).toUpperCase() !== row.password.toUpperCase())
            {
                console.log("Login Failed: " + opts.username);
                loginStatus = "error";
            }
            else
            {
                console.log("Login Success: " + opts.username);
            }
            // console.log(sha512(row.salt + opts.password));
            callback(loginStatus, null);
        }
    });	
};


module.exports = function(config) {
    this.config = config;
    if (this.config.path !== undefined)
    {
    	db = new sqlite3.Database(this.config.path);
    }
    else
    {
        console.log("Path to auth database required");
        console.log("Create table users using:");
        console.log("CREATE TABLE \"users\" ( `uid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `username` TEXT NOT NULL, `password` TEXT NOT NULL, `salt` TEXT NOT NULL)");
        return null;
    }

    this.authenticate = auth; 

    return this;
};
