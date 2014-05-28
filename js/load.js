( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_Loader = function() {
			// Defines base variables
			var plugin_js_dir_url    = window.wp_pressthis_data._plugin_dir_url + '/js/',
				app_config_file      = 'config.js', // default to bookmarklet context
				app_logic_file       = 'app.js',
				ls_app_config        = {},
				app_config           = {},
				site_config          = {},
				site_config_callback = 'press_this_site_settings';

			// @DEBUG
			// localStorage.removeItem( 'WpPressThis_AppConfig' );

			function ls_test(){
				var x = 'y';
				try {
					localStorage.setItem(x, 'z');
					localStorage.removeItem(x);
					return true;
				} catch(e) {
					return false;
				}
			}

			function load_cached_settings() {
				if ( ! ls_test() )
					return false;
				var app_config = localStorage.getItem( 'WpPressThis_AppConfig' );
				if ( ! app_config )
					return false;
				app_config = JSON.parse( app_config );
				if ( ! app_config.ajax_url )
					return false;
				return app_config;
			}

			function save_cached_settings( app_config ) {
				if ( ! ls_test() || ! app_config )
					return false;
				localStorage.setItem( 'WpPressThis_AppConfig', JSON.stringify( app_config ) );
				return true;
			}

			function initialize() {
				// Try to rely on localStorage-cached app and site configs to speed things up, when we can.
				ls_app_config = load_cached_settings();
				// All or nothing, better consistency
				if ( ! ls_app_config || ! ls_app_config.ajax_url ) {
					// Be safe, rest all related config vars
					ls_app_config = {};
					app_config    = {};
					site_config   = {};
					// @DEBUG
					// console.log('Press This app and site config will be loaded from live install.');
				} else {
					app_config  = ls_app_config || {};
					// @DEBUG
					// console.log('Press This app config loaded from localStorage cache.', app_config);
				}

				// If still no app configs by now, let's fetch that 1st.
				if ( ! app_config.ajax_url) {
					// Now make the file a file path
					app_config_file = plugin_js_dir_url + app_config_file;

					// Load the appropriate config file/script
					$.getScript(app_config_file)
						.done(function (script, textStatus) {
							app_config = WpPressThis_AppConfig || {};
							// Since we had to regenerate the app_config, let's refresh the related site_config as well
							load_site_config();
						})
						.fail(function (jqxhr, settings, exception) {
							// Booooh, fail... @TODO: Do so gracefully.
							console.log("Triggered ajaxError handler. ");
						});
				} else {
					// Only regenerate site_configs if we "lost them", or if they look sketchy
					if ( !site_config || !site_config.ajax_url || site_config.ajax_url != app_config.ajax_url )
						load_site_config();
					else
						complete_loading(); // otherwise called at end of load_site_config()
				}
			}

			function load_site_config() {
				// Still no app config?
				if (!app_config || !app_config.ajax_url) {
					// @TODO Fail more gracefully, we shouldn't go on, maybe try initialize again/first?
					return;
				}

				// We now have a good idea what context we're dealing with, let's get some site specific config/data
				$.post(app_config.ajax_url, { action: site_config_callback}, function (response) {
					site_config = response || {};
					complete_loading();
				});
			}

			function complete_loading() {
				// Still no site config?
				if ( ! site_config.nonce) {
					// @TODO Fail more gracefully, we shouldn't go on without a nonce or the rest of the site_config data by now
					return;
				}

				// Site config provides a generated admin ajax_url from live install, standardize app and site configs on canonical value
				if ( site_config.ajax_url && site_config.ajax_url != app_config.ajax_url )
					app_config.ajax_url = site_config.ajax_url;

				window.wp_pressthis_config = {
					'app_config':  app_config,
					'site_config': site_config
				};

				if ( ! save_cached_settings( app_config ) ) {
					// @TODO: couldn't save setting, [maybe] handle.
					console.log("couldn't save settings...", app_config);
				}

				// That's it for the loader, now load the real app.js and let it take over.
				$.getScript( plugin_js_dir_url + app_logic_file );
			}

			initialize();
		};

		window.wp_pressthis_loader = new WpPressThis_Loader();
	});
}( jQuery ));