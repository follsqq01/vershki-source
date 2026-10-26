const art=document.querySelector('#art');
function asset(parent,name,x,y,w,h,angle=0,extra=''){const el=document.createElement('div');el.className='layer';Object.assign(el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});el.innerHTML=`<img src="assets/${name}.svg" alt="" draggable="false" style="transform:rotate(${angle}deg) ${extra}">`;parent.append(el);return el;}
function bead(name,x,y,w,h,label){const el=document.createElement('button');el.className='bead';el.dataset.bead=name;el.setAttribute('aria-label',label+' — тяни вдоль лески, чтобы двигать, поперёк — вращать; стрелки влево и вправо двигают, вверх и вниз вращают');Object.assign(el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});art.append(el);return el;}
asset(art,'thread-back',74.27,344.47,1309.525,1239.691,-4.61);
const pink=bead('pink',843.5,238.35,570.751,549.347,'Розовая бусинка');
asset(pink,'pink',852.67-843.5,259.63-238.35,516.648,507.222,68.34,'skewX(-1.82deg) scaleY(-1)');
function letter(parent,text,x,y,w,h,angle,color,size,blur){const el=document.createElement('div');el.className='layer';Object.assign(el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});el.innerHTML=`<span class="letter" style="transform:rotate(${angle}deg);color:${color};font-size:${size}px;filter:blur(${blur}px)">${text}</span>`;parent.append(el);}
letter(pink,'е',1211.97-139.97-843.5,365-238.35,279.94,363.629,29.17,'#e5b3dd',287.306,8.08);
asset(pink,'pink-hole',925.96-843.5,388.34-238.35,82.801,95.448,28.2,'scaleY(-1)');
asset(pink,'pink-glow-bottom',1039.01-843.5,601.41-238.35,240.27,53.579,-89.4);
asset(pink,'pink-glow-side',1226-843.5,422-238.35,70.652,115.468,-10.98);
asset(art,'thread-middle',74.27,344.47,1309.525,1239.691,-4.61);
asset(art,'hole-back',210.73,570.46,84.316,86.521,-41.86);
const blue=bead('blue',138,288,469,472.247,'Голубая бусинка');
asset(blue,'blue',0,7,469,465.247,82.79,'skewX(-1.82deg) scaleY(-1)');
letter(blue,'в',457.25-127.2505-138,0,254.501,392.055,-19.87,'#8cbdf5',306.242,8.613);
asset(blue,'blue-hole',55,287,93.06,101.85,-34.14,'scaleY(-1)');
asset(blue,'blue-glow-side',436.64-138,387.08-288,107.972,125.996,-32.81);
asset(blue,'blue-glow-bottom',261.17-138,599.62-288,260.923,118.919,-74.95);
const star=bead('star',497,135,470.353,454.825,'Лаймовая звезда');asset(star,'star',0,0,470.353,454.825);
asset(art,'thread-front',82.54,496.95,1242.49,1103.285,-6.06);
const logo=document.querySelector('.logo');['в','е','р','ш','к','и'].forEach((t,i)=>{const el=document.createElement('span');const pos=[[0,.29],[59.07,.29],[118.01,0],[118.01,73.24],[177.08,73.24],[236.14,72.24]][i];Object.assign(el.style,{left:pos[0]+'px',top:pos[1]+'px'});if(i===2)el.className='long';el.innerHTML=(i===2?'':'<img src="assets/logo-circle.svg" alt="">')+`<b>${t}</b>`;logo.append(el)});
const scene=document.querySelector('#scene'),viewport=document.querySelector('#viewport');function resize(){const mobile=innerWidth<601;const scale=innerWidth/1512;const designHeight=mobile?1240:850;scene.style.transform=`scale(${scale})`;viewport.style.height=mobile?Math.max(designHeight*scale,innerHeight)+'px':Math.max(designHeight*scale,innerHeight)+'px';scene.style.top=mobile?Math.max(0,(innerHeight-designHeight*scale)*.28)+'px':'0';}addEventListener('resize',resize);resize();
// The string is the fixed rotation axis, not the screen's Z axis.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,elapsed=0,previous=0;
const axes=[[.63,-.46,-.6257],[.73,.39,-.56125],[1,0,0]].map(a=>{const n=Math.hypot(...a);return a.map(v=>v/n);});
const states=[blue,pink,star].map((el,i)=>({el,i,axis:axes[i],angle:0,v:0,drag:false,manual:false,draw:null}));
const stringMotion=createStringMotion(art,states);
const starVolume=document.createElement('div');starVolume.className='star-volume';
const starFront=star.querySelector('.layer');
// Original star artwork on the faces and depth slices of a 3D bead.
for(let z=-18;z<=18;z+=6){const slice=starFront.cloneNode(true);slice.style.transform=`translateZ(${z}px)`;if(Math.abs(z)<18){slice.style.filter='brightness(.95)';slice.style.opacity='.12';}else{slice.style.backfaceVisibility='hidden';if(z<0)slice.style.transform+=' rotateY(180deg)';}starVolume.append(slice);}
starFront.replaceWith(starVolume);
document.fonts.ready.then(()=>{
  states[0].draw=createBeadSurface(blue,{width:469,height:472.247,center:[234.5,239.624],radius:[211,214],axis:axes[0],glyph:{text:'в',x:319.25,y:223,rotation:-19.87,size:306.242,color:'#649dce'}});
  states[1].draw=createBeadSurface(pink,{width:570.751,height:549.347,center:[267.494,274.891],radius:[199,197],axis:axes[1],glyph:{text:'е',x:368.47,y:335,rotation:29.17,size:287.306,color:'#b775c3'}});
});
states.forEach(s=>{
  s.el.dataset.axis=s.axis.join(',');
  s.el.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    if(!s.manual)s.angle+=Math.sin(elapsed*.008)*.18;
    s.manual=true;s.drag=true;s.v=0;s.slideV=0;s.lastX=e.clientX;s.lastY=e.clientY;s.lastTime=e.timeStamp;
    s.el.setPointerCapture(e.pointerId);
  });
  s.el.addEventListener('pointermove',e=>{
    if(!s.drag)return;
    const dx=e.clientX-s.lastX,dy=e.clientY-s.lastY;
    const scale=scene.getBoundingClientRect().width/1512;
    const radius=200*scale;
    const direction=stringMotion.direction(s);
    // Only movement perpendicular to the line applies rotational torque.
    const delta=(-direction[1]*dx+direction[0]*dy)/radius;
    const dt=Math.max(8,e.timeStamp-s.lastTime);
    const along=(direction[0]*dx+direction[1]*dy)/scale;
    stringMotion.move(s,along);
    s.slideV=Math.max(-18,Math.min(18,along*16.667/dt));
    s.angle+=delta;s.v=Math.max(-.12,Math.min(.12,delta*16.667/dt));
    s.lastX=e.clientX;s.lastY=e.clientY;s.lastTime=e.timeStamp;
  });
  const release=e=>{if(e.timeStamp-s.lastTime>90){s.v=0;s.slideV=0;}s.drag=false;};
  s.el.addEventListener('pointerup',release);
  s.el.addEventListener('pointercancel',()=>{s.v=0;s.slideV=0;s.drag=false;});
  s.el.addEventListener('lostpointercapture',()=>{s.drag=false;});
  s.el.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();s.manual=true;s.slideV=0;s.v=0;
      if(e.key==='ArrowLeft'||e.key==='ArrowRight')stringMotion.move(s,e.key==='ArrowLeft'?-28:28);
      else s.angle+=e.key==='ArrowUp'?-.22:.22;
    }
    if(e.key==='Home'){s.angle=0;s.v=0;s.slideV=0;s.manual=true;stringMotion.move(s,s.origin-s.distance);}
  });
});
function tick(t){
  const dt=previous?Math.min((t-previous)/16.667,2):0;previous=t;
  if(!paused)elapsed+=dt;
  for(const s of states){
    if(!s.drag&&!paused){stringMotion.move(s,s.slideV*dt);s.slideV*=Math.pow(.90,dt);if(Math.abs(s.slideV)<.01)s.slideV=0;s.angle+=s.v*dt;s.v*=Math.pow(.955,dt);if(Math.abs(s.v)<.00005)s.v=0;}
    const angle=s.angle+(s.manual?0:Math.sin(elapsed*.008)*.18);
    s.el.dataset.rotation=angle.toFixed(4);
    if(s.draw&&s.renderedAngle!==angle){s.draw(angle);s.renderedAngle=angle;}
    if(s.i===2)starVolume.style.transform=`rotate3d(1,0,0,${angle}rad)`;
  }
  stringMotion.render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
const motion=document.querySelector('#motion');function updateMotion(){motion.textContent=paused?'▷':'Ⅱ';motion.setAttribute('aria-label',paused?'Включить анимацию':'Приостановить анимацию');motion.title=motion.getAttribute('aria-label');motion.setAttribute('aria-pressed',String(paused))}motion.onclick=()=>{paused=!paused;updateMotion()};updateMotion();reduced.addEventListener('change',e=>{paused=e.matches;updateMotion()});document.querySelector('#reset').onclick=()=>{elapsed=0;stringMotion.reset();states.forEach(s=>{s.angle=0;s.v=0;s.manual=false;});};
const about=document.querySelector('#about');document.querySelector('.more').onclick=e=>{e.preventDefault();about.hidden=false;document.querySelector('.close').focus()};function closeAbout(){about.hidden=true;document.querySelector('.more').focus()}document.querySelector('.close').onclick=closeAbout;document.querySelector('.back').onclick=closeAbout;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!about.hidden)closeAbout()});
