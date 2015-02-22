/* jshint curly: false, eqeqeq: false */
/* global ajaxurl, wpAjax */

/**
 * The functions and classes in that code are a straight cut-and-paste out of
 * /wp-admin/js/post.js, coupled with Press This' usage of the post_tags_meta_box()
 * PHP function.
 *
 * If Press This makes it into core, we can refactor that code out of post.js and
 * make it more reusable, as well as improve it to work better, everywhere.
 *
 * Copied-and-pasted instead of enqueuing post.js because the latter has much more,
 * and has processing instead of just functions/classes.
 */
var tagBox;

( function( $ ) {
	// The following code is from /wp-admin/js/post.js, see notes above.

	// return an array with any duplicate, whitespace or values removed
	function array_unique_noempty( array ) {
		var out = [];

		$.each( array, function( key, val ) {
			val = $.trim( val );

			if ( val && $.inArray( val, out ) === -1 ) {
				out.push( val );
			}
		} );

		return out;
	}

	tagBox = {
		clean : function(tags) {
			var comma = window.pressThisL10n.tagDelimiter;
			if ( ',' !== comma )
				tags = tags.replace(new RegExp(comma, 'g'), ',');
			tags = tags.replace(/\s*,\s*/g, ',').replace(/,+/g, ',').replace(/[,\s]+$/, '').replace(/^[,\s]+/, '');
			if ( ',' !== comma )
				tags = tags.replace(/,/g, comma);
			return tags;
		},

		parseTags : function(el) {
			var id = el.id,
				num = id.split('-check-num-')[1],
				taxbox = $(el).closest('.tagsdiv'),
				thetags = taxbox.find('.the-tags'),
				comma = window.pressThisL10n.tagDelimiter,
				current_tags = thetags.val().split( comma ),
				new_tags = [];
			
			delete current_tags[num];

			$.each( current_tags, function( key, val ) {
				val = $.trim( val );
				if ( val ) {
					new_tags.push( val );
				}
			});

			thetags.val( this.clean( new_tags.join( comma ) ) );

			this.quickClicks( taxbox );
			return false;
		},

		quickClicks : function( el ) {
			var thetags = $('.the-tags', el),
				tagchecklist = $('.tagchecklist', el),
				id = $(el).attr('id'),
				current_tags, disabled;

			if ( ! thetags.length )
				return;

			disabled = thetags.prop('disabled');

			current_tags = thetags.val().split( window.pressThisL10n.tagDelimiter );
			tagchecklist.empty();

			$.each( current_tags, function( key, val ) {
				var span, xbutton;

				val = $.trim( val );

				if ( ! val )
					return;

				// Create a new span, and ensure the text is properly escaped.
				span = $('<span />').text( val );

				// If tags editing isn't disabled, create the X button.
				if ( ! disabled ) {
					xbutton = $( '<a id="' + id + '-check-num-' + key + '" class="ntdelbutton" tabindex="0">X</a>' );
					xbutton.on( 'click keypress', function( e ) {
						// Trigger function if pressed Enter - keyboard navigation
						if ( e.type === 'click' || e.which === 13 ) {
							tagBox.parseTags( this );
						}
					});
					span.prepend('&nbsp;').prepend( xbutton );
				}

				// Append the span to the tag list.
				tagchecklist.append( span );
			});
		},

		flushTags : function( el, a, f ) {
			var tagsval, newtags, text,
				tags = $( '.the-tags', el ),
				newtag = $( 'input.newtag', el ),
				comma = window.pressThisL10n.tagDelimiter;

			a = a || false;

			text = a ? $(a).text() : newtag.val();
			tagsval = tags.val();
			newtags = tagsval ? tagsval + comma + text : text;

			newtags = this.clean( newtags );
			newtags = array_unique_noempty( newtags.split( comma ) ).join( comma );
			tags.val( newtags );
			this.quickClicks( el );

			if ( ! a )
				newtag.val('');
			if ( 'undefined' == typeof( f ) )
				newtag.focus();

			return false;
		},

		get : function( id ) {
			var tax = id.substr( id.indexOf('-') + 1 );

			$.post( ajaxurl, { 'action': 'get-tagcloud', 'tax': tax }, function( r, stat ) {
				if ( 0 === r || 'success' != stat ) {
					// TODO show error?
				//	r = wpAjax.broken; 
					return;
				}

				// TODO: move the wrapper to the html
				r = $( '<p id="tagcloud-' + tax + '" class="the-tagcloud">' + r + '</p>');

				$( 'a', r ).click( function() {
					// TODO: this is a modif to the core version, change when merging
					// tagBox.flushTags( $(this).closest('.inside').children('.tagsdiv'), this);
					tagBox.flushTags( $('.tagsdiv'), this );
					return false;
				});

				$( '#' + id ).after( r );
			});
		},

		init : function() {
			var t = this, ajaxtag = $('div.ajaxtag');

			$('.tagsdiv').each( function() {
				tagBox.quickClicks(this);
			});

			$('button.tagadd', ajaxtag).click(function(){
				t.flushTags( $(this).closest('.tagsdiv') );
			});

			$('div.taghint', ajaxtag).click(function(){
				$(this).css('visibility', 'hidden').parent().siblings('.newtag').focus();
			});

			$('input.newtag', ajaxtag).blur(function() {
				if ( '' === this.value )
					$(this).parent().siblings('.taghint').css('visibility', '');
			}).focus(function(){
				$(this).parent().siblings('.taghint').css('visibility', 'hidden');
			}).keyup(function(e){
				if ( 13 == e.which ) {
					tagBox.flushTags( $(this).closest('.tagsdiv') );
					return false;
				}
			}).keypress(function(e){
				if ( 13 == e.which ) {
					e.preventDefault();
					return false;
				}
			}).each( function() {
				var tax = $(this).closest('div.tagsdiv').attr('id');
				$(this).suggest(
					ajaxurl + '?action=ajax-tag-search&tax=' + tax,
					{ delay: 500, minchars: 2, multiple: true, multipleSep: window.pressThisL10n.tagDelimiter + ' ' }
				);
			});

			// save tags on post save/publish
			$('#post').submit(function(){
				$('div.tagsdiv').each( function() {
					tagBox.flushTags(this, false, 1);
				});
			});

			// tag cloud
			$('a.tagcloud-link').click(function(){
				tagBox.get( $(this).attr('id') );
				$(this).unbind().click(function(){
					$(this).siblings('.the-tagcloud').toggle();
					return false;
				});
				return false;
			});
		}
	};

	tagBox.init();
}( jQuery ));
