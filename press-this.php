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

class WpPressThis {
	public function __construct() {
		add_action( 'wp_ajax_press_this_site_settings', array( $this, 'press_this_site_settings' ) );
		add_action( 'wp_ajax_nopriv_press_this_site_settings', array( $this, 'press_this_site_settings' ) );
		add_action( 'admin_init', array( $this, 'duck_punch_wp_admin_press_this' ), 999 );
	}

	/**
	 * Replace press-this.php entirely with our version.
	 */
	public function duck_punch_wp_admin_press_this() {
		if ( 'press-this.php' === basename( $_SERVER['PHP_SELF'] ) ) {
			include( plugin_dir_path( __FILE__ ) . 'wp-admin-press-this.php' );
			exit;
		}
	}

	public function press_this_site_settings() {
		header( 'content-type: application/json' );
		echo json_encode(array(
			'nonce' => wp_create_nonce( 'press_this_site_settings' ),
			'i18n'  => array(
				'Welcome to Press This!' => __('Welcome to Press This!', 'press-this'),
			),
		));
		die();
	}
}

new WpPressThis;
