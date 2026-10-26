/* Project the inscription onto a sphere, then rotate the sphere around the
   fixed fishing-line axis. The silhouette and the holes never rotate in 2D. */
function createBeadSurface(element, options) {
  const {width, height, center, radius, axis, glyph} = options;
  const canvas = document.createElement('canvas');
  canvas.className = 'sphere-surface';
  canvas.width = Math.round(width * 1.5);
  canvas.height = Math.round(height * 1.5);
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:false, antialias:true});
  if (!gl) return createCanvasSurface(element, options);
  const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}`;
  const fragment = `precision highp float;
    uniform vec2 resolution, size, center, radius;
    uniform vec3 axis;
    uniform float angle;
    uniform sampler2D decal;
    void main() {
      vec2 pixel=vec2(gl_FragCoord.x/resolution.x,1.0-gl_FragCoord.y/resolution.y)*size;
      vec2 xy=(pixel-center)/radius;
      float r2=dot(xy,xy);
      if(r2>=1.0){gl_FragColor=vec4(0.0);return;}
      vec3 front=vec3(xy,sqrt(1.0-r2));
      vec3 a=axis;
      float c=cos(angle),s=sin(angle);
      // Inverse Rodrigues rotation: find the original point now facing us.
      vec3 original=front*c-cross(a,front)*s+a*dot(a,front)*(1.0-c);
      if(original.z<=0.0){gl_FragColor=vec4(0.0);return;}
      vec2 uv=(center+original.xy*radius)/size;
      vec4 ink=texture2D(decal,uv);
      ink.a*=smoothstep(0.0,0.08,front.z)*smoothstep(0.0,0.04,original.z);
      gl_FragColor=ink;
    }`;
  function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;}
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniform=name=>gl.getUniformLocation(program,name);
  gl.uniform2f(uniform('resolution'),canvas.width,canvas.height);gl.uniform2f(uniform('size'),width,height);gl.uniform2f(uniform('center'),...center);gl.uniform2f(uniform('radius'),...radius);gl.uniform3f(uniform('axis'),...axis);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,makeGlyphTexture(width,height,glyph));
  gl.viewport(0,0,canvas.width,canvas.height);
  const angleUniform=uniform('angle');
  element.querySelector('.letter')?.parentElement.replaceWith(canvas);
  return angle=>{gl.uniform1f(angleUniform,angle);gl.drawArrays(gl.TRIANGLES,0,6);};
}
function makeGlyphTexture(width,height,glyph){
  const texture=document.createElement('canvas');texture.width=Math.ceil(width*2);texture.height=Math.ceil(height*2);
  const ctx=texture.getContext('2d');ctx.scale(2,2);ctx.translate(glyph.x,glyph.y);ctx.rotate(glyph.rotation*Math.PI/180);ctx.font=`${glyph.size}px Oranienbaum`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=glyph.color;ctx.filter='blur(2px)';ctx.fillText(glyph.text,0,0);return texture;
}
// Canvas fallback uses the same inverse sphere projection on a smaller buffer.
function createCanvasSurface(element,{width,height,center,radius,axis,glyph}){
  const texture=makeGlyphTexture(width,height,glyph),source=texture.getContext('2d').getImageData(0,0,texture.width,texture.height);
  const canvas=document.createElement('canvas');canvas.className='sphere-surface';canvas.width=Math.round(width*.6);canvas.height=Math.round(height*.6);canvas.setAttribute('aria-hidden','true');const ctx=canvas.getContext('2d'),frame=ctx.createImageData(canvas.width,canvas.height),points=[];
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const px=(x/.6-center[0])/radius[0],py=(y/.6-center[1])/radius[1],r=px*px+py*py;if(r<1)points.push([4*(y*canvas.width+x),px,py,Math.sqrt(1-r)]);}
  element.querySelector('.letter')?.parentElement.replaceWith(canvas);
  return angle=>{frame.data.fill(0);const c=Math.cos(angle),s=Math.sin(angle),[ax,ay,az]=axis;
    for(const [index,x,y,z] of points){const dot=ax*x+ay*y+az*z;const ox=x*c-(ay*z-az*y)*s+ax*dot*(1-c),oy=y*c-(az*x-ax*z)*s+ay*dot*(1-c),oz=z*c-(ax*y-ay*x)*s+az*dot*(1-c);if(oz<=0)continue;const tx=Math.floor((center[0]+ox*radius[0])*2),ty=Math.floor((center[1]+oy*radius[1])*2);if(tx<0||ty<0||tx>=texture.width||ty>=texture.height)continue;const from=4*(ty*texture.width+tx);frame.data.set(source.data.subarray(from,from+4),index);}
    ctx.putImageData(frame,0,0);
  };
}
