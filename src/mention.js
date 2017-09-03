const HTTPS = require('https'),
			config = require('./config.js');

function all(cb) {
	const url = `https://api.groupme.com/v3/groups/${config.GROUP_ID}?token=${config.ACCESS_TOKEN}`;

	HTTPS.get(url, res => {
		let resp = '';

		res.on('data', chunk => {
			resp += chunk;
		});

		res.on('end', () => {
			const info = JSON.parse(resp);
			let body = {
				"bot_id": config.BOT_ID,
				"text": "@everyone",
				"attachments": [{
					"loci": [],
					"type": "mentions",
					"user_ids": []
				}]
			};

			info.response.members.forEach(member => {
				body.attachments[0].user_ids.push(member.user_id);
				body.attachments[0].loci.push([0, 9]);
			});

			cb(body);
		});
	}).on('error', err => {
		console.log('Got an error: ', err);
	});
}

exports.all = all;
