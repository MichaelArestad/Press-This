( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			var site_config           = window.wp_pressthis_config || {},
				data                  = window.wp_pressthis_data || {},
				largest_width         = parseInt( $( document ).width() - 60 ) || 450,
				smallest_width        = 64,
				current_square_size   = parseInt( largest_width ) || 450,
				preferred             = featured_image( data ),
				all_images            = data._img || [],
				featured              = ( preferred ) ? preferred : ( ( all_images.length ) ? full_size_src( all_images[0] ) : '' ),
				suggested_title_str   = suggested_title( data ),
				suggested_content_str = suggested_content( data ),
				already_shown_img     = [],
				nonce                 = data._nonce || '';

/* ***************************************************************
 * LOGIC FUNCTIONS
 *************************************************************** */

			function suggested_title( data ) {
				if ( !data ) {
					if ( site_config && site_config.i18n && site_config.i18n['New Post'] )
						return site_config.i18n['New Post'];
					return '';
				}

				var title='';

				if ( data._meta && data._meta['og:title'] && data._meta['og:title'].length ) {
					title = data._meta['og:title'];
					// console.log('og:title', title);
				} else if ( data._t && data._t.length ) {
					title = data._t;
					// console.log('_t', title);
				}

				if ( ! title.length && site_config && site_config.i18n && site_config.i18n['New Post'])
					title = site_config.i18n['New Post'];

				return title.replace(/\\/g, '');
			}

			function suggested_content( data ) {
				var default_content = ( site_config && site_config.i18n && site_config.i18n['Start typing here.'] )
						? site_config.i18n['Start typing here.']
						: 'Start typing here.',
					content = '',
					title   = suggested_title( data),
					url     = data._u || '' ;

				if ( !data )
					return default_content;

				if (data._s && data._s.length) {
					content = data._s;
					// console.log('_s', content);
				} else if (data._meta) {
					if (data._meta['twitter:description'] && data._meta['twitter:description'].length) {
						content = data._meta['twitter:description'];
						// console.log('twitter:description', content);
					} else if (data._meta['og:description'] && data._meta['og:description'].length) {
						content = data._meta['og:description'];
						// console.log('og:description', content);
					} else if (data._meta['description'] && data._meta['description'].length) {
						content = data._meta['description'];
						// console.log('description', content);
					}
				}

				// Wrap suggested content in blockquote tag, if we have any.
				content = ( (content.length)
						? '<blockquote id="wppt_suggested_content">' + content.replace(/\\/g, '') + '</blockquote>'
						: '' );

				// Add a source attribution if there is one available.
				if ( title.length && url.length ) {
					content += '<p>'
							+ ( ( site_config.i18n['Source:'] ) ? site_config.i18n['Source:'] : '' )
							+ ' <cite id="wppt_suggested_content_source"><a href="'+ url +'" target="_blank">'+ title +'</a></cite>'
							+ '</p>';
				}

				if ( ! content.length )
					content = default_content;

				return content.replace(/\\/g, '');
			}

			function full_size_src( src ) {
				return src.replace(/^(http[^\?]+)(\?.*)?$/, '$1');
			}

			function featured_image( data ) {
				if ( ! data || ! data._meta )
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

				return full_size_src( featured );
			}

/* ***************************************************************
 * RENDERING FUNCTIONS
 *************************************************************** */

			function render_suggested_title( title ) {
				if ( ! title || ! title.length )
					return;

				$('#wppt_title_container').text( title );
			}

			function render_suggested_content( content ) {
				if ( ! content || ! content.length )
					return;

				$('#wppt_suggested_content_container').css({
					'display' : 'block'
				}).html( content );
			}

			function render_featured_image( featured ) {
				if ( ! featured || ! featured.length )
					return;

				var display_src = ( featured.indexOf('files.wordpress.com') > -1 )
					? featured + '?w=' + current_square_size
					: featured;

				var img_div = $('<img />', {
					'src'                : display_src,
					'id'                 : 'img-featured-container',
					'class'              : 'featured-image',
					'width'              : current_square_size + 'px',
					'height'             : parseInt( current_square_size / 1.6) + 'px'
				}).css({
					// 'display'            : 'inline-block',
					'background-image'   : 'url('+display_src+')'
					// 'background-position': 'center',
					// 'background-repeat'  : 'no-repeat',
					// 'background-size'    : 'auto '+current_square_size+'px',
					// 'margin'             : '15px 15px 0 0'
				}).click(function(){
					var real_src = featured ;
					$('#wppt_selected_img_field').val(real_src);
					alert(real_src);
				}).appendTo('#wppt_featured_image_container');

				/*
				 * Might not need that img, or might only need it, decide as group later
				var img_tag = $('<img />', {
					'src'        : display_src,
					'id'         : 'img-featured',
					'width'      : current_square_size + 'px',
					'height'     : 'auto'
				}).css({
					'visibility' : 'hidden'
				}).appendTo(img_div);
				*/

				already_shown_img.push(featured);
			}

			function render_other_images(all_images) {
				var img_switch = $('#wppt_other_images_switch');

				if ( ! all_images || ! all_images.length ) {
					img_switch.text('').hide();
					return;
				}

				$('#wppt_other_images_container').hide();

				var skipped = 0;

				$.each( all_images, function( i, src ) {
					src = full_size_src(src);

					// Skip this image if already shown
					if ( already_shown_img.indexOf(src) > -1 ) {
						skipped++;
						return;
					}

					var num = ( skipped ) ? i - skipped : i;

					if (0 == num || num % 3 == 0)
						current_square_size = parseInt( current_square_size / 3.25 );

					if ( smallest_width >= current_square_size )
						current_square_size = smallest_width;

					var display_src = ( src.indexOf('files.wordpress.com') > -1 )
						? src + '?w=' + parseInt( current_square_size * 1.5 )
						: src;

					var img_div = $('<div />', {
						'id'                 : 'img-'+i+'-container',
						'width'              : current_square_size + 'px',
						'height'             : current_square_size + 'px'
					}).css({
						'display'            : 'inline-block',
						'background-image'   : 'url('+display_src+')',
						'background-position': 'center',
						'background-repeat'  : 'no-repeat',
						'background-size'    : 'auto '+current_square_size+'px',
						'margin'             : '15px 15px 0 0'
					}).click(function(){
						$('#wppt_selected_img_field').val(src);
						alert(src);
					}).appendTo('#wppt_other_images_container');

					/*
					 * Might not need that img, or might only need it, decide as group later
					var img_tag = $('<img />', {
						'src'        : display_src,
						'id'         : 'img-'+i,
						'width'      : current_square_size + 'px',
						'height'     : current_square_size + 'px'
					}).css({
						'visibility' : 'hidden'
					}).appendTo(img_div);
					*/

					already_shown_img.push(src);
				});

				if ( already_shown_img.length == 1 ) {
					img_switch.text('').hide();
					return;
				}

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

			function render_default_form_field_values( nonce, default_title_str, default_img_src, default_content_str ) {
				$('#wppt_nonce_field').val( nonce );
				$('#wppt_title_field').val( default_title_str );
				$('#wppt_selected_img_field').val( default_img_src );
				$('#wppt_content_field').val( default_content_str );
				$('#wppt_publish').val( site_config.i18n['Publish'] );
				$('#wppt_draft').val( site_config.i18n['Save Draft'] );
			}

/* ***************************************************************
 * PROCESSING FUNCTIONS
 *************************************************************** */

			function initialize(){
				// If we don't have those, or they are empty, we weren't able to initialize properly.
				return (site_config.ajax_url && site_config.ajax_url.length && data._nonce && data._nonce.length);
			}

			function render(){
				// We're on!
				$("head title").text(site_config.i18n['Welcome to Press This!']);
				render_suggested_title( suggested_title_str );
				render_prioritized_images( featured, all_images );
				render_suggested_content( suggested_content_str );

				render_default_form_field_values( nonce, suggested_title_str, featured, suggested_content_str );
			}

/* ***************************************************************
 * PROCESSING
 *************************************************************** */

			// Let's go!
			if ( initialize() ) {
				render();
			} else {
				// @TODO: couldn't initialize, fail gracefully
			}
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));