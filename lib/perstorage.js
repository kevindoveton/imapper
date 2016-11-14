var CONSOLE_MESSAGES = true;

// requires
var datecompare = require('./datecompare');
var sqlite3 = require('sqlite3');
var async = require('async');

// global variables
var server, messageHandlers, userId, username, db = null;

// the default test has no multiple mailboxes
module.exports = function (s) {
	server = s;
	
	if (db == null) {
		console.log("path to db is required");
		console.log("call storage.load(path-to-db)");
		return null
	}

	else {
		return {
			mailbox: function (box,user,handlers) {
				username = user;
				messageHandlers = handlers;
				return makeMailbox();
			}
		};
	}
};

module.exports.load = function(path) {
	db = new sqlite3.Database(path);
}



function makeMailbox() {
	// userId;
	db.get("SELECT `uid` FROM `users` WHERE username == ?", [username], function(err, row) {
		if (err == null) {
			userId = row.uid;
		}
	});

	// RETURN A MAILBOX OBJECT
	return {
		
		// get folder in this mailbox whose path matches path. 
		// Will pass data to the callback as an array of folder objects, 
		// or an empty array if none found. If the folder cannot be selected, 
		// callback err as {noselect: true}
		getFolder : function (path,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "getFolder called");
			if (true) {
				callback(null, selectFolder(path));	
			}
			
			else {
				callback({
					noselect: true
				}, null);
			}
			
		},

		//  create a new folder in this mailbox with the path path. 
		// Will pass data to the callback as a new folder object. 
		// If creation fails, pass an error to the callback.
		createFolder : function (path,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "createFolder called");
			console.log(path);
			var pathSplit = path.split('/');
			var folderName = pathSplit[pathSplit.length - 1];
			console.log(userId);
			var stmt = db.prepare("INSERT INTO `folders`(`folderName`,`parentFolder`,`user`,`allowPermanentFlags`,`flags`,`subscribed`) VALUES (?, NULL, ?, NULL, NULL, NULL)"); 
			stmt.run(folderName, userId);
			stmt.finalize();
			// TODO: check the message was inserted
			callback(null, null);
		},

		// delete the named folder at path with all of its messages. 
		// If it fails, pass an error to the err argument of the callback.
		delFolder : function (path, callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "delFolder called");

		},

		// rename the named folder at source with the new path destination. 
		// If it fails, pass an error to the err argument of the callback.
		renameFolder : function (source, destination, callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "renameFolder called");
			var destinationSplit = destination.split('|');
			folderPathToUID(source, '|', function(uid) {
				db.run("UPDATE `folders` SET `folderName` = ? WHERE `uid` == ?", [destinationSplit[destinationSplit.length - 1] ,uid])
				callback(null, null);
			});
		},

		// add a message to the named folder with the content object content. 
		// If it fails, pass an error to the err argument of the callback.
		createMessage : function (folder, content, callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "createMessage called");
		},

		// addFlags(folder,ids,isUid,flags,callback): 
		// add the flags in flags to message(s) ids in folder folder. 
		// ids is index in the folder if isUid is false or undefined, 
		// or the UID of the messages if true. ids is a string in the 
		// format to match a range of messages. See below "Range of Messages". 
		// flags must be an array of String flags. If the message(s) or 
		// folder do not exist, return an error. If the flags already exist
		// on message, do not return an error, as this call should be
		// idempotent. data returned in the callback should be an array 
		// of changed messages, each of which should be an object with 
		// the properties index, uid and flags.
		addFlags : function (folder,ids,isUid,flags,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "addFlags called");
		},

		// removeFlags(folder,ids,isUid,flags,callback): 
		// remove the flags in flags from message(s) ids in folder folder.
		// ids is index in the folder if isUid is false or undefined,
		// UID if true. ids is a string in the format to match a range of
		// messages. See below "Range of Messages". flags must be an array
		// of String flags. If the message(s) or folder do not exist,
		// return an error. If the flags do not exist on message, do not
		// return an error, as this call should be idempotent. data
		// returned in the callback should be an array of changed
		// messages, each of which should be an object with the properties
		// index, uid and flags.
		removeFlags : function (folder,ids,isUid,flags,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "removeFlags called");
		},

		// replaceFlags(folder,ids,isUid,flags,callback):
		// replace all of the flags in flags on message(s) ids in folder
		// folder with flags. ids is index in the folder if isUid is
		// false or undefined, UID if true. ids is a string in the format
		// to match a range of messages. See below "Range of Messages".
		// flags must be an array of String flags. If the message(s) or
		// folder do not exist, return an error. data returned in the
		// callback should be an array of changed messages, each of which
		// should be an object with the properties index, uid and flags.
		replaceFlags : function (folder,ids,isUid,flags,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "replaceFlags called");
		}, 

		// addProperties(folder,ids,isUid,properties,callback):
		// add the properties in properties to message(s) ids in folder
		// folder. ids is index in the folder if isUid is false or undefined,
		// UID if true. ids is a string in the format to match a range of
		// messages. See below "Range of Messages". properties must be a hash
		// of String properties. If the message(s) or folder do not exist,
		// return an error. If the properties already exist on message,
		// do not return an error, as this call should be idempotent.
		addProperties : function (folder,ids,isUid,properties,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "addProperties called");
		}, 

		// removeProperties(folder,ids,isUid,properties,callback):
		// remove the properties in properties from message ids in folder
		// folder. ids is index in the folder if isUid is false or undefined,
		// UID if true. ids is a string in the format to match a range of
		// messages. See below "Range of Messages". properties must be an
		// array of String properties. If the message(s) or folder do not
		// exist, return an error.
		removeProperties : function (folder,ids,isUid,properties,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "removeProperties called");
		},

		// replaceProperties(folder,ids,isUid,properties,callback):
		// replace all of the properties in properties on message(s)
		// ids in folder folder with properties. ids is index in the
		// folder if isUid is false or undefined, UID if true. ids is
		// a string in the format to match a range of messages. See below
		// "Range of Messages". properties must be a hash of String flags.
		replaceProperties : function (folder,ids,isUid,properties,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "replaceProperties called");
		},

		// namespace(path,callback): get the namespace for the given path.
		// Returned object should be null if not found,
		// or an object with a separator property to indicate the separator.
		namespace : function (path,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "namespace called");
		},

		// getNamespaces(callback):
		// List the available namespaces.
		getNamespaces : function (callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "getNamespace called");
		},

		// matchFolders(namespace,name,callback):
		// search for folders whose name includes name in namespace namespace.
		// If namespace is blank, searches the default namespace for this user,
		// including INBOX. Should return folder objects.
		matchFolders : function (namespace,name,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "matchFolders called");
			var folderArray = [];
			db.each("SELECT `uid` FROM `folders` WHERE user == ?", [userId], function(err, row) { // AND parentFolder IS NULL
				if (err == null && row != undefined)
				{
					selectFolder(row.uid, function(data){
						// callback(null,[data]);
						folderArray.push(data);
					});
				}
			}, function (err, rows) {
				
				var timer = setInterval(function() {
					if (rows == folderArray.length)
					{
						callback(null, folderArray);
						clearTimeout(timer);
					}
				}, 100);
				// callback(null, folderArray);
			});
		},

		// getMessageRange(path,range,isUid,callback):
		// retrieve actual message objects with their data based on a range
		// from a given folder path. The range is index, unless isUid is true,
		// in which case it is UID(s). Pass the resultant message objects to
		// the data argument of the callback.
		// See below for details of a message range.
		getMessageRange : function (path,range,isUid,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "getMessageRange called");
			// console.log(range);
			// callback(null, null);
		},

		// setFolderSpecialUse(folder,flags,callback):
		// Set this folder to be special use, per RFC6514, for the given array of flags.
		setFolderSpecialUse : function (folder,flags,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "setFolderSpecialUse called");
		},

		// searchMessages(folder,query,callback):
		// retrieve an array of the IDs - both index and UID - of all messages in
		// the named folder that match the search query, or an empty array for none.
		// Pass an array of objects to the callback as the data argument.
		// See below for search details.
		searchMessages : function(folder,query,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "searchMessages called");
		},

		// subscribeFolder(path,callback):
		// subscribe to a given folder. Should return err if there is an error,
		// specifically if the folder is invalid, does not exist or is not
		// selectable or subscribable, null otherwise.
		subscribeFolder : function (path,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "subscribeFolder called");
		},

		// expunge(folder,ignoreSelf,ignoreExists,callback):
		// Expunge deleted messages from a given folder.
		expunge : function (folder,ignoreSelf,ignoreExists,callback) {
			if (CONSOLE_MESSAGES) console.log(new Date().toISOString(), "expunge called");
		}
	}
}

var selectFolder = function (uid, callback) {
	var fName, fPath, parentId, data;

	async.series([
			function(next) {
				// Get folder
				db.get("SELECT * FROM `folders` WHERE `uid` == ? AND `user` == ?", [uid, userId], function(err, row) {
					if (err == null && row != undefined)
					{
						fName = row.folderName;
						fPath = fName;
						parentId = row.parentFolder;
						next(null);
					}
				});
			},

			function(next) {
				folderUIDToPath(fPath, parentId, function(data) {
					fPath = data;
					next(null);
				});
			},

			function(next) {
				// get the number of read and unread messages
				// count on flags
				next(null);
			}
			],
			function(err, results) {
				// return
				callback ({
					name: fName,
					path: fPath,
					flags: [],
					seen: 3,
					unseen: 2,
					messages: 5,
					permanentFlags: [],
					allowPermanentFlags : false
				});
			}); // end async series

	
}

function folderPathToUID(path, seperator, callback) {
	var splitPath = path.split(seperator);
	// console.log(splitPath.length);
	var parent = null;
	var uid;
	async.mapSeries(splitPath, function(data, callback) {
		if (parent == null)
		{
			var stmt = "SELECT * FROM `folders` WHERE parentFolder IS NULL AND folderName == ?"
			db.get(stmt, [data], function(err, row) {
				if (err == null && row != undefined)
				{
					parent = row.uid;
					uid = row.uid;
					return callback(null, null);
				}
				
			});
		}
		else
		{
			var stmt = "SELECT * FROM `folders` WHERE parentFolder == ? AND folderName == ?";
			db.get(stmt, [parent, data], function(err, row) {
				if (err == null && row != undefined)
				{
					parent = row.uid;
					uid = row.uid;
					return callback(null, null);
				}
			
			});
		}
		
	}, function() {
		callback(uid);
	})
}

function folderUIDToPath(name, parentId, callback) {
	// Get folder path
	var path = name;
	db.all("WITH RECURSIVE tc( i )\
			AS ( SELECT uid FROM folders WHERE uid == ?\
			    UNION SELECT parentFolder FROM folders, tc\
			           WHERE folders.uid == tc.i\
			 )\
			SELECT * FROM folders WHERE uid IN tc", [parentId], 
	function(err, rows) {
		if (err == null && rows != undefined)
		{
			for (let i = 0; i < rows.length; i++)
			{
				path = rows[(rows.length - i) - 1].folderName + '|' + path; // traverse backwards
			}
			callback(path)
		}
		else 
			callback(path)
	});
}
// var selectMessage = function () {
// 	return {
// 		properties: {
// 			timestamp: new Date().getTime()
// 		},
// 		raw: "This is a message",
// 		raw_url: "http://localhost/raw",
// 		headers: "From: me@you.com\n\rTo: you@me.com",
// 		headers_url: "http://localhost/headers",
// 		html: "<html><body><h1>Message</h1></body></html>",
// 		html_url: "http://localhost/html",
// 		attachments: ["Attachment1","Attachment2"]
// 	};
// }