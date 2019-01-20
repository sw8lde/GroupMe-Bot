const config = require('../config');
const rp = require('request-promise');

function trigger(msg) {
  return msg.sender_id == 'system' && new RegExp('removed ' + config.USER_ADD.name, 'i').test(msg.text)
}

async function respond() {
  try {
    await rp({
      method: 'POST',
      url: `https://api.groupme.com/v3/groups/${config.GROUP_ID}/members/add?token=${config.ACCESS_TOKEN}`,
      body: {
        'members': [{
          'nickname': config.USER_ADD.name,
          'user_id': config.USER_ADD.id,
          'guid': 'GUID-1'
        }]
      },
      json: true
    });
  } catch(err) {
    console.error(err);
  }
}

exports.trigger = trigger;
exports.respond = respond;