const config = require('../config');
const bot = require('../bot')
const rp = require('request-promise');
const sprintf = require('sprintf-js').sprintf;

function trigger(msg) {
	return /@stats/i.test(msg.text);
}

async function respond(msg) {
	let userIds = [];
	let num = +msg.text.replace(/\D/g, '') || config.DEFAULT_MSGS_TO_ANALYZE;

	if(/(@all|@everyone|@guys)/i.test(msg.text)) {
		userIds = 'all';
	} else {
		userIds = msg.attachments.reduce((arr, att) => {
			if(att) {
				return arr.concat(att.user_ids);
			}
		}, userIds);

		if(/@me/i.test(msg.text)) {
			userIds.push(msg.sender_id);
		}
	}

	let info = await getInfo(num);
	
	if(userIds.length) {
		userStats(info, userIds).forEach(bot.postMsg)
	} else {
		bot.postMsg(groupStats(info));
	}
}

async function getInfo(num) {
	let info = {
		count: 0,
		msgs: [],
		user_ids: [],
		users: {}
	}

	// initialize member info
	try {
		let resp = await rp({
			method: 'GET',
			url: `https://api.groupme.com/v3/groups/${config.GROUP_ID}?token=${config.ACCESS_TOKEN}`,
			json: true
		});
		
		info.count = resp.response.messages.count;

		resp.response.members.forEach(function(member) {
			info.user_ids.push(member.user_id);
			info.users[member.user_id] = {
				name: member.nickname,
				sent: 0,
				msg_length: 0,
				liked_msgs: 0,
				likes_given: 0,
				likes_got: 0,
				self_likes: 0
			};
		});
	} catch(err) {
		console.error(err);
	}

	// get messages
	const options = {
		method: 'GET',
		url: `https://api.groupme.com/v3/groups/${config.GROUP_ID}/messages?token=${config.ACCESS_TOKEN}&limit=100`,
		json: true
	};

	for(let i = Math.min(num, info.count); i > 0; i -= 100) {
		let resp = await rp(options);

		info.msgs = info.msgs.concat(resp.response.messages);

		options.url = options.url.replace(/&before_id.*/, '');
		options.url += '&before_id=' + resp.response.messages[resp.response.messages.length - 1].id;

		console.log(options.url);
	}

	return info;
}

function groupStats(info) {
	let sent = 0,
		liked = 0,
		likes = 0,
		selfLikes = 0,
		maxLikes = 0,
		maxLikesUser = 'None',
		maxLikesPerc = 0,
		maxLikesPercUser = 'None',
		maxLikesPerc2 = 0,
		maxLikesPercUser2 = 'None';

	info.msgs.forEach(msg => {
		if(info.users[msg.sender_id]) {
			info.users[msg.sender_id].sent++;
			sent++;

			if(msg.favorited_by.length) {
				liked++;
				info.users[msg.sender_id].liked_msgs++;
				likes += msg.favorited_by.length;

				if((msg.favorited_by).indexOf(msg.sender_id) > -1) {
					selfLikes++;
				}

				info.users[msg.sender_id].likes_got += msg.favorited_by.length;
				if(info.users[msg.sender_id].likes_got == maxLikes &&
					maxLikesUser.indexOf(info.users[msg.sender_id].name) == -1) {
					maxLikesUser += ' ' + info.users[msg.sender_id].name;
				} else if(info.users[msg.sender_id].likes_got > maxLikes) {
					maxLikes = info.users[msg.sender_id].likes_got;
					maxLikesUser = info.users[msg.sender_id].name;
				}
			}
		}
	});

	info.user_ids.forEach(id => {
		if(info.users[id].liked_msgs / info.users[id].sent * 100 > maxLikesPerc) {
			maxLikesPerc = info.users[id].liked_msgs / info.users[id].sent * 100;
			maxLikesPercUser = info.users[id].name;
		}
	});

	info.user_ids.forEach(id => {
		if(info.users[id].name != maxLikesPercUser && info.users[id].liked_msgs / info.users[id].sent * 100 > maxLikesPerc2) {
			maxLikesPerc2 = info.users[id].liked_msgs / info.users[id].sent * 100;
			maxLikesPercUser2 = info.users[id].name;
		}
	});

	return sprintf(`Analyzed ${sent} of ${info.count} total msgs:
		%.1f likes per message
		%.1fp liked messages
		%.1f likes per liked message
		${likes} total likes
		${selfLikes} self-likes

		Most likes is ${maxLikesUser} with ${maxLikes} total likes.
		Highest like efficiency is ${maxLikesPercUser} with %.1fp like rate.
		Next hightest is ${maxLikesPercUser2} with %.1fp like rate.`,
		likes / sent || 0,
		liked / sent * 100 || 0,
		likes / liked || 0,
		maxLikesPerc,
		maxLikesPerc2);
}

function userStats(info, userIds) {
	let sent = 0,
		chars = 0,
		liked = 0,
		likes = 0,
		selfLikes = 0,
		id;

	if(userIds === 'all') userIds = info.user_ids;

	info.msgs.forEach(msg => {
		if(info.users[msg.sender_id]) {
			info.users[msg.sender_id].sent++;
			sent++;
			if(msg.text) {
				info.users[msg.sender_id].msg_length += msg.text.length;
				chars += msg.text.length;
			}
			if(msg.favorited_by.length) {
				info.users[msg.sender_id].liked_msgs++;
				liked++;
				likes += msg.favorited_by.length;
				for(var j = 0; j < msg.favorited_by.length; j++) {
					info.users[msg.favorited_by[j]].likes_given++;
					info.users[msg.sender_id].likes_got++;
				}
				if(msg.favorited_by.indexOf(msg.sender_id) > -1) {
					info.users[msg.sender_id].self_likes++;
					selfLikes++;
				}
			}
		}
	});

	return userIds.reduce((arr, id) => {
		return arr.concat([sprintf(`Analyzed ${sent} of ${info.count} total msgs:
			${info.users[id].name}:
			${info.users[id].sent} (%.1fp) sent messages
			%.1f (%.1fp) avg message length
			%.1f (%.1fp) likes per message
			%.1f likes per liked message
			%.1f (%.1fp) like message rate
			${info.users[id].likes_given} (%.1fp) likes given
			${info.users[id].self_likes} self-likes`,
			info.users[id].sent / sent * 100 || 0,
			info.users[id].msg_length / info.users[id].sent, info.users[id].msg_length / chars * 100 || 0,
			info.users[id].likes_got / info.users[id].sent, info.users[id].likes_got / likes * 100 || 0,
			info.users[id].likes_got / info.users[id].liked_msgs || 0,
			info.users[id].liked_msgs / info.users[id].sent * 100, info.users[id].liked_msgs / liked * 100 || 0,
			info.users[id].likes_given / likes * 100 || 0
		)]);
	}, []);
}


exports.trigger = trigger;
exports.respond = respond;
