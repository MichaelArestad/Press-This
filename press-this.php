<?php
/*
Plugin Name: Press This
Plugin URI: https://wordpress.org/plugins/press-this/
Description: Posting images, links, and cat gifs will never be the same.
Version: 0.0.6.1
Author: Press This Team
Author URI: https://corepressthis.wordpress.com/
Text Domain: press-this
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Class WpPressThis
 */
class WpPressThis {
	/**
	 * WpPressThis::__construct()
	 * Constructor
	 *
	 * @uses remove_action(), add_action()
	 */
	public function __construct() {
		$script_name = self::script_name();

		if ( empty( $script_name ) )
			return;

		if ( is_admin() ) {
			if ( false !== strpos( self::runtime_url(), $script_name ) ) {
				/*
				 * Take over /wp-admin/press-this.php
				 */
				add_action( 'admin_init', array( $this, 'press_this_php_override' ), 0 );
			} else if ( false !== strpos( admin_url( 'admin-ajax.php' ), $script_name ) ) {
				/*
				 * AJAX emdpoints
				 */
				// Post draft and publish
				add_action( 'wp_ajax_press_this_publish_post', array( $this, 'ajax_publish_post' ) );
				add_action( 'wp_ajax_press_this_draft_post',   array( $this, 'ajax_draft_post' ) );
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
	 * WpPressThis::script_name()
	 * Returns the current app's fully qualified script name/url based on system-level tests
	 *
	 * @return mixed|string
	 * @uses $_SERVER['SCRIPT_NAME'], $_SERVER['PHP_SELF'], $_SERVER['REQUEST_URI']
	 */
	public function script_name() {
		$script_name = ( ! empty( $_SERVER['SCRIPT_NAME'] ) )
			? $_SERVER['SCRIPT_NAME']
			: ( ! empty( $_SERVER['PHP_SELF'] ) )
				? $_SERVER['PHP_SELF']
				: ( ! empty( $_SERVER['REQUEST_URI'] ) )
					? preg_replace( '/^([^\?]+)(\?.*)?$/', '\1', $_SERVER['REQUEST_URI'] )
					: '';
		return ( preg_match('/\/wp-admin\/?$/', $script_name) || ! preg_match('/\.php$/', $script_name ) )
			? untrailingslashit( $script_name ) . '/index.php'
			: $script_name;
	}

	/**
	 * WpPressThis::set_url_scheme( $url )
	 * Sets the URL to https or http, depending on availability and related WP config settings/APIs.
	 *
	 * @param $url string
	 *
	 * @return string
	 * @uses WP's force_ssl_admin(), force_ssl_login(), force_ssl_content(), is_ssl(), and set_url_scheme()
	 */
	public function set_url_scheme( $url ) {
		$current_user = get_current_user();
		if ( ( function_exists( 'force_ssl_admin' ) && force_ssl_admin() )
			|| ( function_exists( 'force_ssl_login' ) && force_ssl_login() )
			|| ( function_exists( 'force_ssl_content' ) && force_ssl_content() )
			|| ( function_exists( 'is_ssl' ) && is_ssl() )
			|| ! empty( $current_user->use_ssl ) ) {

			return set_url_scheme(  $url, 'https' );
		}

		return set_url_scheme( $url, 'http' );
	}

	/**
	 * WpPressThis::strip_url_scheme()
	 * Removes http or https from a URL to have it default to the current protocaol on the client-side (EG: //youtube.com/)
	 *
	 * @param $url
	 * @return mixed
	 */
	public function strip_url_scheme( $url ) {
		return preg_replace( '/^https?:(\/\/.+)$/', '\1', $url );
	}

	/**
	 * WpPressThis::plugin_data()
	 * Returns this plugin's meta data, from in-code plugin header comment
	 *
	 * @return array
	 * @uses WP's get_plugin_data()
	 */
	public function plugin_data() {
		return get_plugin_data( __FILE__, false, false );
	}

	/**
	 * WpPressThis::plugin_data()
	 * Returns this plugin's own version string, from in-code plugin header comment
	 *
	 * @return string The current plugin's version
	 * @uses WpPressThis::plugin_data()
	 */
	public function plugin_version() {
		$data = self::plugin_data();
		return ( ! empty( $data ) && ! empty( $data['Version'] ) ) ? (string) $data['Version'] : 0;
	}

	/**
	 * WpPressThis::runtime_url()
	 * Returns this plugin's own runtime URL, which happens to masquerade/override as /wp-admin/press-this.php
	 *
	 * @return string Full URL to /admin/press-this.php in current install
	 * @uses admin_url()
	 */
	public function runtime_url() {
		return self::set_url_scheme( admin_url( 'press-this.php' ) );
	}

	/**
	 * WpPressThis::plugin_dir_path()
	 *
	 * @return string Full system path to /wp-content/plugins/press-this in current install
	 * @uses __FILE__, plugin_dir_path()
	 */
	public function plugin_dir_path() {
		return untrailingslashit( plugin_dir_path( __FILE__ ) );
	}

	/**
	 * WpPressThis::i18n()
	 * Centralized/keyed app caption store, used on both server and client sides.
	 *
	 * @return array
	 */
	public function i18n() {
		return array(
			'source'                     => apply_filters( 'press_this_source_string', __( 'Source:', 'press-this' ) ),
			'source-link'                => apply_filters( 'press_this_source_link', __( '<a href="%1$s">%2$s</a>' ) ),
			'new-post'                   => __( 'Title', 'press-this' ),
			'start-typing-here'          => __( 'Start typing here.', 'press-this' ),
			'unexpected-error'           => __( 'Sorry, but an unexpected error occurred.', 'press-this' ),
			'should-upgrade-bookmarklet' => __( 'You should upgrade <a href="%s" target="_blank">your bookmarklet</a> to the latest version!', 'press-this' ),
			'saveAlert'                  => __( 'The changes you made will be lost if you navigate away from this page.' ),
		);
	}

	/**
	 * WpPressThis::press_this_ajax_site_settings()
	 * App and site settings data, including i18n strings for the client-side
	 *
	 * @uses admin_url()
	 */
	public function site_settings() {
		$supported_formats = get_theme_support( 'post-formats' );
		$post_formats      = array();

		if ( !empty( $supported_formats[0] ) && is_array( $supported_formats[0] ) ) {
			$post_formats[ 0 ] = __( 'Standard' );
			foreach ( $supported_formats[0] as $post_format ) {
				$post_formats[ $post_format ] = esc_html( get_post_format_string( $post_format ) );
			}
		}

		return array(
			'version'        => self::plugin_version(),
			'runtime_url'    => self::strip_url_scheme( self::runtime_url() ),
			'ajax_url'       => self::strip_url_scheme( admin_url( 'admin-ajax.php' ) ),
			'post_formats'   => $post_formats,
			'i18n'           => self::i18n(),
		);
	}

	/**
	 * WpPressThis::shortcut_link_override() (plugin only)
	 * Returns the bookmarklet's static code from /js/bookmarklet.js, with a local JS variable set to the current install's path to PT
	 *
	 * @return string Press This bookmarklet JS trigger found in /wp-admin/tools.php
	 */
	public function shortcut_link_override() {
		$url  = esc_js( self::runtime_url() . '?v=' . self::plugin_version() );
		$link = "javascript:";
		$link .= file_get_contents( self::plugin_dir_path() . '/js/bookmarklet.js' );
		$link .= "WpPressThis_Bookmarklet('{$url}')";
		return str_replace( array( "\r", "\n", "\t" ), '', $link );
	}

	/**
	 * WpPressThis::press_this_php_override() (plugin only)
	 * Takes over /wp-admin/press-this.php for backward compatibility and while in feature-as-plugin mode
	 *
	 * @uses $_POST
	 */
	public function press_this_php_override() {
		// Simply drop the following test once/if this becomes the standard Press This code in core
		if ( false === strpos( self::runtime_url(), self::script_name() ) )
			return;

		if ( ! current_user_can( 'edit_posts' ) || ! current_user_can( get_post_type_object( 'post' )->cap->create_posts ) ) {
			wp_die( __( 'Cheatin&#8217; uh?' ) );
		}

		self::serve_app_html();
	}

	/**
	 * WpPressThis::format_post_data_for_save( $status = 'draft' )
	 *
	 * @return array('post_title' => $title, 'post_content' => $content, 'post_status' => $post_status)
	 * @uses $_POST
	 */
	public function format_post_data_for_save( $post_id, $status = 'draft' ) {
		// TODO: consider merging with save()

		$post = array(
			'ID' => $post_id,
			'post_title' => '',
			'post_content' => '',
			'post_type' => 'post',
			'post_status' => 'draft',
			'post_format' => 0,
			'tax_input' => array(),
			'post_category' => array(),
		);

		if ( ! empty( $_POST['wppt_title'] ) ) {
			$post['post_title'] = sanitize_text_field( trim( $_POST['wppt_title'] ) );
		}

		if ( ! empty( $_POST['pressthis'] ) ) {
			$post['post_content'] = trim( $_POST['pressthis'] ); // The editor textarea, we have to allow this one and let wp_insert_post() filter the content below
		}

		if ( 'publish' === $status ) {
			if ( current_user_can( 'publish_posts' ) ) {
				$post['post_status'] = 'publish';
			} else {
				$post['post_status'] = 'pending';
			}
		}

		if ( isset( $_POST['post_format'] ) ) {
			if ( current_theme_supports( 'post-formats', $_POST['post_format'] ) ) {
				$post['post_format'] = $_POST['post_format'];
			}
		}

		if ( !empty( $_POST['tax_input'] ) ) {
			foreach ( (array) $_POST['tax_input'] as $tax_name => $terms ) {
				if ( empty( $terms ) )
					continue;
				$comma = _x( ',', 'tag delimiter' );
				if ( ',' !== $comma ) {
					$terms = str_replace( $comma, ',', $terms );
				}
				$post['tax_input'][ $tax_name ] = explode( ',', trim( $terms, " \n\t\r\0\x0B," ) );
			}
		}

		if ( !empty( $_POST['post_category'] ) ) {
			foreach ( (array) $_POST['post_category'] as $cat_id ) {
				$post['post_category'][] = (int) $cat_id;
			}
		}

		return $post;
	}

	/**
	 * WpPressThis::side_load_images( $post_id, $content = '' )
	 * Get the sources images and save them locally, fr posterity, unless we can't.
	 *
	 * @param $post_id int
	 * @param $content string Current expected markup for PT
	 * @return string New markup with old image URLs replaced with the local attachment ones if swapped
	 * @uses current_user_can(), media_sideload_image(), is_wp_error()
	 */
	public function side_load_images( $post_id, $content = '' ) {
		$new_content = $content;

		preg_match_all( '/<img [^>]+>/', $content, $matches );

		if ( ! empty( $matches ) && current_user_can( 'upload_files' ) ) {
			foreach( (array) $matches[0] as $key => $image ) {
				preg_match( '/src=["\']{1}([^"\']+)["\']{1}/', stripslashes( $image ), $url_matches );

				if ( empty( $url_matches[1] ) ) {
					continue;
				}

				$image_url = $url_matches[1];

				//Don't sideload images already hosted on our WP instance
				if ( false !== strpos( $image_url, preg_replace( '/^(http:.+)\/wp-admin\/.+/', '\1/wp-content/', self::script_name() ) ) ) {
					continue;
				}

				// Don't try to sideload file without a file extension, leads to WP upload error,
				// then a "PHP Notice:  Undefined offset: 0 in /wp-admin/includes/media.php on line 811"
				// Matching regex to skip from media_sideload_image() in otherwise erroring /wp-admin/includes/media.php
				if ( ! preg_match( '/[^\?]+\.(jpe?g|jpe|gif|png)\b/i', $image_url ) )
					 continue;

				// See if files exist in content - we don't want to upload non-used selected files.
				if ( false !== strpos( $new_content, htmlspecialchars( $image_url ) ) ) {
					$upload = media_sideload_image( $image_url, $post_id );

					// Replace the POSTED content <img> with correct uploaded ones. Regex contains fix for Magic Quotes
					if ( ! is_wp_error( $upload ) )
						$new_content = preg_replace( '/<img ([^>]*)src=\\\?(\"|\')'.preg_quote( htmlspecialchars( $image_url ), '/' ).'\\\?(\2)([^>\/]*)\/*>/is', $upload, $new_content );
				}
			}
		}

		// Error handling for media_sideload, send original content back
		if ( is_wp_error( $new_content ) )
			return $content;

		return $new_content;
	}

	/**
	 * WpPressThis::save( $post_status = 'draft' )
	 * Save the post as draft or published
	 *
	 * @param string $post_status
	 * @return bool|int|WP_Error
	 */
	public function save( $post_status = 'draft' ) {
		if ( ! wp_verify_nonce( $_POST['wppt_nonce'], 'press_this' ) ) {
			return false;
		}

		if ( ! $post_id = (int) $_POST['post_ID'] ) {
			return false;
		}

		$post = self::format_post_data_for_save( $post_id, $post_status );

		$new_content = self::side_load_images( $post_id, $post['post_content'] );

		if ( ! is_wp_error( $new_content ) ) {
			$post['post_content'] = $new_content;
		}

		$updated = wp_update_post( $post, true );

		if ( !is_wp_error( $updated ) && isset( $post['post_format'] ) ) {
			if ( current_theme_supports( 'post-formats', $post['post_format'] ) ) {
				set_post_format( $post_id, $post['post_format'] );
			} elseif ( $post['post_format'] ) {
				set_post_format( $post_id, false );
			}
		}

		return $updated;
	}

	/**
	 * WpPressThis::fetch_source_html( $url )
	 *
	 * @return string Source's HTML sanitized markup
	 * @uses download_url(), is_wp_error(), wp_kses(), file_get_contents() , and unlink()
	 */
	public function fetch_source_html( $url ) {
		// Download source page to tmp file
		$source_tmp_file = ( ! empty( $url ) ) ? download_url( $url ) : '';
		$source_content  = '';
		if ( ! is_wp_error( $source_tmp_file ) && file_exists( $source_tmp_file ) ) {
			// Get the content of the source page from the tmp file.
			$source_content = wp_kses(
				file_get_contents( $source_tmp_file ),
				array (
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
			$source_content = new WP_Error( 'upload-error',  sprintf( __( 'Error: %s', 'press-this' ), sprintf( __( 'Could not download the source URL (native error: %s).', 'press-this' ), $source_tmp_file->get_error_message() ) ) );
		} else if ( ! file_exists( $source_tmp_file ) ) {
			$source_content = new WP_Error( 'no-local-file',  sprintf( __( 'Error: %s', 'press-this' ), __( 'Could not save or locate the temporary download file for the source URL.', 'press-this' ) ) );
		}

		return $source_content;
	}

	/**
	 * WpPressThis::source_data_fetch_fallback()
	 * Fetch and parse _meta, _img, and _links data from the source
	 *
	 * @param string $url
	 * @param array $data Existing data array if you have one.
	 *
	 * @return array New data array
	 * @uses self::fetch_source_html()
	 */
	public function source_data_fetch_fallback( $url, $data = array() ) {
		if ( empty( $url ) ) {
			return array();
		}

		// Download source page to tmp file
		$source_content = self::fetch_source_html( $url );
		if ( is_wp_error( $source_content ) ) {
			return array( 'errors' => $source_content->get_error_messages() );
		}

		// Fetch and gather <img> data
		if ( empty( $data['_img'] ) ) {
			$data['_img'] = array();
		}

		if ( preg_match_all( '/<img (.+)[\s]?\/>/', $source_content, $matches ) ) {
			if ( !empty( $matches[0] ) ) {
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
			if ( !empty( $matches[0] ) ) {
				foreach ( $matches[0] as $value ) {
					if ( preg_match( '/<iframe[^>]+src=(\'|")([^"]+)(\'|")/', $value, $new_matches ) ) {
						if ( ! in_array( $new_matches[2], $data['_embed'] ) ) {
							if ( preg_match( '/\/\/www\.youtube\.com\/embed\/([^\?]+)\?.+$/', $new_matches[2], $src_matches ) ) {
								$data['_embed'][] = 'https://www.youtube.com/watch?v=' . $src_matches[1];
							} else if ( preg_match( '/\/\/player\.vimeo\.com\/video\/([\d]+)([\?\/]{1}.*)?$/', $new_matches[2], $src_matches ) ) {
								$data['_embed'][] = 'https://vimeo.com/' . (int) $src_matches[1];
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
			if ( !empty( $matches[0] ) ) {
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
									     || preg_match( '/\/\/twitter\.com\/[^\/]+\/status\/[\d]+$/', $new_matches[3] ) ) {
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
			if ( !empty( $matches[0] ) ) {
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
	 * WpPressThis::merge_or_fetch_data()
	 * This code handles making our version of Press This backward compatible with the previous/legacy version by supporting its query string params
	 *
	 * @return array
	 */
	public function merge_or_fetch_data() {
		// Merge $_POST and $_GET, as appropriate ($_POST > $_GET), to remain backward compatible
		$data = array_merge_recursive( $_POST, $_GET );

		// Get the legacy QS params, or equiv POST data
		$data['u'] = ( !empty( $data['u'] ) && preg_match( '/^https?:/', $data['u'] ) ) ? $data['u'] : '';
		$data['s'] = ( !empty( $data['s'] ) ) ? $data['s'] : '';
		$data['t'] = ( !empty( $data['t'] ) ) ? $data['t'] : '';

		if ( apply_filters( 'press_this_media_discovery', __return_true() ) ) {
			// If no _meta (a new thing) was passed via $_POST, fetch data from source as fallback, makes PT fully backward compatible
			if ( empty( $data['_meta'] ) && ! empty( $data['u'] ) ) {
				$data = self::source_data_fetch_fallback( $data['u'], $data );
			}
		} else {
			if ( !empty( $data['_img'] ) ) {
				$data['_img'] = array();
			}
			if ( !empty( $data['_embed'] ) ) {
				$data['_embed'] = array();
			}
			if ( !empty( $data['_meta'] ) ) {
				$data['_meta'] = array();
			}
		}

		return apply_filters( 'press_this_data', $data );
	}

	/**
	 * Add another stylesheet inside TinyMCE.
	 */
	public function editor_styles_override( $styles ) {
		if ( ! empty( $styles ) ) {
			$styles .= ',';
		}

		return $styles . plugin_dir_url( __FILE__ ) . 'css/press-this-editor.css?ver=' . self::plugin_version();
	}

	/**
	 * WpPressThis::serve_app_html()
	 * Serves the app's base HTML, which in turns calls the load.js
	 *
	 * @uses $_POST, WpPressThis::runtime_url(), WpPressThis::plugin_dir_url()
	 */
	public function serve_app_html() {
		global $wp_locale;

		// Get i18n strings
		$i18n                 = self::i18n();

		// Get data, new (POST) and old (GET)
		$data                 = self::merge_or_fetch_data();

		// Get site settings array/data
		$site_settings        = self::site_settings();

		// Set the passed data
		$data['_version']     = $site_settings['version'];
		$data['_runtime_url'] = $site_settings['runtime_url'];
		$data['_ajax_url']    = $site_settings['ajax_url'];

		// Plugin only
		wp_register_script( 'press-this-app', plugin_dir_url( __FILE__ ) . 'js/app.js', array( 'jquery' ), false, true );
		wp_localize_script( 'press-this-app', 'pressThisL10n', self::i18n() );

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

		@header('Content-Type: ' . get_option('html_type') . '; charset=' . get_option('blog_charset'));

		if ( ! function_exists( 'post_tags_meta_box' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/meta-boxes.php' );
		}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta http-equiv="Content-Type" content="<?php bloginfo('html_type'); ?>; charset=<?php echo get_option('blog_charset'); ?>" />
	<meta name="viewport" content="width=device-width">
	<title><?php echo esc_html( __( 'Press This!' ) ) ?></title>

	<script>
		window.wp_pressthis_data   = <?php echo json_encode( $data ) ?>;
		window.wp_pressthis_config = <?php echo json_encode( $site_settings ) ?>;
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
	<div id="wppt_adminbar" class="adminbar">
		<h1 id="wppt_current_site" class="current-site">
			<span class="dashicons dashicons-wordpress"></span>
			<span><?php bloginfo( 'name' ); ?></span>
		</h1>
		<button class="options-open button--subtle"><span class="dashicons dashicons-tag"></span><span class="screen-reader-text"><?php _e( 'Show post options' ); ?></span></button>
		<button class="options-close button--subtle is-hidden"><?php _e( 'Done' ); ?></button>
	</div>

	<div id="wppt_scanbar" class="scan">
		<form method="GET">
			<input type="url" name="u" id="wppt_url_scan" class="scan__url" value="" placeholder="<?php echo esc_attr( __( 'Enter a URL to scan', 'press-this' ) ) ?>" />
			<input type="submit" name="wppt_url_scan_submit" id="wppt_url_scan_submit" class="scan__submit" value="<?php echo esc_attr( __( 'Scan', 'press-this' ) ) ?>" />
		</form>
	</div>

	<form id="wppt_form" name="wppt_form" method="POST" autocomplete="off">
		<input type="hidden" name="post_ID" id="post_ID" value="<?php echo $post_ID; ?>" />
		<?php wp_nonce_field( 'press_this', 'wppt_nonce', false ); ?>
		<?php wp_nonce_field( 'add-category', '_ajax_nonce-add-category', false ); ?>
		<input type="hidden" name="wppt_title" id="wppt_title_field" value="" />

	<div class="wrapper">
		<div class="editor-wrapper">
			<div id='wppt_app_container' class="editor">
				<span id="wppt_title_container_label" class="post__title-placeholder"><?php _e( 'Post title' ); ?></span>
				<h2 id="wppt_title_container" class="post__title" contenteditable="true" spellcheck="true" aria-labelledby="wppt_title_container_label" tabindex="0"></h2>
				<div id='wppt_featured_media_container' class="featured-container no-media">
					<div id='wppt_all_media_widget' class="all-media">
						<div id='wppt_all_media_container'></div>
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

		<div class="options-panel">
			<div class="post-options">
				<?php if ( $supports_formats ) : ?>
					<a href="#" class="post-option">
						<span class="dashicons dashicons-admin-post"></span>
						<span class="post-option__title"><?php _e('Format'); ?></span>
						<span class="post-option__contents" id="post-option-post-format"><?php echo esc_html( get_post_format_string( $post_format ) ); ?></span>
						<span class="dashicons dashicons-arrow-right-alt2"></span>
					</a>
				<?php endif; ?>
				<a href="#" class="post-option">
					<span class="dashicons dashicons-category"></span>
					<span class="post-option__title"><?php _e('Categories'); ?></span>
					<span class="post-option__contents" id="post-option-category"></span>
					<span class="dashicons dashicons-arrow-right-alt2"></span>
				</a>
				<a href="#" class="post-option">
					<span class="dashicons dashicons-tag"></span>
					<span class="post-option__title"><?php _e('Tags'); ?></span>
					<span class="post-option__contents" id="post-option-tags"></span>
					<span class="dashicons dashicons-arrow-right-alt2"></span>
				</a>
			</div>

			<?php if ( $supports_formats ) : ?>
				<div class="setting-modal">
					<a href="#" class="modal-close" tabindex="-1"><span class="dashicons dashicons-arrow-left-alt2"></span><span class="setting-title"><?php _e('Post format'); ?></span></a>
					<?php post_format_meta_box( $post, null ); ?>
				</div>
			<?php endif; ?>

			<div class="setting-modal">
				<a href="#" class="modal-close" tabindex="-1"><span class="dashicons dashicons-arrow-left-alt2"></span><span class="setting-title"><?php _e('Categories'); ?></span></a>
				<?php

				$taxonomy = get_taxonomy( 'category' );

				if ( current_user_can( $taxonomy->cap->edit_terms ) ) {

				?>
				<button type="button" class="add-cat-toggle"><span class="dashicons dashicons-plus"></span></button>
				<div class="add-cat-wrap hidden">
					<label class="screen-reader-text" for="new-category"><?php echo $taxonomy->labels->add_new_item; ?></label>
					<input type="text" id="new-category" class="add-cat-field" placeholder="<?php echo esc_attr( $taxonomy->labels->new_item_name ); ?>" value="" aria-required="true">
					<button type="button" class="button add-cat-submit"><?php _e( 'Add' ); ?></button>
					<label class="screen-reader-text" for="new-category-parent"><?php echo $taxonomy->labels->parent_item_colon; ?></label>
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
				<?php } ?>
				<input type="search">
				<ul class="categories-select">
					<?php wp_terms_checklist( $post->ID, array( 'taxonomy' => 'category' ) ); ?>
				</ul>
			</div>

			<div class="setting-modal tags">
				<a href="#" class="modal-close" tabindex="-1"><span class="dashicons dashicons-arrow-left-alt2"></span><span class="setting-title"><?php _e('Tags'); ?></span></a>
				<?php post_tags_meta_box( $post, null ); ?>
			</div>
		</div><!-- .options-panel -->
	</div><!-- .wrapper -->

	<div class="press-this__actions">
		<div class="pressthis-media-buttons">
			<button type="button" class="insert-media button--subtle" data-editor="pressthis">
				<span class="dashicons dashicons-camera"></span>
				<span class="screen-reader-text"><?php _e( 'Add Media' ); ?></span>
			</button>
		</div>
		<div class="post-actions">
			<button type="button" class="button--subtle" id="wppt_draft_field"><?php _e( 'Save Draft' ); ?></button>
			<button type="button" class="button--primary" id="wppt_publish_field"><?php _e( 'Publish' ); ?></button>
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
	 * @param $post_id
	 * @param string $post_status
	 */
	public function post_save_json_response( $post_id ) {
		if ( is_wp_error( $post_id ) || intval( $post_id ) < 1 ) {
			wp_send_json_error( array( 'errorMessage' => __( 'Error while saving the post. Please try again later.' ) ) );
		} else {
			if ( get_post_status( $post_id ) === 'publish' ) {
				$redirect = get_post_permalink( $post_id );
			} else {
				$redirect = get_edit_post_link( $post_id, 'raw' );
			}

			wp_send_json_success( array( 'redirect' => $redirect ) );
		}
	}

	/**
	 * Ajax endpoint save a draft post
	 */
	public function ajax_draft_post() {
		// TODO: consider one function for both draft and publish. We pass post_status in the data.

		self::post_save_json_response( self::save( 'draft' ) );
	}

	/**
	 * Ajax endpoint publish a post
	 */
	public function ajax_publish_post() {
		// TODO: see above.

		self::post_save_json_response( self::save( 'publish' ) );
	}

	/**
	 * Ajax endpoint add new category
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
	 * @see add_action( 'admin_menu', array( $this, 'register_options_page' ) );
	 */
	public function register_options_page() {
		// To live under "Settings": https://cloudup.com/i5HzM3AQQl1
		// add_options_page('Press This', 'Press This', 'edit_posts', 'press_this_options', array( $this, 'do_options_page' ));
		// To live under Tools: https://cloudup.com/i7E6ZeJJ6PL
		add_submenu_page('tools.php', 'Press This', 'Press This', 'edit_posts', 'press_this_options', array( $this, 'do_options_page' ));
	}

	/**
	 * Prints a custom options page for PT
	 *
	 * @see self::register_options_page()
	 */
	public function do_options_page() {

	/**
	 * Adding the following <style> block here. I need to review how to properly add CSS to this page
	 */
		?>
		<style type="text/css">
			.postbox-pt {
				margin: 1em 0 0 0;
				padding: 0 1em 1em;
			}

				.postbox-pt textarea {
					width: 100%;
					font-size: 1em;
				}

				.postbox-pt h4 {
					margin: 2em 0 1em;
				}

				.postbox-pt-buttons {
					line-height: 2em;
				}

				.button-pt-bookmarklet:before {
					color: #FFF;
					font: 400 20px/1 dashicons;
					content: '\f157';
					position: relative;
					display: inline-block;
					top: 2px;
				}

				.wp-core-ui .postbox-pt .button:active {
					vertical-align: middle;
				}

		</style>
		<div class="wrap">
			<h2><?php echo get_admin_page_title() ?></h2>
			<div class="postbox postbox-pt">
				<h3><?php _e('What it is?'); ?></h3>
				<p><?php _e('Press This is a little app that lets you grab bits of the web and create new posts with ease.');?></p>
				<p><?php _e('Use Press This to clip text, images and videos from any web page. Then edit and add more straight from Press This before you save or publish it in a post on your site.'); ?></p>
			</div>
			<form>
			<div class="postbox postbox-pt">
				<h3><?php _e('How to install it?'); ?></h3>
				<h4><?php _e('Press This Bookmarklet'); ?></h4>
				<p><?php _e('The bookmarklet allows you to quickly get content from any site. To use it, drag-and-drop the following link to your bookmarks bar. Some mobile browsers make it impossible to add Javascript bookmarklets. For those, use the direct link version below.'); ?></p>

				<div class="postbox-pt-buttons">

					<a class="button button-primary button-pt-bookmarklet" onclick="return false;" href="<?php echo htmlspecialchars( get_shortcut_link() ); ?>"><?php _e('Press This') ?></a>
					<?php _e('or'); ?>
					<button type="button" class="button button-large js-show-pressthis-code-wrap" aria-expanded="false" aria-controls="pressthis-code-wrap"><?php _e('Copy Press This Bookmarklet') ?></button>

					<div class="hidden js-pressthis-code-wrap">
						<p id="pressthis-code-desc"><?php _e('If you can\'t add it to your bookmarks by dragging, copy the code below, open your Bookmarks manager, create new bookmark, type Press This into the name field and paste the code into the URL field.') ?></p>
						<p><textarea class="js-pressthis-code" rows="5" cols="120" readonly="readonly" aria-labelledby="pressthis-code-desc"><?php echo htmlspecialchars( get_shortcut_link() ); ?></textarea></p>
					</div>

				</div>

				<h4><?php _e('Press This Direct Link'); ?></h4>
				<p><?php _e('Follow the Press This Direct Link and add it to your bookmarks:'); ?></p>

				<div class="postbox-pt-buttons">

					<a class="button button-primary" href="<?php echo htmlspecialchars( admin_url( 'press-this.php' ) ); ?>"><?php _e('Press This') ?></a>
					<?php _e('or'); ?>
					<button type="button" class="button button-large js-show-pressthis-code-wrap" aria-expanded="false" aria-controls="pressthis-dl-code-wrap"><?php _e('Copy Press This Direct Link') ?></button>

					<div class="hidden js-pressthis-code-wrap">
						<p id="pressthis-dl-code-desc"><?php _e('Copy the link below, open your Bookmarks manager, create new bookmark, and paste the url into the URL field.') ?></p>
						<p><textarea class="js-pressthis-code" rows="1" cols="120" readonly="readonly" aria-labelledby="pressthis-dl-code-desc"><?php echo htmlspecialchars( admin_url( 'press-this.php' ) ); ?></textarea></p>
					</div>

				</div>

			</div>
			</form>
		</div>
		<script>
			jQuery( document ).ready( function( $ ) {

				var $showPressThisWrap = $( '.js-show-pressthis-code-wrap' );
				var $pressthisCode = $( '.js-pressthis-code' );

				$showPressThisWrap.on( 'click', function( event ) {

					$(this).next( '.js-pressthis-code-wrap' ).slideToggle(200);

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
	 */
	public function admin_notices() {
		if ( get_current_screen()->id == 'plugins' ) {
			printf( '<div class="error"><p>%s</p></div>', sprintf( __( '<strong>Press This setup:</strong> Please visit our <a href="%s">admin screen</a> and select your preferred install method.', 'press-this' ), admin_url( 'tools.php?page=press_this_options' ) ) );
		}
	}
}

new WpPressThis;
