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
		add_filter( 'shortcut_link', array( $this, 'shortcut_link' ) );
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

	/**
	 * Entirely replace the default press-this bookmarklet code.
	 */
	public static function shortcut_link() {
		$url  = esc_js( admin_url( 'press-this.php' ) );
		$link = <<<JSDOC
			javascript:
			var d=document,
				w=window,
				z=w.getSelection,
				k=d.getSelection,
				x=d.selection,
				s=(z?z():(k)?k():(x?x.createRange().text:0)),
				l=d.location,
				e=encodeURIComponent,
				metas=d.head.getElementsByTagName('meta'),
				imgs=d.body.getElementsByTagName('img'),
				r=new Image(),
				f=d.createElement('form'),
				fAdd=function(n,v){
					if(typeof(v)==='undefined')return;
					e=d.createElement('input');
					e.name=n;
					e.value=v;
					e.type='hidden';
					f.appendChild(e);
				},
				i=d.createElement('iframe');

			for (var m = 0; m < metas.length; m++) {
				q=metas[m];
				q_name=q.getAttribute("name");
				q_prop=q.getAttribute("property");
				q_cont=q.getAttribute("content");
				if(q_name){
					fAdd('_meta['+q_name+']',q_cont);
				}else if(q_prop){
					fAdd('_meta['+q_prop+']',q_cont);
				}
			}

			for (var n = 0; n < metas.length; n++) {
				r.src=imgs[n].src;
				if(r.width>=50||r.height>=50){
					fAdd('_img[]',r.src);
				}
			}

			fAdd('_u',l.href);
			fAdd('_t',d.title);
			fAdd('_s',s);

			i.src='{$url}';
			i.name='_press_this_iframe';
			i.width='100%';
			i.height='300px';

			d.body.appendChild(i);

			f.method='POST';
			f.action=i.src+'?v=4';
			f.target='_press_this_iframe';
			f.style='visibility:hidden;';
			f.submit();
			void(0);
JSDOC;

		return str_replace( array( "\r", "\n", "\t" ), '', $link );
	}
}

new WpPressThis;
