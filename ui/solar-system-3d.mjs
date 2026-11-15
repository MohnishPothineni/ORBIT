import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

export function mountSolarSystem(root,planets,onSelect){
 const host=root.querySelector('.solar-viewport');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{root.querySelector('.solar-loading').textContent='3D requires WebGL. Enable hardware acceleration in your browser and refresh to view the map.';return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 const canvas=renderer.domElement;canvas.className='solar-canvas';canvas.tabIndex=0;canvas.setAttribute('aria-label','3D solar system. Drag to rotate, scroll or pinch to zoom. Arrow keys rotate and plus or minus zoom. Select planets using the buttons below.');host.appendChild(canvas);host.classList.add('solar-is-3d');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,1,6000);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=35;controls.maxDistance=1900;controls.maxPolarAngle=Math.PI*.92;
 const initial=new THREE.Vector3(0,720,880);camera.position.copy(initial);controls.update();
 scene.add(new THREE.AmbientLight(0xb9cfee,1.5));
 const sunlight=new THREE.PointLight(0xffe7bf,250000,0,2);scene.add(sunlight);
 const sun=new THREE.Mesh(new THREE.SphereGeometry(29,40,24),new THREE.MeshBasicMaterial({color:0xffc45b}));scene.add(sun);
 const glow=new THREE.Mesh(new THREE.SphereGeometry(35,32,16),new THREE.MeshBasicMaterial({color:0xffc45b,transparent:true,opacity:.12,depthWrite:false}));scene.add(glow);
 function label(text){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.font='28px sans-serif';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#091322';ctx.fillStyle='#e8f0fa';ctx.strokeText(text,128,43);ctx.fillText(text,128,43);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.scale.set(75,18.75,1);return sprite;}
 const sunLabel=label('Sun');sunLabel.position.set(0,45,0);scene.add(sunLabel);
 const meshes=[],labels=[];
 planets.forEach((p,i)=>{
  const points=Array.from({length:161},(_,j)=>{const a=j/160*Math.PI*2;return new THREE.Vector3(Math.cos(a)*p.radius,0,Math.sin(a)*p.radius);});
  scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x536c8c,transparent:true,opacity:.5})));
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(p.size,36,24),new THREE.MeshStandardMaterial({color:p.color,roughness:.85}));mesh.userData.index=i;scene.add(mesh);meshes.push(mesh);
  if(i===5){const ring=new THREE.Mesh(new THREE.RingGeometry(24,35,80),new THREE.MeshStandardMaterial({color:0xd8c493,side:THREE.DoubleSide,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2+.35;mesh.add(ring);}
  const name=label(p.name);scene.add(name);labels.push(name);
 });
 const marker=new THREE.Mesh(new THREE.TorusGeometry(1,.025,8,64),new THREE.MeshBasicMaterial({color:0x9bdcff,depthTest:false}));scene.add(marker);let selected=2,focused=false,transition=null,focusDistance=200;
 const fields=new THREE.Group(),magnetic=new THREE.Group(),electric=new THREE.Group();
 fields.add(magnetic,electric);fields.visible=false;scene.add(fields);
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function clearGroup(group){while(group.children.length){const child=group.children[0];group.remove(child);child.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});}}
 function buildFields(i){
  clearGroup(magnetic);clearGroup(electric);
  const r=planets[i].size;
  const line=points=>magnetic.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x61e6ff,transparent:true,opacity:.8})));
  if(i===1||i===3){
   // Draped solar-wind field: no invented global dipole for Venus or Mars.
   for(let j=0;j<12;j++){const phi=j/12*Math.PI*2,points=[];for(let k=0;k<=80;k++){const x=(-3+k/80*8)*r,rho=r*(1.35+1.1*Math.exp(-Math.pow(x/r,2)/3));points.push(new THREE.Vector3(x,Math.cos(phi)*rho,Math.sin(phi)*rho));}line(points);}
  }else{
   for(let j=0;j<10;j++)for(const extent of [2,3.4]){const phi=j/10*Math.PI*2,points=[],start=Math.asin(Math.sqrt(1/extent));for(let k=0;k<=80;k++){const theta=start+(Math.PI-2*start)*k/80,d=r*extent*Math.sin(theta)**2;points.push(new THREE.Vector3(d*Math.sin(theta)*Math.cos(phi),d*Math.cos(theta),d*Math.sin(theta)*Math.sin(phi)));}line(points);}
   magnetic.rotation.z=[.05,0,.2,0,.17,0,1.03,.82][i];
  }
  if(i===1||i===3)magnetic.rotation.z=0;
  // Uniform illustrative solar-wind electric field, not planetary net charge.
  for(const x of [-2.5,-1.3,0,1.3,2.5])for(const z of [-1.7,1.7])electric.add(new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(x*r,-2*r,z*r),4*r,0xffcf68,.35*r,.18*r));
  focusDistance=Math.max(r*13,145);controls.minDistance=r*4;
 }
 function focus(i){
  selected=i;focused=true;buildFields(i);fields.visible=true;
  transition={start:performance.now(),fromTarget:controls.target.clone(),fromOffset:camera.position.clone().sub(controls.target)};
 }
 controls.addEventListener('start',()=>{transition=null;});
 // A deterministic star field keeps reloads stable and uses no remote assets.
 const stars=[];for(let i=0;i<1400;i++){const a=i*2.399963,b=Math.acos(1-2*(i+.5)/1400),r=2500;stars.push(r*Math.sin(b)*Math.cos(a),r*Math.cos(b),r*Math.sin(b)*Math.sin(a));}
 const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0x9fb8da,size:2.2,sizeAttenuation:true})));
 const observer=new ResizeObserver(()=>resize());observer.observe(host);
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}resize();
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;down=null;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes,false)[0];if(hit)onSelect(hit.object.userData.index);});
 canvas.addEventListener('keydown',e=>{const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'];if(!keys.includes(e.key))return;e.preventDefault();const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi-=.12;if(e.key==='ArrowDown')s.phi+=.12;if(e.key==='+'||e.key==='=')s.radius/=1.12;if(e.key==='-')s.radius*=1.12;s.phi=THREE.MathUtils.clamp(s.phi,.08,Math.PI*.92);s.radius=THREE.MathUtils.clamp(s.radius,controls.minDistance,1900);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();});
 let disposed=false;
 function dispose(){if(disposed)return;disposed=true;observer.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});renderer.dispose();}
 function update(elapsed){if(!root.isConnected){dispose();return;}planets.forEach((p,i)=>{const a=i*2.399-1.1+elapsed/p.year;meshes[i].position.set(Math.cos(a)*p.radius,0,Math.sin(a)*p.radius);labels[i].position.copy(meshes[i].position).add(new THREE.Vector3(0,p.size+17,0));});if(focused){
 const target=meshes[selected].position;
 if(transition){const t=reducedMotion?1:Math.min((performance.now()-transition.start)/900,1),ease=t*t*(3-2*t);const offset=transition.fromOffset.clone().lerp(new THREE.Vector3(.6,.45,1).normalize().multiplyScalar(focusDistance),ease);controls.target.copy(transition.fromTarget).lerp(target,ease);camera.position.copy(controls.target).add(offset);if(t===1)transition=null;}
 else{const delta=target.clone().sub(controls.target);controls.target.copy(target);camera.position.add(delta);}
 fields.position.copy(target);
 // Align the schematic wind frame with the Sun–planet direction.
 fields.rotation.y=-Math.atan2(target.z,target.x);
 }marker.position.copy(meshes[selected].position);marker.scale.setScalar(planets[selected].size+7);marker.quaternion.copy(camera.quaternion);controls.update();if(!document.hidden)renderer.render(scene,camera);}
 // Detect navigation even after the parent animation loop stops.
 const removal=new MutationObserver(()=>{if(!root.isConnected){dispose();removal.disconnect();}});removal.observe(root.parentNode,{childList:true});
 update(0);
 return {update,select(i,closeUp=true){selected=i;if(closeUp)focus(i);},zoom(value){transition=null;camera.position.sub(controls.target).setLength((focused?focusDistance:initial.length())/value).add(controls.target);controls.update();},fields(m,e){magnetic.visible=m;electric.visible=e;},reset(){focused=false;transition=null;fields.visible=false;controls.minDistance=170;camera.position.copy(initial);controls.target.set(0,0,0);controls.update();}};
}
