/* Survival Summoner: Pick Up! — ตัวเชื่อม Firebase (ไม่ต้องแก้ไฟล์นี้) */
(function(){
  var C=window.FB_CFG;if(window.claude||!C||!C.apiKey)return;
  var V='10.12.2',BASE='https://www.gstatic.com/firebasejs/'+V+'/';
  function load(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
  var auth=null,fs=null,rt=null,conn=false;
  function uid(){return auth&&auth.currentUser?auth.currentUser.uid:null}
  function say(m){try{if(typeof toast==='function')return toast(m)}catch(e){}alert(m)}
  var ready=(async function(){try{
    if(!window.firebase){await load(BASE+'firebase-app-compat.js');await Promise.all(['auth','firestore','database'].map(function(n){return load(BASE+'firebase-'+n+'-compat.js')}))}
    firebase.initializeApp(C);auth=firebase.auth();fs=firebase.firestore();try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch(e){}rt=firebase.database();
    await new Promise(function(res){var un=auth.onAuthStateChanged(function(u){if(u){un();res()}else auth.signInAnonymously().catch(function(e){console.warn('anon sign-in failed',e);un();res()})})});
    if(!uid())return null;
    rt.ref('.info/connected').on('value',function(s){conn=!!s.val()});
    return{db:mkDb(),user:mkUser(),room:mkRoom(),downloads:null};
  }catch(e){console.warn('Firebase init failed',e);return null}})();
  // ---------- ฐานข้อมูล (Firestore) ----------
  function wrapDoc(p){var r=fs.doc(p),o={id:r.id,path:p,get:function(){return r.get()},update:function(d){return r.update(d)},delete:function(){return r.delete()},onSnapshot:function(a,b){return r.onSnapshot(a,b)},set:function(d,x){return x?r.set(d,x):r.set(d)}};
    if(/^accounts\/[^\/]+$/.test(p)){o.set=function(d,x){rt.ref('ids/'+p.split('/')[1]).set(true).catch(function(){});return x?r.set(d,x):r.set(d)}}
    if(/^arena_hits\/[^\/]+$/.test(p)){o.set=function(d,x){var h=d&&Array.isArray(d.hits)?d.hits[d.hits.length-1]:null;if(h&&h.d&&/^[\w-]{1,128}$/.test(h.d))fs.collection('arena_in/'+h.d+'/h').add({by:uid(),w:h.w?1:0,t:+h.t||Date.now(),n:String(h.n||'').slice(0,16)}).catch(function(){});return x?r.set(d,x):r.set(d)}}
    return o}
  function accountsColl(){var c=fs.collection('accounts');return{get:function(){return c.get()},orderBy:function(a,b){return c.orderBy(a,b)},limit:function(n){return c.limit(n)},where:function(a,b,v){return c.where(a,b,v)},
    onSnapshot:function(cb,err){var ref=rt.ref('ids');var h=function(s){cb({size:s.numChildren(),docs:[],empty:!s.numChildren()})};ref.on('value',h,err);return function(){ref.off('value',h)}}}}
  function arenaColl(){var lim=60,q=function(){return fs.collection('arena').orderBy('fame','desc').limit(lim)};var api={orderBy:function(){return api},limit:function(n){lim=Math.min(60,n);return api},get:function(){return q().get()},
    onSnapshot:function(cb,err){var last=0,run=function(){last=Date.now();q().get().then(cb).catch(err||function(){})};run();var t=setInterval(function(){var onA=false;try{onA=(typeof tab!=='undefined'&&tab==='arena')}catch(e){}if((onA&&Date.now()-last>90000)||Date.now()-last>1200000)run()},15000);return function(){clearInterval(t)}}};return api}
  function hitsColl(){var api={orderBy:function(){return api},limit:function(){return api},onSnapshot:function(cb,err){var me=uid();return fs.collection('arena_in/'+me+'/h').orderBy('t','desc').limit(20).onSnapshot(function(qs){cb({docs:qs.docs.map(function(d){var x=d.data()||{};return{id:String(x.by||'x').replace(/[^\w-]/g,'').slice(0,64)||'x',data:function(){return{hits:[{d:me,w:x.w,t:x.t,n:x.n}]}}}})})},err)}};return api}
  function mkDb(){return{doc:function(p){return wrapDoc(p)},collection:function(p){if(p==='accounts')return accountsColl();if(p==='arena')return arenaColl();if(p==='arena_hits')return hitsColl();return fs.collection(p)}}}
  // ---------- ผู้ใช้ ----------
  function mkUser(){return{id:async function(){return uid()},isOwner:async function(){return !!window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID},canEdit:async function(){return !!window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID},can:async function(){return true}}}
  // ---------- ผู้เล่นออนไลน์ & แชทสด (Realtime Database) ----------
  function mkRoom(){var me=uid(),pref=rt.ref('presence/'+me),pres={},peersCb=[],chatCb=[],boot=Date.now(),TS=firebase.database.ServerValue.TIMESTAMP;
    rt.ref('.info/connected').on('value',function(s){if(s.val()){pref.onDisconnect().remove();pref.set({p:pres,t:TS}).catch(function(){})}});
    rt.ref('presence').on('value',function(s){var v=s.val()||{},peers=Object.keys(v).map(function(k){return{peer:k,isMe:k===me,kind:'viewer',presence:(v[k]&&v[k].p)||{}}});peersCb.forEach(function(f){try{f({peers:peers})}catch(e){}})});
    var onLive=function(s){var k=s.key,v=s.val();if(!v||k===me||!(+v.t>boot-5000))return;chatCb.forEach(function(f){try{f({isMe:false,sameTab:false,data:v.d})}catch(e){}})};
    rt.ref('live').on('child_added',onLive);rt.ref('live').on('child_changed',onLive);
    return{onPeers:function(f){peersCb.push(f);return function(){}},on:function(t,f){if(t==='chat')chatCb.push(f);return function(){}},
      presence:async function(p){pres=p||{};await pref.set({p:pres,t:TS})},emit:async function(t,d){if(t==='chat')await rt.ref('live/'+me).set({d:d,t:TS})},connected:function(){return conn}}}
  // ---------- เข้าสู่ระบบ ----------
  async function fbLogin(){var p=new firebase.auth.GoogleAuthProvider();try{if(auth.currentUser&&auth.currentUser.isAnonymous)await auth.currentUser.linkWithPopup(p);else await auth.signInWithPopup(p);location.reload()}
    catch(e){if(e&&(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use')&&e.credential){try{await auth.signInWithCredential(e.credential);location.reload()}catch(x){say('เข้าสู่ระบบไม่สำเร็จ')}}else if(!e||e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')say('เข้าสู่ระบบไม่สำเร็จ: '+((e&&e.code)||'unknown'))}}
  async function fbLogout(){try{await auth.signOut()}catch(e){}location.reload()}
  window.claude={fb:true,use:async function(n){var x=await ready;return x&&x[n]||null},fbAnon:function(){return !auth||!auth.currentUser||auth.currentUser.isAnonymous},fbEmail:function(){return auth&&auth.currentUser&&auth.currentUser.email||''},fbUid:function(){return uid()||''},fbLogin:fbLogin,fbLogout:fbLogout};
})();
