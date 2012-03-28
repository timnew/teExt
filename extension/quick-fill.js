var Timesheet = (function() {
	function Timesheet(obj) {
		if(obj == null) {
			this.records = [];
		}
		else {
			for(var i in obj) {
				this[i] = obj[i];
			}
		}
	}
	
	function buildItems(records) {
		var categories = {}
		for(var i = 0; i < records.length; i++) {
			var r = records[i];
			var category = categories[r.day]
			if(category == null) {
				category = categories[r.day] = [r.task];
				category.day = r.day;
				category.code = r.code;
			}
			else {
				category.push(r.task);
			}
		}
		var result = [];
		for(var i in categories) {
			var c = categories[i];
			var item = {
				code: c.code,
				billable: true,
				description: c.join(' '),
				hours: [0,0,0,0,0,0,0]
			};
			item.hours[c.day - 1] = 8;
			result.push(item);
		}
		
		return result;
	}
	
	Timesheet.prototype.submit = function() {
		var dueDate = new Date(this.dueDate);
		var json = {
			dueDate: dueDate.getFullYear() + '-' + dueDate.getMonth() + '-' + dueDate.getDate(),
			hasExpense: false,
			items: buildItems(this.records)
		};
		var auth = authentication.get()
		if(auth != null) {
			json.authentication = auth;
		}
		console.log(json);
		chrome.extension.sendRequest({role: "data-gather", state: "new-data", data: json}, function(){
			// do something
		});
	};
	
	Timesheet.prototype.add = function(record) {
		this.records.push(record);
	}
	
	Timesheet.prototype.remove = function(index) {
		this.records.splice(index,1);
		store.save(this.dueDate, this);
	}
	
	return Timesheet;
})();

var store = (function () {
	function set(dueDate, value) {
		var timesheet= this.load(dueDate);
		timesheet.add(value);
		this.save(dueDate, timesheet);
	}
	
	function updateCode(code, callback) {
		if(code==null && callback == null) {
			this.knownCodes = JSON.parse(localStorage.getItem('knownCodes'));
			if(this.knownCodes == null) {
				this.knownCodes = [
					'PWC0001 ASSIG_3 MISC',
					'TW_TOFF LEAVE PUBLIC_HOLIDAY',
					'TW_TOFF LEAVE ANNUAL_LV',
					'TW_TOFF SICK SICK_LV',
					'TW_TOFF LEAVE TIME_IN_LIEU'];
				localStorage.setItem('knownCodes', JSON.stringify(this.knownCodes));				
			}
		}
		else {
			code = code.trim();
			var index = this.knownCodes.indexOf(code);
		
			if(index == 0)
				return;
				
			if(index === -1) {
				if(this.knownCodes.length > 10) {
					console.log('Dispose old code:' + this.knownCodes.pop());
				}
				this.knownCodes.unshift(code)
				console.log('Add new code: ' + code);
			} 
			else {
				console.log('Reprioritize code ' + code);
				[].splice.apply(this.knownCodes, [1, index].concat(this.knownCodes.slice(0, index || 9e9)));
				this.knownCodes[0] = code;
			}
			localStorage.setItem('knownCodes', JSON.stringify(this.knownCodes));
			if(callback != null) {
				callback();
			}
			
		}
	}
	
	function load(dueDate) {
		var timesheet = localStorage.getItem(dueDate);
		if(timesheet == null) {
			timesheet = new Timesheet();
			timesheet.dueDate = dueDate;
		}
		else {
			timesheet = new Timesheet(JSON.parse(timesheet));
		}
			
		this.current = timesheet;
		
		return timesheet;
	}
	
	function save(dueDate, timesheet) {
		this.current = timesheet;
		localStorage[dueDate] = JSON.stringify(timesheet);
	}
 	
	return {
		load: load,
		save: save,
		current: new Timesheet(),
		knownCodes: [],
		updateCode: updateCode,
		set: set
	};
})();

store.updateCode();

var authentication = (function() {
	function setAuth(auth) {
		if(auth != null) {
			localStorage['authentication'] = JSON.stringify(auth);
		}
	}
	
	function getAuth() {
		var auth = localStorage['authentication'];
		return auth == null ? undefined : JSON.parse(auth);
	}
	
	function resetAuth() {
		localStorage.removeItem('authentication');
	}
	
	return {
		set: setAuth,
		reset: resetAuth,
		get: getAuth
	};
})();

$( document ).delegate("#page-form", "pageinit", function() {
	var page = $('#page-form');
	var dueDate = $('#dueDate', page);
	var dayOfWeek = $('#dayOfWeek', page);
	var code = $('#code', page);
	var codeList = $('#code-list', page);
	var codeListContainer = $('#code-list-container', page);
	var task = $('#task', page);
	var add = $('#add', page);
	var items = $('#items', page);
	 
	(function initDueDate() {
		var today = new Date();
		var sunday = new Date();
		sunday.setDate(today.getDate() + ((7 - today.getDay()) % 7));
		dueDate.val(sunday.toLocaleDateString())
	})();
	
	(function initDayOfWeek() {
		$('input', dayOfWeek).click(function() {
			dayOfWeek.val($(this).val());
		});
		
		var today = new Date();
		$('input[value=' + today.getDay() +']', dayOfWeek).attr('checked','checked').click();
	})();
	
	function refreshCodeList(){
		codeList.html('');
		for(var i = 0; i < store.knownCodes.length; i++) {
			codeList.append('<li data-icon="grid" data-iconpos="left"><a href="#">' + store.knownCodes[i] + '</a></li>');
		}
	
		codeList.listview('refresh');
	}
	
	(function initCode() {
		code.focus(function() {
			codeListContainer.show();
		});
		
		code.blur(function() {
			codeListContainer.hide();
		});
		
		code.val(store.knownCodes[0]);
		
		codeListContainer.hide();

		refreshCodeList();
									
    	codeList.delegate('li', 'mousedown', function (e) {
			code.val($(this).text());
		});
		
		var listview = codeList.data( "listview" );
		code.jqmData( "lastval", "" )
			.bind( "keyup change", function() {
				var $this = $(this),
					val = this.value.toLowerCase(),
					listItems = null,
					lastval = $this.jqmData( "lastval" ) + "",
					childItems = false,
					itemtext = "",
					item;

				// Change val as lastval for next execution
				$this.jqmData( "lastval" , val );
				if ( val.length < lastval.length || val.indexOf(lastval) !== 0 ) {
					// Removed chars or pasted something totally different, check all items
					listItems = codeList.children();
				} else {
					// Only chars added, not removed, only use visible subset
					listItems = codeList.children( ":not(.ui-screen-hidden)" );
				}

				if ( val ) {
					// This handles hiding regular rows without the text we search for
					// and any list dividers without regular rows shown under it

					for ( var i = listItems.length - 1; i >= 0; i-- ) {
						item = $( listItems[ i ] );
						itemtext = item.jqmData( "filtertext" ) || item.text();

						if ( item.is( "li:jqmData(role=list-divider)" ) ) {
							item.toggleClass( "ui-filter-hidequeue" , !childItems );
							// New bucket!
							childItems = false;
						} else if ( listview.options.filterCallback( itemtext, val ) ) {
							//mark to be hidden
							item.toggleClass( "ui-filter-hidequeue" , true );
						} else {
							// There's a shown item in the bucket
							childItems = true;
						}
					}

					// Show items, not marked to be hidden
					listItems
						.filter( ":not(.ui-filter-hidequeue)" )
						.toggleClass( "ui-screen-hidden", false );
					// Hide items, marked to be hidden
					listItems
						.filter( ".ui-filter-hidequeue" )
						.toggleClass( "ui-screen-hidden", true )
						.toggleClass( "ui-filter-hidequeue", false );
				} else {
					//filtervalue is empty => show all
					listItems.toggleClass( "ui-screen-hidden", false );
				}
				listview._refreshCorners();
			});
	})();
	
	(function initAdd() {
		add.click(function() { 
			var record = {	
					code: code.val(),
					day: dayOfWeek.val(),
					task: task.val()
				 };
			store.updateCode(code.val(), refreshCodeList);
			store.set(dueDate.val(), record);
			refresh();
		});
	})();
	
	(function initItems(){
		items.delegate('button','click',function() {
			var index = $(this).attr('index');
			store.current.remove(index);
			refresh();
		})
	})();
	
	function refresh() {
		items.html('');
		var records = store.current.records;
		for(var i=0; i<records.length; i++) {
			var item = $('<tr>').appendTo(items);
			var itemData = records[i];
			$('<td>').text(itemData.day).appendTo(items);
			$('<td>').text(itemData.code).appendTo(items);
			$('<td>').text(itemData.task).appendTo(items);
			$('<td><button>').appendTo(items).find('button').attr('data-icon','delete').attr('data-type','horizontal').attr('data-mini','true').attr('index',i).button();
		}
	}
	
	refresh();
	
	(function initRefresh() {
		$('#refresh', page).click(function() {
			refresh();
		});
	})();

	(function initSubmit() {
		$('#submit', page).click(function() {
			store.current.submit();
		});
	})();
	
	store.load(dueDate.val());
	refresh();
});


$(document).delegate('#authentication-form', 'pageinit', function() {
	function refresh(){
		var auth = authentication.get();
		if(auth == null) {
			auth = {
				username: '',
				password: ''
			};
		}
		
		$('#username').val(auth.username);
		$('#password').val(auth.password);
		
	};
	
	refresh();
	
	$('#saveAuthentication').click(function() {
		var auth = {
			username: $("#username").val(),
			password: $('#password').val()	
		};
		authentication.set(auth);
		refresh();
	});
	
	$('#clearAuthentication').click(function() {
		authentication.reset();
		refresh();
	});
	
	function getVersion() {
		var details = chrome.app.getDetails();
	    return details.version;		
	}
	
	$('#version').text('ver ' + getVersion());
});