
(function(){
  var r=document.getElementById('mp7-x');if(!r)return;
  r.querySelectorAll('[data-tabs]').forEach(function(g){
    g.addEventListener('click',function(e){var b=e.target.closest('.mp7-tab');if(!b)return;
      g.querySelectorAll('.mp7-tab').forEach(function(x){x.classList.remove('is-on')});b.classList.add('is-on')})});
  var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  r.querySelectorAll('[data-car]').forEach(function(c){
    var n=c.nextElementSibling,d=n&&n.nextElementSibling&&n.nextElementSibling.classList.contains('mp7-dots')?n.nextElementSibling:null,t;
    var kids=function(){return Array.prototype.slice.call(c.children)};
    var step=function(){return c.firstElementChild?c.firstElementChild.offsetWidth+16:300};
    var go=function(dir){var max=c.scrollWidth-c.clientWidth-4;
      if(dir>0&&c.scrollLeft>=max)c.scrollTo({left:0,behavior:'smooth'});
      else if(dir<0&&c.scrollLeft<=4)c.scrollTo({left:max,behavior:'smooth'});
      else c.scrollBy({left:dir*step(),behavior:'smooth'})};
    if(n){n.querySelector('[data-prev]').onclick=function(){go(-1)};n.querySelector('[data-next]').onclick=function(){go(1)}}
    if(d){kids().forEach(function(k,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Slide '+(i+1));
      b.onclick=function(){c.scrollTo({left:i*step(),behavior:'smooth'})};d.appendChild(b)});
      var upd=function(){var i=Math.round(c.scrollLeft/step());Array.prototype.forEach.call(d.children,function(b,x){b.classList.toggle('on',x===i)})};
      c.addEventListener('scroll',upd,{passive:true});upd()}
    if(c.hasAttribute('data-auto')&&!rm){var start=function(){t=setInterval(function(){go(1)},4500)},stop=function(){clearInterval(t)};
      start();c.addEventListener('mouseenter',stop);c.addEventListener('mouseleave',start);c.addEventListener('touchstart',stop,{passive:true})}});
  var els=r.querySelectorAll('.mp7-rev');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.1});
  els.forEach(function(e){io.observe(e)});
})();
