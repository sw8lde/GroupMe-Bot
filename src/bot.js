const HTTPS = require('https'),
	config = require('./config.js'),
	mention = require('./mention.js'),
	stats = require('./stats.js'),
	giphy = require('./giphy.js');

function respond() {
	const msg = JSON.parse(this.req.chunks[0]),
		botRegex = /Bot/i,
		mentionRegex = /(@all|@everyone|@guys)/i,
		statsRegex = /@stats/i;

	if(!msg.text) return;
	const txt = msg.text;

	if(botRegex.test(txt)) {
		this.res.writeHead(200);
		console.log('call: Bot');
		postMsg(':)');
		this.res.end('responded to bot');
	} else if(statsRegex.test(txt)) {
		this.res.writeHead(200);
		console.log('call: stats');
		postMsg('Starting analysis...');
		getStats(msg);
		this.res.end('posted stats');
	} else if(mentionRegex.test(txt)) {
		this.res.writeHead(200);
		console.log('call: mention all');
		mention.all(postMsg);
		this.res.end('mentioned all');
	} else if(txt.indexOf('#') > -1) {
		this.res.writeHead(200);
		console.log('call: giphy');
		let search = '',
			tags = txt;

		while(tags.indexOf('#') > -1) {
			let newTag;
			tags = tags.substring(tags.indexOf('#') + 1);
			newTag = tags.split(/\s+/)[0].replace(/\W/g, '');
			if(newTag.length > 0) {
				search += `+${newTag}`;
			}
		}

		if(search.toLowerCase() === '+trending')
			giphy.getTrending(postMsg);
		else
			giphy.getRandom(search.substring(1), postMsg);
		this.res.end('posted gif');
	}
}

function getStats(msg) {
	const txt = msg.text,
				mentionRegex = /(@all|@everyone|@guys)/i,
				meRegex = /@me/i;
	let numMsgs, userIds;

	(numMsgs = txt.match(/\d+/)) && (numMsgs=numMsgs[0]);

	if((new RegExp(msg.name, 'i')).test(txt) || meRegex.test(txt)) {
		userIds = [msg.sender_id];
	}


	if(mentionRegex.test(txt)) {
		userIds = "all";
	} else {
		userIds = msg.attachments.reduce((arr, att) => {
		    if(att) {
		        return arr.concat(att.user_ids);
		    }
		}, userIds || []);
	}

	try {
		if(userIds.length > 0) {
			stats.startUserAnalysis(userIds, numMsgs || config.DEFAULT_MSGS_TO_ANALYZE, postMsg);
		} else {
			stats.startGroupAnalysis(numMsgs || config.DEFAULT_MSGS_TO_ANALYZE, postMsg);
		}
	} catch(err) {
		console.log('err getting stats: ', err);
		postMsg('Unexpected error.');
	}
}

function postMsg(body) {
	const options = {
		hostname: 'api.groupme.com',
		path: '/v3/bots/post',
		method: 'POST',

	};

	if(typeof body === 'string') {
		body = {
			'bot_id': config.BOT_ID,
			'text': body
		};
	} else if(typeof body === 'undefined') {
		body = {
			'bot_id': config.BOT_ID,
			'text': 'I don\'t know man.'
		};
	}

	request(options, body);
}

function request(options, body) {
	let botReq = HTTPS.request(options, res => {
		if(res.statusCode != 202) {
			console.log(`rejecting bad status code ${res.statusCode} ${res.statusMessage}`);
		}
	});

	botReq.on('error', err => {
		console.log('error posting message ' + JSON.stringify(err));
	});
	botReq.on('timeout', err => {
		console.log('timeout posting message ' + JSON.stringify(err));
	});
	botReq.end(JSON.stringify(body));
}

exports.respond = respond;
exports.postMsg = postMsg;
