var HTTP = require('http'),
	config = require('./config.js');

function getRandom(search, callback) {
    var url = 'http://api.giphy.com/v1/gifs/search?q=' + search + '&api_key=dc6zaTOxFJmzC';

	HTTP.get(url, function(res) {
		var resp = "";
        
		res.on('data', function(chunk) {
			resp += chunk;
		});

		res.on('end', function() {
            try {
                var info = JSON.parse(resp);
                var gif = info.data[Math.floor(Math.random() * info.data.length)];
				callback(gif.images.original.url);
			} catch(err) {
				console.log('no gif found for tags: ' + search);
			}
		});
	}).on('error', function(e){
		console.log("Got an error: ", e);
	});
}

exports.getRandom = getRandom;
