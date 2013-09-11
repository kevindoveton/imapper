var toybird = require("./lib/server"),
    server = toybird({
        plugins: ["ID"],
        id:{
            "name": "toybird",
            "version": "0.1"
        }
    });

const PORT = 1234;

server.listen(PORT, function(){
    console.log("Toybird listening on port %s", PORT)
});