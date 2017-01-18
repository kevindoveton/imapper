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
		return null;
	}

	else {
		return {
			mailbox: function (box, user, handlers) {
				username = user;
				messageHandlers = handlers;
				console.log(handlers);
				return makeMailbox();
			}
		};
	}
};

module.exports.load = function(path) {
	db = new sqlite3.Database(path);
};

module.exports.reset = function () {

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
		getFolder : function (path, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "getFolder called");
			}

			var seperator = '|';
			console.log(path);

			folderPathToUID(path, seperator, function(uid) {
				selectFolder(uid, function(data) {
					callback(null, data);
				});
			});

			// if the folder doesn't exist
			// callback({
			// 	noselect: true
			// }, null);


		},

		//  create a new folder in this mailbox with the path path.
		// Will pass data to the callback as a new folder object.
		// If creation fails, pass an error to the callback.
		createFolder : function (path, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "createFolder called");
			}
			console.log(path);
			var pathSplit = path.split('|');
			var folderName = pathSplit[pathSplit.length - 1];
			console.log(userId);
			db.run("INSERT INTO `folders`(`folderName`,`parentFolder`,`user`,`allowPermanentFlags`,`flags`,`subscribed`) VALUES (?, NULL, ?, NULL, NULL, NULL)", [folderName, userId]);

			// TODO: check the folder was inserted
			callback(null, null);
		},

		// delete the named folder at path with all of its messages.
		// If it fails, pass an error to the err argument of the callback.
		delFolder : function (path, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "delFolder called");
			}

			callback(null, null);
			// find all descendant folders
			// delete all messages
			// delete folder
		},

		// rename the named folder at source with the new path destination.
		// If it fails, pass an error to the err argument of the callback.
		renameFolder : function (source, destination, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "renameFolder called");
			}

			var seperator = '|';

			var destinationSplit = destination.split(seperator);
			var sourceSplit = sourceSplit.split(seperator);

			// FIXME: this only renames, can't use it to move a folder
			folderPathToUID(source, seperator, function(uid) {
				db.run("UPDATE `folders` SET `folderName` = ? WHERE `uid` == ?", [destinationSplit[destinationSplit.length - 1] ,uid]);
				callback(null, null);
			});
		},

		// add a message to the named folder with the content object content.
		// If it fails, pass an error to the err argument of the callback.
		createMessage : function (folder, content, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "createMessage called");
			}

			var seperator = '|';
			var properties = JSON.stringify({});
			var attachments = JSON.stringify([]);

			folderPathToUID(folder, seperator, function(folderUid) {
				insertMessage(folderUid, userId, content.raw, JSON.stringify(content.flags), properties, attachments, function() {
					callback(null, null);
				});
			});

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
		addFlags : function (folder, ids, isUid, flags, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "addFlags called");
			}

			console.log(folder, ids, isUid, flags);

			if (isUid) {
				// FIXME make this work for multiple messages
				// async.mapSeries
				db.get("SELECT `flags` FROM `emails` WHERE uid == ?", ids[0], function(err, row) {
					var flag = JSON.parse(row.flags); // parse to array
					flag.push.apply(flag, flags); // concat the two arrays -- FIXME no idea what happens/IMAP handles if duplicates
					db.run("UPDATE `emails` SET `flags` = ? WHERE uid = ?", [JSON.stringify(flag), ids[0]]);
					callback(null, null);
				});
			}
			else
			{
				callback(["not uid"], null);
			}


			// TODO what happens if it isn't an id
			// TODO should return the message - thunderbird doesnt complain too much


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
		removeFlags : function (folder, ids, isUid, flags, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "removeFlags called");
			}

			if (isUid) {
				db.get("SELECT `flags` FROM `emails` WHERE uid == ?", ids[0], function(err, row) {
					var flag = JSON.parse(row.flags);

					// remove all array elements
					flag = flag.filter( function( el ) {
						return !flags.includes( el );
					});

					db.run("UPDATE `emails` SET `flags` = ? WHERE uid = ?", [JSON.stringify(flag), ids[0]]);

					callback(null, null);
				});
			}
			else {
				callback(["not uid"], null);
			}
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
		replaceFlags : function (folder, ids, isUid, flags, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "replaceFlags called");
			}

			if (isUid) {
				db.run("UPDATE `emails` SET `flags` = ? WHERE uid = ?", [JSON.stringify(flags), ids[0]]);
				callback(null, null);
			}
			else {
				callback(["not uid"], null);
			}
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
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "addProperties called");
			}

			if (isUid) {
				// FIXME make this work for multiple messages
				// async.mapSeries
				db.get("SELECT `properties` FROM `emails` WHERE uid == ?", ids[0], function(err, row) {
					properties = JSON.parse(row.properties); // parse to array
					properties.push.apply(flag, properties); // concat the two arrays -- FIXME no idea what happens/IMAP handles if duplicates
					db.run("UPDATE `emails` SET `properties` = ? WHERE uid = ?", [JSON.stringify(properties), ids[0]]);
					callback(null, null);
				});
			}
			else {
				callback(["not uid"], null);
			}

		},

		// removeProperties(folder,ids,isUid,properties,callback):
		// remove the properties in properties from message ids in folder
		// folder. ids is index in the folder if isUid is false or undefined,
		// UID if true. ids is a string in the format to match a range of
		// messages. See below "Range of Messages". properties must be an
		// array of String properties. If the message(s) or folder do not
		// exist, return an error.
		removeProperties : function (folder, ids, isUid, properties, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "removeProperties called");
			}

			if (isUid) {
				db.get("SELECT `properties` FROM `emails` WHERE uid == ?", ids[0], function(err, row) {
					var property = JSON.parse(row.properties);

					// remove all array elements
					property = property.filter( function( el ) {
						return !properties.includes( el );
					});

					db.run("UPDATE `emails` SET `properties` = ? WHERE uid = ?", [JSON.stringify(property), ids[0]]);

					callback(null, null);
				});
			}
			else {
				callback(["not uid"], null);
			}

		},

		// replaceProperties(folder,ids,isUid,properties,callback):
		// replace all of the properties in properties on message(s)
		// ids in folder folder with properties. ids is index in the
		// folder if isUid is false or undefined, UID if true. ids is
		// a string in the format to match a range of messages. See below
		// "Range of Messages". properties must be a hash of String flags.
		replaceProperties : function (folder, ids, isUid, properties, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "replaceProperties called");
			}

			if (isUid) {
				db.run("UPDATE `emails` SET `properties` = ? WHERE uid = ?", [JSON.stringify(properties), ids[0]]);
				callback(null, null);
			}
			else {
				callback(["not uid"], null);
			}

		},

		// namespace(path,callback): get the namespace for the given path.
		// Returned object should be null if not found,
		// or an object with a separator property to indicate the separator.
		namespace : function (path, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "namespace called");
			}

			callback(null, null);
		},

		// getNamespaces(callback):
		// List the available namespaces.
		getNamespaces : function (callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "getNamespace called");
			}

			callback(null, null);
		},

		// matchFolders(namespace,name,callback):
		// search for folders whose name includes name in namespace namespace.
		// If namespace is blank, searches the default namespace for this user,
		// including INBOX. Should return folder objects.
		matchFolders : function (namespace, name, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "matchFolders called");
			}

			var folderArray = []; // array to hold message objects

			db.each("SELECT `uid` FROM `folders` WHERE user == ?", [userId], function(err, row) { // AND parentFolder IS NULL
				if (err === null && row !== undefined)
				{
					selectFolder(row.uid, function(data){
						folderArray.push(data);
					});
				}
			}, function (err, rows) {
				// wait for the array to finish pushing
				var timer = setInterval(function() {
					if (rows === folderArray.length)
					{
						callback(null, folderArray);
						clearInterval(timer);
					}
				}, 50);
			});
		},

		// getMessageRange(path,range,isUid,callback):
		// retrieve actual message objects with their data based on a range
		// from a given folder path. The range is index, unless isUid is true,
		// in which case it is UID(s). Pass the resultant message objects to
		// the data argument of the callback.
		// See below for details of a message range.
		getMessageRange : function (path, range, isUid, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "getMessageRange called");
			}
			// replace * with -1 and then split into parts
			var rangeParts = range.split(",");
			var index = 0; // starts at 1 on first loop
			var selectString = "SELECT * FROM (SELECT uid, (SELECT COUNT(*) FROM `emails` as t2 WHERE t2.internaldate <= t1.internaldate) as rc FROM `emails` as t1 WHERE `parentFolder` == ? ORDER BY `internaldate`)"
			for (var i = 0; i < rangeParts.length; i++) // FIXME this assumes we're based off uid
			{
				var r = rangeParts[i].replace("*", "99999999").split(":"); // FIXME i guess this would fail eventually but it will take a while
				if (r.length > 1) // has two parts
				{
					selectString += i == 0 ? " WHERE uid between " + r[0] + " and " + r[1] : " or uid between " + r[0] + " and " + r[1];;
				}
				else // only one part
				{
					selectString += i == 0 ? " WHERE uid == " + r[0] : " or uid == " + r[0];;
				}
			}
			console.log(selectString);

			folderPathToUID(path, '|', function(uid) {
				db.all(selectString, [uid], function(err, rows) {
					async.mapSeries(rows, function(data, next) {
						index++;
						selectMessage(data.uid, data.rc, userId, function(message) {
							callback(null, [message]);
							next(null, null);
						});
					}, function() {
						callback(null, [null]); // no more messages
					});
				});
			})

		},

		// setFolderSpecialUse(folder,flags,callback):
		// Set this folder to be special use, per RFC6514, for the given array of flags.
		setFolderSpecialUse : function (folder, flags, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "setFolderSpecialUse called");
			}

			callback(null, null);
		},

		// searchMessages(folder,query,callback):
		// retrieve an array of the IDs - both index and UID - of all messages in
		// the named folder that match the search query, or an empty array for none.
		// Pass an array of objects to the callback as the data argument.
		// See below for search details.
		searchMessages : function(folder, query, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "searchMessages called");
			}

			// TODO search messages
			// get folder uid
			// search messages with that folder

			console.log(folder, query);
			folderPathToUID(folder, function(uid) {
				var searchString = "SELECT * FROM `emails` WHERE `parentFolder` == ?";
			})
			callback(null, null);
		},

		// subscribeFolder(path,callback):
		// subscribe to a given folder. Should return err if there is an error,
		// specifically if the folder is invalid, does not exist or is not
		// selectable or subscribable, null otherwise.
		subscribeFolder : function (path, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "subscribeFolder called");
			}

			const seperator = '|';

			folderPathToUID(path, seperator, function(uid) {
				db.run("UPDATE `folders` SET `subscribed` = ? WHERE `uid` == ?", [1 ,uid]);
				callback(null, null);
			});
		},

		// expunge(folder,ignoreSelf,ignoreExists,callback):
		// Expunge deleted messages from a given folder.
		expunge : function (folder, ignoreSelf, ignoreExists, callback) {
			if (CONSOLE_MESSAGES) {
				console.log(new Date().toISOString(), "expunge called");
			}
			// search for the message
			// callback(null,null);
		}
	};
}

var selectFolder = function (uid, callback) {
	var fName, fPath, parentId, data, seen, unseen;

	async.series([
			function(next) {
				// Get folder
				db.get(`SELECT * FROM folders
					WHERE uid == ?
					AND user == ?
					AND subscribed == 1`, [uid, userId], function(err, row) {
					if (err === null && row !== undefined)
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
				// get the number of seen messages
				// count on flags
				db.get(`SELECT COUNT(uid)
						AS seen FROM emails
						WHERE user == ?
						AND parentFolder == ?
						AND flags LIKE "%\\Seen%"`, [userId, uid], function(err, row) {
					if (err === null && row !== undefined)
					{
						seen = row.seen;
						next(null);
					}
				});
			},

			function(next) {
				// get the number of seen messages
				// count on flags
				db.get('SELECT COUNT(uid) AS unseen FROM `emails` WHERE `user` == ? AND `parentFolder` == ? AND `flags` NOT LIKE "%\\Seen%"', [userId, uid], function(err, row) {
					if (err === null && row !== undefined)
					{
						unseen = row.unseen;
						next(null);
					}
				});

			}], // end series

			// callback function
			function(err, results) {
				// return
				callback ({
					name: fName,
					path: fPath,
					flags: [],
					seen: seen,
					unseen: unseen,
					messages: seen + unseen,
					permanentFlags: [],
					allowPermanentFlags : false,
					subscribed: true, // wouldn't have come up otherwise
					seperator: '|' // this will make things easy.. thunderbird seems to ignore it anyway
				});
			}); // end async series
};

function folderPathToUID(path, seperator, callback) {
	var splitPath = path.split(seperator);
	// console.log(splitPath.length);
	var parent = null;
	var uid;
	async.mapSeries(splitPath, function(data, next) {
		if (parent == null)
		{
			var stmt = "SELECT * FROM `folders` WHERE parentFolder IS NULL AND folderName == ?";
			db.get(stmt, [data], function(err, row) {
				if (err === null && row !== undefined)
				{
					parent = row.uid;
					uid = row.uid;
					next(null, null);
				}

			});
		}
		else
		{
			var stmt = "SELECT * FROM `folders` WHERE parentFolder == ? AND folderName == ?";
			db.get(stmt, [parent, data], function(err, row) {
				if (err === null && row !== undefined)
				{
					parent = row.uid;
					uid = row.uid;
					next(null, null);
				}

			});
		}

	}, function() {
		callback(uid);
	});
}

function folderUIDToPath(name, parentId, callback) {
	// Get folder path
	var path = name;
	db.all(`WITH RECURSIVE tc( i )
			AS (
				SELECT uid FROM folders WHERE uid == ?
			    UNION SELECT parentFolder FROM folders, tc
			    WHERE folders.uid == tc.i
			)
			SELECT * FROM folders WHERE uid IN tc`, [parentId],
	function(err, rows) {
		if (err == null && rows != undefined)
		{
			for (var i = 0; i < rows.length; i++)
			{
				path = rows[(rows.length - i) - 1].folderName + '|' + path; // traverse backwards
			}
			callback(path)
		}
		else
			callback(path)
	});
}

var selectMessage = function (uid, index, user, callback) {
	db.get(`SELECT * FROM emails
			WHERE user == ? AND uid == ?`,
			[user, uid], function(err, row) {

		if (err === null && row !== undefined)
		{
			callback( {
				index: index,
				raw: row.raw,
				internal_date: row.internaldate,
				uid: row.uid,
				flags: JSON.parse(row.flags),
				properties: JSON.parse(row.properties),
				attachments: JSON.parse(row.attachments)
			}); // return
		}
	}) // db
}; // selectMessage

var insertMessage= function(folderUid, user, raw, flags, properties, attachments, callback){
	db.run(`INSERT INTO emails
			(user, raw, flags, properties, attachments, parentFolder)
			VALUES (?, ?, ?, ?, ?, ?)`,
			[user, raw, flags, properties, attachments, folderUid]);
	callback();
};

var getMailbox = function(path) {
    folderPathToUID(path, function(data) {
		return data;
	});
};
