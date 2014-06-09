var WpPressThis_Bookmarklet = function(u) {
	var d = document,
		w = window,
		z = w.getSelection,
		k = d.getSelection,
		x = d.selection,
		s = (z ? z() : (k) ? k() : (x ? x.createRange().text : 0)),
		l = d.location,
		e = encodeURIComponent,
		metas = d.head.getElementsByTagName('meta'),
		links = d.head.getElementsByTagName('link'),
		imgs = d.body.getElementsByTagName('img'),
		r = new Image(),
		now = new Date().getTime(),
		f = d.createElement('form'),
		fAdd = function (n, v) {
			if (typeof(v) === 'undefined')return;
			e = d.createElement('input');
			e.name = n;
			e.value = v;
			e.type = 'hidden';
			f.appendChild(e);
		},
		h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
		tn = '_press_this_app';

	for (var m = 0; m < metas.length; m++) {
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
		r.src = imgs[n].src;
		if (imgs[n].className && imgs[n].className.length) {
			if (imgs[n].className.indexOf('gravatar') > -1) {
				fAdd('_img[]', r.src.replace(/^(http[^\?]+)(\?.*)?$/, '$1?s=640'));
			} else if (imgs[n].className.match(/size-(large|full|medium)/)) {
				fAdd('_img[]', r.src);
			}
		} else if (imgs[n].original && imgs[n].original.length) {
			fAdd('_img[]', r.src);
		} else if (r.src.indexOf('/wp-content/uploads/') && !r.src.match(/(\/share-?this[^\.]+?\.[a-z0-9]{3,})(\?.*)?/)) {
			fAdd('_img[]', r.src);
		} else if (r.width >= 256 && r.height >= 128) {
			fAdd('_img[]', r.src);
		}
	}

	fAdd('s', s);

	f.setAttribute('method', 'POST');
	f.setAttribute('action', ( u + ( ( u.indexOf('?') > -1 ) ? '&' : '?' ) + 'u=' + encodeURI(l.href) + '&t=' + encodeURI(d.title) + '&buster=' + now ));
	f.setAttribute('target', tn);

	if (top.location.href.match(/^https/) && !u.match(/https/)) {
		p = w.open('about: blank', tn, "width=500,height=700");
	} else {
		i = d.createElement('iframe');
		i.setAttribute('src', 'about: blank');
		i.setAttribute('name', tn);
		i.setAttribute('id', i.name);
		i.setAttribute('style', 'position:fixed;top:0px;right:0px;z-index:999999999999999;border:0;min-width:320px;max-width:760px;width:50%;height:' + '100%');

		d.body.appendChild(i);
	}

	f.style = 'visibility:hidden;';
	f.submit();
};