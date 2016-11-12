var storage = require('./lib/memstorage.js');
// var storage = require('./lib/perstorage.js');
var authModule = require('./lib/auth.js')
// you now can pass storage to imapper
server = require('./lib/server.js')({
    storage: storage,
    users: authModule
});

server.listen(1143);