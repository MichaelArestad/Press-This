( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			// @DEBUG
			// console.log('Starting WpPressThis_App');

			var plugin_js_dir_url     = window.wp_pressthis_data._plugin_dir_url + '/js/',
				app_config            = window.wp_pressthis_config.app_config || {},
				site_config           = window.wp_pressthis_config.site_config || {},
				data                  = window.wp_pressthis_data || {},
				largest_width         = $( document ).width() - 30,
				smallest_width        = 48,
				current_square_size   = largest_width,
				preferred             = featured_image( data ) || '',
				all_images            = data._img || [],
				featured              = ( preferred ) ? preferred : ( ( all_images.length ) ? all_images[0] : '' ),
				suggested_excerpt_str = suggested_excerpt( data),
				img_featured_container,
				img_featured_tag,
				suggested_excerpt_container;

			// @DEBUG
			// console.log(app_config, site_config, data);

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

			function render_featured_image( featured ) {
				if ( featured ) {
					img_featured_container = $('<div />', {
						'id'                 : 'img-featured-container',
						'width'              : current_square_size,
						'height'             : 'auto'
					}).css({
						'display'            : 'inline-block',
						'background-image'   : 'url('+featured+')',
						'background-position': 'center',
						'background-repeat'  : 'no-repeat',
						'background-size'    : current_square_size + 'px auto',
						'margin'             : '15px 15px 0 0'
					}).appendTo('#press_this_app_container');

					img_featured_tag = $('<img />', {
						'src'        : featured,
						'id'         : 'img-featured',
						'width'      : current_square_size + 'px',
						'height'     : 'auto'
					}).css({
						'visibility' : 'hidden'
					}).appendTo(img_featured_container);
				}
			}

			function render_other_images(all_images) {
				if ( all_images.length ) {
					var skipped = false,
						num = 0;
					$.each( all_images, function( i, src ) {
						// Skip this image if ultimately the same as the featured one
						if ( featured.replace(/^([^\?]+)(\?.*)?$/, '$1') ==  src.replace(/^([^\?]+)(\?.*)?$/, '$1') ) {
							skipped = true;
							return;
						}

						num = ( skipped ) ? i - 1 : i;

						if (0 == num || num % 3 == 0)
							current_square_size = Math.abs( current_square_size / 3.25 );

						if ( smallest_width >= current_square_size )
							current_square_size = smallest_width;


						if ( featured.replace(/^([^\?]+)(\?.*)?$/, '$1') ==  src.replace(/^([^\?]+)(\?.*)?$/, '$1') )
							return;

						img_featured_container = $('<div />', {
							'id'                 : 'img-'+i+'-container',
							'width'              : current_square_size + 'px',
							'height'             : current_square_size + 'px'
						}).css({
							'display'            : 'inline-block',
							'background-image'   : 'url('+src+')',
							'background-position': 'center',
							'background-repeat'  : 'no-repeat',
							'background-size'    : 'auto '+( current_square_size * 1.5 )+'px',
							'margin'             : '15px 15px 0 0'
						}).appendTo('#press_this_app_container');

						img_featured_tag = $('<img />', {
							'src'        : src,
							'id'         : 'img-'+i,
							'width'      : current_square_size + 'px',
							'height'     : current_square_size + 'px'
						}).css({
							'visibility' : 'hidden'
						}).appendTo(img_featured_container);
					});
				}
			}

			function render_prioritized_images( data ){
				if ( !data )
					return;
				// @DEBUG
				// console.log( data );
				// console.log(preferred, all_images, featured);
				if ( featured )
					render_featured_image( featured );
				if ( all_images.length )
					render_other_images( all_images );
			}

			function suggested_excerpt( data ) {
				var excerpt = '';
				if ( data._s && data._s.length ) {
					excerpt = data._s;
					// console.log('_s', excerpt);
				} else if ( data._meta['twitter:description'] && data._meta['twitter:description'].length ) {
					excerpt = data._meta['twitter:description'];
					// console.log('twitter:description', excerpt);
				} else if ( data._meta['og:description'] && data._meta['og:description'].length ) {
					excerpt = data._meta['og:description'];
					// console.log('og:description', excerpt);
				} else if ( data._meta['description'] && data._meta['description'].length ) {
					excerpt = data._meta['description'];
					// console.log('description', excerpt);
				}
				return excerpt;
			}

			function render_suggested_excerpt(data) {
				suggested_excerpt_container = $('<blockquote></blockquote>', {
					'id'      : 'suggested-excerpt-container'
				}).css({
					'display' : 'block'
				}).text(
					suggested_excerpt_str
				).appendTo('#press_this_app_container');
			}

			function initialize(){
				if ( ! app_config.ajax_url || ! site_config.nonce ) {
					// @TODO Fail more gracefully, we shouldn't go on without a nonce or the rest of the app_config and/or site_config data
					return;
				}

				// We're on!
				$("head title").text(site_config.i18n['Welcome to Press This!']);
				$('<h2>'+site_config.i18n['Welcome to Press This!']+'</h2>').appendTo('#press_this_app_container');
				// @DEBUG
				// console.log( 'Done initializing. Moving on to img handling.' )
				render_prioritized_images( data );
				// @DEBUG
				// console.log( 'Done handling imgs. Moving on to description handling.' )
				render_suggested_excerpt( data );
				// @DEBUG
				// console.log('Ending WpPressThis_App');
			}

			// Let's go!
			initialize();
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));