var port = 1143

// var storage = require('./lib/memstorage.js');
var storage = require('./lib/perstorage.js');
storage.load('./email.db');

var authModule = require('./lib/auth.js')({
	path: './email.db'
});
// you now can pass storage to imapper
server = require('./lib/server.js')({
    storage: storage,
    users: authModule
});

server.listen(port);
console.log("Server listening on port", port)
