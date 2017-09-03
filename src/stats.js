const HTTPS = require('https'),
			config = require('./config.js'),
			sprintf = require('sprintf-js').sprintf;
let userDict = {'ids': []};

function startGroupAnalysis(numMsgs, cb) {
	new Promise(resolve => {
		initGroup(numMsgs, resolve);
	})
	.then(msgs => {
		analyzeGroup(msgs, cb);
	});
}

function startUserAnalysis(userIds, numMsgs, cb) {
	new Promise(resolve => {
		initGroup(numMsgs, resolve);
	})
	.then(msgs => {
		analyzeUsers(userIds, msgs, cb);
	});
}

function initGroup(numMsgs, cb) {
	new Promise((resolve, reject) => {
		const groupUrl = `https://api.groupme.com/v3/groups/${config.GROUP_ID}?token=${config.ACCESS_TOKEN}`,
			options = {
				hostname: 'api.groupme.com',
				path: `/v3/groups/${config.GROUP_ID}/messages?token=${config.ACCESS_TOKEN}&limit=100`,
				method: 'GET'
			};

		HTTPS.get(groupUrl, res => {
			let resp = '';

			res.on('data', chunk => {
				resp += chunk;
			});

			res.on('end', () => {
				const info = JSON.parse(resp);
				count = info.response.messages.count;

				info.response.members.forEach(function(member) {
					userDict.ids.push(member.user_id);
					userDict[member.user_id] = {
						name: member.nickname,
						sent: 0,
						msg_length: 0,
						liked_msgs: 0,
						likes_given: 0,
						likes_got: 0,
						self_likes: 0
					};
				});

				resolve();
			});
		}).on('error', reject);
	})
	.then(() => {
		const baseUrl = `/v3/groups/${config.GROUP_ID}/messages?token=${config.ACCESS_TOKEN}&limit=100`,
			options = {
				hostname: 'api.groupme.com',
				path: `/v3/groups/${config.GROUP_ID}/messages?token=${config.ACCESS_TOKEN}&limit=100`,
				method: 'GET'
			};

		function getMsgs(msgs, ops, callback) {
			HTTPS.get(ops, res => {
					var resp = '';

					res.on('data', chunk => {
						resp += chunk;
					});

					res.on('end', () => {
						const info = JSON.parse(resp);
						msgs = msgs.concat(info.response.messages);

						if(msgs.length >= numMsgs || msgs.length == count) {
							cb(msgs);
						} else {
							ops.path = baseUrl + '&before_id=' + info.response.messages[info.response.messages.length - 1].id;
							callback(msgs, ops, getMsgs);
						}
					});
				}).on('error', e => {
					throw e;
				});
		}
		getMsgs([], options, getMsgs);
	})
	.catch(console.log);
}

function analyzeGroup(msgs, cb) {
	let returnStr,
		sent = 0,
		chars = 0,
		liked = 0,
		likes = 0,
		selfLikes = 0,
		maxLikes = 0,
		maxLikesUser = 'None',
		maxLikesPerc = 0,
		maxLikesPercUser = 'None',
		maxLikesPerc2 = 0,
		maxLikesPercUser2 = 'None';

	msgs.forEach(msg => {
		if(userDict[msg.sender_id]) {
			userDict[msg.sender_id].sent++;
			sent++;

			if(msg.text) {
				chars += msg.text.length;
			}

			if(msg.favorited_by.length) {
				liked++;
				userDict[msg.sender_id].liked_msgs++;
				likes += msg.favorited_by.length;

				if((msg.favorited_by).indexOf(msg.sender_id) > -1) {
					selfLikes++;
				}

				userDict[msg.sender_id].likes_got += msg.favorited_by.length;
				if(userDict[msg.sender_id].likes_got == maxLikes &&
					maxLikesUser.indexOf(userDict[msg.sender_id].name) == -1) {
					maxLikesUser += ' ' + userDict[msg.sender_id].name;
				} else if(userDict[msg.sender_id].likes_got > maxLikes) {
					maxLikes = userDict[msg.sender_id].likes_got;
					maxLikesUser = userDict[msg.sender_id].name;
				}
			}
		}
	});

	userDict.ids.forEach(id => {
		if(userDict[id].liked_msgs / userDict[id].sent * 100 > maxLikesPerc) {
			maxLikesPerc = userDict[id].liked_msgs / userDict[id].sent * 100;
			maxLikesPercUser = userDict[id].name;
		}
	});

	userDict.ids.forEach(id => {
		if(userDict[id].name != maxLikesPercUser && userDict[id].liked_msgs / userDict[id].sent * 100 > maxLikesPerc2) {
			maxLikesPerc2 = userDict[id].liked_msgs / userDict[id].sent * 100;
			maxLikesPercUser2 = userDict[id].name;
		}
	});

	cb(sprintf(`Analyzed ${sent} of ${count} total msgs:
		%.1f avg message length
		%.1f likes per message
		%.1fp liked messages
		%.1f likes per liked message
		${likes} total likes
		${selfLikes} self-likes

		Most likes is ${maxLikesUser} with ${maxLikes} total likes.
		Highest like efficiency is ${maxLikesPercUser} with %.1fp like rate.
		Next hightest is ${maxLikesPercUser2} with %.1fp like rate.`,
		chars / sent,
		likes / sent,
		liked / sent * 100,
		likes / liked,
		maxLikesPerc,
		maxLikesPerc2));
}

function analyzeUsers(userIds, msgs, cb) {
	var returnStr,
		sent = 0,
		chars = 0,
		liked = 0,
		likes = 0,
		selfLikes = 0,
		id;

	msgs.forEach(msg => {
		if(userDict[msg.sender_id]) {
			userDict[msg.sender_id].sent++;
			sent++;
			if(msg.text) {
				userDict[msg.sender_id].msg_length += msg.text.length;
				chars += msg.text.length;
			}
			if(msg.favorited_by.length) {
				userDict[msg.sender_id].liked_msgs++;
				liked++;
				likes += msg.favorited_by.length;
				for(var j = 0; j < msg.favorited_by.length; j++) {
					userDict[msg.favorited_by[j]].likes_given++;
					userDict[msg.sender_id].likes_got++;
				}
				if(msg.favorited_by.indexOf(msg.sender_id) > -1) {
					userDict[msg.sender_id].self_likes++;
					selfLikes++;
				}
			}
		}
	});

	userIds.forEach(id => {
		cb(sprintf(`Analyzed ${sent} of ${count} total msgs:
			${userDict[id].name}:
			${userDict[id].sent} (%.1fp) sent messages
			%.1f (%.1fp) avg message length
			%.1f (%.1fp) likes per message
			%.1f likes per liked message
			%.1f (%.1fp) like message rate
			${userDict[id].likes_given} (%.1fp) likes given
			${userDict[id].self_likes} self-likes`,
			userDict[id].sent / sent * 100,
			userDict[id].msg_length / userDict[id].sent, userDict[id].msg_length / chars * 100,
			userDict[id].likes_got / userDict[id].sent, userDict[id].likes_got / likes * 100,
			userDict[id].likes_got / userDict[id].liked_msgs,
			userDict[id].liked_msgs / userDict[id].sent * 100, userDict[id].liked_msgs / liked * 100,
			userDict[id].likes_given / likes * 100
		));
	});
}

exports.startUserAnalysis = startUserAnalysis;
exports.startGroupAnalysis = startGroupAnalysis;
