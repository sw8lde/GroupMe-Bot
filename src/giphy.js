const HTTP = require('http'),
			config = require('./config.js');

function getRandom(search, cb) {
  const url = `http://api.giphy.com/v1/gifs/search?q=${search}&api_key=${config.GIPHY_API_KEY}`;

	HTTP.get(url, res => {
		let resp = '';

		res.on('data', chunk => {
			resp += chunk;
		});

		res.on('end', () => {
            const info = JSON.parse(resp);
			if(info.data.length > 0)
            	cb(info.data
					[Math.floor(Math.random() * Math.min(info.data.length, 10))]
					.images.fixed_height.url);
			else
				console.log('no gif found for tags: ' + search);
		});
	}).on('error', err => {
		console.log("Got an error: ", err);
	});
}

function getTrending(cb) {
  const url = `http://api.giphy.com/v1/gifs/trending?api_key=${config.GIPHY_API_KEY}`;

	HTTP.get(url, res => {
		let resp = '';

		res.on('data', chunk => {
			resp += chunk;
		});

		res.on('end', () => {
            const info = JSON.parse(resp);
			if(info.data.length > 0) {
            	cb(info.data[Math.floor(Math.random() * 10)]
					.images.fixed_height.url);
			} else {
				console.log('no trending gif found');
			}
		});
	}).on('error', err => {
		console.log("Got an error: ", err);
	});
}

exports.getRandom = getRandom;
exports.getTrending = getTrending;
