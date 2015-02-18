( function( $ ) {
	$( document ).ready(function( $ ) {

		/**
		 * WpPressThis_App
		 *
		 * Main class to control behavior and rendering for Press This, on the client side.
		 */
		var WpPressThis_App = function() {
			/**
			 * Define our most common/reused properties with their respective defaults
			 */
			var editor,
				saveAlert             = false,
				$div                  = $('<div>'),
				site_config           = window.wp_pressthis_config || {},
				data                  = window.wp_pressthis_data || {},
				smallest_width        = 128,
				interesting_images	  = get_interesting_images( data ) || [],
				interesting_embeds	  = get_interesting_embeds( data ) || [],
				has_empty_title_str   = false,
				suggested_title_str   = get_suggested_title( data ),
				suggested_content_str = get_suggested_content( data ),
				has_set_focus         = false,
				catsCache = [];

/* ***************************************************************
 * HELPER FUNCTIONS
 *************************************************************** */

			/**
			 * Emulates our PHP __() gettext function, powered by the strings exported in site_config.i18n.
			 *
			 * @param key string Key of the string to be translated, as found in site_config.i18n
			 * @returns string Original or translated value, if there is one
			 */
			function __( key ) {
				return ( ! site_config || ! site_config.i18n || ! site_config.i18n[key] || ! site_config.i18n[key].length ) ? key : site_config.i18n[key];
			}

			/**
			 * Strips HTML tags
			 *
			 * @param str string Text to have the HTML tags striped out of
			 * @returns string Stripped text
			 */
			function stripTags( str ) {
				var out = str && str.replace( /<[^>]+>/g, '' );
				// Encode the rest
				return $div.text( out ).html();
			}

			/**
			 * Gets the source page's canonical link, based on passed location and meta data.
			 *
			 * @param data object Usually WpPressThis_App.data
			 * @returns string Discovered canonical URL, or empty
			 */
			function get_canonical_link( data ) {
				if ( ! data || data.length ) {
					return '';
				}

				var link = '';

				if ( data.u ) {
					link = data.u;
				}

				if ( ! link.length && data._links ) {
					if (data._links.canonical && data._links.canonical.length) {
						link = data._links.canonical;
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

			/**
			 * Gets the source page's site name, based on passed meta data.
			 *
			 * @param data object Usually WpPressThis_App.data
			 * @returns string Discovered site name, or empty
			 */
			function get_source_site_name( data ) {
				if ( ! data || data.length ) {
					return '';
				}

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

			/**
			 * Gets the source page's title, based on passed title and meta data.
			 *
			 * @param data object Usually WpPressThis_App.data
			 * @returns string Discovered page title, or empty
			 */
			function get_suggested_title( data ) {
				if ( ! data || data.length ) {
					return __('new-post');
				}

				var title = '';

				if ( data.t ) {
					title = data.t;
				}

				if ( ! title.length && data._meta ) {
					if ( data._meta['twitter:title'] && data._meta['twitter:title'].length ) {
						title = data._meta['twitter:title'];
					} else if ( data._meta['og:title'] && data._meta['og:title'].length ) {
						title = data._meta['og:title'];
					} else if ( data._meta.title && data._meta.title.length ) {
						title = data._meta.title;
					}
				}

				if ( ! title.length ) {
					title = __( 'new-post' );
					has_empty_title_str = true;
				}

				return title.replace( /\\/g, '' );
			}

			/**
			 * Gets the source page's suggested content, based on passed data (description, selection, etc).
			 * Features a blockquoted excerpt, as well as content attribution, if any.
			 *
			 * @param data object Usually WpPressThis_App.data
			 * @returns string Discovered content, or empty
			 */
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
					} else if ( data._meta.description && data._meta.description.length ) {
						content = data._meta.description;
					}
				}

				// Wrap suggested content in blockquote tag, if we have any.
				content = ( content.length ? '<blockquote class="wppt_suggested_content">' + stripTags( content.replace( /\\/g, '' ) ) + '</blockquote>' : '' );

				// Add a source attribution if there is one available.
				if ( ( ( title.length && __( 'new-post' ) !== title ) || site_name.length ) && url.length ) {
					content += '<p class="wppt_source">';
					content += __( 'source' );
					content += ' <cite class="wppt_suggested_content_source">';
					content += __( 'source-link').replace( '%1$s', encodeURI( url ) ).replace( '%2$s', stripTags( title || site_name ) );
					content += '</cite></p>';
				}

				if ( ! content.length ) {
					content = __( 'start-typing-here' );
				}

				return content.replace( /\\/g, '' );
			}

			/**
			 * Tests if what was passed as an embed URL is deemed to be embeddable in the editor.
			 *
			 * @param url string Passed URl, usually from WpPressThis_App.data._embed
			 * @returns boolean
			 */
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

			/**
			 * Tests if what was passed as an image URL is deemed to be interesting enough to offer to the user for selection.
			 *
			 * @param src string Passed URl, usually from WpPressThis_App.data._ing
			 * @returns boolean Test for false
			 */
			function is_src_uninteresting_path( src ) {
				if ( src.match( /\/ad[sx]{1}?\// ) ) {
					// Ads
					return true;
				} else if ( src.match( /(\/share-?this[^\.]+?\.[a-z0-9]{3,4})(\?.*)?$/ ) ) {
					// Share-this type button
					return true;
				} else if ( src.match( /\/(spinner|loading|spacer|blank|rss)\.(gif|jpg|png)/ ) ) {
					// Loaders, spinners, spacers
					return true;
				} else if ( src.match( /\/([^\.\/]+[-_]{1})?(spinner|loading|spacer|blank)s?([-_]{1}[^\.\/]+)?\.[a-z0-9]{3,4}/ ) ) {
					// Fancy loaders, spinners, spacers
					return true;
				} else if ( src.match( /([^\.\/]+[-_]{1})?thumb[^.]*\.(gif|jpg|png)$/ ) ) {
					// Thumbnails, too small, usually irrelevant to context
					return true;
				} else if ( src.match( /\/wp-includes\// ) ) {
					// Classic WP interface images
					return true;
				} else if ( src.match(/[^\d]{1}\d{1,2}x\d+\.(gif|jpg|png)$/) ) {
					// Most often tiny buttons/thumbs (< 100px wide)
					return true;
				} else if ( src.indexOf('/g.gif') > -1 ) {
					// Classic WP stats gif
					return true;
				} else if ( src.indexOf('/pixel.mathtag.com') > -1 ) {
					// See mathtag.com
					return true;
				}
				return false;
			}

			/**
			 * Get a list of valid embeds from what was passed via WpPressThis_App.data._embed on page load.
			 *
			 * @returns array
			 */
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

						if ( Array.prototype.indexOf && already_selected.indexOf( schemeless_src ) > -1 ) {
							// Skip: already shown
							return;
						}

						interesting_embeds.push(src);
						already_selected.push(schemeless_src);
					});
				}

				return interesting_embeds;
			}

			/**
			 * Get what is likely the most valuable image from what was passed via WpPressThis_App.data._img and WpPressThis_App.data._meta on page load.
			 *
			 * @returns array
			 */
			function get_featured_image( data ) {
				var featured = '';

				if ( ! data || ! data._meta ) {
					return '';
				}

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

			/**
			 * Get a list of valid images from what was passed via WpPressThis_App.data._img and WpPressThis_App.data._meta on page load.
			 *
			 * @returns array
			 */
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

						if ( Array.prototype.indexOf && already_selected.indexOf( schemeless_src ) > -1 ) {
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

			/**
			 * Show UX spinner
			 */
			function show_spinner() {
				$('#wppt_spinner').addClass('show');
				$('[class^="button--"]').each(function(){
					$(this).attr('disabled', 'disabled');
				});
			}

			/**
			 * Hide UX spinner
			 */
			function hide_spinner() {
				$('#wppt_spinner').removeClass('show');
				$('[class^="button--"]').each(function(){
					$(this).removeAttr('disabled');
				});
			}

			/**
			 * Submit the post form via AJAX, and redirect to the proper screen if published vs saved as a draft.
			 *
			 * @param action string publish|draft
			 */
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
				if ( window.tagBox ) {
					$('div.tagsdiv').each( function() {
						window.tagBox.flushTags( this, false, 1 );
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

								window.self.close();
							} else {
								window.location.href = response.data.redirect;
							}
						}
					}
				});
			}

			/**
			 * Inserts the media a user has selected from the presented list inside the editor, as an image or embed, based on type
			 *
			 * @param type string img|embed
			 * @param src string Source URL
			 * @param link string Optional destination link, for images (defaults to src)
			 */
			function insert_selected_media( type, src, link ) {
				var new_content = '';

				if ( ! editor ) {
					return;
				}

				if ( 'img' === type ) {
					if ( !link || !link.length ) {
						link = src;
					}
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

			/**
			 * Adds the currently selected post format next to the option, in the options panel.
			 *
			 * @param format string Post format to be displayed
			 */
			function set_post_format_string(format) {
				if ( !format || !site_config || !site_config.post_formats || !site_config.post_formats[ format ] ) {
					return;
				}
				$('#post-option-post-format').text( site_config.post_formats[format] );
			}

			/**
			 * Save a new user-generated category via AJAX
			 */
			function saveNewCategory() {
				var data = {
					action: 'press_this_add_category',
					post_id: $( '#post_ID' ).val() || 0,
					name: $( '#new-category' ).val() || '',
					new_cat_nonce: $( '#_ajax_nonce-add-category' ).val() || '',
					parent: $( '#new-category-parent' ).val() || 0
				};

				$.post( window.ajaxurl, data, function( response ) {
					if ( ! response.success ) {
						render_error( response.data.errorMessage );
					} else {
						// TODO: change if/when the html changes.
						var $parent, $ul,
							$wrap = $( 'ul.categories-select' );

						$.each( response.data, function( i, newCat ) {
							var $node = $( '<li>' ).attr( 'id', 'category-' + newCat.term_id )
								.append( $( '<label class="selectit">' ).text( newCat.name )
									.append( $( '<input type="checkbox" name="post_category[]" checked>' ).attr( 'value', newCat.term_id ) ) );

							if ( newCat.parent ) {
								if ( ! $ul || ! $ul.length ) {
									$parent = $wrap.find( '#category-' + newCat.parent );
									$ul = $parent.find( 'ul.children:first' );

									if ( ! $ul.length ) {
										$ul = $( '<ul class="children">' ).appendTo( $parent );
									}
								}

								$ul.append( $node );
								// TODO: set focus on
							} else {
								$wrap.prepend( $node );
							}
						});

						refreshCatsCache();
					}
				});
			}

/* ***************************************************************
 * RENDERING FUNCTIONS
 *************************************************************** */

			/**
			 * Hide the form letting users enter a URL to be scanned, if a URL was already passed.
			 */
			function render_tools_visibility() {
				if ( data.u && data.u.match( /^https?:/ ) ) {
					$('#wppt_scanbar').hide();
				}
			}

			/**
			 * Render error notice
			 *
			 * @param msg string Notice/error message
			 * @param error string error|notice CSS class for display
			 */
			function render_notice( msg, error ) {
				var $alerts = $( '#alerts' ),
					className = error ? 'error' : 'notice';

				if ( ! $alerts.length ) {
					$alerts = $( '<div id="alerts" class="alerts">' ).insertBefore( '#wppt_app_container' );
				}

				$alerts.append( $( '<p class="' + className +'">' + stripTags( msg ) + '</p>' ) );
			}

			/**
			 * Render error notice
			 *
			 * @param msg string Error message
			 */
			function render_error( msg ) {
				render_notice( msg, true );
			}

			/**
			 * Render notices on page load, if any already
			 */
			function render_startup_notices() {
				// Render errors sent in the data, if any
				if ( data.errors && data.errors.length ) {
					$.each( data.errors, function( i, msg ) {
						render_error( msg );
					} );
				}

				// Prompt user to upgrade their bookmarklet if there is a version mismatch.
				if ( data.v && data._version && data.v !== data._version ) {
					render_notice( __( 'should-upgrade-bookmarklet').replace( '%s', site_config.runtime_url.replace( /^(.+)\/press-this\.php(\?.*)?/, '$1/tools.php?page=press_this_options' ) ) );
				}
			}

			/**
			 * Render the suggested title, if any
			 */
			function render_suggested_title() {
				var title = suggested_title_str || '';

				if ( ! has_empty_title_str ) {
					$('#wppt_title_field').val( title );
					$('#wppt_title_container').text( title );
					$('.post__title-placeholder').addClass('screen-reader-text');
				}

				$('#wppt_title_container').on( 'input', function() {
					saveAlert = true;
					$('#wppt_title_field').val( $(this).text() );
				});

			}

			/**
			 * Render the suggested content, if any
			 */
			function render_suggested_content() {
				if ( ! suggested_content_str || ! suggested_content_str.length ) {
					return;
				}

				if ( ! editor ) {
					editor = window.tinymce.get( 'pressthis' );
				}

				if ( editor ) {
					editor.setContent( suggested_content_str );
					editor.on( 'focus', function() {
						has_set_focus = true;
					});
				}

			}

			/**
			 * Render the detected images and embed for selection, if any
			 */
			function render_detected_media() {
				var media_container = $( '#wppt_featured_media_container'),
					list_container  = $('#wppt_all_media_container'),
					found           = 0;

				list_container.empty();

				if ( interesting_embeds && interesting_embeds.length ) {
					$.each(interesting_embeds, function (i, src) {
						src = stripTags( src );

						if ( ! is_embeddable( src ) ) {
							return;
						}

						var display_src = '',
							css_class = 'suggested-media-thumbnail suggested-media--embed';
						if ( src.indexOf( 'youtube.com/' ) > -1 ) {
							display_src = 'https://i.ytimg.com/vi/' + src.replace( /.+v=([^&]+).*/, '$1' ) + '/hqdefault.jpg';
							css_class += ' is-video';
						} else if ( src.indexOf( 'youtu.be/' ) > -1 ) {
							display_src = 'https://i.ytimg.com/vi/' + src.replace( /\/([^\/])$/, '$1' ) + '/hqdefault.jpg';
							css_class += ' is-video';
						} else if ( src.indexOf( 'dailymotion.com' ) > -1 ) {
							display_src = src.replace( '/video/', '/thumbnail/video/' );
							css_class += ' is-video';
						} else if ( src.indexOf( 'soundcloud.com' ) > -1 ) {
							css_class += ' is-audio';
						} else if ( src.indexOf( 'twitter.com' ) > -1 ) {
							css_class += ' is-tweet';
						} else {
							css_class += ' is-video';
						}

						$('<div></div>', {
							'id': 'embed-' + i + '-container',
							'class': css_class,
							'tabindex': '0'
						}).css({
							'background-image': ( display_src.length ) ? 'url(' + display_src + ')' : null
						}).on('click keypress', function (e) {
							if ( e.type === 'click' || e.which === 13 ) {
								insert_selected_media('embed',src);
							}
						}).appendTo(list_container);

						found++;
					});
				}

				if ( interesting_images && interesting_images.length ) {
					$.each(interesting_images, function (i, src) {
						src = stripTags( src );

						var display_src = src.replace(/^(http[^\?]+)(\?.*)?$/, '$1');
						if ( src.indexOf('files.wordpress.com/') > -1 ) {
							display_src = display_src.replace(/\?.*$/, '') + '?w=' + smallest_width;
						} else if ( src.indexOf('gravatar.com/') > -1 ) {
							display_src = display_src.replace(/\?.*$/, '') + '?s=' + smallest_width;
						} else {
							display_src = src;
						}

						$('<div></div>', {
							'src': display_src,
							'id': 'img-' + i + '-container',
							'class': 'suggested-media-thumbnail is-image',
							'tabindex': '0'
						}).css({
							'background-image': 'url(' + display_src + ')'
						}).on('click keypress', function (e) {
							if ( e.type === 'click' || e.which === 13 ) {
								insert_selected_media('img', src, data.u);
							}
						}).appendTo(list_container);

						found++;
					});
				}

				if ( ! found ) {
					media_container.removeClass('all-media--visible').addClass( 'no-media');
					return;
				}

				media_container.removeClass( 'no-media' ).addClass( 'all-media--visible' );
			}

/* ***************************************************************
 * MONITORING FUNCTIONS
 *************************************************************** */

			/**
			 * Interactive navigation behavior for the options modal (post format, tags, categories)
			 */
			function monitor_options_modal() {
				var is_off_screen = 'is-off-screen',
					is_hidden = 'is-hidden',
					$postOptions = $( '.post-options' ),
					$postOption = $( '.post-option' ),
					$settingModal = $( '.setting-modal' ),
					$modalClose = $( '.modal-close' );

				$postOption.on( 'click', function() {

					var index = $( this ).index(),
						$targetSettingModal = $settingModal.eq( index );

					$postOptions
						.addClass( is_off_screen )
						.one( 'transitionend', function() {
							$( this ).addClass( is_hidden );
						});

					$targetSettingModal
						.removeClass( is_off_screen + ' ' + is_hidden )
						.one( 'transitionend', function() {
							$( this ).find( $modalClose ).focus();
						});

				});

				$modalClose.on( 'click', function(){

					var $targetSettingModal = $( this ).parent(),
						index = $targetSettingModal.index();

					$postOptions
						.removeClass( is_off_screen + ' ' + is_hidden );

					$targetSettingModal
						.addClass( is_off_screen )
						.one( 'transitionend', function() {
							$( this ).addClass( is_hidden );
						});

					$postOption.eq( index - 1 ).focus();

				});
			}

			/**
			 * Interactive behavior for the sidebar toggle, to show the options modals
			 */
			function monitor_sidebar_toggle() {
				var $opt_open  = $( '.options-open' ),
					$opt_close = $( '.options-close' ),
					$postOption = $( '.post-option' ),
					$sidebar = $( '.options-panel' ),
					$post_actions = $( '.press-this__actions' ),
					$scanbar = $( '#wppt_scanbar' ),
					is_off_screen = 'is-off-screen',
					is_hidden = 'is-hidden';

				$opt_open.on( 'click', function(){

					$opt_open.addClass( is_hidden );
					$opt_close.removeClass( is_hidden );
					$post_actions.addClass( is_hidden );
					$scanbar.addClass( is_hidden );

					$sidebar
						.removeClass( is_off_screen + ' ' + is_hidden )
						.one( 'transitionend', function() {
							$postOption.eq(0).focus();
						});
				});

				$opt_close.on( 'click', function(){

					$opt_close.addClass( is_hidden );
					$opt_open.removeClass( is_hidden );
					$post_actions.removeClass( is_hidden );
					$scanbar.removeClass( is_hidden );

					$sidebar
						.addClass( is_off_screen )
						.one( 'transitionend', function() {
							$( this ).addClass( is_hidden );
						});
				});
			}

			/**
			 * Interactive behavior for the post title's field placeholder
			 */
			function monitor_placeholder() {

				var $selector = $( '#wppt_title_container' );
				var $placeholder = $('.post__title-placeholder');

				$selector.on( 'focus', function() {

					$placeholder.addClass('screen-reader-text');

				});

				$selector.on( 'blur', function() {
					var textLength = $( this ).text().length;

					if ( ! textLength ) {
						$placeholder.removeClass('screen-reader-text');
					}
				});
			}

/* ***************************************************************
 * PROCESSING FUNCTIONS
 *************************************************************** */

			/**
			 * Calls all the rendring related functions to happen on page load
			 */
			function render(){
				// We're on!
				render_tools_visibility();
				render_suggested_title();
				render_detected_media();
				$( document ).on( 'tinymce-editor-init', render_suggested_content );
				render_startup_notices();
			}

			/**
			 * Set app events and other state monitoring related code.
			 */
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

				$( 'button.add-cat-toggle' ).on( 'click.press-this', function() {
					$( this ).toggleClass( 'is-toggled' );
					$( '.setting-modal .add-category' ).toggleClass( 'is-hidden' );
					$( '.categories-search-wrapper' ).toggleClass( 'is-hidden' );
				});

				$( 'button.add-cat-submit' ).on( 'click.press-this', saveNewCategory );

				$( '.categories-search' ).on( 'keyup', function() {
					var search = $( this ).val().toLowerCase() || '';

					// Don't search when less thasn 3 extended ASCII chars
					if ( /[\x20-\xFF]+/.test( search ) && search.length < 2 ) {
						return;
					}

					$.each( catsCache, function( i, cat ) {
						cat.node.removeClass( 'is-hidden searched-parent' );
					} );

					if ( search ) {
						$.each( catsCache, function( i, cat ) {
							if ( cat.text.indexOf( search ) === -1 ) {
								cat.node.addClass( 'is-hidden' );
							} else {
								cat.parents.addClass( 'searched-parent' );
							}
						} );
					}
				} );

				return true;
			}

			function refreshCatsCache() {
				$( '.categories-select' ).find( 'li' ).each( function() {
					var $this = $( this );

					catsCache.push( {
						node: $this,
						parents: $this.parents( 'li' ),
						text: $this.children( 'label' ).text().toLowerCase()
					} );
				} );
			}

/* ***************************************************************
 * PROCESSING
 *************************************************************** */

			// Let's go!
			render();
			monitor();
			refreshCatsCache();

			// Assign callback/public properties/methods to returned object
			this.render_error = render_error;
		};

		// Initialize app
		window.wp_pressthis_app = new WpPressThis_App();
	});
}( jQuery ));
