=== Press This ===
Contributors: michael-arestad, stephdau, georgestephanis, folletto, melchoyce
Donate link: http://wordpressfoundation.org/donate/
Tags: post, quick-post, photo-post
Requires at least: 3.9
Tested up to: 4.0
Stable tag: trunk
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Posting images, links, and cat gifs will never be the same.

== Description ==

Press This is a redesign of the Press This bookmarklet with a focus on automation and speed. It will have a simplified interface, efficient media upload, content scraping, and site switching.

**CAUTION:** This is in super early development. Don't use on a production site. There be dragons!

== Contributing ==

You can see discussion and progress at [corepressthis.wordpress.com](corepressthis.wordpress.com).

Development of this plugin is done on [Github](https://github.com/MichaelArestad/Press-This). Pull requests welcome.

== Screenshots ==

1. Get and activate the plugin (see https://make.wordpress.org/ui/2014/06/04/press-this/)
2. Install the bookmarklet to your browser's bookmark toolbar
3. Use the bookmarklet on any web page
4. Publish in 2 steps! :)

== Changelog ==

= 0.0.1a =
* Core architecture of the plugin/tools is an as-pure-Javascript app as possible
* Currently AJAX driven, but ready to be switched to using the WP-API endpoints as they become available
* Is backward compatible with the current version of the Press This bookmarklet as bundled in WP, but also bring its own, more powerful one with it
* Can blog any web page found online, blockquoting an excerpt, including a selection of in-page images to choose from. Said images are augmented with meta data to sort them in the order the site advertises to be best
* Overrides /wp-admin/press-this.php and its behavior, so that we’re 100% backward compatible
* Overrides the bookmarklet JS code provided in /wp-admin/tools.php
* Quick featured image switching
* Saving draft and publishing
* Image side-loading
* **3 modes**:
 * Direct access: quick post of sort, more to come with media and formatting tools
 * Modal: when accessed via new bookmarklet code: will show in an iframe within the visited page itself
 * Popup: if the currently visited page is SSL but the target install is not, we open Press This in a popup instead. We also do that if the”legacy” bookmarklet code is used. It’s pretty awesome for pressing from your sweet smartphone.

= 0.0.2 =
* Added the start of an admin bar
* Major code refactoring for easier code reuse and better performance/stability
* Started backend work on Chrome extension, not functional, but a start
* Started work on adding/editing/removing a user's different Press This instances
