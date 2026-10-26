// The necklace follows the ellipse used by the original Figma thread.
function createStringMotion(art,states){
 const rotation=-4.61*Math.PI/180,cos=Math.cos(rotation),sin=Math.sin(rotation);
 const center=[729.0325,964.3155],rx=611.86,ry=573.76,unit=600;
 function point(distance){const t=distance/unit,x=rx*Math.sin(t),y=-ry*Math.cos(t);return [center[0]+x*cos-y*sin,center[1]+x*sin+y*cos];}
 function tangent(distance){const t=distance/unit,x=rx*Math.cos(t),y=ry*Math.sin(t),n=Math.hypot(x,y);return [(x*cos-y*sin)/n,(x*sin+y*cos)/n];}
 function nearest(x,y){const dx=x-center[0],dy=y-center[1];return Math.atan2((dx*cos+dy*sin)/rx,-(-dx*sin+dy*cos)/ry)*unit;}
 const centers=[[372.5,527.624],[1110.994,513.241],[732.1765,417]];
 const holes=[[239.53,625.925],[967.36,436.064],null];
 states.forEach((s,i)=>{s.distance=s.origin=nearest(...centers[i]);s.slideV=0;s.pathRotation=0;s.translation=[0,0];s.center=centers[i];s.el.style.transformOrigin=`${centers[i][0]-parseFloat(s.el.style.left)}px ${centers[i][1]-parseFloat(s.el.style.top)}px`;});
 const chain=[states[0],states[2],states[1]],gap=380,lower=chain[0].origin-220,upper=chain[2].origin+220;
 const ns='http://www.w3.org/2000/svg';
 function wire(front){const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 1512 1800');svg.classList.add('moving-thread');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(ns,'path');path.setAttribute('fill','none');path.setAttribute('stroke','#505050');path.setAttribute('stroke-width','2');path.setAttribute('stroke-linecap','round');svg.append(path);if(front)art.append(svg);else art.prepend(svg);return {svg,path};}
 const back=wire(false),front=wire(true);
 const originals=[...art.querySelectorAll('.layer')].filter(el=>el.querySelector('img[src*="thread-"],img[src*="hole-back"]'));
 function move(s,delta){const index=chain.indexOf(s),before=s.distance;s.distance=Math.max(lower+index*gap,Math.min(upper-(2-index)*gap,s.distance+delta));
  for(let i=index-1;i>=0;i--)chain[i].distance=Math.min(chain[i].distance,chain[i+1].distance-gap);
  for(let i=index+1;i<3;i++)chain[i].distance=Math.max(chain[i].distance,chain[i-1].distance+gap);
  if(Math.abs(s.distance-before)<Math.abs(delta)*.2)s.slideV=0;
 }
 function segment(from,to){let d='';const count=Math.max(2,Math.ceil(Math.abs(to-from)/9));for(let i=0;i<=count;i++){const p=point(from+(to-from)*i/count);d+=(i?' L':'M')+p.map(v=>v.toFixed(2)).join(' ');}return d;}
 function transformedHole(s,i){const [hx,hy]=holes[i],dx=hx-s.center[0],dy=hy-s.center[1],c=Math.cos(s.pathRotation),sn=Math.sin(s.pathRotation);return [s.center[0]+s.translation[0]+dx*c-dy*sn,s.center[1]+s.translation[1]+dx*sn+dy*c];}
 let signature='';
 function render(){const next=states.map(s=>s.distance.toFixed(3)).join(',');if(next===signature)return;signature=next;
  const moved=states.some(s=>Math.abs(s.distance-s.origin)>.01);
  back.svg.style.display=front.svg.style.display=moved?'block':'none';originals.forEach(el=>el.style.visibility=moved?'hidden':'');
  states.forEach(s=>{const p=point(s.distance),p0=point(s.origin),v=tangent(s.distance),v0=tangent(s.origin);s.translation=[p[0]-p0[0],p[1]-p0[1]];s.pathRotation=Math.atan2(v[1],v[0])-Math.atan2(v0[1],v0[0]);s.el.style.transform=`translate(${s.translation[0]}px,${s.translation[1]}px) rotate(${s.pathRotation}rad)`;s.el.dataset.slide=(s.distance-s.origin).toFixed(2);});
  if(!moved)return;
  back.path.setAttribute('d',segment(-1100,1150));
  // Foreground ends terminate at the moving holes, keeping the string threaded.
  let d='';for(const i of [0,1]){const hole=transformedHole(states[i],i),end=nearest(...hole),start=i===0?-1100:end-95,near=point(end-20);d+=segment(start,end-20)+` Q ${near[0]} ${near[1]} ${hole[0]} ${hole[1]} `;}
  front.path.setAttribute('d',d);
 }
 function direction(s){const local=[s.axis[0],s.axis[1]],n=Math.hypot(...local),c=Math.cos(s.pathRotation),sn=Math.sin(s.pathRotation);return [(local[0]*c-local[1]*sn)/n,(local[0]*sn+local[1]*c)/n];}
 function reset(){states.forEach(s=>{s.distance=s.origin;s.slideV=0;});render();}
 render();return {move,render,direction,reset};
}
