const config = require('../config');
const rp = require('request-promise');

function trigger(msg) {
  return msg.sender_id == config.USER_LIKE.id;
}

async function respond(msg) {
  try {
    await rp({
      method: 'POST',
      url: `https://api.groupme.com/v3/messages/${config.GROUP_ID}/${msg.id}/like?token=${config.ACCESS_TOKEN}`
    });
  } catch(err) {
    console.error(err);
  }
}

exports.trigger = trigger;
exports.respond = respond;