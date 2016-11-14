var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./emaildb.db');

db.run('CREATE TABLE IF NOT EXISTS "users" ( `uid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `username` TEXT NOT NULL, `password` TEXT NOT NULL, `salt` TEXT NOT NULL )');
db.run('CREATE TABLE IF NOT EXISTS "folders" ( `uid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `folderName` TEXT NOT NULL UNIQUE, `parentFolder` INTEGER, `user` INTEGER NOT NULL, `allowPermanentFlags` INTEGER, `flags` TEXT, `subscribed` INTEGER )');
db.run('CREATE TABLE IF NOT EXISTS "emails" ( "uid" INTEGER NOT NULL UNIQUE, "user" INTEGER NOT NULL, "raw" TEXT, "internaldate" TEXT DEFAULT (strftime(\'%s\',\'now\')), "flags" TEXT, "properties" TEXT, "attachments" TEXT, PRIMARY KEY (uid) )');