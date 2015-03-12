=== Press This ===
Contributors: michael-arestad, stephdau, georgestephanis, folletto, melchoyce
Donate link: http://wordpressfoundation.org/donate/
Tags: post, quick-post, photo-post
Requires at least: 3.9
Tested up to: 4.2
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Now merged into WordPress (4.2.0), no longer does anything.

== Description ==

This plugin has now been merged into WordPress itself, and no longer does anything. See the new Press This in WordPress 4.2 and up.

== Contributing ==

Development is now happening withing the WordPress core infrastructure.
See the Press This component in Trac: https://core.trac.wordpress.org/query?status=!closed&component=Press+This


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
 * Alpha level code

= 0.0.2 =
* Added the start of an admin bar
* Major code refactoring for easier code reuse and better performance/stability
* Started backend work on Chrome extension, not functional, but a start
* Started work on adding/editing/removing a user's different Press This instances
* Still alpha level code

= 0.0.3 =
 * Photo upload (without page reload, and with preview), take 1!
 * Handy field for users to enter a URL to scan for media, if accessed without providing one.
 * Refined algorithm that selects what picts to present as interesting/worthy to the user.
 * Continued work on adding/editing/removing a user's different Press This instances.
 * Major UI/UX improvements.
 * Major backend improvements.
 * Still alpha level code.

= 0.0.4 =
 * Dropped the iframe mode to an experimental file devs can play with, now defaulting to popup for better security and less fighting browsers on sameorigin policies.
 * Improved UI/UX: new icons and related behaviors, etc.
 * Better photo selection experience, including when uploading.
 * Ability to dismiss having a photo.
 * Lots of backend work to start moving towards multiple media types and selection.
 * Still alpha level code.

= 0.0.4.1 =
 * PHP compatibility updates: some of our syntax could error on some PP versions.
 * Still alpha level code.

= 0.0.4.2 =
 * Added <meta name="viewport" content="width=device-width"> to make it extra responsive on mobile.
 * Still alpha level code.

= 0.0.4.3 =
 * Improving our github to svn tool flow
 * Still alpha level code.

= 0.1 =
 * Change the plugin to do nothing now that merged in WordPress.