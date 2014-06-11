Press-This
==========
Posting images, links, and cat gifs will never be the same.

## Description

Press This is a redesign of the Press This bookmarklet with a focus on automation and speed. It will have a simplified interface, efficient media upload, content scraping, and site switching.

**CAUTION:** This is in super early development. Don't use on a production site. There be dragons!

## Contributing

You can see discussion and progress at [corepressthis.wordpress.com](corepressthis.wordpress.com).

Development of this plugin is done on [Github](https://github.com/MichaelArestad/Press-This). Pull requests welcome.

### Setting up Grunt (compiles/autoprefixes Sass)
1. You need to have [Sass](http://sass-lang.com/install) installed.
 * To check to see if you have it, type `sass -v` in your terminal.
 * On Mac, type 'gem install sass' in your terminal. If you get an error, try `sudo gem install sass` instead.
* You need to have [Node.js](http://nodejs.org/) installed.
 * To check to see if you have it, type `node -v` in your terminal.
 * Download and install the package [here](http://nodejs.org/).
* Navigate to the plugin folder in your terminal.
* Type `npm install`, which installs Grunt and the node modules needed.
* Type `grunt`, which starts the Watch task and compiles/autoprefixes the Sass when changes are detected.
 * You can exit grunt watch using `Control + C`

## Changelog

### 0.0.1a
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

### 0.0.2
 * Added the start of an admin bar
 * Major code refactoring for easier code reuse and better performance/stability
 * Started backend work on Chrome extension, not functional, but a start
 * Started work on adding/editing/removing a user's different Press This instances

