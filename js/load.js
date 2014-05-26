( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_Loader = function() {
			// Defines base variables
			var plugin_js_dir_url = window.wp_pressthis_data._plugin_dir_url + '/js/',
				app_config_file = 'config-bookmarklet.js', // default to bookmarklet context
				app_logic_file = 'app.js',
				app_config = {},
				site_config_callback = 'press_this_site_settings',
				site_config = {};

			function initialize() {

				if (!app_config.ajax_url) {
					// @TODO define if extension, load appropriate file if so
					if (false === true) {
						app_config_file = 'config-extensions.js';
					}

					// Now make the file a file path
					app_config_file = plugin_js_dir_url + app_config_file;

					// Load the approriate config file/script
					$.getScript(app_config_file)
						.done(function (script, textStatus) {
							app_config = WpPressThis_AppConfig || {};
							load_site_config();
						})
						.fail(function (jqxhr, settings, exception) {
							// Booooh, fail... @TODO: Do so gracefully.
							console.log("Triggered ajaxError handler. ");
						});
				} else {
					load_site_config();
				}
			}

			function load_site_config() {
				// Still no app config?
				if (!app_config) {
					// @TODO Fail more gracefully, we shouldn't go on without a nonce or the rest of the app_config data by now
					return;
				} else if (!app_config.ajax_url) {
					// @TODO Usually extension context, likely need to load the multi-blog contextual UX/UI,
					// define app_config.ajax_url (target site) and set it in localStorage for the future
				}

				// We now have a good idea what context we're dealing with, let's get some site specific config/data
				$.post(app_config.ajax_url, { action: site_config_callback}, function (response) {
					site_config = response || {};

					// Still no site config?
					if (!site_config.nonce) {
						// @TODO Fail more gracefully, we shouldn't go on without a nonce or the rest of the site_config data by now
						return;
					}

					window.wp_pressthis_config = {
						'app_config':  app_config,
						'site_config': site_config
					};

					// That's it for the loader, now load the real app.js and let it take over.
					$.getScript(plugin_js_dir_url + app_logic_file);
				});
			}

			initialize();
		};

		window.wp_pressthis_loader = new WpPressThis_Loader();
	});
}( jQuery ));