( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			var editor,
				site_config           = window.wp_pressthis_config || {},
				data                  = window.wp_pressthis_data || {},
				ux_context            = ( '' == window.top.name ) ? 'top' : 'popup',
				largest_width         = parseInt( $( document ).width() - 60 ) || 450,
				smallest_width        = 128,
				interesting_images	  = get_interesting_images( data ) || [],
				interesting_embeds	  = get_interesting_embeds( data ) || [],
				suggested_title_str   = get_suggested_title( data ),
				suggested_content_str = get_suggested_content( data ),
				nonce                 = data._nonce || '',
				has_set_focus         = false;

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

				return title.replace( /\\/g, '' );
			}

			function get_suggested_content( data ) {
				if ( ! data || data.length ) {
					return __( 'start-typing-here' );
				}

				var content   = '',
					title     = get_suggested_title( data ),
					url       = get_canonical_link( data ),
					site_name = get_source_site_name( data );

				if ( data.s && data.s.length ) {
					content = data.s;
				} else if ( data._meta ) {
					if ( data._meta['twitter:description'] && data._meta['twitter:description'].length ) {
						content = data._meta['twitter:description'];
					} else if ( data._meta['og:description'] && data._meta['og:description'].length ) {
						content = data._meta['og:description'];
					} else if ( data._meta['description'] && data._meta['description'].length ) {
						content = data._meta['description'];
					}
				}

				// Wrap suggested content in blockquote tag, if we have any.
				content = ( content.length ? '<blockquote class="wppt_suggested_content">' + html_encode( content.replace(/\\/g, '') ) + '</blockquote>' : '' );

				// Add a source attribution if there is one available.
				if ( ( ( title.length && __( 'new-post' ) !== title ) || site_name.length ) && url.length ) {
					content += '<p class="wppt_source">'
					+ __( 'source' )
					+ ' <cite class="wppt_suggested_content_source"><a href="'+ encodeURI( url ) +'">'+ html_encode( title || site_name ) +'</a></cite>'
					+ '</p>';
				}

				if ( ! content.length ) {
					content = __( 'start-typing-here' );
				}

				return content.replace( /\\/g, '' );
			}

			function is_embeddable( url ) {
				if ( ! url || ! url ) {
					return false;
				} else if ( url.match(/\/\/(m\.|www\.)?youtube\.com\/watch\?/) || url.match(/\/youtu\.be\/.+$/) ) {
					return true;
				} else if ( url.match(/\/\/vimeo\.com\/(.+\/)?[\d]+$/) ) {
					return true;
				} else if ( url.match(/\/\/(www\.)?dailymotion\.com\/video\/.+$/) ) {
					return true;
				} else if ( url.match(/\/\/soundcloud\.com\/.+$/) ) {
					return true;
				}
				return false;
			}

			function is_src_uninteresting_path( src ) {
				return (
				src.match(/\/ad[sx]{1}?\//) // ads
				|| src.match(/(\/share-?this[^\.]+?\.[a-z0-9]{3,4})(\?.*)?$/) // share-this type button
				|| src.match(/\/(spinner|loading|spacer|blank|rss)\.(gif|jpg|png)/) // loaders, spinners, spacers
				|| src.match(/\/([^\.\/]+[-_]{1})?(spinner|loading|spacer|blank)s?([-_]{1}[^\.\/]+)?\.[a-z0-9]{3,4}/) // fancy loaders, spinners, spacers
				|| src.match(/([^\.\/]+[-_]{1})?thumb[^.]*\.(gif|jpg|png)$/) // thumbnails, too small, usually irrelevant to context
				|| src.match(/\/wp-includes\//) // classic WP interface images
				|| src.match(/[^\d]{1}\d{1,2}x\d+\.(gif|jpg|png)$/) // most often tiny buttons/thumbs (< 100px wide)
				|| src.indexOf('/g.gif') > -1 // classic WP stats gif
				|| src.indexOf('/pixel.mathtag.com') > -1 // classic WP stats gif
				);
			}

			function get_interesting_embeds() {
				var embeds             = data._embed || [],
					interesting_embeds = [],
					already_selected   = [];

				if ( embeds.length ) {
					$.each( embeds, function ( i, src ) {
						if (!src || !src.length) {
							// Skip: no src value
							return;
						} else if ( !is_embeddable( src ) ) {
							// Skip: not deemed embeddable
							return;
						}

						var schemeless_src = src.replace(/^https?:/, '');

						if ( already_selected.indexOf( schemeless_src ) > -1 ) {
							// Skip: already shown
							return;
						}

						interesting_embeds.push(src);
						already_selected.push(schemeless_src);
					});
				}

				return interesting_embeds;
			}

			function get_featured_image( data ) {
				var featured = '';

				if ( ! data || ! data._meta )
					return '';

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

				return ( is_src_uninteresting_path( featured ) ) ? '' : featured;
			}

			function get_interesting_images( data ) {
				var imgs             = data._img || [],
					featured_pict    = get_featured_image( data ) || '',
					interesting_imgs = [],
					already_selected = [];

				if ( featured_pict.length ) {
					interesting_imgs.push(featured_pict);
					already_selected.push(featured_pict.replace(/^https?:/, ''));
				}

				if ( imgs.length ) {
					$.each( imgs, function ( i, src ) {
						src = src.replace(/http:\/\/[\d]+\.gravatar\.com\//, 'https://secure.gravatar.com/');

						if (!src || !src.length) {
							// Skip: no src value
							return;
						}

						var schemeless_src = src.replace(/^https?:/, '');

						if ( already_selected.indexOf( schemeless_src ) > -1 ) {
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

			function submit_post( event, action ) {
				show_spinner();

				var form = $('#wppt_form');

				if ( 'publish' !== action )
					action = 'draft';

				event.preventDefault();

				editor && editor.save();

				$('<input type="hidden" name="action" id="wppt_action_field" value="press_this_'+action+'_post">').appendTo(form);

				var data = form.serialize();

				$.ajax({
					type: "POST",
					url: site_config.ajax_url,
					data: data,
					success: function( response ) {
						if ( response.error ) {
							render_error( __('unexpected-error') );
							hide_spinner();
						} else {
							if ( 'published' == response.post_status ) {
								if ( 'popup' == ux_context && window.opener && window.opener.location ) {
									window.opener.location.href = response.post_permalink;
									self.close();
								} else {
									window.top.location.href = response.post_permalink;
								}
							} else {
								window.top.location.href = './post.php?post=' + response.post_id + '&action=edit';
							}
						}
					}
				});
			}

			function insert_selected_media( type, src, link ) {
				var new_content = '';
				if ( 'img' == type ) {
					new_content = '<a href="' + link + '"><img src="' + src + '" style="max-width:100%;" />' + "</a>\n";
				} else {
					new_content = '[embed]' + src + "[/embed]\n";
				}
				if ( ! has_set_focus ) {
					// Append to top of content on 1st media insert
					editor && editor.setContent( new_content + editor.getContent() );
				} else {
					// Or add where the cursor was last positioned in TinyMCE
					editor.execCommand( 'mceInsertContent', false, new_content );
				}
				has_set_focus = true;
			}

			function clear_errors() {
				var messages_div = $( '#alerts' );
				if ( messages_div && messages_div.remove )
					messages_div.remove();
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
				if ( data.u && data.u.match(/^https?:/ ) )
					$('#wppt_scanbar').hide();

				if ( 'iframe' != ux_context  )
					$('#wppt_close_button').hide();
			}

			function render_default_form_field_values() {
				$('#wppt_nonce_field').val( nonce );
				$('#wppt_title_field').val( suggested_title_str );
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
				$('.current-site a').attr( 'href', site_config.blog_url ).text( site_config.blog_name );
			}

			function render_suggested_title() {
				if ( ! suggested_title_str || ! suggested_title_str.length )
					return;

				$('#wppt_title_container').on('input', function(){
					$('#wppt_title_field').val($(this).text());
				}).text( suggested_title_str );
			}

			function render_suggested_content() {
				if ( ! suggested_content_str || ! suggested_content_str.length ) {
					return;
				}

				if ( ! editor ) {
					editor = tinymce.get( 'pressthis' );
				}

				if ( editor ) {
					editor.setContent( suggested_content_str );
					editor.on( 'focus', function(e) {
						has_set_focus = true;
					});
				}
			}

			function render_detected_media() {
				var media_container = $( '#wppt_featured_media_container'),
					list_container = $('#wppt_all_media_container'),
					found          = 0;

				list_container.empty();

				if ( interesting_embeds && interesting_embeds.length ) {
					$.each(interesting_embeds, function (i, src) {
						if ( ! is_embeddable( src ) ) {
							return;
						}

						var display_src = 'a bundled thumb representing embed';
						if ( src.indexOf('youtube.com/') > -1 ) {
							display_src = 'https://i.ytimg.com/vi/' + src.replace(/.+v=([^&]+).*/, '$1') + '/hqdefault.jpg';
						} else if ( src.indexOf('youtu.be/') > -1 ) {
							display_src = 'https://i.ytimg.com/vi/' + src.replace(/\/([^\/])$/, '$1') + '/hqdefault.jpg';
						}

						$('<div></div>', {
							'id': 'embed-' + i + '-container',
							'class': 'suggested-media-thumbnail'
						}).css({
							'background-image': 'url(' + display_src + ')'
						}).click(function () {
							insert_selected_media('embed',src);
						}).appendTo(list_container);

						found++;
					});
				}

				if ( interesting_images && interesting_images.length ) {
					$.each(interesting_images, function (i, src) {
						var display_src = src.replace(/^(http[^\?]+)(\?.*)?$/, '$1');
						if ( src.indexOf('files.wordpress.com/') > -1 ) {
							display_src = display_src.replace(/\?.*$/, '') + '?w=' + smallest_width;
						} else if ( src.indexOf('gravatar.com/') > -1 ) {
							display_src = display_src.replace(/\?.*$/, '') + '?s=' + smallest_width;
						} else {
							display_src = src;
						}

						$('<img />', {
							'src': display_src,
							'id': 'img-' + i + '-container',
							'class': 'suggested-media-thumbnail'
						}).css({
							'background-image': 'url(' + display_src + ')'
						}).click(function () {
							insert_selected_media('img', src, data.u);
						}).appendTo(list_container);

						found++;
					});
				}

				if ( ! found ) {
					media_container.removeClass('all-media--visible').addClass( 'no-media');
					return;
				}

				media_container.removeClass('no-media').addClass( 'all-media--visible');
			}

/* ***************************************************************
 * MONITORING FUNCTIONS
 *************************************************************** */

			function monitor_options_modal() {
				var is_active = 'is-active',
					is_hidden = 'is-hidden';
				$('.post-option').click(function(){
					$('.post-options').addClass(is_hidden);
					$('.setting-modal:nth-child(2)').addClass(is_active);
				});
				$('.modal-close').click(function(){
					$('.setting-modal:nth-child(2)').removeClass(is_active);
					$('.post-options').removeClass(is_hidden);
				});
			}

			function monitor_sidebar_toggle() {
				var opt_open  = $('.options-open'),
					opt_close = $('.options-close'),
					sidebar   = $('.options-panel'),
					is_open   = 'is-open',
					is_hidden = 'is-hidden';
				opt_open.click(function(){
					opt_open.addClass(is_hidden);
					opt_close.removeClass(is_hidden);
					sidebar.addClass(is_open);
				});
				opt_close.click(function(){
					opt_close.addClass(is_hidden);
					opt_open.removeClass(is_hidden);
					sidebar.removeClass(is_open);
				});
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
				render_detected_media();
				$( document ).on( 'tinymce-editor-init', render_suggested_content );
				render_startup_notices();
				return true;
			}

			function monitor(){
				show_spinner();

				$( '#wppt_current_site a, #wppt_current_site div').click(function( e ){
					e.preventDefault();
				});

				// Publish and Draft buttons and submit

				$( '#wppt_draft_field' ).on( 'click', function( e ){
					submit_post( e, 'draft');
				});

				$( '#wppt_publish_field' ).on( 'click', function( e ){
					submit_post( e, 'publish');
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

				monitor_options_modal();
				monitor_sidebar_toggle();

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

			// Assign callback/public properties/methods to returned object
			this.render_error = render_error;
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));