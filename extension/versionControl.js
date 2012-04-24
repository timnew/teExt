function migrateDB_v0_9_3(){
	var toBeAdded = [];
	var toBeRemoved = [];
	
	for(var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);
	 	if(key === 'knownCodes' || key === 'authentication')
			continue;
			
		var value = localStorage.getItem(key);
	 	var dueDate = new Date(key);
		dueDate.setHours(0,0,0,0);
		value = JSON.parse(value);
		value.dueDate = dueDate;
		value = JSON.stringify(value);
		toBeRemoved.push(key);
		toBeAdded.push({key:dueDate, value:value});
	}
	
	for(var i = 0 ; i < toBeRemoved.length; i ++) {
		localStorage.removeItem(toBeRemoved[i]);
	}
	
	for(var i = 0 ; i < toBeAdded.length; i ++) {
		localStorage[toBeAdded[i].key]=toBeAdded[i].value;
	}
	
}

function Upgrade(oldVersion, currentVersion) {
	if(currentVersion === "0.9.3" && oldVersion === "0.9.2" ) {
		migrateDB_v0_9_3();
	}
}

function getOldVersion() {
	var version = localStorage.getItem('version');
	if(version == null ) {
		if(localStorage.length === 0) {
			return "0.0.0"; // New Install
		}
		else {
			return "0.9.2"; // The first version didn't store version info.
		}
	}
}

function getVersion() {
  var details = chrome.app.getDetails();
  return details.version;
}

(function checkVersion(){
	var oldVersion = getOldVersion();
	var currentVersion = getVersion();
	
	if(oldVersion !== currentVersion) {
		console.log("Upgrade from v" + oldVersion + " to v" + currentVersion);
		if(Upgrade(oldVersion, currentVersion)) {
			localStorage['version'] = currentVersion;
			console.log("Upgrade Succeeded.");
		}
		else{
			console.error("Upgrade failed");
		}
		
	}
})();