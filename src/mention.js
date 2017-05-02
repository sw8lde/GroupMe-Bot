var HTTPS = require('https');
var config = require('./config.js');

function all(callback) {
	var url = 'https://api.groupme.com/v3/groups/' + config.GROUP_ID + '?token=' + config.ACCESS_TOKEN;

	HTTPS.get(url, function(res) {
		var resp = "";

		res.on('data', function(chunk) {
			resp += chunk;
		});

		res.on('end', function() {
			var info = JSON.parse(resp);
			var body = {
				"bot_id": config.BOT_ID,
				"text": "@everyone",
				"attachments": [{
					"loci": [],
					"type": "mentions",
					"user_ids": []
				}]
			};
			var member, lociIndex = 0;

			for(var i = 0; i < info.response.members.length; i++) {
				body.attachments[0].user_ids.push(info.response.members[i].user_id);
				body.attachments[0].loci.push([0, 9]);
			}
			
			console.log(body);
			console.log(body.attachments[0].user_ids);
			callback(body);
		});
	}).on('error', function(e){
		console.log("Got an error: ", e);
	});
}

exports.all = all;
