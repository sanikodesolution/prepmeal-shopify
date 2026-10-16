(function(){
  var r=document.getElementById('mp7-x');if(!r)return;
  var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnim=typeof Element.prototype.animate==='function';
  var cars=[];

  function syncAll(){cars.forEach(function(c){if(c.__mp7Sync)c.__mp7Sync()})}

  // Instant scroll (the carousel is scroll-behavior:smooth, which would otherwise
  // animate a direct scrollLeft write and break position measurements).
  function jump(car,left){
    var prev=car.style.scrollBehavior;
    car.style.scrollBehavior='auto';
    car.scrollLeft=left;
    car.style.scrollBehavior=prev||'';
  }

  r.querySelectorAll('[data-tabs]').forEach(function(g){
    g.addEventListener('click',function(e){
      var b=e.target.closest('.mp7-tab');if(!b)return;
      if(b.classList.contains('is-on'))return;
      g.querySelectorAll('.mp7-tab').forEach(function(x){x.classList.remove('is-on');x.setAttribute('aria-pressed','false')});
      b.classList.add('is-on');b.setAttribute('aria-pressed','true');
      if(g.hasAttribute('data-mp7-filter')) applyServings(b);
      if(g.hasAttribute('data-way-filter')) applyDiet(g,b,true);
    });
  });

  function dietAttr(btn){
    var diet=btn.getAttribute('data-diet')||'';
    return diet.indexOf('dairy')!==-1?'dairy':'gluten';
  }

  // Two cards left? Let them grow to fill the row instead of leaving a bare gap.
  function layout(car){
    var vis=car.querySelectorAll('.mp7-meal:not([hidden])').length;
    car.classList.toggle('is-2',vis===2);
    jump(car,0);
  }

  // Isotope-style filter: outgoing cards fade away, the cards that remain slide
  // into their new slots (FLIP), and newly matching cards fade back in.
  function applyDiet(group,btn,animate){
    var attr=dietAttr(btn);
    var sec=group.closest('.mp7-way');if(!sec)return;
    var car=sec.querySelector('[data-car]');if(!car)return;
    var meals=Array.prototype.slice.call(car.querySelectorAll('.mp7-meal'));
    var want=function(m){return m.getAttribute('data-'+attr)==='true'};
    var leaving=meals.filter(function(m){return !m.hidden&&!want(m)});
    var entering=meals.filter(function(m){return m.hidden&&want(m)});

    if(!leaving.length&&!entering.length){layout(car);syncAll();return}

    var flor=animate&&!rm&&canAnim;
    if(!flor){
      leaving.forEach(function(m){m.hidden=true});
      entering.forEach(function(m){m.hidden=false});
      layout(car);
      syncAll();
      return;
    }

    // FIRST: measure the current layout (outgoing cards are still in flow).
    jump(car,0);
    var before=new Map();
    meals.forEach(function(m){if(!m.hidden)before.set(m,m.getBoundingClientRect())});

    var out=leaving.map(function(m){
      return m.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.92)'}],
        {duration:170,easing:'ease-in',fill:'forwards'});
    });

    setTimeout(function(){
      leaving.forEach(function(m){m.hidden=true});
      entering.forEach(function(m){m.hidden=false});
      layout(car);

      // LAST: measure again, then invert and play the movement.
      meals.forEach(function(m){
        if(m.hidden)return;
        var now=m.getBoundingClientRect();
        var was=before.get(m);
        if(was){
          var dx=was.left-now.left, dy=was.top-now.top;
          if(Math.abs(dx)>0.5||Math.abs(dy)>0.5){
            m.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],
              {duration:420,easing:'cubic-bezier(.22,.7,.2,1)'});
          }
        } else {
          m.animate([{opacity:0,transform:'translateY(20px) scale(.94)'},{opacity:1,transform:'none'}],
            {duration:420,easing:'cubic-bezier(.22,.7,.2,1)'});
        }
      });

      out.forEach(function(a){try{a.cancel()}catch(e){}});
      syncAll();
    }, leaving.length?170:0);
  }

  r.querySelectorAll('[data-way-filter]').forEach(function(g){
    var on=g.querySelector('.mp7-tab.is-on');
    if(on) applyDiet(g,on,false);
  });

  function servingsOf(btn){
    var m=(btn.textContent||'').match(/\d+/);
    var n=m?parseInt(m[0],10):1;
    return n>0?n:1;
  }
  function applyServings(btn){
    var n=servingsOf(btn);
    r.querySelectorAll('.mp7-grid .mp7-val').forEach(function(el){
      if(!el.hasAttribute('data-base')) el.setAttribute('data-base',el.textContent.trim());
      var raw=el.getAttribute('data-base');
      var num=parseFloat(String(raw).replace(/[^0-9.]/g,''));
      if(!isFinite(num)) return;
      var suffix=(String(raw).match(/[^0-9.\s]+$/)||[''])[0];
      el.textContent=Math.round(num*n)+suffix;
    });
  }

  r.querySelectorAll('[data-car]').forEach(function(c){
    var sib=c.nextElementSibling;
    var nav=sib&&sib.classList.contains('mp7-nav')?sib:null;
    var dots=nav&&nav.nextElementSibling&&nav.nextElementSibling.classList.contains('mp7-dots')?nav.nextElementSibling:null;
    var t;
    var kids=function(){return Array.prototype.filter.call(c.children,function(el){return !el.hidden})};
    var gap=function(){var cs=getComputedStyle(c);var g=parseFloat(cs.columnGap||cs.gap);return isFinite(g)?g:16};
    var step=function(){var first=kids()[0];return first?first.offsetWidth+gap():300};
    var maxScroll=function(){return Math.max(0,c.scrollWidth-c.clientWidth)};
    var go=function(dir){
      var max=maxScroll();
      if(max<2)return;
      var s=Math.max(1,step());
      if(dir>0&&c.scrollLeft>=max-2){c.scrollTo({left:0,behavior:rm?'auto':'smooth'});return}
      if(dir<0&&c.scrollLeft<=2){c.scrollTo({left:max,behavior:rm?'auto':'smooth'});return}
      c.scrollBy({left:dir*s,behavior:rm?'auto':'smooth'});
    };

    if(nav){
      var pb=nav.querySelector('[data-prev]'),nb=nav.querySelector('[data-next]');
      if(pb)pb.onclick=function(){go(-1)};
      if(nb)nb.onclick=function(){go(1)};
    }

    if(dots&&!dots.children.length){
      kids().forEach(function(k,i){
        var b=document.createElement('button');
        b.type='button';
        b.setAttribute('aria-label','Slide '+(i+1));
        b.onclick=function(){c.scrollTo({left:i*step(),behavior:rm?'auto':'smooth'})};
        dots.appendChild(b);
      });
      var upd=function(){
        var i=Math.round(c.scrollLeft/Math.max(1,step()));
        Array.prototype.forEach.call(dots.children,function(b,x){b.classList.toggle('on',x===i)});
      };
      c.addEventListener('scroll',upd,{passive:true});
      upd();
    }

    if(c.hasAttribute('data-auto')&&!rm){
      var start=function(){t=setInterval(function(){go(1)},4500)},stop=function(){clearInterval(t)};
      start();
      c.addEventListener('mouseenter',stop);
      c.addEventListener('mouseleave',start);
      c.addEventListener('touchstart',stop,{passive:true});
    }

    // Keep the arrows usable: hide them when the track doesn't actually scroll.
    var sync=function(){
      if(!nav)return;
      var off=maxScroll()<2;
      nav.hidden=off;
      Array.prototype.forEach.call(nav.querySelectorAll('button'),function(b){
        b.disabled=off;
        b.setAttribute('aria-disabled',off?'true':'false');
      });
    };
    c.__mp7Sync=sync;
    cars.push(c);
    sync();
    c.addEventListener('scroll',sync,{passive:true});
    if(window.ResizeObserver){new ResizeObserver(sync).observe(c)}else{window.addEventListener('resize',sync)}
  });

  var els=r.querySelectorAll('.mp7-rev');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.1});
  els.forEach(function(e){io.observe(e)});
})();
