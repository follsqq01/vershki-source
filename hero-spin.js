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
  const letterData = [
    ['в','blue'],['е','coral'],['р','pink'],
    ['ш','mint'],['к','gold'],['и','lavender'],
  ];
  const shapeData = ['star','sun','capsule','diamond','flower','drop'];
  const items = [];
  letterData.forEach(([letter,color],i)=>{
    const bead = i===0 ? blue : i===1 ? pink : blue.cloneNode(true);
    bead.classList.add(`bead-${color}`);
    bead.querySelector('span').textContent=letter;
    if(i>1) art.append(bead);
    items.push({el:bead,phase:(i*2-1)*Math.PI/6});
    const shape=i===0 ? star : document.createElement('div');
    if(i>0){shape.className=`hero-shape shape-${shapeData[i]}`;art.append(shape);}
    items.push({el:shape,phase:i*2*Math.PI/6});
  });
  items.forEach(({el})=>{el.classList.add('hero-orbit-item');el.setAttribute('aria-hidden','true');});
  let angle=0,velocity=0,drag=null,visible=true,last=0,raf=0;
  const render=()=>{
    const ranked=items.map((item,index)=>({
      index,
      distance:Math.abs(Math.atan2(Math.sin(item.phase+angle),Math.cos(item.phase+angle))),
    })).sort((a,b)=>a.distance-b.distance);
    const visibleSet=new Set(ranked.slice(0,3).map(item=>item.index));
    items.forEach(({el,phase},index)=>{
      const a=phase+angle;
      el.style.transform=`translate(-50%, -50%) translate(${756+750*Math.sin(a)}rem, ${1100-750*Math.cos(a)}rem)`;
      el.style.visibility=visibleSet.has(index)?'visible':'hidden';
      el.style.opacity=visibleSet.has(index)?'1':'0';
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
    const delta=(event.clientX-drag.x)/(750*scale);
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
