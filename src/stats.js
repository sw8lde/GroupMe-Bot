var HTTPS = require('https'),
	config = require('./config.js'),
	sprintf = require('sprintf-js').sprintf,
	userDict = {'ids': []},
	count = 0,
	numTotal,
	finalFunction,
	finalCallback,
	userIds;

function initGroup() {
	var groupUrl = 'https://api.groupme.com/v3/groups/' + config.GROUP_ID + '?token=' + config.ACCESS_TOKEN,
		options = {
			hostname: 'api.groupme.com',
			path: '/v3/groups/' + config.GROUP_ID + '/messages?token=' + config.ACCESS_TOKEN + '&limit=100',
			method: 'GET'
		};

	HTTPS.get(groupUrl, function(res) {
		var resp = "";

		res.on('data', function(chunk) {
			resp += chunk;
		});

		res.on('end', function() {
			var info = JSON.parse(resp);
			count = info.response.messages.count;

			info.response.members.forEach(function(member) {
				userDict['ids'].push(member.user_id);
				// id: [name, msgs sent, msg length, liked msgs, likes given, likes received, self-likes]
				userDict[member.user_id] = [member.nickname, 0, 0, 0, 0, 0, 0];
			});

			if(userIds == 'all') {
				userIds = userDict['ids'];
			}

			getMsgs([], options, getMsgs);
		});
	}).on('error', function(e){
		console.log("Got an error: ", e);
	});
}

function getMsgs(msgs, options, callback) {
	var basePath = '/v3/groups/' + config.GROUP_ID + '/messages?token=' + config.ACCESS_TOKEN + '&limit=100'

	HTTPS.get(options, function(res) {
			var resp = "";

			res.on('data', function(chunk) {
				resp += chunk;
			});

			res.on('end', function() {
				var info = JSON.parse(resp);
				msgs = msgs.concat(info.response.messages);

				if(msgs.length >= numTotal || msgs.length == count) {
					finalFunction(msgs);
				} else {
					options.path = basePath + '&before_id=' + info.response.messages[info.response.messages.length - 1].id;
					callback(msgs, options, getMsgs);
				}
			});
		}).on('error', function(e){
			console.log("Got an error: ", e);
		});
}

function startGroupAnalysis(numMsgs, callback) {
	if(typeof numMsgs === 'undefined' || numMsgs == null) {
		numTotal = config.DEFAULT_MSGS_TO_ANALYZE;
	} else {
		numTotal = numMsgs;
	}
	finalFunction = analyzeGroup;
	finalCallback = callback;
	initGroup();
}

function startUserAnalysis(userIdsArray, numMsgs, callback) {
	userIds = userIdsArray;
	if(typeof numMsgs === 'undefined' || numMsgs == null) {
		numTotal = config.DEFAULT_MSGS_TO_ANALYZE;
	} else {
		numTotal = numMsgs;
	}
	finalFunction = analyzeUser;
	finalCallback = callback;
	initGroup()
}

function analyzeGroup(msgs) {
	console.log('analysing');
	var returnStr,
		sent = 0,
		chars = 0,
		liked = 0,
		likes = 0,
		selfLikes = 0;

	for(var i = 0; i < msgs.length; i++) {
		if(userDict[msgs[i].sender_id]) {
			sent++;
			if(msgs[i].text) {
				chars += msgs[i].text.length;
			}
			if(msgs[i].favorited_by.length) {
				liked++;
				likes += msgs[i].favorited_by.length;
				if((msgs[i].favorited_by).indexOf(msgs[i].sender_id) > -1) {
					selfLikes++;
				}
			}
		}
	}


	returnStr = sprintf("Analyzed %d msgs of %d total:\n"
		+ "Avg msg length: %.3f\n"
		+ "Avg likes per msg: %.3f\n"
		+ "Liked msgs perc: %.3f perc\n"
		+ "Avg likes per liked msg %.3f\n"
		+ "Total likes: %d\n"
		+ "Total self-likes: %d",
		sent, count,
		chars / sent,
		likes / sent,
		liked / sent * 100,
		likes / liked,
		likes,
		selfLikes);
	
	console.log("stats done");
	finalCallback(returnStr);
}

function analyzeUser(msgs) {
	var returnStr,
		sent = 0,
		chars = 0,
		liked = 0,
		likes = 0,
		selfLikes = 0,
		id;

	for(var i = 0; i < msgs.length; i++) {
		//id: [name, msgs sent, msg length, liked msgs, likes given, likes received, self-likes]
		if(userDict[msgs[i].sender_id]) {
			userDict[msgs[i].sender_id][1]++;
			sent++;
			if(msgs[i].text) {
				userDict[msgs[i].sender_id][2] += msgs[i].text.length;
				chars += msgs[i].text.length;
			}
			if(msgs[i].favorited_by.length) {
				userDict[msgs[i].sender_id][3]++;
				liked++;
				likes += msgs[i].favorited_by.length;
				for(var j = 0; j < msgs[i].favorited_by.length; j++) {
					userDict[msgs[i].favorited_by[j]][4]++;
					userDict[msgs[i].sender_id][5]++;
				}
				if(msgs[i].favorited_by.indexOf(msgs[i].sender_id) > -1) {
					userDict[msgs[i].sender_id][6]++;
					selfLikes++;
				}
			}
		}
	}

	for(var i = 0; i < userIds.length; i++) {
		var id = userIds[i];
		returnStr = sprintf("Analyzed %d msgs of %d total:\n", sent, count);
		returnStr += sprintf("Analysis for %s:\n", userDict[id][0]);
		returnStr += sprintf("Sent msgs: %d (%.3f percent of all msgs)\n",
			userDict[id][1], userDict[id][1] / sent * 100);
		returnStr += sprintf("Avg msg length: %.3f (%.3f percent of all characters)\n",
			userDict[id][2] / userDict[id][1], userDict[id][2] / chars * 100);
		returnStr += sprintf("Avg likes received per msg: %.3f (%.3f perc of all likes)\n",
			userDict[id][5] / userDict[id][1], userDict[id][5] / likes * 100);
		returnStr += sprintf("Liked msgs perc: %.3f perc (%.3f perc of all likes given)\n",
			userDict[id][3] / userDict[id][1] * 100, userDict[id][3] / liked * 100);
		returnStr += sprintf("Avg likes received per liked msg: %.3f\n",
			userDict[id][5] / userDict[id][3]);
		returnStr += sprintf("Total likes given: %d (%.3f perc of all likes)\n",
			userDict[id][4], userDict[id][4] / likes * 100);
		returnStr += sprintf("Total self-likes: %d",
			userDict[id][6]);

		console.log("stats done");
		finalCallback(returnStr);
	}
}

exports.startUserAnalysis = startUserAnalysis;
exports.startGroupAnalysis = startGroupAnalysis;