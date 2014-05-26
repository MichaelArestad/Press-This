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
	h=Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
	tn='_press_this_app';

for (var m = 0; m < metas.length; m++) {
	var q=metas[m];
	q_name=q.getAttribute("name");
	q_prop=q.getAttribute("property");
	q_cont=q.getAttribute("content");
	if(q_name){
		fAdd('_meta['+q_name+']',q_cont);
	}else if(q_prop){
		fAdd('_meta['+q_prop+']',q_cont);
	}
}

for (var n = 0; n < imgs.length; n++) {
	r.src=imgs[n].src;
	if( r.width >= 256 && r.height >= 128){
		fAdd('_img[]',r.src);
	}
}

fAdd('_u',l.href);
fAdd('_t',d.title);
fAdd('_s',s);

f.setAttribute('method','POST');
f.setAttribute('action', u += '?a=init');
f.setAttribute('target', tn);

if ( top.location.href.match(/^https/) && ! u.match(/https/) ) {
	p =w.open('about: blank', tn, "width=500, height=500");
} else {
	i = d.createElement('iframe');
	i.setAttribute('src', 'about: blank' );
	i.setAttribute('name', tn );
	i.setAttribute('id', i.name );
	i.setAttribute('style', 'position:fixed;top:0px;right:0px;z-index:999999999999999;width:40%;height:'+h+'px');

	d.body.appendChild(i);
}

f.style='visibility:hidden;';
f.submit();