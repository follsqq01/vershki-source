"use strict";
// A closed, rounded star mesh: both faces and the rim share the same geometry.
async function createStarSurface(host, axis) {
  const canvas = document.createElement('canvas');
  canvas.className = 'star-surface';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
  if (!gl) throw new Error('WebGL unavailable');
  const source = new Image();
  source.src = 'assets/hero-star.png';
  await source.decode();
  const probe = document.createElement('canvas');
  probe.width = source.naturalWidth; probe.height = source.naturalHeight;
  const ctx = probe.getContext('2d', {willReadFrequently:true});
  ctx.drawImage(source,0,0);
  const {data} = ctx.getImageData(0,0,probe.width,probe.height);
  const contour=[];
  // Follow the original Figma silhouette, including its asymmetry and soft tips.
  for(let i=0;i<240;i++) {
    const a=Math.PI/2+i*Math.PI*2/240;
    let radius=.1;
    for(let r=.1;r<1;r+=.002) {
      const x=Math.round((.5+Math.cos(a)*r/2)*(probe.width-1));
      const y=Math.round((.5-Math.sin(a)*r/2)*(probe.height-1));
      if(data[(y*probe.width+x)*4+3]>18) radius=r;
    }
    contour.push([Math.cos(a)*radius,Math.sin(a)*radius]);
  }
  const rings = [[.001,.21],[.38,.21],[.65,.20],[.82,.18],[.93,.13],[.985,.06],[1,0],
    [.985,-.06],[.93,-.13],[.82,-.18],[.65,-.20],[.38,-.21],[.001,-.21]];
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
    varying vec3 N; varying vec3 P; varying vec2 uv;
    vec3 turn(vec3 v) { return v*cos(angle)+cross(axis,v)*sin(angle)+axis*dot(axis,v)*(1.0-cos(angle)); }
    void main() {
      P=turn(position); N=turn(normal); uv=position.xy*.5+.5;
      float w=1.0-P.z*.16;
      gl_Position=vec4(P.xy*.98,-P.z*.3,w);
    }
  `));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
    precision highp float; varying vec3 N; varying vec3 P; varying vec2 uv;
    uniform sampler2D artwork; uniform float angle; uniform vec3 axis;
    void main() {
      vec3 n=normalize(N), l=normalize(vec3(-.6,.85,1.5));
      vec4 original=texture2D(artwork,uv);
      vec3 edge=vec3(.86,.93,.36);
      float facing=abs(cos(angle)+axis.z*axis.z*(1.-cos(angle)));
      vec3 pigment=mix(edge,original.rgb,smoothstep(.15,.8,facing)*smoothstep(.1,.75,original.a));
      float shade=.88+.12*max(dot(n,l),0.);
      vec3 color=pigment*mix(shade,1.,facing*.85);
      float alpha=mix(1.,original.a,smoothstep(.3,.8,facing));
      gl_FragColor=vec4(color,alpha);
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
  const texture=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
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
