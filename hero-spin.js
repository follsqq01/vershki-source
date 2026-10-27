"use strict";
(() => {
  const hero = document.querySelector('.hero');
  const art = hero.querySelector('.hero-art');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  art.classList.add('hero-orbit');
  art.setAttribute('role', 'slider');
  art.setAttribute('aria-label', 'Бусины ВЕРШКИ — вращайте окружность перетаскиванием или стрелками');
  art.setAttribute('aria-valuemin', '0');
  art.setAttribute('aria-valuemax', '359');
  art.tabIndex = 0;
  const ring = document.createElement('div');
  ring.className = 'hero-orbit-thread';
  ring.setAttribute('aria-hidden', 'true');
  art.prepend(ring);
  const blue = art.querySelector('.hero-blue');
  const pink = art.querySelector('.hero-pink');
  const star = art.querySelector('.hero-star');
  star.draggable = false;
  const items = [{el:blue,phase:-.7},{el:star,phase:0},{el:pink,phase:.7}];
  ['р','ш','к','и'].forEach((letter,i)=>{
    const el=(i%2 ? pink : blue).cloneNode(true);
    el.classList.remove('hero-blue','hero-pink');
    el.querySelector('span').textContent=letter;
    art.append(el);
    items.push({el,phase:1.68+i*.98});
  });
  items.forEach(({el})=>{el.classList.add('hero-orbit-item');el.setAttribute('aria-hidden','true');});
  let angle=0,velocity=0,drag=null,visible=true,last=0,raf=0;
  const render=()=>{
    items.forEach(({el,phase})=>{
      const a=phase+angle;
      el.style.transform=`translate(-50%, -50%) translate(${756+650*Math.sin(a)}rem, ${1000-650*Math.cos(a)}rem) rotate(${a*.24}rad)`;
    });
    art.dataset.rotation=angle.toFixed(4);
    art.setAttribute('aria-valuenow',String(Math.floor(((angle*180/Math.PI)%360+360)%360)));
  };
  new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(hero);
  art.addEventListener('pointerdown',event=>{
    if(event.button!==0 || !event.target.closest('.hero-orbit-item'))return;
    drag={x:event.clientX,time:event.timeStamp};velocity=0;
    art.setPointerCapture(event.pointerId);art.classList.add('is-dragging');
  });
  art.addEventListener('pointermove',event=>{
    if(!drag)return;
    const scale=art.getBoundingClientRect().width/1512;
    const delta=(event.clientX-drag.x)/(650*scale);
    angle+=delta;
    velocity=Math.max(-1.5,Math.min(1.5,delta/Math.max(.016,(event.timeStamp-drag.time)/1000)));
    drag={x:event.clientX,time:event.timeStamp};render();
  });
  const release=event=>{
    if(drag&&event.timeStamp-drag.time>100)velocity=0;
    drag=null;art.classList.remove('is-dragging');
  };
  art.addEventListener('pointerup',release);
  art.addEventListener('pointercancel',()=>{velocity=0;drag=null;art.classList.remove('is-dragging');});
  art.addEventListener('lostpointercapture',release);
  art.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;
    event.preventDefault();velocity=0;
    angle=event.key==='Home'?0:angle+(event.key==='ArrowLeft'?-.35:.35);render();
  });
  function tick(time){
    const dt=last?Math.min(.04,(time-last)/1000):0;last=time;
    if(visible&&!document.hidden&&!drag&&!reduced.matches&&!document.body.classList.contains('motion-paused')&&!art.matches(':focus-visible')){
      angle+=(-.07+velocity)*dt;velocity*=Math.exp(-2*dt);render();
    }
    raf=requestAnimationFrame(tick);
  }
  render();raf=requestAnimationFrame(tick);
  window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
  window.addEventListener('pageshow',event=>{if(event.persisted){last=0;raf=requestAnimationFrame(tick);}});
})();
