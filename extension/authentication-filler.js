var filler = (function(){
	function typeOf(obj) {
		return obj.constructor.name.toLowerCase();
	}
	
	function verifyLogInType() {
		var title = $('#app-name').text();
		switch(title) {
			case 'SSO Internal/VPN access, please use Active Directory credentials.':
				console.log('Log In Type: Internal/VPN Access');
				return true;
			default:
				console.log('Log In Type: Unsupport');
				return false;
		}
	}
	
	function fill(formData, callback) {
		if(verifyLogInType()) {
			$('#username').val(formData.username);
			$('#password').val(formData.password);
			$('.btn-submit').click();
		}
		
		callback();
	}
	
	return {
		fill: fill
	};
})();

console.log('Log In Required');
chrome.extension.sendRequest({role: "te-tab", state: "log-in"}, function(formData) {
	console.log(formData);
	var authData = formData.authentication;
	if(authData != null) {
		filler.fill(authData, function() { 
			console.log('auth ok');
			formData.needLogOut = true;
			chrome.extension.sendRequest({role: "te-tab", state: "updateData", data: formData}, function(res){
				console.log(res);
			});
		});		
	}
});

