( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			// @DEBUG
			// console.log('Starting WpPressThis_App');

			var plugin_js_dir_url   = window.wp_pressthis_data._plugin_dir_url + '/js/',
				app_config          = window.wp_pressthis_config.app_config || {},
				site_config         = window.wp_pressthis_config.site_config || {},
				data                = window.wp_pressthis_data || {},
				largest_width       = $( document ).width() - 20,
				smallest_width      = 64,
				current_square_size = largest_width;

			// @DEBUG
			// console.log(app_config, site_config, data);

			function initialize(){
				if ( ! app_config.ajax_url || ! site_config.nonce ) {
					// @TODO Fail more gracefully, we shouldn't go on without a nonce or the rest of the app_config and/or site_config data
					return;
				}

				// We're on!
				$("head title").text(site_config.i18n['Welcome to Press This!']);
				$('<h2>'+site_config.i18n['Welcome to Press This!']+'</h2>').appendTo('body');
			}

			function render_prioritized_images( data ){
				if ( !data )
					return;

				// @DEBUG
				// console.log( data );

				var preferred  = featured_image( data ) || '',
					all_images = data._img || [],
					featured   = ( preferred ) ? preferred : ( ( all_images.length ) ? all_images[0] : '' ),
					img_featured_container,
					img_featured_tag;

				// @DEBUG
				// console.log(preferred, all_images, featured);

				if ( featured ) {
					img_featured_container = $('<div />', {
							'id'                 : 'img-featured-container',
							'width'              : current_square_size,
							'height'             : current_square_size
						}).css({
							'display'            : 'inline-block',
							'background-image'   : 'url('+featured+')',
							'background-position': 'center',
							'background-repeat'  : 'no-repeat',
							'background-size'    : 'auto '+( (current_square_size / 4) * 5 )+'px'
						}).appendTo('body');

					img_featured_tag = $('<img />', {
							'src'        : featured,
							'id'         : 'img-featured',
							'width'      : current_square_size,
							'height'     : current_square_size
						}).css({
							'visibility' : 'hidden'
						}).appendTo(img_featured_container);

				}

				if ( all_images.length ) {
					$.each( all_images, function( i, src ) {
						if (0 == i || i % 4 == 0)
							current_square_size = current_square_size / 3;

						// @DEBUG
						// console.log(current_square_size, smallest_width);

						if ( smallest_width >= current_square_size )
							current_square_size = smallest_width;

						// Skip this image if ultimately the same as the featured one
						if ( featured.replace(/^([^\?]+)(\?.*)?$/, '$1') ==  src.replace(/^([^\?]+)(\?.*)?$/, '$1') )
							return;

						img_featured_container = $('<div />', {
							'id'                 : 'img-'+i+'-container',
							'width'              : current_square_size,
							'height'             : current_square_size
						}).css({
							'display'            : 'inline-block',
							'background-image'   : 'url('+src+')',
							'background-position': 'center',
							'background-repeat'  : 'no-repeat',
							'background-size'    : 'auto '+( (current_square_size / 4) * 5 )+'px'
						}).appendTo('body');

						img_featured_tag = $('<img />', {
							'src'        : src,
							'id'         : 'img-'+i,
							'width'      : current_square_size,
							'height'     : current_square_size
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

			// Let's go!
			initialize();
			// @DEBUG
			// console.log( 'Done initializing. Moving on to img handling.' )
			render_prioritized_images( data );
			// @DEBUG
			// console.log('Ending WpPressThis_App');
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));