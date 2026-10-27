"use strict";
// A closed, rounded star mesh: both faces and the rim share the same geometry.
function createStarSurface(host, axis) {
  const canvas = document.createElement('canvas');
  canvas.className = 'star-surface';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) throw new Error('WebGL unavailable');
  const corners = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .46 : 1;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  const contour = [];
  const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);
  corners.forEach((p, i) => {
    const start = mix(p, corners[(i + 9) % 10], .12);
    const end = mix(p, corners[(i + 1) % 10], .12);
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      contour.push(mix(mix(start, p, t), mix(p, end, t), t));
    }
  });
  const rings = [[.001,.24],[.38,.235],[.72,.215],[.9,.17],[.975,.09],[1,0],
    [.975,-.09],[.9,-.17],[.72,-.215],[.38,-.235],[.001,-.24]];
  const points = rings.flatMap(([r,z]) => contour.map(([x,y]) => [x*r,y*r,z]));
  const normals = points.map(() => [0,0,0]), faces = [], n = contour.length;
  const sub = (a,b) => a.map((v,i)=>v-b[i]);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  for (let r=0;r<rings.length-1;r++) for(let i=0;i<n;i++) {
    const a=r*n+i,b=r*n+(i+1)%n,c=(r+1)*n+i,d=(r+1)*n+(i+1)%n;
    faces.push([a,c,b],[b,c,d]);
  }
  faces.forEach(face => {
    const [a,b,c]=face, normal=cross(sub(points[b],points[a]),sub(points[c],points[a]));
    face.forEach(v=>normal.forEach((x,k)=>normals[v][k]+=x));
  });
  normals.forEach(v=>{const l=Math.hypot(...v)||1;v.forEach((x,i)=>v[i]=x/l);});
  const shader = (type, source) => {
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,`
    attribute vec3 position; attribute vec3 normal;
    uniform float angle; uniform vec3 axis;
    varying vec3 N; varying vec3 P;
    vec3 turn(vec3 v) { return v*cos(angle)+cross(axis,v)*sin(angle)+axis*dot(axis,v)*(1.0-cos(angle)); }
    void main() {
      P=turn(position); N=turn(normal);
      float w=1.0-P.z*.16;
      gl_Position=vec4(P.xy*.85,-P.z*.3,w);
    }
  `));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
    precision mediump float; varying vec3 N; varying vec3 P;
    void main() {
      vec3 n=normalize(N), l=normalize(vec3(-.6,.85,1.5));
      vec3 eye=normalize(vec3(0.,0.,5.)-P);
      float diffuse=max(dot(n,l),0.);
      float spec=pow(max(dot(n,normalize(l+eye)),0.),48.);
      float rim=pow(1.-max(dot(n,eye),0.),3.);
      vec3 base=vec3(.85,.94,.25);
      vec3 color=base*(.48+.53*diffuse)+vec3(1.,1.,.78)*spec*.48+vec3(.13,.14,.025)*rim;
      gl_FragColor=vec4(color,1.);
    }
  `));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  for (const [name,data] of [['position',points],['normal',normals]]) {
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(faces.flatMap(f=>f.flatMap(i=>data[i]))),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
  }
  gl.uniform3fv(gl.getUniformLocation(program,'axis'),axis);
  const angleLoc=gl.getUniformLocation(program,'angle');
  gl.enable(gl.DEPTH_TEST); gl.clearColor(0,0,0,0);
  host.append(canvas);
  let current=0;
  const render=angle=>{
    current=angle;
    const size=Math.max(1,Math.round(host.clientWidth*Math.min(devicePixelRatio,2)));
    if(canvas.width!==size||canvas.height!==size) {canvas.width=size;canvas.height=size;}
    gl.viewport(0,0,size,size);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(angleLoc,angle);gl.drawArrays(gl.TRIANGLES,0,faces.length*3);
  };
  new ResizeObserver(()=>render(current)).observe(host);
  render(0);
  return render;
}
