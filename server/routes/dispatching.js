
/*
 * GET dispatching page
 */
var messenger = {
	on: function(callback) {
		if(this.callback)
		{
			var lastCallback = this.callback;
			this.callback = function(m) {
				lastCallback(m);
				callback(m);
			}
		}
		else
		{
			this.callback = callback;
		}
	},
	send: function(message) {
		if(this.callback)
			this.callback(message);
	}
}

exports.dispatching = function(req, res) {
	req.socket.setTimeout(Infinity);
	
	var messageCount = 0;
	var publishEvent = function(message) {
		console.log(message);

		for(var i=0; i<message.timesheets.length; i++){
			var timesheet = message.timesheets[i];
			if(message.authentication != null) {
				timesheet.authentication = message.authentication;
			}
			messageCount++;
			res.write('id: ' + messageCount + '\n');
			res.write('event: ' + 'timesheet' + '\n')
		   	res.write('data: ' + JSON.stringify(message.timesheets[0]) + '\n');
			res.write('\n');
		}
	}
	messenger.on(publishEvent);
	
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	
	res.write('\n');
	
	req.on('close', function() {
		res.end();
	});
};

exports.manualPost = function(req, res) {
  messenger.send(req.params.message);
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(req.params.message + ' delivered!');
  res.end();
};

exports.post = function(req, res) {
	console.log(req.body);
	messenger.send(req.body);
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('delivered: \n');
  	res.write(JSON.stringify(req.body));
  	res.end();
};