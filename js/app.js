( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			var app_config  = window.wp_pressthis_config.app_config || {},
				site_config = window.wp_pressthis_config.site_config || {}

			function initialize(){
				if ( ! app_config.ajax_url || ! site_config.nonce ) {
					// @TODO Fail gracefully, we're kinda stuck
					return;
				}

				// We're on!
				$("head title").text(site_config.i18n['Welcome to Press This!']);
				$("body").add("p").text(site_config.i18n['Welcome to Press This!']);
			}

			initialize();
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));