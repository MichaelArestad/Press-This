window.WpPressThis_Bookmarklet = function( pt_url ) {
	var d = document,
		w = window,
		l = top.location,
		z = w.getSelection,
		k = d.getSelection,
		x = d.selection,
		s = ( z ? z() : ( k ) ? k() : ( x ? x.createRange().text : 0 ) ),
		es = encodeURI( s ),
		now = new Date().getTime();

	if ( ! pt_url || ! pt_url.match( /^http/ ) ) {
		w.alert( 'Sorry, no Press This URL provided.' );
		return;
	}

	pt_url += ( ( pt_url.indexOf( '?' ) > -1 ) ? '&' : '?' ) + 'buster=' + now;

	if ( d.title.length && d.title.length <= 512 ) {
		pt_url += '&t=' + encodeURI( d.title );
	}

	if ( es.length && es.length <= 512 ) {
		pt_url += '&s=' + es;
	}

	if ( l.href.match( /^https?:/ ) ) {
		pt_url += '&u=' + encodeURI( l.href );
	} else {
		top.location.href = pt_url;
		return;
	}

	var e = encodeURIComponent,
		metas = d.head.getElementsByTagName( 'meta' ),
		links = d.head.getElementsByTagName( 'link' ),
		it = d.getElementById( 'content' ),
		imgs = ( null != it ) ? it.getElementsByTagName( 'img' ) : [],
		ifrs = d.body.getElementsByTagName( 'iframe' ) || [],
		r = new Image(),
		f = d.createElement( 'form' ),
		tn = '_press_this_app',
		vid = null,
		fAdd = function ( n, v ) {
			if ( typeof( v ) === 'undefined' ) {
				return;
			}

			e = d.createElement( 'input' );
			e.name  = n;
			e.value = v;
			e.type  = 'hidden';
			f.appendChild( e );
		};

	if ( l.href.match( /\/\/www\.youtube\.com\/watch/ ) ) {
		fAdd( '_embed[]', l.href );
	} else if ( l.href.match( /\/\/vimeo\.com\/(.+\/)?([\d]+)$/ ) ) {
		fAdd( '_embed[]', l.href );
	}  else if ( l.href.match( /\/\/(www\.)?dailymotion\.com\/video\/.+$/ ) ) {
		fAdd( '_embed[]', l.href );
	} else if ( l.href.match( /\/\/soundcloud\.com\/.+$/ ) ) {
		fAdd( '_embed[]', l.href );
	} else if ( l.href.match( /\/\/twitter\.com\/[^\/]+\/status\/[\d]+$/ ) ) {
		fAdd( '_embed[]', l.href );
	}

	if ( ! imgs || ! imgs.length ) {
		it = d.body.getElementsByClassName ? d.body.getElementsByClassName( 'hfeed' ) : [];
		imgs = it.length ? it[0].getElementsByTagName( 'img' ) : [];

		if ( ! imgs || ! imgs.length ) {
			imgs = d.body.getElementsByTagName( 'img' ) || [];
		}
	}

	for ( var m = 0; m < metas.length; m++ ) {
		if ( m >= 50 ) {
			break;
		}

		var q = metas[ m ],
			q_name = q.getAttribute( 'name' ),
			q_prop = q.getAttribute( 'property' ),
			q_cont = q.getAttribute( 'content' );

		if ( q_name ) {
			fAdd( '_meta[' + q_name + ']', q_cont );
		} else if (q_prop) {
			fAdd( '_meta[' + q_prop + ']', q_cont );
		}
	}

	for ( var y = 0; y < links.length; y++ ) {
		if ( y >= 50 ) {
			break;
		}

		var g = links[ y ],
			g_rel = g.getAttribute( 'rel' );

		if ( g_rel ) {
			switch ( g_rel ) {
				case 'canonical':
				case 'icon':
				case 'shortlink':
					fAdd( '_links[' + g_rel + ']', g.getAttribute( 'href' ) );
					break;
				case 'alternate':
					if ( 'application/json+oembed' === g.getAttribute( 'type' ) ) {
						fAdd( '_links[' + g_rel + ']', g.getAttribute( 'href' ) );
					} else if ( 'handheld' === g.getAttribute( 'media' ) ) {
						fAdd( '_links[' + g_rel + ']', g.getAttribute( 'href' ) );
					}
			}
		}
	}

	for ( var n = 0; n < imgs.length; n++ ) {
		if ( n >= 100 ) {
			break;
		}

		r.src = imgs[ n ].src;

		if ( r.src.indexOf( 'gravatar.com' ) > -1 ) {
			continue;
		} else if ( imgs[ n ].className && imgs[ n ].className.length && imgs[ n ].className.indexOf( 'avatar' ) > -1 ) {
			continue;
		}

		if ( imgs[ n ].original && imgs[ n ].original.length ) {
			fAdd( '_img[]', imgs[ n ].original );
		} else if ( r.src.indexOf( '/wp-content/uploads/' ) ) {
			fAdd( '_img[]', r.src );
		} else if ( r.width && r.height && r.width >= 256 && r.height >= 128 ) {
			fAdd( '_img[]', r.src );
		}
	}

	for ( var p = 0; p < ifrs.length; p++ ) {
		if ( p >= 100 ) {
			break;
		}

		vid = ifrs[ p ].src.match(/\/\/www\.youtube\.com\/embed\/([^\?]+)\?.+$/);

		if ( vid && 2 === vid.length ) {
			fAdd( '_embed[]', 'https://www.youtube.com/watch?v=' + vid[1] );
		}

		vid = ifrs[ p ].src.match( /\/\/player\.vimeo\.com\/video\/([\d]+)$/ );

		if ( vid && 2 === vid.length ) {
			fAdd( '_embed[]', 'https://vimeo.com/' + vid[1] );
		}
	}

	if ( d.title && d.title > 512 ) {
		fAdd( 't', d.title );
	}

	if ( es.length && es.length > 512 ) {
		fAdd( 's', s );
	}

	f.setAttribute( 'method', 'POST' );
	f.setAttribute( 'action', pt_url );
	f.setAttribute( 'target', tn );
	f.setAttribute( 'style', 'display: none;' );

	w.open( 'about:blank', tn, 'width=500,height=700' );

	d.body.appendChild(f);
	f.submit();
};
