jQuery(document).ready(function($){
	//console.log('idb-app.js loaded');
	var db;

	var openRequest = indexedDB.open('notes', 1);

	openRequest.onupgradeneeded = function(e){
		console.log('Upgrading DB...');
		var thisDB = e.target.result;
		if(!thisDB.objectStoreNames.contains('notestore')) {
			thisDB.createObjectStore('notestore', { autoIncrement : true });
		}
	};

	openRequest.onsuccess = function(e){
		console.log('Open Success!');
		db = e.target.result;
		$('#save-btn').click(function(e){
			
			$('#alertsub').hide();
			$('#alertname').hide();
			$('#alertmessage').hide();
			var subject = encode($('#subject').val().trim());
			var name = encode($('#name').val().trim());
			var message=encode($('#message').val().trim());

			if (!subject) {
				$('#alertsub').show();
			} else if (!name) {
				$('#alertname').show();
			} else if(!message){
				$('#alertmessage').show();
			}else{
				 var time2 = new Date();
				   var m = time2.getMonth() + 1;
				   var time = time2.getFullYear() + "-" + m + "-"
				     + time2.getDate() + " " + time2.getHours() + ":"
				     + time2.getMinutes();
				addnote(new Note(subject, message, name, time));
				$('#create').toggle();
				$('#subject').val('');
				$('#name').val('');
				$('#message').val('');
			}
		});
		renderList();
	};

	//stop create a new note and cancel.
	$('#cancel-btn').click(function(e){
		$('#create').toggle();
		$('#subject').val('');
		$('#name').val('');
		$('#message').val('');
		$('#alertsub').hide();
		$('#alertname').hide();
		$('#alertmessage').hide();
	});
	openRequest.onerror = function(e) {
		console.log('Open Error!');
		console.dir(e);
	}

	// Setup new note buttons
	$('#new-btn').click(function(e){
		$('#create').toggle();
		$('#alertsub').hide();
		$('#alertname').hide();
		$('#alertmessage').hide();
	});
	
	function encode (str){  
        var s = "";
        if(str.length == 0) return "";
        s = str.replace(/&/g,"&amp;");
        s = s.replace(/</g,"&lt;");
        s = s.replace(/>/g,"&gt;");
        s = s.replace(/ /g,"&nbsp;");
        s = s.replace(/\'/g,"&#39;");
        s = s.replace(/\"/g,"&quot;");
        return s;  
  }
	function decode(str){  
        var s = "";
        if(str.length == 0) return "";
        s = str.replace(/&amp;/g,"&");
        s = s.replace(/&lt;/g,"<");
        s = s.replace(/&gt;/g,">");
        s = s.replace(/&nbsp;/g," ");
        s = s.replace(/&#39;/g,"\'");
        s = s.replace(/&quot;/g,"\"");
        return s;  
  }

	// Render List Function
	function renderList(){
		$('#list-wrapper').empty();
		$('#list-wrapper').html('<table><th>Subject</th><th>Number of charaters</th><th>time</th><th>operations</th><tr></tr></table>');

		//Count Objects
		var transaction = db.transaction(['notestore'], 'readonly');
		var store = transaction.objectStore('notestore');
		var countRequest = store.count();
		countRequest.onsuccess = function(){
			console.log(countRequest.result)
			var count = Number(countRequest.result);
			var i=0;
			
			// Get all Objects and display if contacts exist
			if (count > 0) {
				var objectStore = db.transaction(['notestore'], 'readonly').objectStore('notestore');
				objectStore.openCursor().onsuccess = function(e){
					var cursor = e.target.result;
					if (cursor) {
						var messages=cursor.value.message.trim();
						messages=decode(messages);
						var result;
						   result = messages.replace(/\s/g,"");
						var messagecount=result.length;
						var $row = $('<tr></tr>');
						var $subjectlink = $('<a href="#" key="' + cursor.key + '">'+cursor.value.subject+'</a>');
						var $datatime=$('<td>'+cursor.value.time+'</td>');
						var $datamessagecount=$('<td>'+messagecount+'</td>');
						var $subjectCell=$('<td></td>').append($subjectlink);
						var $delBtn =$('<button value="' + cursor.key + '">Delete</button>');
						$delBtn.click(function(){
					   		console.log('Delete ' + Number($(this).attr('value')));
					   		deletenote(Number($(this).attr('value')));
						});
						$subjectlink.click(function(){
							loadnoteByKey(Number($(this).attr('key')));
						});
						var $delCell = $('<td></td>').append($delBtn);
						$row.append($subjectCell);
						$row.append($datamessagecount);
						$row.append($datatime);
						$row.append($delCell);
						$('#list-wrapper table').append($row);
						var count2=$('<h3></h3>').append('Total:'+count);
						if(i==0){$('#list-wrapper table').append(count2);}
						i++;
						cursor.continue();
					}
					else {
					    //no more entries
					}
				};
			} else {
				$('#list-wrapper').empty();
				$('#list-wrapper').html('<h3>No Notes to show!</h3>');
			}
		};
	} //end renderList()

	//add new contact function
	function addnote(note){
		console.log('adding ' + note.subject);
		var transaction = db.transaction(['notestore'],'readwrite');
		var store = transaction.objectStore('notestore');
		var addRequest = store.add(note);
		addRequest.onerror = function(e) {
			console.log("Error", e.target.error.name);
	        //some type of error handler
	    }
	    addRequest.onsuccess = function(e) {
	    	console.log("added " + note.subject);
	    	$('#subject').val('');
			$('#message').val('');
			$('#name').val('');
	    	renderList();   	
	    }
	} //end addContact()

	// Create note data model
	function Note(subject, message, name, time){
		this.subject = subject;
		this.message = message;
		this.name=name;
		this.time=time;
	}

	// load by key function
	function loadnoteByKey(k){
		var transaction = db.transaction(['notestore'], 'readonly');
		var store = transaction.objectStore('notestore');
		var request = store.get(k);

		request.onerror = function(e) {
		  // Handle errors!
		};
		request.onsuccess = function(e) {
			// Do something with the request.result!
			console.log(request);
			$('#detailbox').html('<h2>Show Note ' + request.result.subject + '</h2>'+'<div id="detail"></div>');
			$('#detail').append($('<label><span>Note subject:</span> <input type="text" id="subject-detail" value="' + request.result.subject + '"></label><span id="alertsub2">(subject is required)</span><br>'));
			$('#detail').append($('<label><span>Author name:</span> <input type="text" id="name-detail" value="' + request.result.name + '"></label><span id="alertname2">(author name is required)</span><br>'));
			$('#detail').append($('<label><span>message:</span> <textarea type="message" id="message-detail" value="">' + request.result.message + '</textarea></label><span id="alertmessage2">(message is required)</span><br>'));			
			var $delBtn = $('<button id="detail-del">Delete </button>');
			$delBtn.click(function(){
		   		console.log('Delete ' + k);
		   		deletenote(k);
			});
			var $saveBtn = $('<button id="detail-save">Save</button>');
			$saveBtn.click(function(){
				console.log('update ' + k);
				updatenote(k);
			});
			var $cancelBtn=$('<button id="detail-cancel">Cancel</button>');
			$cancelBtn.click(function(e){
				$('#detailbox').empty();
				$('#detailbox').hide();
			});
			$('#detail').append($delBtn);
			$('#detail').append($saveBtn);
			$('#detail').append($cancelBtn);
			$('#detailbox').show();
		};
	} // end loadContactByKey()

	// delete by key
	function deletenote(k) {
		var transaction = db.transaction(['notestore'], 'readwrite');
		var store = transaction.objectStore('notestore');
		var request = store.delete(k);
		request.onsuccess = function(e){
			renderList();
			$('#detailbox').empty();
			$('#detailbox').hide();
		};
	} // end deleteContact()

	// update contact
	function updatenote(k) {
		$('#alertsub2').hide();
		$('#alertname2').hide();
		$('#alertmessage2').hide();
		var subjectIn = encode($('#subject-detail').val().trim());
		var nameIn = encode($('#name-detail').val().trim());
		var messageIn=encode($('#message-detail').val().trim());
		var time3 = new Date();
		   var m2 = time3.getMonth() + 1;
		   var time4 = time3.getFullYear() + "-" + m2 + "-"
		     + time3.getDate() + " " + time3.getHours() + ":"
		     + time3.getMinutes();
		if (!subjectIn.trim()) {
			$('#alertsub2').show();
		} else if (!nameIn.trim()) {
			$('#alertname2').show();
		} else if(!messageIn.trim()){
			$('#alertmessage2').show();
		}else{
			var note = new Note(subjectIn, messageIn, nameIn, time4);
			var transaction = db.transaction(['notestore'], 'readwrite');
			var store = transaction.objectStore('notestore');
			var request = store.put(note, k);
			renderList();
			$('#detailbox').empty();
			$('#detailbox').hide();
		}
	} // end updateContact()

}); //end document ready function







