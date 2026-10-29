"use strict";
(() => {
  const hero = document.querySelector('.hero');
  const art = hero.querySelector('.hero-art');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width:700px)');
  let step = mobile.matches ? .88 : .7;
  const radius = 650;
  const centerY = 350 + radius;
  // в → звезда → е → жёлтая бусина → р → ш → бежевая бусина → к → и.
  const sequence = ['1.webp', '4.png', '3.webp', 'yellow.webp', '5.webp', '6.webp', '7.webp', '8.webp', '9.webp'];
  const ring = document.createElement('div');
  ring.className = 'hero-orbit-thread';
  ring.setAttribute('aria-hidden','true');
  const items = sequence.map((asset,index) => {
    const el = document.createElement('img');
    el.src = `assets/hero/${asset}?v=hero-order-yellow-1`;
    el.alt = ''; el.draggable = false;
    el.className = 'hero-orbit-item supplied-bead';
    el.setAttribute('aria-hidden','true');
    el.dataset.figure = asset;
    return {el,phase:(index-1)*step};
  });
  art.replaceChildren(ring,...items.map(item=>item.el));
  art.classList.add('hero-orbit');
  art.setAttribute('role','slider');art.tabIndex=0;
  art.setAttribute('aria-label','Бусины ВЕРШКИ — вращайте окружность перетаскиванием или стрелками');
  art.setAttribute('aria-valuemin','0');art.setAttribute('aria-valuemax','359');
  let period=sequence.length*step;
  let angle=0,velocity=0,drag=null,visible=true,last=0,raf=0;
  mobile.addEventListener('change', () => {
    const oldStep = step;
    step = mobile.matches ? .88 : .7;
    angle *= step / oldStep;
    period = sequence.length * step;
    items.forEach((item, index) => { item.phase = (index - 1) * step; });
    render();
  });
  function render(){
    for(const {el,phase} of items){
      // Recycle on the hidden part of the necklace, never on its visible arc.
      const phaseAngle=((phase+angle+period/2)%period+period)%period-period/2;
      const distance=Math.abs(phaseAngle);
      // Keep the top composition close; turn down the side of the circle
      // before the next ornament enters. No opacity or on-screen recycling.
      const side=Math.max(0,distance-step);
      const a=Math.sign(phaseAngle)*(distance+10*side*side);
      // Only recycle below the viewport, on the hidden bottom half of the circle.
      // Every ornament remains opaque until the hero clips it at its boundary.
      el.style.visibility=Math.abs(a)<=Math.PI?'visible':'hidden';
      el.style.transform=`translate(-50%, -50%) translate(${756+radius*Math.sin(a)}rem,${centerY-radius*Math.cos(a)}rem)`;
    }
    art.dataset.rotation=angle.toFixed(4);
    art.setAttribute('aria-valuenow',String(Math.floor(((angle%period+period)%period)/period*359)));
  }
  new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(hero);
  art.addEventListener('wheel',event=>{
    if(!event.target.closest('.hero-orbit-item'))return;
    event.preventDefault();
    velocity=0;
    angle-=event.deltaY*.0035 + event.deltaX*.0035;
    render();
  },{passive:false});
  art.addEventListener('pointerdown',event=>{
    if(event.button!==0||!event.target.closest('.hero-orbit-item'))return;
    drag={x:event.clientX,time:event.timeStamp};velocity=0;
    art.setPointerCapture(event.pointerId);art.classList.add('is-dragging');
  });
  art.addEventListener('pointermove',event=>{
    if(!drag)return;
    const scale=art.getBoundingClientRect().width/1512;
    const delta=(event.clientX-drag.x)/(radius*scale);
    angle+=delta;
    velocity=Math.max(-.9,Math.min(.9,delta/Math.max(.016,(event.timeStamp-drag.time)/1000)));
    drag={x:event.clientX,time:event.timeStamp};render();
  });
  const release=event=>{
    if(drag&&event.timeStamp-drag.time>100)velocity=0;
    drag=null;art.classList.remove('is-dragging');
  };
  art.addEventListener('pointerup',release);
  art.addEventListener('pointercancel',event=>{velocity=0;release(event);});
  art.addEventListener('lostpointercapture',release);
  art.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;
    event.preventDefault();velocity=0;
    angle=event.key==='Home'?0:angle+(event.key==='ArrowLeft'?-step:step);render();
  });
  function tick(time){
    const dt=last?Math.min(.04,(time-last)/1000):0;last=time;
    if(visible&&!document.hidden&&!drag&&!reduced.matches&&!document.body.classList.contains('motion-paused')&&!art.matches(':focus-visible')){
      angle+=(-.075+velocity)*dt;velocity*=Math.exp(-2.4*dt);render();
    }
    raf=requestAnimationFrame(tick);
  }
  render();raf=requestAnimationFrame(tick);
  window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
  window.addEventListener('pageshow',event=>{if(event.persisted){last=0;raf=requestAnimationFrame(tick);}});
})();
