const bot = require('../bot');
const config = require('../config');
const rp = require('request-promise');

function trigger(msg) {
	return /(@all|@everyone|@guys)/i.test(msg.text);
}

async function respond() {
	let body = {
		"bot_id": config.BOT_ID,
		"text": "^^^",
		"attachments": [{
			"loci": [],
			"type": "mentions",
			"user_ids": []
		}]
	};

	// fill in member ids
	try {
		let resp = await rp({
			method: 'GET',
			url: `https://api.groupme.com/v3/groups/${config.GROUP_ID}?token=${config.ACCESS_TOKEN}`,
			json: true
		});
		
		resp.response.members.forEach(member => {
			body.attachments[0].user_ids.push(member.user_id);
			body.attachments[0].loci.push([0, 3]);
		});
	} catch(err) {
		console.error(err);
	}

	// post message
	bot.postMsg(body)
}

exports.trigger = trigger;
exports.respond = respond;
