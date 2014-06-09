// experimental code, not functional yet
chrome.browserAction.onClicked.addListener( function() {
	chrome.tabs.getSelected( null, function ( tab ) {
		var u = prompt('Please enter a WordPress install\'s URL', ''),
			selected_text = '';
		console.log('chrome.browserAction.onClicked');
		if (null !== u && u.match(/^https?:\/\//)) {
			u = u + '/wp-admin/press-this.php?u=' + encodeURI(tab.url);
			console.log(chrome.windows.getgetCurrent(null, function(win){ return win; }));
			WpPressThis_Bookmarklet( u, selected_text, chrome.windows.getgetCurrent(null, function(win){ return win; }) );
		}
	});
});