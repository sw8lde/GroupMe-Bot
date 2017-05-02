var HTTPS = require('https');
var config = require('./config.js');
var mention = require('./mention.js');
var stats = require('./stats.js');
var giphy = require('./giphy.js');

function respond() {
	var message = JSON.parse(this.req.chunks[0]),
		botRegex = /Bot/i,
		mentionRegex = /(@all|@everyone|@guys)/i,
		statsRegex = /@stats/i,
        meRegex = /@me/i;

	if(message.text && botRegex.test(message.text)) {
		console.log('call: CSSA Bot');
		this.res.writeHead(200);
		postMessage(":)");
		this.res.end();
	} else if(message.text && statsRegex.test(message.text)) {
		var numMsgs, userIds = [];

		console.log("call: stats");
		this.res.writeHead(200);
		postMessage("Starting analysis...");

		numMsgs = message.text.match(/\d+/);
		if(numMsgs) {
			numMsgs = numMsgs[0];
		}

		if((new RegExp(message.name, 'i')).test(message.text) || meRegex.test(message.text)) {
			userIds = [message.sender_id];
		}

		message.attachments.forEach(function(attachment) {
		if(attachment.user_ids) {
			userIds = userIds.concat(attachment.user_ids);
		}
		});

		if(mentionRegex.test(message.text)) {
			userIds = "all";
		}

		try {
			if(userIds.length > 0) {
				stats.startUserAnalysis(userIds, numMsgs, postMessage);
			} else {
				stats.startGroupAnalysis(numMsgs, postMessage);
			}
		} catch(err) {
			postMessage('Unexpected error.');
			console.log('err: ' + err);
		}
		this.res.end();
	} else if(message.text && mentionRegex.test(message.text)) {
		console.log('call: mention all');
		this.res.writeHead(200);
		mention.all(postMessage);
		this.res.end();
	} else if(message.text && message.text.indexOf('#') > -1) {
		var msg = message.text, search = "";

		console.log('call: giphy');
		this.res.writeHead(200);

		while(msg.indexOf('#') > -1) {
			var newTag;
			msg = msg.substring(msg.indexOf('#') + 1);
			newTag = msg.split(/\s+/)[0].replace(/\W/g, '');
			if(newTag.length > 0) {
				search += "+" + newTag;
			}
    }
    
		giphy.getRandom(search.substring(1), postMessage);
		this.res.end();
    } else {
		console.log("call: none");
		this.res.writeHead(200);
		this.res.end();
	}
}

function postMessage(body) {
  var options, botReq;

  if(typeof body === "string") {
	body = {
	"bot_id" : config.BOT_ID,
	"text" : body
	};
  } else if(typeof body === "undefined") {
	body = {
	"bot_id" : config.BOT_ID,
	"text" : "Error"
	};
  }
  
  options = {
	hostname: 'api.groupme.com',
	path: '/v3/bots/post',
	method: 'POST'
  };

  botReq = HTTPS.request(options, function(res) {
	  if(res.statusCode == 202) {
		//neat
	  } else {
		console.log('rejecting bad status code ' + res.statusCode);
	  }
  });

  botReq.on('error', function(err) {
	console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
	console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

exports.respond = respond;
exports.postMessage = postMessage;
