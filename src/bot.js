const config = require('./config');
const fs = require('fs');
const rp = require('request-promise');


function respond(arg) {
	let msg;
	if(!config.TEST) {
		msg = JSON.parse(this.req.chunks[0]);
	} else {
		msg = arg;
		this.res = {
			writeHead: () => {},
			end: () => {},
		}
	}

	fs.readdirSync('./src/responses/').forEach(f => {
		const resp = require('./responses/' + f);

		if(resp.trigger && resp.respond && resp.trigger(msg)) {
			console.log(`triggered ${f} from message: ${msg.text}`);

			this.res.writeHead(200);
			resp.respond(msg);
			this.res.end('done');
		}
	});
}

async function postMsg(body) {
	const options = {
		method: 'POST',
		url: 'https://api.groupme.com/v3/bots/post',
		body: body,
		json: true
	};

	if(typeof body === 'string') {
		options.body = {
			'bot_id': config.BOT_ID,
			'text': body
		};
	}

	try {
		await rp(options);
		console.log('message sent: ' + options.body.text);
	} catch(err) {
		console.error(err);
	}
}

exports.respond = respond;
exports.postMsg = config.TEST ? (obj) => console.log(obj) : postMsg;