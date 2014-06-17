var WpPressThis_Bookmarklet = function(pt_url) {
	if ( !pt_url || !pt_url.match(/^http/) ) {
		alert('Sorry, no Press This URL provided.');
		return;
	}

	var d   = document,
		w   = window,
		l   = top.location,
		now = new Date().getTime();

	pt_url += ( ( pt_url.indexOf('?') > -1 ) ? '&' : '?' ) + 'buster=' + now;
	if ( l.href.match(/^https?:/) )
		pt_url += '&u=' + encodeURI( l.href );

	var z = w.getSelection,
		k = d.getSelection,
		x = d.selection,
		s = (z ? z() : (k) ? k() : (x ? x.createRange().text : 0)),
		e = encodeURIComponent,
		metas = d.head.getElementsByTagName('meta'),
		links = d.head.getElementsByTagName('link'),
		imgs  = d.body.getElementsByTagName('img'),
		r     = new Image(),
		f     = d.createElement('form'),
		h     = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
		tn    = '_press_this_app',
		tnu   = pt_url,
		fs    = false,
		i     = null,
		fAdd  = function (n, v) {
			if (typeof(v) === 'undefined')return;
			e       = d.createElement('input');
			e.name  = n;
			e.value = v;
			e.type  = 'hidden';
			f.appendChild(e);
		};

	for (var m = 0; m < metas.length; m++) {
		if ( m >= 50 )
			break;
		var q = metas[m];
		q_name = q.getAttribute("name");
		q_prop = q.getAttribute("property");
		q_cont = q.getAttribute("content");
		if (q_name) {
			fAdd('_meta[' + q_name + ']', q_cont);
		} else if (q_prop) {
			fAdd('_meta[' + q_prop + ']', q_cont);
		}
	}

	for (var y = 0; y < links.length; y++) {
		if ( y >= 50 )
			break;
		var g = links[y];
		g_rel = g.getAttribute("rel");
		if (g_rel) {
			switch (g_rel) {
				case 'canonical':
				case 'icon':
				case 'shortlink':
					fAdd('_links[' + g_rel + ']', g.getAttribute("href"));
					break;
				case 'alternate':
					if ('application/json+oembed' == g.getAttribute("type"))
						fAdd('_links[' + g_rel + ']', g.getAttribute("href"));
					else if ('handheld' == g.getAttribute("media"))
						fAdd('_links[' + g_rel + ']', g.getAttribute("href"));
			}
		}
	}

	for (var n = 0; n < imgs.length; n++) {
		if ( n >= 100 )
			break;
		r.src = imgs[n].src;
		if (imgs[n].className && imgs[n].className.length) {
			if (imgs[n].className.indexOf('gravatar') > -1 && n <= 30) {
				fAdd('_img[]', r.src.replace(/^(http[^\?]+)(\?.*)?$/, '$1?s=640'));
			} else {
				fAdd('_img[]', r.src);
			}
		} else if (imgs[n].original && imgs[n].original.length) {
			fAdd('_img[]', r.src);
		} else if (r.src.indexOf('/wp-content/uploads/')) {
			fAdd('_img[]', r.src);
		} else if (r.width && r.height && r.width >= 256 && r.height >= 128) {
			fAdd('_img[]', r.src);
		}
	}

	fAdd('s', s);
	fAdd('t', d.title);

	if ( navigator && navigator.userAgent && navigator.userAgent.length && ! navigator.userAgent.match(/firefox\//i) ) {
		tnu = 'about:blank';
		fs = true;
		f.setAttribute('method', 'POST');
		f.setAttribute('action', pt_url);
		if ( l.href.match(/^https?:/) )
			f.setAttribute('target', tn);
	}

	if (top.location.href.match(/^https/) && !pt_url.match(/^https/)) {
		w.open(tnu, tn, "width=500,height=700");
	} else if ( l.href.match(/^https?:/) ) {
		i = d.createElement('iframe');
		i.setAttribute('src', tnu);
		i.setAttribute('name', tn);
		i.setAttribute('id', i.name);
		i.setAttribute('style', 'position:fixed;top:0px;right:0px;z-index:999999999999999;border:0;min-width:320px;max-width:760px;width:50%;height:' + '100%');

		d.body.appendChild(i);
	}

	if ( true == fs ) {
		f.style = 'visibility:hidden;';
		f.submit();
	}
};