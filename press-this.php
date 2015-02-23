<?php
/*
Plugin Name: Press This
Plugin URI: https://wordpress.org/plugins/press-this/
Description: Posting images, links, and cat gifs will never be the same.
Version: 0.0.9
Author: Press This Team
Author URI: https://corepressthis.wordpress.com/
Text Domain: press-this
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Class WP_Press_This
 *
 * @since 4.2
 */
class WP_Press_This {
	/**
	 * Constructor
	 *
	 * @since 4.2
	 */
	public function __construct() {
		$script_name = $this->script_name();

		if ( empty( $script_name ) ) {
			return;
		}

		if ( is_admin() ) {
			if ( false !== strpos( $this->runtime_url(), $script_name ) ) {
				/*
				 * Take over /wp-admin/press-this.php
				 */
				add_action( 'admin_init', array( $this, 'press_this_php_override' ), 0 );
			} else if ( false !== strpos( admin_url( 'admin-ajax.php' ), $script_name ) ) {
				/*
				 * AJAX emdpoints
				 */
				// Post draft and publish
				add_action( 'wp_ajax_press_this_publish_post', array( $this, 'save' ) );
				add_action( 'wp_ajax_press_this_draft_post',   array( $this, 'save' ) );
				add_action( 'wp_ajax_press_this_add_category', array( $this, 'press_this_add_category' ) );
			} else {
				/*
				 * Take over Press This bookmarklet code, wherever presented
				 */
				add_filter( 'shortcut_link', array( $this, 'shortcut_link_override' ) );
				/*
				 * Register a new admin page for PT, so we can have our our instructions, etc.
				 */
				add_action( 'admin_menu', array( $this, 'register_options_page' ) );
				add_action( 'admin_notices', array( $this, 'admin_notices' ) );
			}
		}
	}

	/**
	 * Returns the current app's fully qualified script name/url based on system-level tests
	 *
	 * @since 4.2
	 *
	 * @return mixed|string
	 */
	public function script_name() {
		$script_name = ( ! empty( $_SERVER['SCRIPT_NAME'] ) )
			? $_SERVER['SCRIPT_NAME']
			: ( ! empty( $_SERVER['PHP_SELF'] ) )
				? $_SERVER['PHP_SELF']
				: ( ! empty( $_SERVER['REQUEST_URI'] ) )
					? preg_replace( '/^([^\?]+)(\?.*)?$/', '\1', $_SERVER['REQUEST_URI'] )
					: '';
		return ( preg_match( '/\/wp-admin\/?$/', $script_name ) || ! preg_match( '/\.php$/', $script_name ) )
			? untrailingslashit( $script_name ) . '/index.php'
			: $script_name;
	}

	/**
	 * Sets the URL to https or http, depending on availability and related WP config settings/APIs.
	 *
	 * @since 4.2
	 *
	 * @param $url string
	 *
	 * @return string
	 */
	public function set_url_scheme( $url ) {
		$current_user = get_current_user();
		if ( ( function_exists( 'force_ssl_admin' ) && force_ssl_admin() )
			|| ( function_exists( 'force_ssl_login' ) && force_ssl_login() )
			|| ( function_exists( 'force_ssl_content' ) && force_ssl_content() )
			|| ( function_exists( 'is_ssl' ) && is_ssl() )
			|| ! empty( $current_user->use_ssl ) ) {

			return set_url_scheme( $url, 'https' );
		}

		return set_url_scheme( $url, 'http' );
	}

	/**
	 * Removes http or https from a URL to have it default to the current protocaol on the client-side (EG: //youtube.com/)
	 *
	 * @since 4.2
	 *
	 * @param $url
	 * @return mixed
	 */
	public function strip_url_scheme( $url ) {
		return preg_replace( '/^https?:(\/\/.+)$/', '\1', $url );
	}

	/**
	 * Returns this plugin's meta data, from in-code plugin header comment
	 *
	 * @since 4.2
	 *
	 * @return array
	 */
	public function plugin_data() {
		return get_plugin_data( __FILE__, false, false );
	}

	/**
	 * Returns this plugin's own version string, from in-code plugin header comment
	 *
	 * @since 4.2
	 *
	 * @return string The current plugin's version
	 */
	public function plugin_version() {
		$data = $this->plugin_data();
		return ( ! empty( $data ) && ! empty( $data['Version'] ) ) ? (string) $data['Version'] : 0;
	}

	/**
	 * Returns this plugin's own runtime URL, which happens to masquerade/override as /wp-admin/press-this.php
	 *
	 * @since 4.2
	 *
	 * @return string Full URL to /admin/press-this.php in current install
	 */
	public function runtime_url() {
		return $this->set_url_scheme( admin_url( 'press-this.php' ) );
	}

	/**
	 * Plugin directory filesystem path
	 *
	 * @since 4.2
	 *
	 * @return string Full system path to /wp-content/plugins/press-this in current install
	 */
	public function plugin_dir_path() {
		return untrailingslashit( plugin_dir_path( __FILE__ ) );
	}

	/**
	 * Centralized/keyed app caption store, used on both server and client sides.
	 *
	 * @since 4.2
	 *
	 * @return array
	 */
	public function i18n() {
		return array(
			/**
			 * press_this_source_string: string displayed before the source attribution string, defaults to "Source:".
			 *
			 * @since 4.2
			 * @see https://github.com/MichaelArestad/Press-This/issues/25
			 *
			 * @param string $string Internationalized source string
			 *
			 * @return string Source string
			 */
			'source'           => apply_filters( 'press_this_source_string', __( 'Source:' ) ),
			/**
			 * press_this_source_link: HTML link format for the source attribution, can control target, class, etc
			 *
			 * @since 4.2
			 * @see https://github.com/MichaelArestad/Press-This/issues/25
			 *
			 * @param string $link_format Internationalized link format, %1$s is link href, %2$s is link text
			 *
			 * @return string Link markup
			 */
			'sourceLink'        => apply_filters( 'press_this_source_link', __( '<a href="%1$s">%2$s</a>' ) ),
			'newPost'           => __( 'Title' ),
			'unexpectedError'   => __( 'Sorry, but an unexpected error occurred.' ),
			'saveAlert'         => __( 'The changes you made will be lost if you navigate away from this page.' ),
			'allMediaHeading'   => __( 'Suggested media' ),
			'tagDelimiter'      => _x( ',', 'tag delimiter' ),
			'suggestedEmbedAlt' => __( 'Suggested embed #%d' ),
			'suggestedImgAlt'  => __( 'Suggested image #%d' ),
		);
	}

	/**
	 * App and site settings data, including i18n strings for the client-side
	 *
	 * @since 4.2
	 */
	public function site_settings() {
		$supported_formats = get_theme_support( 'post-formats' );
		$post_formats      = array();

		if ( ! empty( $supported_formats[0] ) && is_array( $supported_formats[0] ) ) {
			$post_formats[ 0 ] = __( 'Standard' );
			foreach ( $supported_formats[0] as $post_format ) {
				$post_formats[ $post_format ] = esc_html( get_post_format_string( $post_format ) );
			}
		}

		return array(
			'version'         => $this->plugin_version(),
			'runtime_url'     => $this->strip_url_scheme( $this->runtime_url() ),
			'ajax_url'        => $this->strip_url_scheme( admin_url( 'admin-ajax.php' ) ),
			'post_formats'    => $post_formats,
			/**
			 * press_this_redirect_in_parent: Should PT redirect the user in the parent window, instead of the popup, upon save.
			 *
			 * @since 4.2
			 *
			 * @param bool $redir_in_parent Whether to redirect in parent window or not, defaults to false
			 *
			 * @return bool
			 */
			'redir_in_parent' => apply_filters( 'press_this_redirect_in_parent', __return_false() ),
		);
	}

	/**
	 * Returns the bookmarklet's static code from /js/bookmarklet.js, with a local JS variable set to the current install's path to PT
	 *
	 * @since 4.2
	 *
	 * @return string Press This bookmarklet JS trigger found in /wp-admin/tools.php
	 */
	public function shortcut_link_override( $link ) {
		/**
		 * Return the old/shorter bookmarklet code for MSIE 8 and lower,
		 * since they only support a max length of ~2000 characters for
		 * bookmark[let] URLs, which is way to small for our smarter one.
		 * Do update the version number so users do not get the "upgrade your
		 * bookmarklet" notice when using PT in those browsers.
		 */
		$ua = $_SERVER['HTTP_USER_AGENT'];
		if ( ! empty( $ua ) && preg_match( '/\bMSIE (\d{1})/', $ua, $matches ) && (int) $matches[1] <= 8 ) {
			return preg_replace( '/\bv=\d{1}/', 'v=' . $this->plugin_version(), $link );
		}

		$url = esc_js( $this->runtime_url() . '?v=' . $this->plugin_version() );

		$link = 'javascript:' . file_get_contents( $this->plugin_dir_path() . '/js/bookmarklet.min.js' );
		$link = str_replace( 'window.pt_url', wp_json_encode( $url ), $link );

		return $link;
	}

	/**
	 * Takes over /wp-admin/press-this.php for backward compatibility and while in feature-as-plugin mode
	 *
	 * @since 4.2
	 */
	public function press_this_php_override() {
		// Simply drop the following test once/if this becomes the standard Press This code in core
		if ( false === strpos( $this->runtime_url(), $this->script_name() ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_posts' ) || ! current_user_can( get_post_type_object( 'post' )->cap->create_posts ) ) {
			wp_die( __( 'Cheatin&#8217; uh?' ) );
		}

		$this->serve_app_html();
	}

	/**
	 * Get the sources images and save them locally, fr posterity, unless we can't.
	 *
	 * @since 4.2
	 *
	 * @param $post_id int
	 * @param $content string Current expected markup for PT
	 * @return string New markup with old image URLs replaced with the local attachment ones if swapped
	 */
	public function side_load_images( $post_id, $content = '' ) {
		$new_content = $content;

		preg_match_all( '/<img [^>]+>/', $content, $matches );

		if ( ! empty( $matches ) && current_user_can( 'upload_files' ) ) {
			foreach ( (array) $matches[0] as $key => $image ) {
				preg_match( '/src=["\']{1}([^"\']+)["\']{1}/', stripslashes( $image ), $url_matches );

				if ( empty( $url_matches[1] ) ) {
					continue;
				}

				$image_url = $url_matches[1];

				//Don't sideload images already hosted on our WP instance
				if ( false !== strpos( $image_url, preg_replace( '/^(http:.+)\/wp-admin\/.+/', '\1/wp-content/', $this->script_name() ) ) ) {
					continue;
				}

				// Don't try to sideload file without a file extension, leads to WP upload error,
				// then a "PHP Notice:  Undefined offset: 0 in /wp-admin/includes/media.php on line 811"
				// Matching regex to skip from media_sideload_image() in otherwise erroring /wp-admin/includes/media.php
				if ( ! preg_match( '/[^\?]+\.(jpe?g|jpe|gif|png)\b/i', $image_url ) )
					 continue;

				// See if files exist in content - we don't want to upload non-used selected files.
				if ( false !== strpos( $new_content, htmlspecialchars( $image_url ) ) ) {
					// Sideload image, which ives us a new image tag, strip the empty alt that comes with it.
					$upload = str_replace( ' alt=""', '', media_sideload_image( $image_url, $post_id ) );

					// Preserve assigned class, id, width, height and alt attributes
					if ( preg_match_all( '/(class|width|height|id|alt)=\\\?(\"|\')[^"\']+\\\?(\2)/', $image, $attr_matches ) && is_array( $attr_matches[0] ) ) {
						foreach ( $attr_matches[0] as $attr ) {
							$upload = str_replace( '<img', '<img ' . $attr, $upload );
						}
					}

					// Replace the POSTED content <img> with correct uploaded ones. Regex contains fix for Magic Quotes
					if ( ! is_wp_error( $upload ) ) {
						$new_content = str_replace( $image, $upload, $new_content );
					}
				}
			}
		}

		// Error handling for media_sideload, send original content back
		if ( is_wp_error( $new_content ) ) {
			return $content;
		}

		return $new_content;
	}

	/**
	 * Save the post as draft or published, via AJAX
	 *
	 * @since 4.2
	 */
	public function save() {
		if ( empty( $_POST['pressthis-nonce'] ) || ! wp_verify_nonce( $_POST['pressthis-nonce'], 'press-this' ) ) {
			wp_send_json_error( array( 'errorMessage' => __( 'Cheatin&#8217; uh?' ) ) );
		}

		if ( ! isset( $_POST['post_ID'] ) || ! $post_id = (int) $_POST['post_ID'] ) {
			wp_send_json_error( array( 'errorMessage' => __( 'Missing post ID.' ) ) );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			wp_send_json_error( array( 'errorMessage' => __( 'Cheatin&#8217; uh?' ) ) );
		}

		$post = array(
			'ID' => $post_id,
			'post_title' => ( ! empty( $_POST['title'] ) ) ? sanitize_text_field( trim( $_POST['title'] ) ) : '',
			'post_content' => ( ! empty( $_POST['pressthis'] ) ) ? trim( $_POST['pressthis'] ) : '',
			'post_type' => 'post',
			'post_status' => 'draft',
			'post_format' => ( ! empty( $_POST['post_format'] ) ) ? $_POST['post_format'] : 0,
			'tax_input' => ( ! empty( $_POST['tax_input'] ) ) ? $_POST['tax_input'] : array(),
			'post_category' => ( ! empty( $_POST['post_category'] ) ) ? $_POST['post_category'] : array(),
		);

		if ( ! empty( $_POST['action'] ) && 'press_this_publish_post' === $_POST['action'] ) {
			if ( current_user_can( 'publish_posts' ) ) {
				$post['post_status'] = 'publish';
			} else {
				$post['post_status'] = 'pending';
			}
		}

		$new_content = $this->side_load_images( $post_id, $post['post_content'] );

		if ( ! is_wp_error( $new_content ) ) {
			$post['post_content'] = $new_content;
		}

		$updated = wp_update_post( $post, true );

		if ( is_wp_error( $updated ) || intval( $updated ) < 1 ) {
			wp_send_json_error( array( 'errorMessage' => __( 'Error while saving the post. Please try again later.' ) ) );
		} else {
			if ( isset( $post['post_format'] ) ) {
				if ( current_theme_supports( 'post-formats', $post['post_format'] ) ) {
					set_post_format( $post_id, $post['post_format'] );
				} elseif ( $post['post_format'] ) {
					set_post_format( $post_id, false );
				}
			}

			if ( 'publish' === get_post_status( $post_id ) ) {
				/**
				 * press_this_publish_redirect: URL returned to PT on publish sucess, defaults to post permalink.
				 *
				 * @since 4.2
				 *
				 * @param int $post_id
				 *
				 * @return string URL
				 */
				$redirect = apply_filters( 'press_this_publish_redirect', get_post_permalink( $post_id ), $post_id );
			} else {
				/**
				 * press_this_draft_redirect: URL returned to PT on draft success, defaults to editing the post.
				 *
				 * @since 4.2
				 *
				 * @param int $post_id
				 *
				 * @return string URL
				 */
				$redirect = apply_filters( 'press_this_draft_redirect', get_edit_post_link( $post_id, 'raw' ), $post_id );
			}

			wp_send_json_success( array( 'redirect' => $redirect ) );
		}
	}

	/**
	 * Download the source's HTML via server-side call
	 *
	 * @since 4.2
	 *
	 * @return string Source's HTML sanitized markup
	 */
	public function fetch_source_html( $url ) {
		// Download source page to tmp file
		$source_tmp_file = ( ! empty( $url ) ) ? download_url( $url ) : '';
		$source_content  = '';
		if ( ! is_wp_error( $source_tmp_file ) && file_exists( $source_tmp_file ) ) {
			// Get the content of the source page from the tmp file.
			$source_content = wp_kses(
				file_get_contents( $source_tmp_file ),
				array(
					'img' => array(
						'src'      => array(),
					),
					'iframe' => array(
						'src'      => array(),
					),
					'link' => array(
						'rel'      => array(),
						'itemprop' => array(),
						'href'     => array(),
					),
					'meta' => array(
						'property' => array(),
						'name'     => array(),
						'content'  => array(),
					)
				)
			);
			// All done with backward compatibility
			// Let's do some cleanup, for good measure :)
			unlink( $source_tmp_file );
		} else if ( is_wp_error( $source_tmp_file ) ) {
			$source_content = new WP_Error( 'upload-error',  sprintf( __( 'Error: %s' ), sprintf( __( 'Could not download the source URL (native error: %s).' ), $source_tmp_file->get_error_message() ) ) );
		} else if ( ! file_exists( $source_tmp_file ) ) {
			$source_content = new WP_Error( 'no-local-file',  sprintf( __( 'Error: %s' ), __( 'Could not save or locate the temporary download file for the source URL.' ) ) );
		}

		return $source_content;
	}

	/**
	 * Fetch and parse _meta, _img, and _links data from the source
	 *
	 * @since 4.2
	 *
	 * @param string $url
	 * @param array $data Existing data array if you have one.
	 *
	 * @return array New data array
	 */
	public function source_data_fetch_fallback( $url, $data = array() ) {
		if ( empty( $url ) ) {
			return array();
		}

		// Download source page to tmp file
		$source_content = $this->fetch_source_html( $url );
		if ( is_wp_error( $source_content ) ) {
			return array( 'errors' => $source_content->get_error_messages() );
		}

		// Fetch and gather <img> data
		if ( empty( $data['_img'] ) ) {
			$data['_img'] = array();
		}

		if ( preg_match_all( '/<img (.+)[\s]?\/>/', $source_content, $matches ) ) {
			if ( ! empty( $matches[0] ) ) {
				foreach ( $matches[0] as $value ) {
					if ( preg_match( '/<img[^>]+src="([^"]+)"[^>]+\/>/', $value, $new_matches ) ) {
						if ( ! in_array( $new_matches[1], $data['_img'] ) ) {
							$data['_img'][] = $new_matches[1];
						}
					}
				}
			}
		}

		// Fetch and gather <iframe> data
		if ( empty( $data['_embed'] ) ) {
			$data['_embed'] = array();
		}

		if ( preg_match_all( '/<iframe (.+)[\s][^>]*>/', $source_content, $matches ) ) {
			if ( ! empty( $matches[0] ) ) {
				foreach ( $matches[0] as $value ) {
					if ( preg_match( '/<iframe[^>]+src=(\'|")([^"]+)(\'|")/', $value, $new_matches ) ) {
						if ( ! in_array( $new_matches[2], $data['_embed'] ) ) {
							if ( preg_match( '/\/\/www\.youtube\.com\/embed\/([^\?]+)\?.+$/', $new_matches[2], $src_matches ) ) {
								$data['_embed'][] = 'https://www.youtube.com/watch?v=' . $src_matches[1];
							} else if ( preg_match( '/\/\/player\.vimeo\.com\/video\/([\d]+)([\?\/]{1}.*)?$/', $new_matches[2], $src_matches ) ) {
								$data['_embed'][] = 'https://vimeo.com/' . (int) $src_matches[1];
							} else if ( preg_match( '/\/\/vine\.co\/v\/([^\/]+)\/embed/', $new_matches[2], $src_matches ) ) {
								$data['_embed'][] = 'https://vine.co/v/' . $src_matches[1];
							}
						}
					}
				}
			}
		}

		// Fetch and gather <meta> data
		if ( empty( $data['_meta'] ) ) {
			$data['_meta'] = array();
		}

		if ( preg_match_all( '/<meta ([^>]+)[\s]?\/?>/  ', $source_content, $matches ) ) {
			if ( ! empty( $matches[0] ) ) {
				foreach ( $matches[0] as $key => $value ) {
					if ( preg_match( '/<meta[^>]+(property|name)="(.+)"[^>]+content="(.+)"/', $value, $new_matches ) ) {
						if ( empty( $data['_meta'][ $new_matches[2] ] ) ) {
							if ( preg_match( '/:?(title|description|keywords)$/', $new_matches[2] ) ) {
								$data['_meta'][ $new_matches[2] ] = str_replace( '&#039;', "'", str_replace( '&#034;', '', html_entity_decode( $new_matches[3] ) ) );
							} else {
								$data['_meta'][ $new_matches[2] ] = $new_matches[3];
								if ( 'og:url' == $new_matches[2] ) {
									if ( false !== strpos( $new_matches[3], '//www.youtube.com/watch?' )
									     || false !== strpos( $new_matches[3], '//www.dailymotion.com/video/' )
									     || preg_match( '/\/\/vimeo\.com\/[\d]+$/', $new_matches[3] )
									     || preg_match( '/\/\/soundcloud\.com\/.+$/', $new_matches[3] )
									     || preg_match( '/\/\/twitter\.com\/[^\/]+\/status\/[\d]+$/', $new_matches[3] )
									     || preg_match( '/\/\/vine\.co\/v\/[^\/]+/', $new_matches[3] ) ) {
										if ( ! in_array( $new_matches[3], $data['_embed'] ) ) {
											$data['_embed'][] = $new_matches[3];
										}
									}
								} else if ( 'og:video' == $new_matches[2] || 'og:video:secure_url' == $new_matches[2] ) {
									if ( preg_match( '/\/\/www\.youtube\.com\/v\/([^\?]+)/', $new_matches[3], $src_matches ) ) {
										if ( ! in_array( 'https://www.youtube.com/watch?v=' . $src_matches[1], $data['_embed'] ) ) {
											$data['_embed'][] = 'https://www.youtube.com/watch?v=' . $src_matches[1];
										}
									} else if ( preg_match( '/\/\/vimeo.com\/moogaloop\.swf\?clip_id=([\d]+)$/', $new_matches[3], $src_matches ) ) {
										if ( ! in_array( 'https://vimeo.com/' . $src_matches[1], $data['_embed'] ) ) {
											$data['_embed'][] = 'https://vimeo.com/' . $src_matches[1];
										}
									}
								} else if ( 'og:image' == $new_matches[2] || 'og:image:secure_url' == $new_matches[2] ) {
									if ( ! in_array( $new_matches[3], $data['_img'] ) ) {
										$data['_img'][] = $new_matches[3];
									}
								}
							}
						}
					}
				}
			}
		}

		// Fetch and gather <link> data
		if ( empty( $data['_links'] ) ) {
			$data['_links'] = array();
		}

		if ( preg_match_all( '/<link ([^>]+)[\s]?\/>/', $source_content, $matches ) ) {
			if ( ! empty( $matches[0] ) ) {
				foreach ( $matches[0] as $key => $value ) {
					if ( preg_match( '/<link[^>]+(rel|itemprop)="([^"]+)"[^>]+href="([^"]+)"[^>]+\/>/', $value, $new_matches ) ) {
						if ( 'alternate' == $new_matches[2] || 'thumbnailUrl' == $new_matches[2] || 'url' == $new_matches[2] ) {
							if ( empty( $data['_links'][ $new_matches[2] ] ) ) {
								$data['_links'][ $new_matches[2] ] = $new_matches[3];
							}
						}
					}
				}
			}
		}

		return $data;
	}

	/**
	 * Handles making this version of Press This backward compatible with the previous/legacy version by supporting its query string params
	 *
	 * @since 4.2
	 *
	 * @return array
	 */
	public function merge_or_fetch_data() {
		// Merge $_POST and $_GET, as appropriate ($_POST > $_GET), to remain backward compatible
		$data = array_merge_recursive( $_POST, $_GET );

		// Get the legacy QS params, or equiv POST data
		$data['u'] = ( ! empty( $data['u'] ) && preg_match( '/^https?:/', $data['u'] ) ) ? $data['u'] : '';
		$data['s'] = ( ! empty( $data['s'] ) ) ? $data['s'] : '';
		$data['t'] = ( ! empty( $data['t'] ) ) ? $data['t'] : '';

		/**
		 * press_this_media_discovery: Whether to enable or disable in-source media discovery.
		 *
		 * @since 4.2
		 * @see https://github.com/MichaelArestad/Press-This/issues/62
		 *
		 * @param bool $enable Defaults to true
		 *
		 * @return bool
		 */
		if ( apply_filters( 'press_this_media_discovery', __return_true() ) ) {
			// If no _meta (a new thing) was passed via $_POST, fetch data from source as fallback, makes PT fully backward compatible
			if ( empty( $data['_meta'] ) && ! empty( $data['u'] ) ) {
				$data = $this->source_data_fetch_fallback( $data['u'], $data );
			}
		} else {
			if ( ! empty( $data['_img'] ) ) {
				$data['_img'] = array();
			}
			if ( ! empty( $data['_embed'] ) ) {
				$data['_embed'] = array();
			}
			if ( ! empty( $data['_meta'] ) ) {
				$data['_meta'] = array();
			}
		}

		/**
		 * press_this_data: Data array used by PT to provide meta data gathered from the source.
		 *
		 * @since 4.2
		 *
		 * @param array $data Data array
		 *
		 * @return array
		 */
		return apply_filters( 'press_this_data', $data );
	}

	/**
	 * Add another stylesheet inside TinyMCE.
	 *
	 * @since 4.2
	 *
	 * @param string $styles URL to editor stylesheet
	 *
	 * @return string
	 */
	public function editor_styles_override( $styles ) {
		if ( ! empty( $styles ) ) {
			$styles .= ',';
		}

		return $styles . plugin_dir_url( __FILE__ ) . 'css/press-this-editor.css?ver=' . $this->plugin_version();
	}

	/**
	 * Output the post format selection HTML.
	 *
	 * @since 4.2
	 *
	 * @param object $post
	 */
	function post_formats_html( $post ) {
		if ( current_theme_supports( 'post-formats' ) && post_type_supports( $post->post_type, 'post-formats' ) ) {
			$post_formats = get_theme_support( 'post-formats' );

			if ( is_array( $post_formats[0] ) ) {
				$post_format = get_post_format( $post->ID );

				if ( ! $post_format ) {
					$post_format = '0';
				}

				// Add in the current one if it isn't there yet, in case the current theme doesn't support it
				if ( $post_format && ! in_array( $post_format, $post_formats[0] ) ) {
					$post_formats[0][] = $post_format;
				}

				?>
				<div id="post-formats-select">
					<input type="radio" name="post_format" class="post-format" id="post-format-0" value="0" <?php checked( $post_format, '0' ); ?> />
					<label for="post-format-0" class="post-format-icon post-format-standard"><?php echo get_post_format_string( 'standard' ); ?></label>
					<?php

					foreach ( $post_formats[0] as $format ) {
						$attr_format = esc_attr( $format );

						?>
						<br />
						<input type="radio" name="post_format" class="post-format" id="post-format-<?php echo $attr_format; ?>" value="<?php echo $attr_format; ?>" <?php checked( $post_format, $format ); ?> />
						<label for="post-format-<?php echo $attr_format ?>" class="post-format-icon post-format-<?php echo $attr_format; ?>"><?php echo esc_html( get_post_format_string( $format ) ); ?></label>
						<?php
					 }

					 ?>
				</div>
				<?php
			}
		}
	}

	/**
	 * Output the categories HTML.
	 *
	 * @since 4.2
	 *
	 * @param object $post
	 */
	function categories_html( $post ) {
		$taxonomy = get_taxonomy( 'category' );

		if ( current_user_can( $taxonomy->cap->edit_terms ) ) {

			?>
			<button type="button" class="add-cat-toggle button-subtle"><span class="dashicons dashicons-plus"></span></button>
			<div class="add-category is-hidden">
				<label class="screen-reader-text" for="new-category"><?php echo $taxonomy->labels->add_new_item; ?></label>
				<input type="text" id="new-category" class="add-category-name" placeholder="<?php echo esc_attr( $taxonomy->labels->new_item_name ); ?>" value="" aria-required="true">
				<label class="screen-reader-text" for="new-category-parent"><?php echo $taxonomy->labels->parent_item_colon; ?></label>
				<div class="postform-wrapper">
					<?php

					wp_dropdown_categories( array(
						'taxonomy' => 'category',
						'hide_empty' => 0,
						'name' => 'new-category-parent',
						'orderby' => 'name',
						'hierarchical' => 1,
						'show_option_none' => '&mdash; ' . $taxonomy->labels->parent_item . ' &mdash;'
					) );

					?>
				</div>
				<button type="button" class="button add-cat-submit"><?php _e( 'Add' ); ?></button>
			</div>
			<?php
		}

		?>
		<div class="categories-search-wrapper">
			<input id="categories-search" type="search" class="categories-search" placeholder="<?php _e( 'Search categories' ) ?>">
			<label for="categories-search"><span class="dashicons dashicons-search"></span></label>
		</div>
		<ul class="categories-select">
			<?php wp_terms_checklist( $post->ID, array( 'taxonomy' => 'category' ) ); ?>
		</ul>
		<?php
	}

	/**
	 * Output the tags HTML.
	 *
	 * @since 4.2
	 *
	 * @param object $post
	 */
	function tags_html( $post ) {
		$taxonomy = get_taxonomy( 'post_tag' );
		$user_can_assign_terms = current_user_can( $taxonomy->cap->assign_terms );
		$esc_tags = get_terms_to_edit( $post->ID, 'post_tag' );

		if ( ! $esc_tags || is_wp_error( $esc_tags ) ) {
			$esc_tags = '';
		}

		?>
		<div class="tagsdiv" id="post_tag">
			<div class="jaxtag">
			<input type="hidden" name="tax_input[post_tag]" class="the-tags" value="<?php echo $esc_tags; // escaped in get_terms_to_edit() ?>">
		 	<?php

			if ( $user_can_assign_terms ) {
				?>
				<div class="ajaxtag hide-if-no-js">
					<label class="screen-reader-text" for="new-tag-post_tag"><?php _e('Tags'); ?></label>
					<div class="taghint"><?php echo $taxonomy->labels->add_new_item; ?></div>
					<p>
						<input type="text" id="new-tag-post_tag" name="newtag[post_tag]" class="newtag form-input-tip" size="16" autocomplete="off" value="" />
						<button type="button" class="button tagadd"><?php esc_attr_e('Add'); ?></button>
					</p>
				</div>
				<p class="howto"><?php echo $taxonomy->labels->separate_items_with_commas; ?></p>
				<?php
			}

			?>
			</div>
			<div class="tagchecklist"></div>
		</div>
		<?php

		if ( $user_can_assign_terms ) {
			?>
			<p><a href="#titlediv" class="tagcloud-link" id="link-post_tag"><?php echo $taxonomy->labels->choose_from_most_used; ?></a></p>
			<?php
		}
	}

	/**
	 * Serves the app's base HTML, which in turns calls the load.js
	 *
	 * @since 4.2
	 */
	public function serve_app_html() {
		global $wp_locale;

		// Get data, new (POST) and old (GET)
		$data                 = $this->merge_or_fetch_data();

		// Get site settings array/data
		$site_settings        = $this->site_settings();

		// Set the passed data
		$data['_version']     = $site_settings['version'];
		$data['_runtime_url'] = $site_settings['runtime_url'];
		$data['_ajax_url']    = $site_settings['ajax_url'];

		// Plugin only
		wp_register_script( 'press-this-app', plugin_dir_url( __FILE__ ) . 'js/app.js', array( 'jquery' ), false, true );
		wp_localize_script( 'press-this-app', 'pressThisL10n', $this->i18n() );

		wp_register_style( 'press-this-css', plugin_dir_url( __FILE__ ) . 'css/press-this.css' );

		// TEMP: for tags handling –– @TODO: evaluate
		wp_register_script( 'tag-box', plugin_dir_url( __FILE__ ) . 'js/tag-box.js', array( 'suggest' ), false, true );

		// Add press-this-editor.css and remove theme's editor-style.css, if any.
		remove_editor_styles();
		add_filter( 'mce_css', array( $this, 'editor_styles_override' ) );

		$hook_suffix = 'press-this.php';

		/**
		 * @TODO: this is a temp fix to an arcane issue while we're a plugin.
		 * See https://github.com/MichaelArestad/Press-This/issues/51
		 * Will become irrelevant when/if we merge into core.
		 */
		if ( function_exists( 'set_current_screen' ) ) {
			set_current_screen( $hook_suffix );
		}

		if ( ! empty( $GLOBALS['is_IE'] ) ) {
			@header( 'X-UA-Compatible: IE=edge' );
		}

		@header( 'Content-Type: ' . get_option( 'html_type' ) . '; charset=' . get_option( 'blog_charset' ) );

?>
<!DOCTYPE html>
<!--[if IE 7]>         <html class="lt-ie9 lt-ie8" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 8]>         <html class="lt-ie9" <?php language_attributes(); ?>> <![endif]-->
<!--[if gt IE 8]><!--> <html <?php language_attributes(); ?>> <!--<![endif]-->
<head>
	<meta http-equiv="Content-Type" content="<?php bloginfo( 'html_type' ); ?>; charset=<?php echo get_option( 'blog_charset' ); ?>" />
	<meta name="viewport" content="width=device-width">
	<title><?php echo esc_html( __( 'Press This!' ) ) ?></title>

	<script>
		window.wpPressThisData   = <?php echo json_encode( $data ) ?>;
		window.wpPressThisConfig = <?php echo json_encode( $site_settings ) ?>;
	</script>

	<script type="text/javascript">
		var ajaxurl = '<?php echo admin_url( 'admin-ajax.php', 'relative' ); ?>',
			pagenow = 'press-this',
			typenow = 'post',
			adminpage = 'press-this-php',
			thousandsSeparator = '<?php echo addslashes( $wp_locale->number_format['thousands_sep'] ); ?>',
			decimalPoint = '<?php echo addslashes( $wp_locale->number_format['decimal_point'] ); ?>',
			isRtl = <?php echo (int) is_rtl(); ?>;
	</script>

	<?php
		// $post->ID is needed for the embed shortcode so we can show oEmbed previews in the editor. Maybe find a way without it.
		$post = get_default_post_to_edit( 'post', true );
		$post_ID = (int) $post->ID;

		wp_enqueue_style( 'press-this-css' );
		wp_enqueue_script( 'press-this-app' );
		wp_enqueue_script( 'json2' );
		wp_enqueue_media( array( 'post' => $post->ID ) );
		wp_enqueue_script( 'editor' );

		// TEMP: for tags handling –– @TODO: evaluate
		wp_enqueue_script( 'tag-box' );

		$supports_formats = false;
		$post_format      = 0;
		if ( current_theme_supports( 'post-formats' ) && post_type_supports( $post->post_type, 'post-formats' ) ) {
			$supports_formats = true;
			if ( ! ( $post_format = get_post_format( $post->ID ) ) ) {
				$post_format = 0;
			}
		}

		/** This action is documented in wp-admin/admin-header.php */
		do_action( 'admin_enqueue_scripts', $hook_suffix );

		/** This action is documented in wp-admin/admin-header.php */
		do_action( 'admin_print_styles' );

		/** This action is documented in wp-admin/admin-header.php */
		do_action( 'admin_print_scripts' );

	?>
</head>
<body>
	<div id="adminbar" class="adminbar">
		<h1 id="current-site" class="current-site">
			<span class="dashicons dashicons-wordpress"></span>
			<span><?php bloginfo( 'name' ); ?></span>
		</h1>
		<button type="button" class="options-open button-subtle"><span class="dashicons dashicons-tag"></span><span class="screen-reader-text"><?php _e( 'Show post options' ); ?></span></button>
		<button type="button" class="options-close button-subtle is-hidden"><?php _e( 'Done' ); ?></button>
	</div>

	<div id="scanbar" class="scan">
		<form method="GET">
			<input type="url" name="u" id="url-scan" class="scan-url" value="" placeholder="<?php echo esc_attr( __( 'Enter a URL to scan' ) ) ?>" />
			<input type="submit" name="url-scan-submit" id="url-scan-submit" class="scan-submit" value="<?php echo esc_attr( __( 'Scan' ) ) ?>" />
		</form>
	</div>

	<form id="pressthis-form" name="pressthis-form" method="POST" autocomplete="off">
		<input type="hidden" name="post_ID" id="post_ID" value="<?php echo $post_ID; ?>" />
		<?php wp_nonce_field( 'press-this', 'pressthis-nonce', false ); ?>
		<?php wp_nonce_field( 'add-category', '_ajax_nonce-add-category', false ); ?>
		<input type="hidden" name="title" id="title-field" value="" />

	<div class="wrapper">
		<div class="editor-wrapper">
			<div class="alerts">
				<p class="alert is-notice is-hidden should-upgrade-bookmarklet">
					<?php printf( __( 'You should upgrade <a href="%s" target="_blank">your bookmarklet</a> to the latest version!' ), admin_url( 'tools.php?page=press_this_options' ) ); ?>
				</p>
			</div>

			<div id='app-container' class="editor">
				<span id="title-container-label" class="post-title-placeholder" aria-hidden="true"><?php _e( 'Post title' ); ?></span>
				<h2 id="title-container" class="post-title" contenteditable="true" spellcheck="true" aria-label="<?php _e( 'Post title' ); ?>" tabindex="0"></h2>
				<div id='featured-media-container' class="featured-container no-media">
					<div id='all-media-widget' class="all-media">
						<div id='all-media-container'></div>
					</div>
				</div>

				<?php

				wp_editor( '', 'pressthis', array(
					'drag_drop_upload' => true,
					'editor_height' => 600,
					'media_buttons' => false,
					'teeny' => true,
					'tinymce' => array(
						'resize' => false,
						'wordpress_adv_hidden' => false,
						'add_unload_trigger' => false,
						'statusbar' => false,
						'autoresize_min_height' => 600,
						'wp_autoresize_on' => true,
						'plugins' => 'lists,media,paste,tabfocus,fullscreen,wordpress,wpautoresize,wpeditimage,wpgallery,wplink,wpview',
						'toolbar1' => 'bold,italic,bullist,numlist,blockquote,link,unlink',
						'toolbar2' => 'undo,redo',
					),
					'quicktags' => false,
				) );

				?>
			</div>
		</div>

		<div class="options-panel is-off-screen is-hidden">
			<div class="post-options">
				<?php if ( $supports_formats ) : ?>
					<button type="button" class="button-reset post-option">
						<span class="dashicons dashicons-admin-post"></span>
						<span class="post-option-title"><?php _e( 'Format' ); ?></span>
						<span class="post-option-contents" id="post-option-post-format"><?php echo esc_html( get_post_format_string( $post_format ) ); ?></span>
						<span class="dashicons dashicons-arrow-right-alt2"></span>
					</button>
				<?php endif; ?>
				<button type="button" class="button-reset post-option">
					<span class="dashicons dashicons-category"></span>
					<span class="post-option-title"><?php _e( 'Categories' ); ?></span>
					<span class="post-option-contents" id="post-option-category"></span>
					<span class="dashicons dashicons-arrow-right-alt2"></span>
				</button>
				<button type="button" class="button-reset post-option">
					<span class="dashicons dashicons-tag"></span>
					<span class="post-option-title"><?php _e( 'Tags' ); ?></span>
					<span class="post-option-contents" id="post-option-tags"></span>
					<span class="dashicons dashicons-arrow-right-alt2"></span>
				</button>
			</div>

			<?php if ( $supports_formats ) : ?>
				<div class="setting-modal is-off-screen is-hidden">
					<button type="button" class="button-reset modal-close"><span class="dashicons dashicons-arrow-left-alt2"></span><span class="setting-title"><?php _e( 'Post format' ); ?></span></button>
					<?php $this->post_formats_html( $post ); ?>
				</div>
			<?php endif; ?>

			<div class="setting-modal is-off-screen is-hidden">
				<button type="button" class="button-reset modal-close"><span class="dashicons dashicons-arrow-left-alt2"></span><span class="setting-title"><?php _e( 'Categories' ); ?></span></button>
				<?php $this->categories_html( $post ); ?>
			</div>

			<div class="setting-modal tags is-off-screen is-hidden">
				<button type="button" class="button-reset modal-close"><span class="dashicons dashicons-arrow-left-alt2"></span><span class="setting-title"><?php _e( 'Tags' ); ?></span></button>
				<?php $this->tags_html( $post ); ?>
			</div>
		</div><!-- .options-panel -->
	</div><!-- .wrapper -->

	<div class="press-this-actions">
		<div class="pressthis-media-buttons">
			<button type="button" class="insert-media button-subtle" data-editor="pressthis">
				<span class="dashicons dashicons-admin-media"></span>
				<span class="screen-reader-text"><?php _e( 'Add Media' ); ?></span>
			</button>
		</div>
		<div class="post-actions">
			<button type="button" class="button-subtle" id="draft-field"><?php _e( 'Save Draft' ); ?></button>
			<button type="button" class="button-primary" id="publish-field"><?php _e( 'Publish' ); ?></button>
		</div>
	</div>
	</form>

	<?php

		// TODO: consider running "special" press-this hooks here?
		// Maybe better so we don't output stuff accidentaly added by plugins. Would probably prevent some errors.
		do_action( 'admin_footer', '' );
		do_action( 'admin_print_footer_scripts' );

	?>
</body>
</html>
<?php
		die();
	}

	/**
	 * Ajax endpoint add new category
	 *
	 * @since 4.2
	 */
	public function press_this_add_category() {
		if ( false === wp_verify_nonce( $_POST['new_cat_nonce'], 'add-category' ) ) {
			wp_send_json_error();
		}

		$taxonomy = get_taxonomy( 'category' );

		if ( ! current_user_can( $taxonomy->cap->edit_terms ) || empty( $_POST['name'] ) ) {
			wp_send_json_error();
		}

		$parent = isset( $_POST['parent'] ) && (int) $_POST['parent'] > 0 ? (int) $_POST['parent'] : 0;
		$names = explode( ',', $_POST['name'] );
		$added = $data = array();

		foreach ( $names as $cat_name ) {
			$cat_name = trim( $cat_name );
			$cat_nicename = sanitize_title( $cat_name );

			if ( empty( $cat_nicename ) ) {
				continue;
			}

			if ( ! $cat_id = term_exists( $cat_name, $taxonomy->name, $parent ) ) {
				$cat_id = wp_insert_term( $cat_name, $taxonomy->name, array( 'parent' => $parent ) );
			}

			if ( is_wp_error( $cat_id ) ) {
				continue;
			} elseif ( is_array( $cat_id ) ) {
				$cat_id = $cat_id['term_id'];
			}

			$added[] = $cat_id;
		}

		if ( empty( $added ) ) {
			wp_send_json_error( array( 'errorMessage' => __( 'This category cannot be added. Please change the name and try again.' ) ) );
		}

		foreach ( $added as $new_cat_id ) {
			$new_cat = get_category( $new_cat_id );

			if ( is_wp_error( $new_cat ) ) {
				wp_send_json_error( array( 'errorMessage' => __( 'Error while adding the category. Please try again later.' ) ) );
			}

			$data[] = array(
				'term_id' => $new_cat->term_id,
				'name' => $new_cat->name,
				'parent' => $new_cat->parent,
			);
		}

		wp_send_json_success( $data );
	}

	/**
	 * Registers a new setting screen and menu item for PT in the Admin sidebar
	 *
	 * @since 4.2
	 *
	 * @see add_action( 'admin_menu', array( $this, 'register_options_page' ) );
	 */
	public function register_options_page() {
		// To live under "Settings": https://cloudup.com/i5HzM3AQQl1
		// add_options_page('Press This', 'Press This', 'edit_posts', 'press_this_options', array( $this, 'do_options_page' ));
		// To live under Tools: https://cloudup.com/i7E6ZeJJ6PL
		add_submenu_page( 'tools.php', 'Press This', 'Press This', 'edit_posts', 'press_this_options', array( $this, 'do_options_page' ) );
	}

	/**
	 * Prints a custom options page for PT
	 *
	 * @since 4.2
	 *
	 * @see $this->register_options_page()
	 */
	public function do_options_page() {

	/**
	 * Adding the following <style> block here. I need to review how to properly add CSS to this page
	 */
		?>
		<style type="text/css">
			.postbox-pt {
				margin: 20px 0 0 0;
				padding: 0.7em 2em 1em;
				max-width: 420px;
			}

			.postbox-pt textarea {
				width: 100%;
				font-size: 1em;
			}

			.postbox-pt h4 {
				margin: 2em 0 1em;
			}

			.pressthis {
				vertical-align: top;
				position: relative;
				z-index: 1;
			}

			p.pressthis .button {
				margin-left: 10px;
				padding: 0;
				height: auto;
				vertical-align: top;
			}
			.pressthis button .dashicons {
				margin: 5px 8px 6px 7px;
				color: #777;
			}

		</style>
		<div class="wrap">
			<h2><?php echo get_admin_page_title() ?></h2>
			<div class="postbox postbox-pt">
				<h3><?php _e( 'What it is?' ); ?></h3>
				<p><?php _e( 'Press This is a little app that lets you grab bits of the web and create new posts with ease.' );?></p>
				<p><?php _e( 'Use Press This to clip text, images and videos from any web page. Then edit and add more straight from Press This before you save or publish it in a post on your site.' ); ?></p>
			</div>
			<form>
			<div class="postbox postbox-pt">
				<h3><?php _e( 'Install Press This' ); ?></h3>
				<h4><?php _e( 'Bookmarklet' ); ?></h4>
				<p><?php _e( 'Drag the bookmarklet below to your bookmarks bar. Then, when you\'re on a page you want to share, simply "press" it.' ); ?></p>

				<p class="pressthis">
					<a class="" onclick="return false;" href="<?php echo htmlspecialchars( get_shortcut_link() ); ?>"><span><?php _e( 'Press This' ) ?></span></a>
					<button type="button" class="button button-secondary js-show-pressthis-code-wrap" aria-expanded="false" aria-controls="pressthis-code-wrap"><span class="dashicons dashicons-clipboard"></span><span class="screen-reader-text"><?php _e( 'Copy Press This Bookmarklet' ) ?></span></button>
				</p>

				<div class="hidden js-pressthis-code-wrap">
					<p id="pressthis-code-desc"><?php _e( 'If you can\'t drag it to your bookmarks, copy the following code and create new bookmark. Paste the code into the new bookmark\'s URL field.' ) ?></p>
					<p><textarea class="js-pressthis-code" rows="5" cols="120" readonly="readonly" aria-labelledby="pressthis-code-desc"><?php echo htmlspecialchars( get_shortcut_link() ); ?></textarea></p>
				</div>


				<h4><?php _e( 'Direct link (best for mobile)' ); ?></h4>
				<p><?php _e( 'Follow the link to open Press This. Then add it to your device\'s bookmarks or home screen.' ); ?></p>

				<p>
					<a class="button button-secondary" href="<?php echo htmlspecialchars( admin_url( 'press-this.php' ) ); ?>"><?php _e( 'Open Press This' ) ?></a>
				</p>

			</div>
			</form>
		</div>
		<script>
			jQuery( document ).ready( function( $ ) {

				var $showPressThisWrap = $( '.js-show-pressthis-code-wrap' );
				var $pressthisCode = $( '.js-pressthis-code' );

				$showPressThisWrap.on( 'click', function( event ) {

					$(this).parent().next( '.js-pressthis-code-wrap' ).slideToggle(200);

					$( this ).attr( 'aria-expanded', $( this ).attr( 'aria-expanded' ) === 'false' ? 'true' : 'false' );

				});

				// Select Press This code when focusing (tabbing) or clicking the textarea.
				$pressthisCode.on( 'click focus', function() {

					var self = this;

					setTimeout( function() { self.select(); }, 50 );

				});

			});
		</script>
	<?php
	}

	/**
	 * Basic admin notice to prompt users to go to the related admin screen upon install
	 *
	 * @since 4.2
	 */
	public function admin_notices() {
		if ( 'plugins' === get_current_screen()->id ) {
			printf( '<div class="error"><p>%s</p></div>', sprintf( __( '<strong>Press This setup:</strong> Please visit our <a href="%s">admin screen</a> and select your preferred install method.' ), admin_url( 'tools.php?page=press_this_options' ) ) );
		}
	}
}

new WP_Press_This;
