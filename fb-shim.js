/* Survival Summoner: Pick Up! — ตัวเชื่อม Firebase (ไม่ต้องแก้ไฟล์นี้) · v3 (1.66.0): Guest เล่นในเครื่องอย่างเดียว ไม่สร้างไอดีนิรนามและไม่เขียนข้อมูลขึ้นระบบ */
(function(){
  var C=window.FB_CFG;if(window.claude||!C||!C.apiKey)return;
  var V='10.12.2',BASE='https://www.gstatic.com/firebasejs/'+V+'/';
  function load(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
  var auth=null,fs=null,rt=null,conn=false,off=0,LIVE=90000,DONE=false;
  // Guest เดิม (ไอดีนิรนาม): จำกุญแจเซฟในเครื่องไว้ ลบข้อมูลของตัวเองบนระบบ แล้วลบไอดีนิรนามทิ้ง
  async function dropAnon(u){var id=u.uid;try{if(!localStorage.getItem('pmu_gk'))localStorage.setItem('pmu_gk',id)}catch(e){}
    var ps=['tower','arena','lobby','stats','accounts','push','gmem','flags','arena_hits'].map(function(c){return fs.doc(c+'/'+id).delete().catch(function(){})});
    ps.push(rt.ref('ids/'+id).remove().catch(function(){}));ps.push(rt.ref('presence/'+id).remove().catch(function(){}));
    try{await Promise.race([Promise.all(ps),new Promise(function(r){setTimeout(r,4000)})])}catch(e){}
    try{await u.delete()}catch(e){try{await auth.signOut()}catch(x){}}}
  function snow(){return Date.now()+off}
  function uid(){return auth&&auth.currentUser?auth.currentUser.uid:null}
  function say(m){try{if(typeof toast==='function')return toast(m)}catch(e){}alert(m)}
  var ready=(async function(){try{
    if(!window.firebase){await load(BASE+'firebase-app-compat.js');await Promise.all(['auth','firestore','database'].map(function(n){return load(BASE+'firebase-'+n+'-compat.js')}))}
    firebase.initializeApp(C);auth=firebase.auth();fs=firebase.firestore();try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch(e){}rt=firebase.database();
    var u0=await new Promise(function(res){var un=auth.onAuthStateChanged(function(u){un();res(u)})});
    if(u0&&u0.isAnonymous){await dropAnon(u0)}
    if(!uid()||auth.currentUser.isAnonymous){DONE=true;return null}/* Guest: ไม่เชื่อมฐานข้อมูล เซฟอยู่ในเครื่อง */
    rt.ref('.info/connected').on('value',function(s){conn=!!s.val()});
    rt.ref('.info/serverTimeOffset').on('value',function(s){off=+s.val()||0});
    try{rt.ref('ids/'+uid()).set('f').catch(function(){})}catch(e){}
    DONE=true;return{db:mkDb(),user:mkUser(),room:mkRoom(),downloads:null};
  }catch(e){console.warn('Firebase init failed',e);DONE=true;return null}})();
  // ---------- ฐานข้อมูล (Firestore) ----------
  function wrapDoc(p){var r=fs.doc(p),o={id:r.id,path:p,get:function(){return r.get()},update:function(d){return r.update(d)},delete:function(){return r.delete()},onSnapshot:function(a,b){return r.onSnapshot(a,b)},set:function(d,x){return x?r.set(d,x):r.set(d)}};
    if(/^accounts\/[^\/]+$/.test(p)){o.set=function(d,x){var an=!auth.currentUser||auth.currentUser.isAnonymous;rt.ref('ids/'+p.split('/')[1]).set(an?true:'f').catch(function(){});return x?r.set(d,x):r.set(d)}}
    if(/^arena_hits\/[^\/]+$/.test(p)){o.set=function(d,x){var h=d&&Array.isArray(d.hits)?d.hits[d.hits.length-1]:null;if(h&&h.d&&/^[\w-]{1,128}$/.test(h.d))fs.collection('arena_in/'+h.d+'/h').add({by:uid(),w:h.w?1:0,t:+h.t||Date.now(),n:String(h.n||'').slice(0,16)}).catch(function(){});return x?r.set(d,x):r.set(d)}}
    return o}
  function accountsColl(){var c=fs.collection('accounts');return{get:function(){return c.get()},orderBy:function(a,b){return c.orderBy(a,b)},limit:function(n){return c.limit(n)},where:function(a,b,v){return c.where(a,b,v)},
    onSnapshot:function(cb,err){var ref=rt.ref('ids');var h=function(s){var n=0;s.forEach(function(c){if(c.val()==='f')n++});cb({size:n,docs:[],empty:!n})}/* นับเฉพาะบัญชีจริง (Google / ไอดี) ไม่นับ Guest */;ref.on('value',h,err);return function(){ref.off('value',h)}}}}
  function arenaColl(){var lim=60,q=function(){return fs.collection('arena').orderBy('fame','desc').limit(lim)};var api={orderBy:function(){return api},limit:function(n){lim=Math.min(60,n);return api},get:function(){return q().get()},
    onSnapshot:function(cb,err){var last=0,run=function(){last=Date.now();q().get().then(cb).catch(err||function(){})};run();var t=setInterval(function(){var onA=false;try{onA=(typeof tab!=='undefined'&&tab==='arena')}catch(e){}if((onA&&Date.now()-last>90000)||Date.now()-last>1200000)run()},15000);return function(){clearInterval(t)}}};return api}
  function hitsColl(){var api={orderBy:function(){return api},limit:function(){return api},onSnapshot:function(cb,err){var me=uid();return fs.collection('arena_in/'+me+'/h').orderBy('t','desc').limit(20).onSnapshot(function(qs){cb({docs:qs.docs.map(function(d){var x=d.data()||{};return{id:String(x.by||'x').replace(/[^\w-]/g,'').slice(0,64)||'x',data:function(){return{hits:[{d:me,w:x.w,t:x.t,n:x.n}]}}}})})},err)}};return api}
  function mkDb(){return{doc:function(p){return wrapDoc(p)},collection:function(p){if(p==='accounts')return accountsColl();if(p==='arena')return arenaColl();if(p==='arena_hits')return hitsColl();return fs.collection(p)}}}
  // ---------- ผู้ใช้ ----------
  function mkUser(){return{id:async function(){return uid()},isOwner:async function(){return !!window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID},canEdit:async function(){return !!window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID},can:async function(){return true}}}
  // ---------- ผู้เล่นออนไลน์ & แชทสด (Realtime Database) ----------
  function mkRoom(){var me=uid(),pref=rt.ref('presence/'+me),pres={},peersCb=[],chatCb=[],boot=Date.now(),TS=firebase.database.ServerValue.TIMESTAMP,last={};
    var norm=function(p){var o=Object.assign({},p||{});if(!auth.currentUser||auth.currentUser.isAnonymous)o.g=1;else delete o.g;return o};/* g=1 คือ Guest */
    var put=function(){pres=norm(pres);return pref.set({p:pres,t:TS}).catch(function(){})};
    rt.ref('.info/connected').on('value',function(s){if(s.val()){pref.onDisconnect().remove();put()}});
    setInterval(function(){if(conn)put()},30000);// ส่งสัญญาณว่ายังออนไลน์ทุก 30 วินาที
    var emit=function(){var now=snow(),peers=Object.keys(last).filter(function(k){var x=last[k];return k===me||(x&&+x.t>now-LIVE)}).map(function(k){return{peer:k,isMe:k===me,kind:'viewer',presence:(last[k]&&last[k].p)||{}}});peersCb.forEach(function(f){try{f({peers:peers})}catch(e){}})};
    rt.ref('presence').on('value',function(s){last=s.val()||{};emit()});setInterval(emit,15000);// ตัดรายการค้าง (ไม่มีสัญญาณเกิน 90 วินาที) ออกจากยอด
    var onLive=function(s){var k=s.key,v=s.val();if(!v||k===me||!(+v.t>boot-5000))return;chatCb.forEach(function(f){try{f({isMe:false,sameTab:false,data:v.d})}catch(e){}})};
    rt.ref('live').on('child_added',onLive);rt.ref('live').on('child_changed',onLive);
    return{onPeers:function(f){peersCb.push(f);return function(){}},on:function(t,f){if(t==='chat')chatCb.push(f);return function(){}},
      presence:async function(p){pres=norm(p);await pref.set({p:pres,t:TS})},emit:async function(t,d){if(t==='chat')await rt.ref('live/'+me).set({d:d,t:TS})},connected:function(){return conn}}}
  // ---------- เข้าสู่ระบบ ----------
  var IDD='@id.survival-summoner.app';
  function idEmail(id){return String(id||'').trim().toLowerCase()+IDD}
  function idOk(id){return /^[a-z0-9_]{4,16}$/.test(String(id||'').trim().toLowerCase())}
  async function dropMe(){try{if(uid())await rt.ref('presence/'+uid()).remove()}catch(e){}}
  function gkey(){try{return localStorage.getItem('pmu_gk')||'offline'}catch(e){return'offline'}}
  function markPrev(){try{if(!auth.currentUser||auth.currentUser.isAnonymous)localStorage.setItem('pmu_prev_anon',gkey())}catch(e){}}
  async function fbLogin(){var p=new firebase.auth.GoogleAuthProvider();try{markPrev();await auth.signInWithPopup(p);location.reload()}
    catch(e){if(e&&(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use')&&e.credential){try{markPrev();await dropMe();await auth.signInWithCredential(e.credential);location.reload()}catch(x){say('เข้าสู่ระบบไม่สำเร็จ')}}else if(!e||e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')say('เข้าสู่ระบบไม่สำเร็จ: '+((e&&e.code)||'unknown'))}}
  // ---------- สมัคร / เข้าสู่ระบบด้วยไอดี + รหัสผ่าน (แยกจาก Google · ใช้ Firebase Email/Password ภายใน) ----------
  async function fbRegister(id,pw){if(!idOk(id))throw{code:'id/bad'};if(String(pw||'').length<6)throw{code:'auth/weak-password'};var em=idEmail(id);
    markPrev();await dropMe();await auth.createUserWithEmailAndPassword(em,pw);
    try{await fs.doc('accounts/'+uid()).set({idn:String(id).trim().toLowerCase(),reg:new Date().toISOString()},{merge:true})}catch(e){}location.reload()}
  async function fbLoginPw(id,pw){if(!idOk(id))throw{code:'id/bad'};markPrev();await dropMe();await auth.signInWithEmailAndPassword(idEmail(id),pw);location.reload()}
  function fbEmail(){var u=auth&&auth.currentUser;if(!u||!u.email)return'';return u.email.slice(-IDD.length)===IDD?'ไอดี '+u.email.slice(0,-IDD.length):u.email}
  function fbProv(){var u=auth&&auth.currentUser;if(!u)return'';if(u.isAnonymous)return'guest';return u.email&&u.email.slice(-IDD.length)===IDD?'id':'google'}
  async function fbLogout(){await dropMe();try{await auth.signOut()}catch(e){}location.reload()}
  window.claude={fb:true,use:async function(n){var x=await ready;return x&&x[n]||null},fbAnon:function(){return !auth||!auth.currentUser||auth.currentUser.isAnonymous},fbEmail:fbEmail,fbProv:fbProv,fbRegister:fbRegister,fbLoginPw:fbLoginPw,fbIdOk:idOk,fbUid:function(){return uid()||''},fbLogin:fbLogin,fbLogout:fbLogout,
    fbDone:function(){return DONE},fbGuestKey:gkey,
    /* เครื่องมือผู้พัฒนา (ล้างข้อมูล Guest): เข้าถึงฐานข้อมูลตรง ๆ ได้เฉพาะ UID ผู้พัฒนา */
    fbRaw:function(){return window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID?{fs:fs,rt:rt}:null}};
})();
