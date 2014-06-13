( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_Loader = function() {
			// Defines base variables
			var data                 = window.wp_pressthis_data || {},
				ajax_url             = ( data && data._ajax_url && data._ajax_url.length ) ? data._ajax_url : './admin-ajax.php',
				plugin_js_dir_url    = ( data && data._plugin_dir_url ) ? data._plugin_dir_url + '/js' : '../wp-content/plugins/press-this/js',
				app_logic_file       = '/app.js',
				ls_site_config_key   = 'WpPressThis_SiteConfig',
				ls_site_config       = {},
				site_config          = {},
				site_config_callback = 'press_this_site_settings',
				ux_context           = get_ux_context();

			function is_in_iframe() {
				try {
					return window.self !== window.top;
				} catch (e) {
					return true;
				}
			}

			function is_in_popup(){
				try {
					return '' !== window.top.name;
				} catch (e) {
					return true;
				}
			}

			function get_ux_context() {
				var context = 'top';
				if ( is_in_iframe() )
					context = 'iframe';
				else if ( is_in_popup() )
					context = 'popup';
				return context;
			}

			// @DEBUG
			// localStorage.removeItem( 'WpPressThis_SiteConfig' );

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
				var site_config = localStorage.getItem( ls_site_config_key );
				if ( ! site_config )
					return false;
				site_config = JSON.parse( site_config );
				if ( ! site_config.runtime_url || ! site_config.plugin_dir_url || ! site_config.ajax_url )
					return false;
				return site_config;
			}

			function save_cached_settings( site_config ) {
				if ( ! ls_test() || ! site_config || ! site_config.runtime_url || ! site_config.plugin_dir_url || ! site_config.ajax_url )
					return false;
				localStorage.setItem( ls_site_config_key, JSON.stringify( site_config ) );
				return true;
			}

			function initialize() {
				// Try to rely on localStorage-cached app and site configs to speed things up, when we can.
				ls_site_config = load_cached_settings();
				// All or nothing, better consistency
				if ( ! ls_site_config || ! ls_site_config.ajax_url || ! ls_site_config.runtime_url || ! ls_site_config.plugin_dir_url ) {
					// Be safe, rest all related config vars
					ls_site_config = {};
					site_config    = {};
					// @DEBUG
					// console.log('Press This site config will be loaded from live install.');
				} else {
					site_config    = ls_site_config || {};
					// @DEBUG
					// console.log('Press This site config loaded from localStorage cache.', site_config);
				}

				// See if the site configs are maybe already in the markup (onload), avoid extra remote query
				if ( ! site_config.length && window.wp_pressthis_config && window.wp_pressthis_config.length ) {
					site_config = window.wp_pressthis_config;
					complete_loading();
				}

				// Still no site configs? Guess we have to load them live from the url then.
				if ( ! site_config.runtime_url || ! site_config.plugin_dir_url || ! site_config.ajax_url )
					load_site_config();
				// Have site configs, but having a version mismatch between app and cached configs.
				else if ( ! site_config.version || ! data._version || site_config.version != data._version )
					load_site_config();
				// Or just go on and finish loading.
				else
					complete_loading(); // otherwise called at end of load_site_config()
			}

			function load_site_config() {
				$.post(ajax_url, { action: site_config_callback}, function (response) {
					site_config = response || {};
					// Set the target URLs in site_config, for caching (but leave data._nonce and data._version, both time-sensitive)
					site_config.runtime_url    = data._runtime_url;
					site_config.plugin_dir_url = data._plugin_dir_url || plugin_js_dir_url;
					site_config.ajax_url       = data._ajax_url || ajax_url;
					// And cache them
					if ( ! save_cached_settings( site_config ) ) {
						// @TODO: couldn't save setting, [maybe] handle.
						console.log("Couldn't save settings...", site_config);
					}
					// @DEBUG
					// console.log('Loaded site config live...', site_config);
					complete_loading();
				});
			}

			function complete_loading() {
				// Still no site config?
				if ( ! data._nonce || ! site_config.runtime_url || ! site_config.plugin_dir_url || ! site_config.ajax_url ) {
					// @TODO Fail more gracefully, we shouldn't go on without a nonce or the rest of the site_config data by now
					return;
				}

				// Clean up those same URLs from data (but leave data._nonce and data._version, both time-sensitive)
				if ( data._runtime_url )
					delete data._runtime_url;
				if ( data._plugin_dir_url )
					delete data._plugin_dir_url;
				if ( data._ajax_url )
					delete data._ajax_url;

				window.wp_pressthis_config = site_config;
				window.wp_pressthis_ux     = ux_context;

				// That's it for the loader, now load the real app.js and let it take over.
				$.getScript( plugin_js_dir_url + app_logic_file );
			}

			initialize();
		};

		window.wp_pressthis_loader = new WpPressThis_Loader();
	});
}( jQuery ));