var taskQueue = [];
taskQueue.isAwake = false;
var assignedTask = {};

var roles = {
	"te-tab": {
		"ready": function(request, sender, sendResponse) {
			console.log('tab is ready fetch data: '+sender.tab.id);
			var data = assignedTask[sender.tab.id];
			sendResponse(data);
		},
		"log-in": function(request, sender, sendResponse) {
			console.log('log in is needed for tab: ' + sender.tab.id);
			var data = assignedTask[sender.tab.id];
			sendResponse(data);
		},
		"updateData": function(request, sender, sendResponse) {
			if( assignedTask[sender.tab.id] != null) {
				if(request.data != null) {
					assignedTask[sender.tab.id] = request.data;
				}
				sendResponse(true);
			}
			else {
				sendResponse(false);
			}
		},
		"done": function(request, sender, sendResponse) {
			if(assignedTask[sender.tab.id].needLogOut) {
				sendResponse(true);
			}
			else {
				sendResponse(false);
			}			
		},
		"close": function(request, sender, sendResponse) {
			sendResponse({});
			chrome.tabs.remove([sender.tab.id], function(response){ console.log('te tab closed: ' + sender.tab.id); });
			console.log('deassociate data from tab: '+sender.tab.id);
			delete assignedTask[sender.tab.id];
			taskQueue.isAwake = false;
			messenger.send({role: "job-runner", state: "wake-up"}, function(response) {
				console.log('job runer is awake: ' + response.awake);
			});
		}
	},
	"data-gather": {
		"new-data": function(request, sender, sendResponse) {
			console.log(request.data);
			sendResponse(true);
			taskQueue.push(request.data);
			console.log('new data pushed into queue: ' + request.data);
			
			messenger.send({role: "job-runner", state: "wake-up"}, function(response) {
				console.log('job runer is awake: ' + response.awake);
			});
		}
	},
	"job-runner": {
		"wake-up": function(request, sender, sendResponse) {
			console.log('wake up job-runner')
			sendResponse({awake: taskQueue.isAwake});
			if(taskQueue.isAwake)
			{
				console.log('job-runner has been awake');
				return;
			}
			
			taskQueue.isAwake = true;
				
			if(taskQueue.length) {
				var task = taskQueue.pop();
				chrome.tabs.create(
					{ url: 'https://te.thoughtworks.com/time_sheets/new' }, 
					function(tab) {
						console.log('new te tab created: ' + tab.id);	 
						console.log('associate data to tab: ' + tab.id + ' data: ' + task);
						task.needLogOut = false;
						assignedTask[tab.id] = task;
					});
			}
			else {
				taskQueue.isAwake = false;
			}
			
		}
	},
	"tracker": {
		"on-data": function(request, sender, sendResponse) {
			messenger.send({role: 'data-gather', state: 'new-data', data: request.data}, function(response){});
		}
	}
}

var messenger = (function(){
	function send(request, callback){
		onMessage(request, this, callback);
	}
	
	function onMessage(request,sender,sendResponse) {
		console.log(request);
		var role = roles[request.role];
		if(role === undefined) {
			console.error('role not found: ' + request.role);
			return;
		}
		var handler = role[request.state];
		if(handler === undefined) {
			console.error('state handler not found: ' + request.state + ' on ' + state.role);
			return;
		}
		handler(request, sender, sendResponse);
	}
	
	chrome.extension.onRequest.addListener(onMessage);	
	
	return {
		send: send,
		onMessage: onMessage
	};

})();

var tracker = (function(url) {
 	
    var onMessage = function(e) {
		var timesheet = JSON.parse(e.data);
		messenger.send({role: "tracker",state: "on-data", data: timesheet }, function(response){ console.log('handled'); })
	}
	
	function createSource(url) {
		if(this.source){
			destorySource();
		}
		
		if(url == null) {
			url = localStorage["scheduleServer"];
		}
		else {
			url = normalizeUrl(url);
		}
		
		if(url) {
			console.log('Start Tracker listen to ' + url);
			this.source = new EventSource(url);	
			this.source.addEventListener('timesheet', onMessage);
		}
		else {
			console.log('Tracker url is not defined');
		}
		
	}

 	function destorySource() {
		if(this.source) {
			console.log('Stoping Tracker...');
			this.source.close();
			this.source = null;
		}
    }

	function normalizeUrl(url) {
		if(url == null)
			return url;
			
		if(url.slice(0, 7) == 'http://' || url.slice(0, 8) == 'https://')
			return url;
		
		return 'http://' + url + '/dispatching';
	}

	function setupSource(url) {
		url = normalizeUrl(url);
		if(url) {
			console.log("Set tracker server listen to " + url);
			localStorage["scheduleServer"] = url;
			createSource();
		}
		else {
			console.log('Clear tracker server address');
			localStorage.removeItem('scheduleServer');
			destorySource();
		}
	}

	return {
		source: undefined,
		newMessage: onMessage,
		stop: destorySource,
		start: createSource,
		setup: setupSource
	};
})();

console.log('Use "tracker" object to manage tracker');
tracker.start();
