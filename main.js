var storage = require('./lib/storage.js');
var authModule = require('./lib/auth.js')
// you now can pass storage to imapper
server = require('./lib/server.js')({
    storage: storage,
    users: authModule
});

server.listen(1143);