( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			var plugin_js_dir_url = window.wp_pressthis_data._plugin_dir_url + '/js/',
				app_config        = window.wp_pressthis_config.app_config || {},
				site_config       = window.wp_pressthis_config.site_config || {},
				data              = window.wp_pressthis_data || {},
				largest_width     = 256,
				smallest_width    = 8,
				current_width     = largest_width;

			function initialize(){
				if ( ! app_config.ajax_url || ! site_config.nonce ) {
					// @TODO Fail more gracefully, we shouldn't go on without a nonce or the rest of the app_config and/or site_config data
					return;
				}

				// We're on!
				$("head title").text(site_config.i18n['Welcome to Press This!']);
				$('<h2>'+site_config.i18n['Welcome to Press This!']+'</h2>').appendTo('body');
			}

			function prioritize_images( data ){
				if ( !data )
					return;

				var featured=featured_image( data ),
					all_images = data._img,
					first=null,
					img_featured_container,
					img_featured_tag;

				img_featured_container = $('<div />', {
						'id'                 : 'img-featured-container',
						'width'              : current_width,
						'height'             : 'auto'
					}).css({
						'display'            : 'inline-block',
						'background-image'   : 'url('+featured+')',
						'background-position': 'center',
						'background-repeat'  : 'no-repeat',
						'background-size'    : 'auto '+( (current_width / 4) * 5 )+'px'
					}).appendTo('body');

				img_featured_tag = $('<img />', {
						'src'        : featured,
						'id'         : 'img-featured',
						'width'      : current_width,
						'height'     : 'auto'
					}).css({
						'visibility' : 'hidden'
					}).appendTo(img_featured_container);

				if ( all_images.length ) {
					$.each( all_images, function( i, src ) {
						if ( i % 4 == 0 )
							current_width = current_width / 2;

						if ( smallest_width >= current_width )
							current_width = smallest_width;

						console.log(i, src, current_width);

						img_featured_container = $('<div />', {
							'id'                 : 'img-'+i+'-container',
							'width'              : current_width,
							'height'             : 'auto'
						}).css({
							'display'            : 'inline-block',
							'background-image'   : 'url('+src+')',
							'background-position': 'center',
							'background-repeat'  : 'no-repeat',
							'background-size'    : 'auto '+( (current_width / 4) * 5 )+'px'
						}).appendTo('body');

						img_featured_tag = $('<img />', {
							'src'        : src,
							'id'         : 'img-'+i,
							'width'      : current_width,
							'height'     : 'auto'
						}).css({
							'visibility' : 'hidden'
						}).appendTo(img_featured_container);
					});
				}
			}

			function featured_image( data ) {
				if ( !data )
					return;

				var featured=null;

				if ( data._meta['twitter:image0:src'] )
					featured = data._meta['twitter:image0:src'];
				else if ( data._meta['twitter:image0'] )
					featured = data._meta['twitter:image0'];
				else if ( data._meta['twitter:image:src'] )
					featured = data._meta['twitter:image:src'];
				else if ( data._meta['twitter:image'] )
					featured = data._meta['twitter:image'];
				else if ( data._meta['og:image'] )
					featured = data._meta['og:image'];
				else if ( data._meta['og:image:secure_url'] )
					featured = data._meta['og:image:secure_url'];

				return featured;
			}

			initialize();
			prioritize_images( data );
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));