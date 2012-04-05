
(function () {
	function _stringStartWith(str, prefix) {
		return str.slice(0,prefix.length) === prefix;
	}
	
	var notice = $('#flash_notice');
	if(notice && _stringStartWith(notice.text(), 'Successfully created time sheet ending on')) {
		chrome.extension.sendRequest({role: "te-tab", state: "done"}, function(needLogout) {
			if(needLogout) {
				window.location = 'https://te.thoughtworks.com/logout';
			}
			else {
				chrome.extension.sendRequest({role: "te-tab", state: "close" }, function() { });
			}

		});	
	}
})();