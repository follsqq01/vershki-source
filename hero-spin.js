"use strict";
(() => {
  const hero = document.querySelector('.hero');
  const art = hero.querySelector('.hero-art');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const step = .7;
  const radius = 650;
  const centerY = 350 + radius;
  const palette = {
    blue: ['#92bff3','#cee1fa','#76a8d8'],
    pink: ['#e4cfea','#f0c1e6','#bf89cb'],
    yellow: ['#ffd03e','#ffe995','#cf9b30'],
    coral: ['#ff7e60','#ffb39b','#d56854'],
    lime: ['#deef63','#f3f8ae','#a4bb42'],
  };
  const paths = {
    heart: 'M200 338 C169 315 53 233 48 144 C43 65 143 39 200 112 C257 39 357 65 352 144 C347 233 231 315 200 338 Z',
    flower: 'M200 53 C243 18 288 51 277 98 C333 76 370 129 334 170 C386 194 366 258 314 260 C335 317 282 352 240 318 C219 375 153 366 145 311 C92 343 46 297 75 248 C17 238 17 171 73 157 C38 110 82 61 131 86 C135 29 184 19 200 53 Z',
    diamond: 'M174 48 Q200 23 226 48 L352 174 Q377 200 352 226 L226 352 Q200 377 174 352 L48 226 Q23 200 48 174 Z',
    drop: 'M215 42 C238 73 339 179 339 247 C339 323 275 359 208 359 C135 359 73 318 73 247 C73 172 159 71 185 42 Q200 22 215 42 Z',
    bow: 'M193 162 C159 116 67 65 48 104 C26 148 27 271 61 292 C92 309 161 266 198 235 C240 272 317 313 344 284 C375 252 374 138 346 105 C314 69 234 122 207 162 Q200 171 193 162 Z',
  };
  const sequence = [
    ['letter','в','blue'], ['star','','lime'],
    ['letter','е','pink'], ['heart','','coral'],
    ['letter','р','yellow'], ['flower','','lime'],
    ['letter','ш','coral'], ['diamond','','pink'],
    ['letter','к','lime'], ['drop','','blue'],
    ['letter','и','pink'], ['bow','','yellow'],
  ];
  const ring = document.createElement('div');
  ring.className = 'hero-orbit-thread';
  ring.setAttribute('aria-hidden','true');
  const items = sequence.map(([type,letter,color],index) => {
    let el, hole, frontThread;
    const [top,bottom,ink]=palette[color];
    if(type==='star') {
      el=document.createElement('img');
      el.src='assets/hero-star.png';el.alt='';el.draggable=false;
      el.className='hero-star';
    } else if(type==='letter') {
      el=document.createElement('div');el.className='bead orbit-bead';
      const glyph=document.createElement('span');glyph.textContent=letter;
      hole=document.createElement('i');hole.className='hole';
      const threadSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      threadSvg.setAttribute('viewBox','0 0 394 394');
      threadSvg.classList.add('bead-thread-front');
      frontThread=document.createElementNS('http://www.w3.org/2000/svg','path');
      threadSvg.append(frontThread);
      el.append(glyph,hole,threadSvg);
      el.style.setProperty('--bead-top',top);
      el.style.setProperty('--bead-bottom',bottom);
      el.style.setProperty('--bead-ink',ink);
    } else {
      el=document.createElement('div');el.className='hero-shape';
      const id=`orbit-fill-${index}`,blur=`orbit-soft-${index}`;
      el.innerHTML=`<svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bottom}"/><stop offset=".55" stop-color="${top}"/><stop offset="1" stop-color="${ink}"/></linearGradient><filter id="${blur}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter></defs><path d="${paths[type]}" fill="url(#${id})" filter="url(#${blur})"/></svg>`;
    }
    el.classList.add('hero-orbit-item');el.setAttribute('aria-hidden','true');
    el.dataset.figure=letter||type;
    return {el,hole,frontThread,phase:(index-1)*step};
  });
  art.replaceChildren(ring,...items.map(item=>item.el));
  art.classList.add('hero-orbit');
  art.setAttribute('role','slider');art.tabIndex=0;
  art.setAttribute('aria-label','Бусины ВЕРШКИ — вращайте окружность перетаскиванием или стрелками');
  art.setAttribute('aria-valuemin','0');art.setAttribute('aria-valuemax','359');
  const period=sequence.length*step;
  let angle=0,velocity=0,drag=null,visible=true,last=0,raf=0,hovered=false;
  function render(){
    for(const {el,hole,frontThread,phase} of items){
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
      if(hole && Math.abs(a)<=Math.PI){
        // The cord emerges on the left-facing side, then disappears into the bead.
        const entry=2*Math.asin(197/(2*radius));
        const inset=2*Math.asin(145/(2*radius));
        const point=d=>[197+radius*(Math.sin(a-d)-Math.sin(a)),197-radius*(Math.cos(a-d)-Math.cos(a))];
        const [hx,hy]=point(inset);
        hole.style.left=`${hx}rem`;hole.style.top=`${hy}rem`;
        hole.style.transform=`translate(-50%,-50%) rotate(${a-inset}rad)`;
        const points=Array.from({length:9},(_,i)=>point(entry+(inset-entry)*i/8));
        frontThread.setAttribute('d',points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' '));
      }
    }
    art.dataset.rotation=angle.toFixed(4);
    art.setAttribute('aria-valuenow',String(Math.floor(((angle%period+period)%period)/period*359)));
  }
  new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(hero);
  art.addEventListener('pointerover',event=>{if(event.pointerType==='mouse')hovered=true;});
  art.addEventListener('pointerleave',()=>hovered=false);
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
    if(visible&&!document.hidden&&!drag&&!hovered&&!reduced.matches&&!document.body.classList.contains('motion-paused')&&!art.matches(':focus-visible')){
      angle+=(-.055+velocity)*dt;velocity*=Math.exp(-2.4*dt);render();
    }
    raf=requestAnimationFrame(tick);
  }
  render();raf=requestAnimationFrame(tick);
  window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
  window.addEventListener('pageshow',event=>{if(event.persisted){last=0;raf=requestAnimationFrame(tick);}});
})();
