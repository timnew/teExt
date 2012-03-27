chrome.extension.sendRequest({role: "te-tab", state: "updateData"},function(canLogIn) {
	if(canLogIn) {
		window.location = 'https://te.thoughtworks.com/time_sheets/new';
	}
});