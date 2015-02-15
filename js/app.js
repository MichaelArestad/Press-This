( function( $ ) {
	$( document ).ready(function( $ ) {
		var WpPressThis_App = function() {
			var editor,
				saveAlert             = false,
				$div                  = $('<div>'),
				site_config           = window.wp_pressthis_config || {},
				data                  = window.wp_pressthis_data || {},
				largest_width         = parseInt( $( document ).width() - 60 ) || 450,
				smallest_width        = 128,
				interesting_images	  = get_interesting_images( data ) || [],
				interesting_embeds	  = get_interesting_embeds( data ) || [],
				has_empty_title_str   = false,
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

			function stripTags( str ) {
				var out = str && str.replace( /<[^>]+>/g, '' );
				// Encode the rest
				return $div.text( out ).html();
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
					if ( data._meta['og:site_name'] && data._meta['og:site_name'].length ) {
						name = data._meta['og:site_name'];
					} else if ( data._meta['application-name'] && data._meta['application-name'].length ) {
						name = data._meta['application-name'];
					}
				}

				return name.replace(/\\/g, '');
			}

			function get_suggested_title( data ) {
				if ( ! data || data.length )
					return __( 'new-post' );

				var title = '';

				if ( data.t ) {
					title = data.t;
				}

				if ( ! title.length && data._meta ) {
					if ( data._meta['twitter:title'] && data._meta['twitter:title'].length ) {
						title = data._meta['twitter:title'];
					} else if ( data._meta['og:title'] && data._meta['og:title'].length ) {
						title = data._meta['og:title'];
					} else if ( data._meta['title'] && data._meta['title'].length ) {
						title = data._meta['title'];
					}
				}

				if ( ! title.length ) {
					title = __( 'new-post' );
					has_empty_title_str = true;
				}

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
				content = ( content.length ? '<blockquote class="wppt_suggested_content">' + stripTags( content.replace( /\\/g, '' ) ) + '</blockquote>' : '' );

				// Add a source attribution if there is one available.
				if ( ( ( title.length && __( 'new-post' ) !== title ) || site_name.length ) && url.length ) {
					content += '<p class="wppt_source">'
					+ __( 'source' )
					+ ' <cite class="wppt_suggested_content_source"><a href="'+ encodeURI( url ) +'">'+ stripTags( title || site_name ) +'</a></cite>'
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
				} else if ( url.match(/\/\/twitter\.com\/[^\/]+\/status\/[\d]+$/) ) {
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

			function submit_post( action ) {
				saveAlert = false;
				show_spinner();

				var $form = $('#wppt_form');

				if ( 'publish' !== action ) {
					action = 'draft';
				}

				editor && editor.save();

				$form.append( '<input type="hidden" name="action" id="wppt_action_field" value="press_this_' + action + '_post">' );

				// Make sure to flush out the tags with tagBox before saving
				if ( tagBox ) {
					$('div.tagsdiv').each( function() {
						tagBox.flushTags( this, false, 1 );
					});
				}

				var data = $form.serialize();

				$.ajax({
					type: 'post',
					url: window.ajaxurl,
					data: data,
					success: function( response ) {
						if ( ! response.success ) {
							render_error( response.data.errorMessage );
							hide_spinner();
						} else if ( response.data.redirect ) {
							// TODO: better redirect/window.open()/_blank logic
							if ( window.opener ) {
								try {
									window.opener.location.href = response.data.redirect;
								} catch( er ) {}

								self.close();
							} else {
								window.location.href = response.data.redirect;
							}
						}
					}
				});
			}

			function insert_selected_media( type, src, link ) {
				var new_content = '';

				if ( ! editor ) {
					return;
				}

				if ( 'img' == type ) {
					new_content = '<a href="' + link + '"><img src="' + src + '" /></a>\n';
				} else {
					new_content = '[embed]' + src + '[/embed]\n';
				}

				if ( ! has_set_focus ) {
					// Append to top of content on 1st media insert
					editor.setContent( new_content + editor.getContent() );
				} else {
					// Or add where the cursor was last positioned in TinyMCE
					editor.execCommand( 'mceInsertContent', false, new_content );
				}

				has_set_focus = true;
			}

			function set_post_format_string(format) {
				if ( !format || !site_config || !site_config.post_formats || !site_config.post_formats[ format ] ) {
					return;
				}
				$('#post-option-post-format').text( site_config.post_formats[format] );
			}

/* ***************************************************************
 * RENDERING FUNCTIONS
 *************************************************************** */

			function render_tools_visibility() {
				if ( data.u && data.u.match( /^https?:/ ) )
					$('#wppt_scanbar').hide();
			}

			function render_notice( msg, error ) {
				var $alerts = $( '#alerts' ),
					className = error ? 'error' : 'notice';

				if ( ! $alerts.length )
					$alerts = $( '<div id="alerts" class="alerts"></div>' ).insertBefore( '#wppt_app_container' );

				$alerts.append( '<p class="' + className +'">' + msg + '</p>' );
			}

			function render_error( msg ) {
				render_notice( msg, true );
			}

			function render_startup_notices() {
				// Render errors sent in the data, if any
				if ( data.errors && data.errors.length ) {
					$.each( data.errors, function( i, msg ) {
						render_error( msg );
					} );
				}

				// Prompt user to upgrade their bookmarklet if there is a version mismatch.
				if ( data.v && data._version && data.v != data._version ) {
					render_notice( __( 'should-upgrade-bookmarklet').replace( '%s', site_config.runtime_url.replace( /^(.+)\/press-this\.php(\?.*)?/, '$1/tools.php?page=press_this_options' ) ) );
				}
			}

			function render_suggested_title() {
				var title = suggested_title_str || '';

				if ( !has_empty_title_str ) {
					$('#wppt_title_field').val( title );
					$('#wppt_title_container').text( title )
					$('.post__title-placeholder').addClass('screen-reader-text');
				}

				$('#wppt_title_container').on( 'input', function() {
					saveAlert = true;
					$('#wppt_title_field').val( $(this).text() );
				});

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
					editor.on( 'focus', function() {
						has_set_focus = true;
					});
				}

			}

			function render_detected_media() {
				var media_container = $( '#wppt_featured_media_container'),
					list_container  = $('#wppt_all_media_container'),
					found           = 0;

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
							'class': 'suggested-media-thumbnail suggested-media--embed'
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
					is_hidden = 'is-hidden',
					$postOptions = $( '.post-options'),
					$postOption = $( '.post-option'),
					$settingModal = $( '.setting-modal' );

				$postOption.on('click', function() {
					var index = $( this ).index();
					$postOptions.addClass( is_hidden );
					$settingModal.eq( index ).addClass( is_active );
				});

				$('.modal-close').click(function(){
					$settingModal.removeClass( is_active );
					$postOptions.removeClass( is_hidden );
				});
			}

			function monitor_sidebar_toggle() {
				var $opt_open  = $( '.options-open' ),
					$opt_close = $( '.options-close' ),
					$sidebar = $( '.options-panel' ),
					is_open = 'is-open',
					is_hidden = 'is-hidden';

				$opt_open.click(function(){
					$opt_open.addClass( is_hidden );
					$opt_close.removeClass( is_hidden );
					$sidebar.addClass( is_open );
				});

				$opt_close.click(function(){
					$opt_close.addClass( is_hidden );
					$opt_open.removeClass( is_hidden );
					$sidebar.removeClass( is_open );
					$( '.post-options' ).removeClass( is_hidden );
					$( '.setting-modal').removeClass( 'is-active' );
				});
			}

			function monitor_placeholder() {

				var $selector = $( '#wppt_title_container' );
				var $placeholder = $('.post__title-placeholder');

				$selector.on( 'focus', function() {

					$placeholder.addClass('screen-reader-text');

				});
				
				$selector.on( 'blur', function() {

					var textLength = $( this ).text().length;

					if ( ! textLength > 0 )
						$placeholder.removeClass('screen-reader-text');

				});

			}


/* ***************************************************************
 * PROCESSING FUNCTIONS
 *************************************************************** */

			function render(){
				// We're on!
				render_tools_visibility();
				render_suggested_title();
				render_detected_media();
				$( document ).on( 'tinymce-editor-init', render_suggested_content );
				render_startup_notices();
			}

			function monitor(){
				$( '#wppt_current_site a').click( function( e ) {
					e.preventDefault();
				});

				// Publish and Draft buttons and submit

				$( '#wppt_draft_field' ).on( 'click', function() {
					submit_post( 'draft' );
				});

				$( '#wppt_publish_field' ).on( 'click', function() {
					submit_post( 'publish' );
				});

				monitor_options_modal();
				monitor_sidebar_toggle();
				monitor_placeholder();

				$('#post-formats-select input').on( 'change', function() {
					var $this = $( this );

					if ( $this.is( ':checked' ) ) {
						set_post_format_string( $this.attr('id').replace( /^post-format-(.+)$/, '$1' ) );
					}
				});

				// Needs more work, doesn't detect when the other JS changes the value of #tax-input-post_tag
				$( '#tax-input-post_tag' ).on( 'change', function() {
					var val =  $( this ).val();
					$('#post-option-tags').text( ( val.length ) ? val.replace( /,([^\s])/g, ', $1' ) : '' );
				});
				
				$( window ).on( 'beforeunload.press-this', function() {
					if ( saveAlert || ( editor && editor.isDirty() ) ) {
						return window.pressThisL10n.saveAlert;
					}
				});

				return true;
			}

/* ***************************************************************
 * PROCESSING
 *************************************************************** */

			// Let's go!
			render();
			monitor();

			// Assign callback/public properties/methods to returned object
			this.render_error = render_error;
		};

		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));
