const bot = require('../bot');

var sentiment = new (require('sentiment'))();

function trigger(msg) {
  return /@Bot/i.test(msg.text);
}

function respond(msg) {
  let sent = sentiment.analyze(msg.text).score;
  let resps = [
    { thres: '-25', resp: '(ಥ﹏ಥ)' },
    { thres: '-15', resp: '(ง ͠° ͟ل͜ ͡°)ง' },
    { thres: '-10', resp: 'stfu :)' },
    { thres: '-1', resp: ':(' },
    { thres: '0', resp: ':/' },
    { thres: '0.1', resp: '¯\\_(ツ)_/¯' },
    { thres: '1', resp: ':)' },
    { thres: '10', resp: ':D' },
    { thres: '999999', resp: '(ღ˘⌣˘ღ)' }
  ]
  
  console.log('sentiment: ' + sent);

  resps.some(resp => {
    if(sent < +resp.thres) {
      bot.postMsg(resp.resp);
      return true;
    }
  });
}

exports.trigger = trigger;
exports.respond = respond;