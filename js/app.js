( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			var plugin_js_dir_url     = window.wp_pressthis_data._plugin_dir_url + '/js/',
				app_config            = window.wp_pressthis_config.app_config || {},
				site_config           = window.wp_pressthis_config.site_config || {},
				data                  = window.wp_pressthis_data || {},
				largest_width         = $( document ).width() - 60,
				smallest_width        = 48,
				current_square_size   = largest_width,
				preferred             = featured_image( data ) || '',
				all_images            = data._img || [],
				featured              = ( preferred ) ? preferred : ( ( all_images.length ) ? all_images[0] : '' ),
				suggested_title_str   = suggested_title( data ) || '',
				suggested_excerpt_str = suggested_excerpt( data ) || '';

/* ***************************************************************
 * LOGIC FUNCTIONS
 *************************************************************** */

			function suggested_title( data ) {
				if ( !data )
					return '';

				var title='';

				if ( data._meta['og:title'] && data._meta['og:title'].length ) {
					title = data._meta['og:title'];
					// console.log('og:title', title);
				} else if ( data._t && data._t.length ) {
					title = data._t;
					// console.log('_t', title);
				}

				return title.replace(/\\/g, '');
			}

			function suggested_excerpt( data ) {
				if (!data)
					return '';

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

				return excerpt.replace(/\\/g, '');
			}

			function featured_image( data ) {
				if ( ! data )
					return '';

				var featured = '';

				if (data._meta['twitter:image0:src'] && data._meta['twitter:image0:src'].length) {
					featured = data._meta['twitter:image0:src'];
					// console.log('', featured);
				} else if (data._meta['twitter:image0'] && data._meta['twitter:image0'].length) {
					featured = data._meta['twitter:image0'];
					// console.log('', featured);
				} else if (data._meta['twitter:image:src'] && data._meta['twitter:image:src'].length) {
					featured = data._meta['twitter:image:src'];
					// console.log('', featured);
				} else if (data._meta['twitter:image'] && data._meta['twitter:image'].length) {
					featured = data._meta['twitter:image'];
					// console.log('', featured);
				} else if (data._meta['og:image'] && data._meta['og:image'].length) {
					featured = data._meta['og:image'];
					// console.log('', featured);
				} else if (data._meta['og:image:secure_url'] && data._meta['og:image:secure_url'].length) {
					featured = data._meta['og:image:secure_url'];
					// console.log('', featured);
				}

				return featured;
			}

/* ***************************************************************
 * RENDERING FUNCTIONS
 *************************************************************** */

			function render_suggested_title( title ) {
				if ( ! title || ! title.length )
					return;

				$('#wppt_title_container').text( title );
			}

			function render_suggested_excerpt( excerpt ) {
				if ( ! excerpt || ! excerpt.length )
					return;

				var suggested_excerpt_blockquote = $('<blockquote></blockquote>', {
					'id'      : 'wppt_suggested_excerpt'
				}).css({
					'display' : 'block'
				}).text(
					suggested_excerpt_str
				).appendTo('#wppt_suggested_excerpt_container');

				var suggested_source = $('<p></p>', {
				}).html(
					site_config.i18n['Source:'] + ' <cite><a href="'+ data._u +'" target="_blank">'+ suggested_title_str +'</a></cite>'
				).appendTo('#wppt_suggested_excerpt_container');
			}

			function render_featured_image( featured ) {
				if ( ! featured || ! featured.length )
					return;

				var img_div = $('<div />', {
					'id'                 : 'img-featured-container',
					'width'              : current_square_size + 'px',
					'height'             : Math.abs( current_square_size / 1.5 ) + 'px'
				}).css({
					'display'            : 'inline-block',
					'background-image'   : 'url('+featured+')',
					'background-position': 'center',
					'background-repeat'  : 'no-repeat',
					'background-size'    : 'auto '+current_square_size+'px',
					'margin'             : '15px 15px 0 0'
				}).click(function(){
					alert(featured.replace(/^(http[^\?]+)(\?.*$)?/, '$1'));
				}).appendTo('#wppt_featured_image_container');

				/*
				 * Might not need that img, or might only need it, decide as group later
				var img_tag = $('<img />', {
					'src'        : featured,
					'id'         : 'img-featured',
					'width'      : current_square_size + 'px',
					'height'     : 'auto'
				}).css({
					'visibility' : 'hidden'
				}).appendTo(img_div);
				*/
			}

			function render_other_images(all_images) {
				var img_switch = $('#wppt_other_images_switch');

				if ( ! all_images || ! all_images.length ) {
					img_switch.text('').hide();
					return;
				}

				$('#wppt_other_images_container').hide();

				var img_div,
					img_tag,
					skipped = false,
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

					img_div = $('<div />', {
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
					}).click(function(){
						alert(src.replace(/^(http[^\?]+)(\?.*$)?/, '$1'));
					}).appendTo('#wppt_other_images_container');

					/*
					 * Might not need that img, or might only need it, decide as group later
					img_tag = $('<img />', {
						'src'        : src,
						'id'         : 'img-'+i,
						'width'      : current_square_size + 'px',
						'height'     : current_square_size + 'px'
					}).css({
						'visibility' : 'hidden'
					}).appendTo(img_div);
					*/
				});

				img_switch.text(
					site_config.i18n['Show other images']
				).click(function(){
					$('#wppt_other_images_container').toggle( 500 );
					if ( img_switch.text() == site_config.i18n['Show other images'] )
						img_switch.text( site_config.i18n['Hide other images'] );
					else
						img_switch.text( site_config.i18n['Show other images'] );
				}).show();
			}

			function render_prioritized_images( featured, all_images ){
				if ( featured && featured.length )
					render_featured_image( featured );
				if ( all_images && all_images.length )
					render_other_images( all_images );
			}

/* ***************************************************************
 * PROCESSING FUNCTIONS
 *************************************************************** */

			function initialize(){
				// If we don't have those, or they are empty, we weren't able to initialize properly.
				return (app_config.ajax_url && app_config.ajax_url.length && site_config.nonce && site_config.nonce.length);
			}

			function render(){
				// We're on!
				$("head title").text(site_config.i18n['Welcome to Press This!']);
				render_suggested_title( suggested_title_str );
				render_prioritized_images( featured, all_images );
				render_suggested_excerpt( suggested_excerpt_str );
			}

/* ***************************************************************
 * PROCESSING
 *************************************************************** */
			// Let's go!
			if ( initialize() ) {
				render();
			} else {
				// @TODO: coulnd't initialize, fail gracefully
			}
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));