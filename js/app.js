( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			var site_config           = window.wp_pressthis_config || {},
				data                  = window.wp_pressthis_data || {},
				ux_context            = window.wp_pressthis_ux || 'top',
				largest_width         = parseInt( $( document ).width() - 60 ) || 450,
				smallest_width        = 64,
				current_width         = parseInt( largest_width ) || 450,
				interesting_images	  = get_interesting_images( data ) || [],
				featured              = ( interesting_images.length ) ? interesting_images[0] : '',
				suggested_title_str   = get_suggested_title( data ),
				suggested_content_str = get_suggested_content( data ),
				already_shown_img     = [],
				nonce                 = data._nonce || '';

/* ***************************************************************
 * HELPER FUNCTIONS
 *************************************************************** */

			function __( key ) {
				return ( ! site_config || ! site_config.i18n || ! site_config.i18n[key] || ! site_config.i18n[key].length )
					? key : site_config.i18n[key];
			}

			// Source: https://stackoverflow.com/questions/1219860/html-encoding-in-javascript-jquery/1219983#1219983
			function html_encode( str ){
				//create a in-memory div, set it's inner text(which jQuery automatically encodes)
				//then grab the encoded contents back out.  The div never exists on the page.
				return $('<div/>').text(str).html();
			}

			function get_full_size_src( src ) {
				return ( src.indexOf('gravatar.com') > -1 || src.match( /\/avatars[\d]+\.githubusercontent\.com\// ) )
					? src.replace(/^(http[^\?]+)(\?.*)?$/, '$1?s=' + largest_width)
					: src.replace(/^(http[^\?]+)(\?.*)?$/, '$1');
			}

			function get_canonical_link( data ) {
				if ( ! data || data.length )
					return '';

				var link = '';

				if ( data.u ) {
					link = data.u;
				}

				if ( ! link.length && data._links ) {
					if (data._links['canonical'] && data._links['canonical'].length) {
						link = data._links['canonical'];
					}
				}

				if ( ! link.length && data._meta ) {
					if (data._meta['twitter:url'] && data._meta['twitter:url'].length) {
						link = data._meta['twitter:url'];
					} else if (data._meta['og:url'] && data._meta['og:url'].length) {
						link = data._meta['og:url'];
					}
				}

				return decodeURI( link );
			}

			function get_source_site_name( data ) {
				if ( ! data || data.length )
					return '';

				var name='';

				if ( data._meta ) {
					if (data._meta['og:site_name'] && data._meta['og:site_name'].length) {
						name = data._meta['og:site_name'];
					} else if (data._meta['application-name'] && data._meta['application-name'].length) {
						name = data._meta['application-name'];
					}
				}

				return name.replace(/\\/g, '');
			}

			function get_suggested_title( data ) {
				if ( ! data || data.length )
					return __( 'new-post' );

				var title='';

				if ( data.t ) {
					title = data.t;
				}

				if ( ! title.length && data._meta ) {
					if (data._meta['twitter:title'] && data._meta['twitter:title'].length) {
						title = data._meta['twitter:title'];
					} else if (data._meta['og:title'] && data._meta['og:title'].length) {
						title = data._meta['og:title'];
					} else if (data._meta['title'] && data._meta['title'].length) {
						title = data._meta['title'];
					}
				}

				if ( ! title.length)
					title = __( 'new-post' );

				return title.replace(/\\/g, '');
			}

			function get_suggested_content( data ) {
				if ( ! data || data.length )
					return __( 'star-typing-here' );

				var content   = '',
					title     = get_suggested_title( data ),
					url       = get_canonical_link( data ),
					site_name = get_source_site_name( data );

				if (data.s && data.s.length) {
					content = data.s;
				} else if (data._meta) {
					if (data._meta['twitter:description'] && data._meta['twitter:description'].length) {
						content = data._meta['twitter:description'];
					} else if (data._meta['og:description'] && data._meta['og:description'].length) {
						content = data._meta['og:description'];
					} else if (data._meta['description'] && data._meta['description'].length) {
						content = data._meta['description'];
					}
				}

				// Wrap suggested content in blockquote tag, if we have any.
				content = ( (content.length)
					? '<blockquote id="wppt_suggested_content">' + html_encode( content.replace(/\\/g, '') ) + '</blockquote>'
					: '' );

				// Add a source attribution if there is one available.
				if ( ( ( title.length && __( 'new-post' ) != title ) || site_name.length ) && url.length ) {
					content += '<p>'
					+ __( 'source' )
					+ ' <cite id="wppt_suggested_content_source"><a href="'+ encodeURI( url ) +'">'+ html_encode( title || site_name ) +'</a></cite>'
					+ '</p>';
				}

				if ( ! content.length )
					content = __( 'start-typing-here' );

				return content.replace(/\\/g, '');
			}

			function is_src_uninteresting_path( src ) {
				return (
				src.match(/\/ad[sx]{1}?\//) // ads
				|| src.match(/(\/share-?this[^\.]+?\.[a-z0-9]{3,4})(\?.*)?$/) // share-this type button
				|| src.match(/\/(spinner|loading|spacer|blank|rss)\.(gif|jpg|png)/) // loaders, spinners, spacers
				|| src.match(/\/([^\.\/]+[-_]{1})?(spinner|loading|spacer|blank)s?([-_]{1}[^\.\/]+)?\.[a-z0-9]{3,4}/) // fancy loaders, spinners, spacers
				|| src.match(/([^\.\/]+[-_]{1})?thumb[^.]*\.(gif|jpg|png)$/) // thumbnails, too small, usually irrelevant to context
				|| src.match(/\/wp-includes\//) // classic WP interface images
				|| src.indexOf('/g.gif') > -1 // classic WP stats gif
				|| src.indexOf('/pixel.mathtag.com') > -1 // classic WP stats gif
				);
			}

			function get_featured_image( data ) {
				if ( ! data || ! data._meta )
					return '';

				var featured = '';

				if (data._meta['twitter:image0:src'] && data._meta['twitter:image0:src'].length) {
					featured = data._meta['twitter:image0:src'];
				} else if (data._meta['twitter:image0'] && data._meta['twitter:image0'].length) {
					featured = data._meta['twitter:image0'];
				} else if (data._meta['twitter:image:src'] && data._meta['twitter:image:src'].length) {
					featured = data._meta['twitter:image:src'];
				} else if (data._meta['twitter:image'] && data._meta['twitter:image'].length) {
					featured = data._meta['twitter:image'];
				} else if (data._meta['og:image'] && data._meta['og:image'].length) {
					featured = data._meta['og:image'];
				} else if (data._meta['og:image:secure_url'] && data._meta['og:image:secure_url'].length) {
					featured = data._meta['og:image:secure_url'];
				}

				featured = get_full_size_src( featured );

				return ( is_src_uninteresting_path( featured ) ) ? '' : featured;
			}

			function get_interesting_images( data ) {
				var imgs             = data._img || [],
					featured_pict    = get_featured_image( data ) || '',
					interesting_imgs = [],
					already_selected = [];

				if ( featured_pict.length ) {
					interesting_imgs.push(featured_pict);
					already_selected.push(get_full_size_src(featured_pict).replace(/^https?:/, ''));
				}

				if ( imgs.length ) {
					$.each( imgs, function ( i, src ) {
						src = get_full_size_src( src );
						src = src.replace(/http:\/\/[\d]+\.gravatar\.com\//, 'https://secure.gravatar.com/');

						var schemeless_src = src.replace(/^https?:/, '');

						if (!src || !src.length) {
							// Skip: no src value
							return;
						} else if ( already_selected.indexOf( schemeless_src ) > -1 ) {
							// Skip: already shown
							return;
						} else if (is_src_uninteresting_path(src)) {
							// Skip: spinner, stat, ad, or spacer pict
							return;
						} else if (src.indexOf('avatar') > -1 && interesting_imgs.length >= 15) {
							// Skip:  some type of avatar and we've already gathered more than 23 diff images to show
							return;
						}

						interesting_imgs.push(src);
						already_selected.push(schemeless_src);
					});
				}

				return interesting_imgs;
			}

			function show_spinner( messages ) {
				$('#wppt_spinner').addClass('show');
				$('[class^="button--"]').each(function(k, v){
					$(this).attr('disabled', 'disabled');
				});
			}

			function hide_spinner() {
				$('#wppt_spinner').removeClass('show');
				$('[class^="button--"]').each(function(k, v){
					$(this).removeAttr('disabled');
				});
			}

			function submit_post(e, action) {
				show_spinner();
				maybe_clear_suggested_content_placeholder();
				var form = $('#wppt_form');
				if ( 'publish' !== action )
					action = 'draft';
				e.preventDefault();
				$('<input type="hidden" name="action" id="wppt_action_field" value="press_this_'+action+'_post">').appendTo(form);
				var data = form.serialize();
				$.ajax({
					type: "POST",
					url: site_config.ajax_url,
					data: data,
					success: function(r){
						if ( r.error ) {
							render_error( __('unexpected-error') );
							hide_spinner();
						} else {
							if ( 'published' == r.post_status )
								if ( 'popup' == ux_context ) {
									window.opener.location.href = r.post_permalink;
									self.close();
								} else {
									window.top.location.href = r.post_permalink;
								}
							else
								window.self.location.href = './post.php?post=' + r.post_id + '&action=edit';
						}
					}
				});
			}

			function show_all_media() {
				$( '#wppt_all_media_switch' ).click(function(){
					show_selected_media();
				}).attr(
					'title', __( 'show-selected-media' )
				);
				$( '#wppt_featured_image_container' ).addClass( 'all-media--visible').show();
				$( '#wppt_selected_img').hide();
				$('#wppt_no_image');
			}

			function show_selected_media() {
				if ( '' == $( '#wppt_selected_img_field' ).val() ) {
					hide_selected_media();
					return;
				}
				$( '#wppt_all_media_switch').click(function(){
					show_all_media();
				}).attr(
					'title', __( 'show-all-media' )
				);
				$( '#wppt_selected_img').css( 'display', 'block' );
				$( '#wppt_featured_image_container' ).removeClass('all-media--visible no-media').show();
				$('#wppt_no_image');
			}

			function hide_selected_media() {
				$( '#wppt_all_media_switch').click(function(){
						show_all_media();
				}).attr(
					'title', __( 'show-all-media' )
				);
				$( '#wppt_selected_img').hide();
				$( '#wppt_featured_image_container' ).removeClass('all-media--visible no-media').show();
				$('#wppt_no_image');
			}

			function show_nomedia_button() {
				$('#wppt_no_image').click(function(){
						unset_selected_media();
						$( '#wppt_featured_image_container' ).addClass('no-media');
				}).attr(
					'title', __( 'no-media' )
				);
			}

			function set_selected_media( src ) {
				$( '#wppt_selected_img_field' ).val( src );
				$( '#wppt_selected_img' ).attr( 'src', src ).css('background-image', 'url(' + src + ')' );
				show_selected_media();
			}

			function unset_selected_media() {
				$( '#wppt_selected_img_field' ).val('');
				$( '#wppt_selected_img' ).attr( 'src', '' ).css('background-image', 'none' );
				hide_selected_media();
			}

			function add_new_image_to_list( src ) {
				interesting_images.unshift( src );
				render_interesting_images();
			}

			function file_upload_success( url, type ) {
				if (!url || !type || !url.match(/^https?:/) || !type.match(/^[\w]+\/.+$/)) {
					render_error(__('upload-failed') + ' [app_js.file_upload_success]');
					hide_spinner();
					return;
				}
				if (type.match(/^image\//)) {
					add_new_image_to_list(url);
					set_selected_media(url);
					clear_errors();
				} else {
					render_error(__('limit-uploads-to-photos').replace('%s', encodeURI(url)));
				}
				hide_spinner();
			}

			function clear_errors() {
				var messages_div = $( '#alerts' );
				if ( messages_div && messages_div.remove )
					messages_div.remove();
			}

			function maybe_clear_suggested_content_placeholder() {
				var content_field = $('#wppt_suggested_content_container');
				if ( __( 'start-typing-here' ).toLowerCase() == content_field.text().toLowerCase() ) {
					content_field.empty();
					$('#wppt_content_field').val('');
				}
			}

			function close_self( source_url ) {
				if ( 'popup' == ux_context )
					self.close();
				else if ( 'iframe' == ux_context && source_url.length )
					top.location.href = source_url;
				else
					top.location.href = self.location.href.replace(/^(.+)\/wp-admin\/.+$/, '$1/');
			}

/* ***************************************************************
 * RENDERING FUNCTIONS
 *************************************************************** */

			function render_tools_visibility() {
				if ( 'top' != ux_context  ) {
					if ( data.u && data.u.match(/^https?:/ ) )
						$('#wppt_scanbar').hide();
				} else {
					$('#wppt_close_button').hide();
				}
				// Only while being developed, looking ugly otherwise :)
				$('#wppt_sites').hide();
			}

			function render_default_form_field_values() {
				$('#wppt_nonce_field').val( nonce );
				$('#wppt_title_field').val( suggested_title_str );
				$('#wppt_content_field').val( suggested_content_str );
				$('#wppt_selected_img_field').val( featured );
				$('#wppt_source_url_field').val( get_canonical_link( data ) );
				$('#wppt_source_name_field').val( get_source_site_name( data ) );
				$('#wppt_publish_field').val( __( 'publish' ) );
				$('#wppt_draft_field').val( __( 'save-draft' ) );

				$('#wppt_file_button').val(__( 'upload-photo' ) );

				$('#wppt_url_scan').attr('placeholder', __( 'enter-url-to-scan' )).val( ( data.u && data.u.match(/^https?:/ ) ) ? data.u : '' );
				$('#wppt_url_scan_submit').val(__( 'scan' ) );

				$('#wppt_new_site').attr('placeholder', __( 'enter-wp-url' ) );
				$('#wppt_new_site_submit').val(__( 'add' ) );
			}

			function render_notice( msg, error ) {
				error = ( true === error );
				var messages_div = $( '#alerts' );
				if ( ! messages_div || ! messages_div.html() )
					messages_div = $('<div id="alerts" class="alerts"></div>').insertBefore('#wppt_app_container');
				messages_div.append( '<p class="' + ( ( error ) ? 'error': 'notice' ) +'">' + msg + '</p>' );
			}

			function render_error( msg ) {
				render_notice( msg, true );
			}

			function render_startup_notices() {
				// Render errors sent in the data, if any
				if ( data.errors && data.errors.length ) {
					$.each( data.errors, function(i, msg) {
						render_error(msg);
					} );
				}
				// Prompt user to upgrade their bookmarklet if there is a version mismatch.
				if ( data.v && data._version && data.v != data._version ) {
					render_notice( __( 'should-upgrade-bookmarklet').replace( '%s', site_config.runtime_url.replace( /^(.+)\/press-this\.php(\?.*)?/, '$1/tools.php' ) ) );
				}
			}

			function render_admin_bar() {
				$('.current-site a').on( 'click', function(){
				}).attr( 'href', site_config.blog_url ).text( site_config.blog_name );
			}

			function render_suggested_title() {
				if ( ! suggested_title_str || ! suggested_title_str.length )
					return;

				$('#wppt_title_container').on('input', function(){
					$('#wppt_title_field').val($(this).text());
				}).text( suggested_title_str );
			}

			function render_suggested_content() {
				if ( ! suggested_content_str || ! suggested_content_str.length )
					return;

				$('#wppt_suggested_content_container').css({
					'display' : 'block'
				}).on('focus', function(){
					maybe_clear_suggested_content_placeholder();
				}).on('input', function(){
					$('#wppt_content_field').val( $(this).html() );
				}).html( suggested_content_str );
			}

			function render_featured_image() {
				if ( ! featured || ! featured.length ) {
					$('#wppt_featured_image_container').hide();
					return;
				}

				var display_src = ( featured.indexOf('files.wordpress.com') > -1 )
					? featured + '?w=' + current_width
					: featured;

				$('#wppt_selected_img').attr('src', display_src ).css({
					'background-image'   : 'url('+display_src+')',
					'width'              : current_width + 'px',
					'height'             : parseInt( current_width / 1.6) + 'px'
				}).click(function(){
					set_selected_media( display_src );
				}).appendTo('#wppt_featured_image_container');

				show_nomedia_button();
			}

			function render_interesting_images() {
				var img_switch     = $('#wppt_all_media_switch'),
					imgs_container = $('#wppt_all_media_container');

				imgs_container.empty();

				if ( ! interesting_images || ! interesting_images.length ) {
					img_switch.attr(
						'title', __( 'show-selected-media' )
					).hide();
					imgs_container.hide();
					return;
				}

				$.each( interesting_images, function( i, src ) {
					src = get_full_size_src(src);

					var css_size_class = 'thumbs-small';

					if (i < 3)
						css_size_class = 'thumbs-large';
					else if (i < 7)
						css_size_class = 'thumbs-medium';

					if ( 0 == i || 3 == i || 7 == i )
						current_width   = parseInt(current_width / 2);

					if ( current_width < smallest_width )
						current_width = smallest_width;

					var display_src = ( src.indexOf('files.wordpress.com') > -1 )
						? src + '?w=' + parseInt( current_width * 1.5 )
						: src;

					$('<img />', {
						'src'                : display_src,
						'id'                 : 'img-'+i+'-container',
						'class'              : 'site-thumbnail ' + css_size_class
					}).css({
						'background-image'   : 'url('+display_src+')'
					}).click(function(){
						set_selected_media( display_src );
					}).appendTo(imgs_container);
				});

				imgs_container.show();

				img_switch.click(function(){
					show_all_media();
				}).attr(
					'title', __( 'show-all-media' )
				).show();

				show_nomedia_button();
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
				$("head title").text(__( 'welcome' ));
				render_tools_visibility();
				render_default_form_field_values();
				render_admin_bar();
				render_suggested_title();
				render_featured_image();
				render_interesting_images();
				render_suggested_content();
				render_startup_notices();
				return true;
			}

			function monitor(){
				show_spinner();

				// Publish and Draft buttons and submit

				$( '#wppt_draft_field' ).on( 'click', function( e ){
					submit_post( e, 'draft');
				});

				$( '#wppt_publish_field' ).on( 'click', function( e ){
					submit_post( e, 'publish');
				});

				$( '#wppt_form' ).on( 'submit', function( e ){
					e.preventDefault();
					submit_post( $( '#wppt_draft_field' ), 'draft');
				});

				// File upload button and autosubmit

				$( '#wppt_file' ).on('change', function(){
					show_spinner();
					$( '#wppt_file_upload' ).submit();
				});

				$('#wppt_file_button').on('click', function(){
					$( '#wppt_file').click();
				});

				// Close button
				$('#wppt_close_button').on('click', function(){
					close_self( get_canonical_link( data ) );
				});

				hide_spinner();

				return true;
			}

/* ***************************************************************
 * PROCESSING
 *************************************************************** */

			// Let's go!
			if ( ! initialize() ) {
				// @TODO: couldn't initialize, fail gracefully
				console.log('Could not initialize...');
			} else if ( ! render() ) {
				// @TODO: couldn't render, fail gracefully
				console.log('Could not render...');
			} else if ( ! monitor() ) {
				// @TODO: couldn't monitor, fail gracefully
				console.log('Could not monitor app...');
			}

			// Assign callback/public functions to returned object
			this.file_upload_success = file_upload_success;
			this.render_error        = render_error;
			this.interesting_images  = interesting_images;
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));
