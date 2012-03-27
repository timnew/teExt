chrome.extension.sendRequest({role: "te-tab", state: "updateData"},function(canClose) {
	if(canClose) {
		chrome.extension.sendRequest({role: "te-tab", state: "close" }, function() { });
	}
});
