'use strict';
window.OrbitAPI=(()=>{
 let config=null,me={authenticated:false},ready;
 async function request(path,{method='GET',data}={}){
  const r=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(75000),headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(me.csrf?{'X-ORBIT-CSRF':me.csrf}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})});
  const result=await r.json().catch(()=>({error:'The ORBIT server is unavailable.'}));if(!r.ok){if(r.status===401){me={authenticated:false};window.dispatchEvent(new Event('orbit:account-change'));}throw new Error(result.error||'Request failed.');}return result;
 }
 async function init(){if(!ready)ready=(async()=>{try{config=await request('config');me=await request('auth/me');}catch{config={server:false,voice:false,photos:false};}return config;})();return ready;}
 async function passkey(register,values){await init();if(!config.server)throw new Error('Start the included Node server to use passkeys.');if(!window.PublicKeyCredential)throw new Error('Passkeys require HTTPS or localhost and a compatible browser.');const pk=await import('./vendor/passkeys.js');const action=register?'register':'login';const options=await request('auth/'+action+'/options',{method:'POST',data:values||{}});const response=await(register?pk.startRegistration({optionsJSON:options}):pk.startAuthentication({optionsJSON:options}));me=await request('auth/'+action+'/verify',{method:'POST',data:response});window.dispatchEvent(new Event('orbit:account-change'));return me;}
 return {init,request,passkey,get config(){return config;},get me(){return me;},async logout(){await request('auth/logout',{method:'POST',data:{}});me={authenticated:false};window.dispatchEvent(new Event('orbit:account-change'));},async voice(kind){await init();if(!config.server||!config.voice)throw new Error('Voice is not configured. Local text commands remain available.');return request('voice/session',{method:'POST',data:{kind}});}};
})();
