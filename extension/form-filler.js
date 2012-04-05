var filler = (function(){
	function typeOf(obj) {
		return obj.constructor.name.toLowerCase();
	}
	
	var monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
	
	function fillDueDate(rawDate) {
		var date;
		switch(typeOf(rawDate)) {
			case 'string':
				date = new Date(rawDate);
				break;
			case 'date':
				date = rawDate;
				break;
			default:
				throw new Exception();
		}
		
		var dateString = date.getDate()+' '+monthNames[date.getMonth()]+' '+date.getFullYear();
		
		$('#week_ending_date_string').val(dateString);
	}

	var Row = (function() {	
		var constructor = function(dom) {
			var columns = dom.find('td');
			
			this.codeInput = $(columns[2]).find('input');
			
			this.billableInputs = {
				true:  $(columns[4]).find('input[value=true]'),
				false: $(columns[4]).find('input[value=false]')
			};
			
			this.descriptionInput = $(columns[5]).find('input');
			
			this.hoursInputs = [];
			
			for(var i=0; i<7; i++) {
				this.hoursInputs[i] = $(columns[6+i]).find('input');
			}
			}
		
	    $.extend(constructor.prototype, {
			setCode: function(code) {
				this.codeInput.val(code);
			},
			setBillable: function(billable) {
				this.billableInputs[billable].attr('checked','checked');
			},
			setDescription: function(text) {
				this.descriptionInput.val(text);
			},
			setDayHour: function(day, hour) {
				 this.hoursInputs[day].val(hour ? hour : '');	
			},
			setDayHours: function(hours) {
				for(var day=0; day<hours.length; day++) {
					this.setDayHour(day, hours[day]);
				}
			}
		});
		
		return constructor;
	})();
	
	function fillRow(rowDom, rowData) {
		var row = new Row(rowDom);
		row.setCode(rowData.code);
		row.setBillable(rowData.billable);
		row.setDescription(rowData.description);
		row.setDayHours(rowData.hours);
	}
	
	function fillExpense(value) {
		$('#time_sheet_expenses_'+value).attr('checked','checked');
	}
	
	function submitForm(submitAsFinal) {
		var button = $('input[type=submit]:' + (submitAsFinal ? 'last' : 'first'));
		
		if (confirm ('Confirm the form data?')){
			button.click();
		}
	}
	
	function _getRowDom(index) {
		return $("#time_record_" + index + "_row");
	}

	function _addRow() {
		$('#add_row').find('a').click();
	}
	
	function _getRowDomAsync(index, asyncCallback) {
		var rowDom = _getRowDom(index);
		if(rowDom.length) {
			return rowDom;					
		}
		else {
			_addRow();
			setTimeout(function(){ _waitForAddRow(index, asyncCallback); }, 50);
			return false;
		}
	}
	
	function _waitForAddRow(index, asyncCallback) {
		var rowDom = _getRowDom(index);
		if(rowDom.length) {
			asyncCallback(rowDom);
		}
		else {
			setTimeout(function(){ _waitForAddRow(index,asyncCallback); }, 50);
		}
	}
	
	function _stringStartWith(str, prefix) {
		return str.slice(0,prefix.length) === prefix;
	}
	
	function _waitForSaveSucceed(callback) {
		var notice = $('#flash_notice');
		if(notice && _stringStartWith(notice.text(), 'Successfully created time sheet ending on')) {
			callback();
		}
		else {
			setTimeout(function(){ _waitForSaveSucceed(callback); }, 50);
		}
	}
	
	function fillRowsAsync(tasks, callback) { 
		while(tasks.length) {
			var task = tasks.pop();
			var result = _getRowDomAsync(task.index, function(dom){
				fillRow(dom, task.data);
				fillRowsAsync(tasks,callback);
			})
			if(result) {
				fillRow(result,task.data);
			}
			else{
				return false;
			}
		}
		callback();
	}
	
	function fill(data, callback) {
		fillDueDate(data.dueDate);
		
		var tasks = [];
		for(var i=0; i<data.items.length; i++) {
		 	tasks.push({index: i, data: data.items[i]});
		}
		tasks = tasks.reverse();
		
		fillRowsAsync(tasks, function() {
			fillExpense(false);
			submitForm(data.submitAsFinal);
		
			if(!data.submitAsFinal) {
				_waitForSaveSucceed(callback);
			}
			else {
				while(true) { } // Wait for page redirect automatically.
			}
		});
	}
	
	return {
		fill: fill
	};
})();

chrome.extension.sendRequest({role: "te-tab", state: "ready"}, function(formData) {
	filler.fill(formData, function() {
		console.log(formData);
		chrome.extension.sendRequest({role: "te-tab", state: "done"}, function(needLogout) {
			if(needLogout) {
				window.location = 'https://te.thoughtworks.com/logout';
			}
			else {
				chrome.extension.sendRequest({role: "te-tab", state: "close" }, function() { });
			}
			
		});
	});
});

