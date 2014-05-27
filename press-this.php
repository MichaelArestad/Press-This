<?php
/*
Plugin Name: Press This
Plugin URI: http://wordpress.org/extend/plugins/press-this/
Description: Posting images, links, and cat gifs will never be the same.
Version: 0.1
Author: Press This Team
Author URI: https://corepressthis.wordpress.com/
Text Domain: press-this
Domain Path: /languages
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Class WpPressThis
 */
class WpPressThis {
	/**
	 * Constructor
	 */
	public function __construct() {

		// TEMP: Removing SAMEORIGIN so we can display in iframe, see TODO below.
		// @TODO: must come up with final solution for SAMEORIGIN handling when in modal context (detect, secure, serve).

		if ( ! is_admin() ) {
			remove_action( 'login_init', 'send_frame_options_header' );
			// add_action( 'wp_ajax_nopriv_press_this_site_settings', array( $this, 'press_this_ajax_site_settings' ) );
		} else {
			remove_action( 'admin_init', 'send_frame_options_header' );

			// Take over /wp-admin/press-this.php
			add_action( 'admin_init', array( $this, 'press_this_php_override' ), 0 );

			// Take over Press This bookmarklet code in /wp-admin/tools.php
			add_filter( 'shortcut_link', array( $this, 'shortcut_link_override' ) );

			// AJAX handling
			add_action( 'wp_ajax_press_this_site_settings', array( $this, 'press_this_ajax_site_settings' ) );
		}
	}

	/**
	 * @return string|void Full URL to /admin/press-this.php in current install
	 */
	public function runtime_url() {
		return admin_url( 'press-this.php' );
	}

	/**
	 * @return string|void Full URL to /admin/press-this.php in current install
	 */
	public function plugin_dir_path() {
		return rtrim( plugin_dir_path( __FILE__ ), '/' );
	}

	public function plugin_dir_url() {
		return rtrim( plugin_dir_url( __FILE__ ), '/' );
	}

	/**
	 * @return mixed Press This bookmarklet JS trigger found in /wp-admin/tools.php
	 */
	public function shortcut_link_override() {
		$url  = esc_js( self::runtime_url() );
		$link = "javascript: var u='{$url}';\n";
		$link .= file_get_contents( self::plugin_dir_path() . '/js/bookmarklet.js' );
		return str_replace( array( "\r", "\n", "\t" ), '', $link );
	}

	/**
	 * Takes over /wp-admin/press-this.php for backward compatibility and while in feature-as-plugin mode
	 */
	public function press_this_php_override() {
		// Simply drop the following test once/if this becomes the standard Press This code in core
		if ( ! preg_match( '/\/press-this\.php$/', $_SERVER['SCRIPT_NAME'] ) )
			return;

		self::serve_app_html();
	}

	/**
	 *
	 */
	public function serve_app_html() {
		$_POST['_runtime_url']    = self::runtime_url();
		$_POST['_plugin_dir_url'] = self::plugin_dir_url();
		$json                     = json_encode( $_POST );
		$js_inc_dir               = preg_replace( '/^(.+)\/wp-admin\/.+$/', '\1/wp-includes/js', self::runtime_url() );
		$json_js_inc              = $js_inc_dir . '/json2.min.js';
		$jquery_js_inc            = $js_inc_dir . '/jquery/jquery.js';
		$app_css_inc              = self::plugin_dir_url() . '/css/press-this.css';
		$load_js_inc              = self::plugin_dir_url() . '/js/load.js';
		echo <<<________HTMLDOC
<!DOCTYPE html>
<html>
<head lang="en">
	<meta charset="UTF-8">
	<title></title>
	<link rel='stylesheet' id='all-css' href='{$app_css_inc}' type='text/css' media='all' />
	<script language="JavaScript">
		window.wp_pressthis_data = {$json};
	</script>
	<script src="{$json_js_inc}" language="JavaScript"></script>
	<script src="{$jquery_js_inc}" language="JavaScript"></script>
	<script src="{$load_js_inc}" language="JavaScript"></script>
</head>
<body>
	<div id='wppt_app_container'>
		<h2 id='wppt_title_container'></h2>
		<div id='wppt_featured_image_container'></div>
		<div id='wppt_other_images_container'></div>
		<div id='wppt_suggested_excerpt_container'></div>
	</div>
</body>
</html>
________HTMLDOC;
		die();
	}

	/**
	 *
	 */
	public function press_this_ajax_site_settings() {
		$domain = 'press-this';
		header( 'content-type: application/json' );
		echo json_encode( array(
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'press_this_site_settings' ),
			'i18n'     => array(
				'Welcome to Press This!' => __('Welcome to Press This!', $domain ),
				'Source:'                => __( 'Source:', $domain )
			),
		) );
		die();
	}
}

new WpPressThis;