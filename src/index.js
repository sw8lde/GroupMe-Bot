const http = require('http'),
	    director = require('director'),
	    bot = require('./bot.js'),

  router = new director.http.Router({
    '/' : {
      post: bot.respond,
      get: ping
    }
  }),

  server = http.createServer((req, res) => {
    req.chunks = [];
    req.on('data', chunk => {
      req.chunks.push(chunk.toString());
    });

    router.dispatch(req, res, err => {
      res.writeHead(err.status, {"Content-Type": "text/plain"});
      res.end(err.message);
    });
  }),

	port = Number(process.env.PORT || 5000);

server.listen(port);

function ping() {
  this.res.writeHead(200);
  this.res.end("Bot running.");
}
