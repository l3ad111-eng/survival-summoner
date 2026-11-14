/* Survival Summoner: Pick Up! — ตัวเชื่อม Supabase (แทน fb-shim.js) · 1.71.0 · 1.74.0 แก้ช่องสดหลุด/โควตาสถานะออนไลน์ · 1.81.1 แก้จำนวนออนไลน์ไม่ตรงกัน/แชทไม่เด้ง/นับผู้ชม (Guest) · 1.81.2 Guest ต่อ Realtime ได้จริง (ไม่ส่งคีย์สาธารณะเป็นโทเค็น)
   ให้เกมเรียกคำสั่งแบบ Firebase (firestore/auth/realtime) ได้เหมือนเดิม แต่ทำงานบน Supabase
   - ข้อมูล: ตาราง docs (เก็บแบบ Firestore) ผ่าน rpc dget / q / qcount / tx · ฟังสดด้วย Realtime
   - ล็อกอิน: ไอดี+รหัส (อีเมลภายใน @id.survival-summoner.app) · Google · Guest (เล่นในเครื่อง)
   - ลอบบี้รวม: Realtime presence + broadcast แทน Realtime Database */
/* ---------- ย้ายเว็บ: เว็บเก่า (github.io) ส่งเซฟในเครื่องไปเว็บใหม่ทางลิงก์ แล้วเว็บใหม่รับเซฟ ---------- */
(function(){
  var NEW='https://survival-summoner.pages.dev/';
  function keys(){var o={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(/^(pmu|ss_)/.test(k))o[k]=localStorage.getItem(k)}return o}
  function b64u(u8){var s='';for(var i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function ub64(t){var s=atob(t.replace(/-/g,'+').replace(/_/g,'/')),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
  async function gz(str,de){var cs=de?new DecompressionStream('gzip'):new CompressionStream('gzip'),w=cs.writable.getWriter();w.write(de?str:new TextEncoder().encode(str));w.close();var b=await new Response(cs.readable).arrayBuffer();return de?new TextDecoder().decode(b):new Uint8Array(b)}
  try{
    if(/github\.io$/i.test(location.hostname)){window.__MOVING=1;document.documentElement.style.visibility='hidden';
      var o=keys(),n=Object.keys(o).length;
      if(!n||!window.CompressionStream){location.replace(NEW);return}
      gz(JSON.stringify({v:1,t:Date.now(),k:o})).then(function(u){location.replace(NEW+'#mv='+b64u(u))}).catch(function(){location.replace(NEW)});return}
    var m=/[#&]mv=([\w-]+)/.exec(location.hash);
    if(m&&window.DecompressionStream){window.__MOVING=1;document.documentElement.style.visibility='hidden';
      gz(ub64(m[1]),1).then(function(js){var d=JSON.parse(js),k=d&&d.k||{},have=false;for(var i=0;i<localStorage.length;i++){if(/^pmu_s_/.test(localStorage.key(i)))have=true};
        var ok=!have||confirm('พบเซฟจากเว็บเก่า ต้องการนำมาใช้แทนเซฟในเครื่องนี้หรือไม่?\n(กด “ยกเลิก” = ใช้เซฟเดิมในเครื่องนี้)');
        if(ok){for(var x in k){try{localStorage.setItem(x,k[x])}catch(e){}}try{localStorage.setItem('pmu_moved',String(Date.now()))}catch(e){}}
        /* กันเกมที่บูตอยู่ข้างหลังเขียนทับเซฟที่เพิ่งรับมา ระหว่างโหลดหน้าใหม่ */
        try{var _si=Storage.prototype.setItem,_ri=Storage.prototype.removeItem;Storage.prototype.setItem=function(a,b){if(/^(pmu|ss_)/.test(a))return;return _si.call(this,a,b)};Storage.prototype.removeItem=function(a){if(/^(pmu|ss_)/.test(a))return;return _ri.call(this,a)}}catch(e){}
        location.replace(location.pathname)}).catch(function(){location.replace(location.pathname)})}
  }catch(e){}
})();
(function(){
  if(window.__MOVING)return;
  var C=window.SB_CFG;if(window.claude||!C||!C.url||!C.key)return;
  var SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  var IDD='@id.survival-summoner.app',sb=null,me=null,sess=null,off=0,DONE=false,conn=false,LIVE=90000;
  function load(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
  function say(m){try{if(typeof toast==='function')return toast(m)}catch(e){}alert(m)}
  function snow(){return Date.now()+off}
  function uid(){return me}
  // ---------- ข้อผิดพลาดแบบ Firebase ----------
  function ferr(e){var m=String(e&&(e.message||e.msg)||e||''),c=e&&e.code,o=new Error(m);
    o.code=c==='42501'||/permission-denied/.test(m)?'permission-denied':c==='40001'||/aborted/.test(m)?'aborted':c==='P0002'||/not-found/.test(m)?'not-found'
      :/unauthenticated/.test(m)?'unauthenticated':/Failed to fetch|NetworkError|network|timeout/i.test(m)?'unavailable':(c||'unknown');return o}
  async function rpc(fn,args){var r=await sb.rpc(fn,args);if(r.error)throw ferr(r.error);return r.data}
  // ---------- snapshot ----------
  function DSnap(path,j){var id=path.split('/').pop();return{id:id,ref:docRef(path),exists:!!(j&&j.exists),_v:j&&j.exists?j.ver:null,data:function(){return j&&j.exists?clone(j.data):undefined},get:function(k){var d=j&&j.data;return d?d[k]:undefined}}}
  function QSnap(col,rows){var docs=(rows||[]).map(function(r){return DSnap(col+'/'+r.id,{exists:true,data:r.data,ver:r.ver})});
    return{docs:docs,size:docs.length,empty:!docs.length,forEach:function(f){docs.forEach(f)},docChanges:function(){return docs.map(function(d){return{type:'added',doc:d}})}}}
  function clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
  function clean(d){return JSON.parse(JSON.stringify(d===undefined?{}:d))}/* ตัด undefined ทิ้งเหมือน ignoreUndefinedProperties */
  // ---------- ฟังสด (Realtime) · หนึ่งช่องต่อคอลเลกชัน ----------
  var CH={};
  /* 1.74.0: ถ้าช่องหลุด (เน็ตสะดุด/สลับแอป/เซิร์ฟปิดช่อง) จะต่อใหม่เอง แล้วให้ทุกตัวที่ฟังอยู่โหลดข้อมูลล่าสุดทันที ({_re:1}) */
  var BAD={CHANNEL_ERROR:1,TIMED_OUT:1,CLOSED:1};
  /* 1.81.1: ช่องที่ทุกเครื่องต้องอยู่ห้องเดียวกัน (ผู้เล่นออนไลน์ · ลอบบี้) ต้องใช้ชื่อคงที่เสมอ
     แต่ sb.channel(ชื่อซ้ำ) จะคืน "ช่องเก่าที่กำลังปิด" มาแทน → ต่อใหม่ไม่ติด จำนวนคนค้าง/แชทไม่เข้า
     จึงต้องรอถอดช่องเก่าชื่อนั้นออกจากตัวเชื่อมให้หมดก่อน แล้วค่อยสร้างช่องใหม่ */
  var GRT=null;function RC(){return GRT||sb}/* ตัวเชื่อม Realtime ที่ใช้อยู่ (Guest ใช้ตัวแยกของตัวเอง ดู guestRt) */
  function chOff(topic,old){var T='realtime:'+topic,L=[];try{L=(RC().getChannels()||[]).filter(function(c){return c===old||c.topic===T})}catch(e){}if(old&&L.indexOf(old)<0)L.push(old);
    return Promise.all(L.map(function(c){return Promise.race([Promise.resolve().then(function(){return RC().removeChannel(c)}).catch(function(){}),new Promise(function(r){setTimeout(r,3000)})])})).then(function(){
      try{var A=(GRT||sb.realtime||{}).channels;if(A)L.forEach(function(c){if(Array.isArray(A)){var i=A.indexOf(c);if(i>=0)A.splice(i,1)}else if(A.delete)A.delete(c)})}catch(e){}})}
  function chNew(topic,opts){var x=RC().channel(topic,opts);return x&&!x.joinedOnce&&(!x.state||x.state==='closed')?x:null}/* null = ได้ช่องเก่าคืนมา ต้องถอดก่อน */
  function chKick(c){c.subs.slice().forEach(function(s){try{s({_re:1})}catch(e){}})}
  function chBuild(col,c){var x=sb.channel('docs:'+col+':'+(++c.gen)).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'col=eq.'+col},function(pl){c.subs.slice().forEach(function(s){try{s(pl)}catch(e){}})});c.ch=x;
    x.subscribe(function(st){if(c.ch!==x||c.dead)return;if(st==='SUBSCRIBED'){c.ok=true;if(c.down){c.down=false;chKick(c)}clearTimeout(c.rt)}
      else if(BAD[st]){c.ok=false;c.down=true;clearTimeout(c.rt);c.rt=setTimeout(function(){if(c.dead||c.ok||c.ch!==x)return;try{sb.removeChannel(x)}catch(e){}chBuild(col,c)},st==='CLOSED'?2500:12000)}})}
  function chOn(col,f){var c=CH[col];if(!c){c=CH[col]={subs:[],ch:null,gen:0,ok:false,down:false};chBuild(col,c)}
    c.subs.push(f);return function(){var i=c.subs.indexOf(f);if(i>=0)c.subs.splice(i,1);if(!c.subs.length){c.dead=true;clearTimeout(c.rt);try{sb.removeChannel(c.ch)}catch(e){}delete CH[col]}}}
  /* โหลดใหม่ทุกตัวที่ฟังอยู่: ตอนกลับเข้าแอป ตอนเน็ตกลับมา และทุก 90 วิ (กันพลาดข้อความ) */
  var RFT=0;function refreshAll(){if(Date.now()-RFT<3000)return;RFT=Date.now();for(var k in CH){var c=CH[k];if(!c.ok&&!c.dead){try{sb.removeChannel(c.ch)}catch(e){}chBuild(k,c)}chKick(c)}for(var r in RM){var R=RM[r];if(R&&!R.joined&&!R.dead)hubRe(R,r,1)}if(ROOMX&&ROOMX.fix)ROOMX.fix()}
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')setTimeout(refreshAll,400)});
  window.addEventListener('online',function(){setTimeout(refreshAll,800)});
  setInterval(function(){if(document.visibilityState==='visible'){RFT=0;refreshAll()}},90000);
  /* โควตาสถานะออนไลน์ของ Supabase: เครื่องละไม่เกิน 5 ครั้งต่อ 30 วิ (เกินแล้วเซิร์ฟปิดช่องทิ้ง) → คุมไว้ 4 ครั้ง รวมทุกช่อง · ส่งค่าล่าสุดเท่านั้น */
  var PQ={h:[],q:[],t:null};
  function presCall(key,fn){var i;for(i=0;i<PQ.q.length;i++)if(PQ.q[i].k===key){PQ.q[i].f=fn;break}if(i===PQ.q.length)PQ.q.push({k:key,f:fn});presPump()}
  function presPump(){clearTimeout(PQ.t);var now=Date.now();PQ.h=PQ.h.filter(function(t){return now-t<31000});
    while(PQ.q.length&&PQ.h.length<4){var x=PQ.q.shift();PQ.h.push(Date.now());try{Promise.resolve(x.f()).catch(function(){})}catch(e){}}
    if(PQ.q.length)PQ.t=setTimeout(presPump,Math.max(250,31000-(now-PQ.h[0])+60))}
  var ROOMX=null;
  function parentOf(p){var s=p.split('/');s.pop();return s.join('/')}
  // ---------- เอกสาร ----------
  function docRef(p){p=String(p).replace(/^\/+|\/+$/g,'');var id=p.split('/').pop();
    var r={id:id,path:p,parent:{path:parentOf(p)},
      get:async function(){return DSnap(p,await rpc('dget',{p:p}))},
      set:function(d,o){return write([{t:'set',p:p,d:clean(d),m:!!(o&&o.merge)}])},
      update:function(d){return write([{t:'update',p:p,d:clean(d)}])},
      delete:function(){return write([{t:'delete',p:p}])},
      collection:function(c){return colRef(p+'/'+c)},
      onSnapshot:function(cb,err){var alive=true,run=function(){r.get().then(function(s){if(alive)cb(s)}).catch(function(e){if(alive&&err)err(e)})};
        run();var un=chOn(parentOf(p),function(pl){if(pl&&pl._re)return run();var row=pl.new&&pl.new.path?pl.new:pl.old;if(row&&row.path===p){if(pl.eventType==='DELETE')cb(DSnap(p,{exists:false}));else if(pl.new&&pl.new.data)cb(DSnap(p,{exists:true,data:pl.new.data,ver:pl.new.ver}));else run()}});
        return function(){alive=false;un()}}};
    return r}
  async function write(ops){await rpc('tx',{reads:[],ops:ops})}
  // ---------- คอลเลกชัน / ค้นหา ----------
  function newId(){var a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',s='';var r=new Uint8Array(20);crypto.getRandomValues(r);for(var i=0;i<20;i++)s+=a[r[i]%62];return s}
  function colRef(col,st){col=String(col).replace(/^\/+|\/+$/g,'');st=st||{f:[],o:null,d:'asc',l:1000};
    var q={id:col.split('/').pop(),path:col,
      where:function(f,op,v){return colRef(col,{f:st.f.concat([[f,op,v]]),o:st.o,d:st.d,l:st.l})},
      orderBy:function(f,d){return colRef(col,{f:st.f,o:f,d:d||'asc',l:st.l})},
      limit:function(n){return colRef(col,{f:st.f,o:st.o,d:st.d,l:n})},
      doc:function(id){return docRef(col+'/'+(id||newId()))},
      add:async function(d){var r=docRef(col+'/'+newId());await r.set(d);return r},
      get:async function(){return QSnap(col,await rpc('q',{c:col,filters:st.f,ord:st.o,dir:st.d,lim:st.l}))},
      count:function(){return{get:async function(){var n=await rpc('qcount',{c:col,filters:st.f});return{data:function(){return{count:+n||0}}}}}},
      onSnapshot:function(cb,err){var alive=true,t=null,busy=false,again=false,run=function(){if(busy){again=true;return}busy=true;q.get().then(function(s){if(alive)cb(s)}).catch(function(e){if(alive&&err)err(e)}).finally(function(){busy=false;if(again){again=false;run()}})};
        run();var un=chOn(col,function(){clearTimeout(t);t=setTimeout(run,400)});/* มีอะไรเปลี่ยนในคอลเลกชัน → ค้นใหม่ (ไม่คิดเงินต่อการอ่าน) */
        return function(){alive=false;clearTimeout(t);un()}}};
    return q}
  // ---------- ทรานแซกชัน / batch ----------
  async function runTransaction(fn){var last=null;
    for(var k=0;k<6;k++){var reads={},ops=[];
      var tx={get:async function(ref){var s=await ref.get();reads[ref.path]=s._v;return s},
        set:function(ref,d,o){ops.push({t:'set',p:ref.path,d:clean(d),m:!!(o&&o.merge)});return tx},
        update:function(ref,d){ops.push({t:'update',p:ref.path,d:clean(d)});return tx},
        delete:function(ref){ops.push({t:'delete',p:ref.path});return tx}};
      var out=await fn(tx);
      try{await rpc('tx',{reads:Object.keys(reads).map(function(p){return{p:p,v:reads[p]}}),ops:ops});return out}
      catch(e){last=e;if(e.code!=='aborted')throw e;await new Promise(function(r){setTimeout(r,80+Math.random()*250*(k+1))})}}
    throw last}
  function batch(){var ops=[];var b={set:function(r,d,o){ops.push({t:'set',p:r.path,d:clean(d),m:!!(o&&o.merge)});return b},update:function(r,d){ops.push({t:'update',p:r.path,d:clean(d)});return b},
    delete:function(r){ops.push({t:'delete',p:r.path});return b},commit:function(){return ops.length?write(ops):Promise.resolve()}};return b}
  var FS={doc:docRef,collection:function(c){return colRef(c)},runTransaction:runTransaction,batch:batch,settings:function(){},enablePersistence:function(){return Promise.resolve()}};
  // ---------- Realtime Database จำลอง (ลอบบี้รวม: ตำแหน่ง/แชท/คำท้า/ของที่ยึด) ----------
  // hub/rN/p → Realtime presence (หลุดแล้วหายเองแทน onDisconnect) · hub/rN/c → docs hubc/rN/m · hubx/A → docs hubx/A/f · hubloot/A → docs hubloot/A/k
  function pushId(){var t=Date.now().toString(36);while(t.length<9)t='0'+t;var a='0123456789abcdefghijklmnopqrstuvwxyz',r=new Uint8Array(8),s='';crypto.getRandomValues(r);for(var i=0;i<8;i++)s+=a[r[i]%36];return t+s}
  function rmap(path){var s=String(path||'').replace(/^\/+|\/+$/g,'').split('/'),n=s.length,ok=function(x){return /^[\w-]{1,128}$/.test(x||'')};
    if(s[0]==='.info')return{k:'info',w:s[1]};
    if(s[0]==='hub'&&/^r\d{1,2}$/.test(s[1]||'')){if(s[2]==='p'){if(n===3)return{k:'pres',room:s[1]};if(n===4&&ok(s[3]))return{k:'presLeaf',room:s[1],key:s[3]}}
      if(s[2]==='c'){if(n===3)return{k:'col',col:'hubc/'+s[1]+'/m'};if(n===4&&ok(s[3]))return{k:'leaf',p:'hubc/'+s[1]+'/m/'+s[3]}}}
    if((s[0]==='hubx'||s[0]==='hubloot')&&ok(s[1])){var sub=s[0]==='hubx'?'f':'k';if(n===2)return{k:'col',col:s[0]+'/'+s[1]+'/'+sub};if(n===3&&ok(s[2]))return{k:'leaf',p:s[0]+'/'+s[1]+'/'+sub+'/'+s[2]}}
    return{k:'no',path:s.join('/')}}
  function rsnap(key,v){v=v==null?null:clone(v);return{key:key,val:function(){return v},exists:function(){return v!=null},child:function(k){var x=v&&v[k];return rsnap(k,x)}}}
  function colObj(qs){var o=null;qs.docs.forEach(function(d){(o=o||{})[d.id]=d.data()});return o}
  var RM={};
  function room(r){var R=RM[r];if(R)return R;R=RM[r]={subs:[],mine:null,state:{},pk:{},bc:{},synced:false,joined:false,w:[],lt:0,gen:0};hubBuild(R,r);return R}
  function hubBuild(R,r){if(R.dead)return;var ch=chNew('hub-'+r,{config:{presence:{key:me},broadcast:{self:false}}});/* 1.81.1: ชื่อห้องคงที่ (เดิมต่อท้ายเลขรอบ → หลุดแล้วต่อใหม่ไปอยู่คนละห้องกับคนอื่น) */
    if(!ch){R.ch=null;R.joined=false;if(!R.fx){R.fx=1;chOff('hub-'+r).then(function(){R.fx=0;hubBuild(R,r)})}return}++R.gen;R.ch=ch;R.joined=false;
    ch.on('presence',{event:'sync'},function(){if(R.ch!==ch)return;var st=ch.presenceState(),o={};for(var k in st){var a=st[k]||[],best=null;a.forEach(function(m){if(m&&m.d&&(!best||(+m.d.hb||0)>=(+best.hb||0)))best=m.d});if(best)o[k]=best}
      R.pk=o;R.synced=true;hubEmit(R);var w=R.w;R.w=[];w.forEach(function(f){f()})})
      .on('presence',{event:'join'},function(e){if(R.ch===ch&&e&&e.key!==me&&R.mine)setTimeout(function(){hubSay(R,1)},200+Math.random()*600)})
      .on('presence',{event:'leave'},function(e){if(R.ch===ch&&e&&e.key&&e.key!==me){delete R.bc[e.key];hubSoon(R)}})
      .on('broadcast',{event:'st'},function(m){if(R.ch!==ch)return;var v=m&&m.payload;if(!v||!v.u||v.u===me)return;if(v.d==null)delete R.bc[v.u];else R.bc[v.u]={d:v.d,t:Date.now()};hubSoon(R)})
      .subscribe(function(st){if(R.ch!==ch||R.dead)return;if(st==='SUBSCRIBED'){R.joined=true;clearTimeout(R.rt);if(R.mine){R.lt=0;hubTrack(R,1);hubSay(R,1)}}
        else if(BAD[st]){R.joined=false;clearTimeout(R.rt);R.rt=setTimeout(function(){if(!R.dead&&!R.joined&&R.ch===ch)hubRe(R,r)},st==='CLOSED'?2500:12000)}})}
  function hubRe(R,r,now){if(R.dead||R.fx)return;var old=R.ch;R.ch=null;R.joined=false;R.fx=1;chOff('hub-'+r,old).then(function(){R.fx=0;if(!R.dead&&!R.ch)hubBuild(R,r)})}
  /* รวมสถานะ: รายชื่อจาก presence + ตำแหน่งล่าสุดจาก broadcast (เลือกอันที่ hb ใหม่กว่า) */
  function hubEmit(R){var o={},now=Date.now(),k;for(k in R.pk)o[k]=R.pk[k];
    for(k in R.bc){var b=R.bc[k];if(!o[k]&&now-b.t>60000){delete R.bc[k];continue}if(!o[k]||(+b.d.hb||0)>=(+o[k].hb||0))o[k]=b.d}
    if(R.mine)o[me]=R.mine;R.state=o;R.subs.slice().forEach(function(f){try{f(rsnap('p',o))}catch(e){}})}
  function hubSoon(R){if(R.et)return;R.et=setTimeout(function(){R.et=0;hubEmit(R)},120)}
  function hubSay(R,force){if(!R.joined||!R.ch)return;var now=Date.now();if(!force&&now-(R.st||0)<180){if(!R.sq)R.sq=setTimeout(function(){R.sq=0;hubSay(R,1)},200);return}R.st=now;
    try{R.ch.send({type:'broadcast',event:'st',payload:{u:me,d:R.mine}}).catch(function(){})}catch(e){}}
  function hubTrack(R,force){if(!R.joined||!R.ch)return;var now=Date.now(),gap=25000;
    if(force||now-R.lt>=gap){R.lt=now;clearTimeout(R.tq);R.tq=0;var ch=R.ch,d=R.mine;presCall('hub:'+R.gen,function(){return d?ch.track({d:R.mine||d}):ch.untrack()})}
    else if(!R.tq)R.tq=setTimeout(function(){R.tq=0;hubTrack(R,1)},gap-(now-R.lt)+50)}
  function roomFree(r){var R=RM[r];if(R&&!R.subs.length&&!R.mine&&!R.w.length){R.dead=true;clearTimeout(R.rt);clearTimeout(R.tq);chOff('hub-'+r,R.ch);delete RM[r]}}
  function roomRel(r){setTimeout(function(){roomFree(r)},8000)}
  function roomState(r){var R=room(r);return new Promise(function(res){var fin=function(){clearTimeout(t);res(R.state);roomRel(r)};if(R.synced)return fin();var t=setTimeout(function(){var i=R.w.indexOf(fin);if(i>=0)R.w.splice(i,1);res(R.state);roomRel(r)},3000);R.w.push(fin)})}
  var LST=[];
  function rref(path,qq){path=String(path||'').replace(/^\/+|\/+$/g,'');var M=rmap(path),key=path.split('/').pop();qq=qq||{};
    var nope=function(){return Promise.reject(new Error('ไม่รองรับบน Supabase: '+path))};
    var r={key:key,path:path,
      child:function(k){return rref(path+'/'+k)},
      orderByChild:function(f){return rref(path,{o:f,l:qq.l})},
      limitToLast:function(n){return rref(path,{o:qq.o,l:n})},
      onDisconnect:function(){return{remove:function(){return Promise.resolve()},set:function(){return Promise.resolve()},cancel:function(){return Promise.resolve()}}},
      set:function(v){
        if(M.k==='presLeaf'){if(M.key!==me)return nope();var R=room(M.room);R.mine=v==null?null:clean(v);if(!R.mine){if(R.joined){try{R.ch.send({type:'broadcast',event:'st',payload:{u:me,d:null}}).catch(function(){})}catch(e){}var ch0=R.ch;presCall('hub:'+R.gen,function(){return ch0.untrack()})}roomRel(M.room);return Promise.resolve()}hubSay(R);hubTrack(R);hubSoon(R);return Promise.resolve()}
        if(M.k==='leaf')return v==null?write([{t:'delete',p:M.p}]):write([{t:'set',p:M.p,d:clean(v),m:false}]);
        if(M.k==='col'&&v==null)return colRef(M.col).get().then(function(qs){var ops=qs.docs.map(function(d){return{t:'delete',p:M.col+'/'+d.id}});return ops.length?write(ops):null});
        return nope()},
      update:function(d){if(M.k==='leaf')return write([{t:'set',p:M.p,d:clean(d),m:true}]);if(M.k==='presLeaf'){var R=RM[M.room];return r.set(Object.assign({},R&&R.mine||{},d))}return nope()},
      remove:function(){return r.set(null)},
      push:function(d){if(M.k!=='col')return nope();var id=pushId(),c=rref(path+'/'+id),pr=d===undefined?Promise.resolve():c.set(d);c.then=pr.then.bind(pr);c.catch=pr.catch.bind(pr);return c},
      once:function(ev){
        if(M.k==='info')return Promise.resolve(rsnap(M.w,M.w==='connected'?true:off));
        if(M.k==='pres')return roomState(M.room).then(function(o){return rsnap(key,Object.keys(o).length?o:null)});
        if(M.k==='presLeaf')return roomState(M.room).then(function(o){return rsnap(key,o[M.key])});
        if(M.k==='leaf')return docRef(M.p).get().then(function(s){return rsnap(key,s.exists?s.data():null)});
        if(M.k==='col'){var q=colRef(M.col);if(qq.o)q=q.orderBy(qq.o,'desc');if(qq.l)q=q.limit(qq.l);return q.get().then(function(qs){return rsnap(key,colObj(qs))})}
        return nope()},
      on:function(ev,f){var un=function(){};
        if(M.k==='info'){var v=M.w==='connected'?true:off;setTimeout(function(){f(rsnap(M.w,v))},0)}
        else if(M.k==='pres'&&ev==='value'){var R=room(M.room);R.subs.push(f);if(R.synced)setTimeout(function(){f(rsnap(key,R.state))},0);un=function(){var i=R.subs.indexOf(f);if(i>=0)R.subs.splice(i,1);roomRel(M.room)}}
        else if(M.k==='leaf'&&ev==='value')un=docRef(M.p).onSnapshot(function(s){f(rsnap(key,s.exists?s.data():null))});
        else if(M.k==='col'&&ev==='value')un=colRef(M.col).onSnapshot(function(qs){f(rsnap(key,colObj(qs)))});
        else if(M.k==='col'&&ev==='child_added'){var alive=true,seen={},emit=function(id,v){if(!alive||seen[id])return;seen[id]=1;f(rsnap(id,v))};
          var q=colRef(M.col);if(qq.o)q=q.orderBy(qq.o,'desc');q=q.limit(qq.l||100);
          var pull=function(){q.get().then(function(qs){qs.docs.slice().reverse().forEach(function(d){emit(d.id,d.data())})}).catch(function(){})};
          var u2=chOn(M.col,function(pl){if(pl&&pl._re)return pull();if(pl.eventType==='INSERT'&&pl.new&&pl.new.data)emit(pl.new.id,pl.new.data)});
          pull();
          un=function(){alive=false;u2()}}
        LST.push({p:path,e:ev,f:f,un:un});return f},
      off:function(ev,f){for(var i=LST.length-1;i>=0;i--){var x=LST[i];if(x.p===path&&(!ev||x.e===ev)&&(!f||x.f===f)){try{x.un()}catch(e){}LST.splice(i,1)}}}};
    return r}
  var RT={ref:function(p){return rref(p)},goOnline:function(){},goOffline:function(){}};
  window.firebase=window.firebase||{};
  window.firebase.firestore=function(){return FS};
  window.firebase.firestore.FieldValue={delete:function(){return null},serverTimestamp:function(){return snow()}};
  window.firebase.database=function(){return RT};
  // ---------- คอลเลกชันพิเศษที่เกมเดิมทำผ่านตัวเชื่อม ----------
  function wrapDoc(p){var r=docRef(p);
    if(/^arena_hits\/[^\/]+$/.test(p)){var s0=r.set;r.set=function(d,x){var h=d&&Array.isArray(d.hits)?d.hits[d.hits.length-1]:null;
      if(h&&h.d&&/^[\w-]{1,128}$/.test(h.d))colRef('arena_in/'+h.d+'/h').add({by:uid(),w:h.w?1:0,t:+h.t||Date.now(),n:String(h.n||'').slice(0,16)}).catch(function(){});return s0(d,x)}}
    return r}
  function accountsColl(){var c=colRef('accounts');return{get:function(){return c.get()},orderBy:c.orderBy,limit:c.limit,where:c.where,doc:c.doc,count:c.count,
    onSnapshot:function(cb,err){var run=function(){c.count().get().then(function(s){var n=s.data().count;cb({size:n,docs:[],empty:!n})}).catch(err||function(){})};run();var t=setInterval(run,600000);return function(){clearInterval(t)}}}}
  function arenaColl(){var lim=60,q=function(){return colRef('arena').orderBy('fame','desc').limit(lim)};var api={orderBy:function(){return api},limit:function(n){lim=Math.min(60,n);return api},get:function(){return q().get()},
    onSnapshot:function(cb,err){var last=0,run=function(){last=Date.now();q().get().then(cb).catch(err||function(){})};run();var t=setInterval(function(){var onA=false;try{onA=(typeof tab!=='undefined'&&tab==='arena')}catch(e){}if((onA&&Date.now()-last>90000)||Date.now()-last>1200000)run()},15000);return function(){clearInterval(t)}}};return api}
  function hitsColl(){var api={orderBy:function(){return api},limit:function(){return api},onSnapshot:function(cb,err){var m=uid();return colRef('arena_in/'+m+'/h').orderBy('t','desc').limit(20).onSnapshot(function(qs){cb({docs:qs.docs.map(function(d){var x=d.data()||{};return{id:String(x.by||'x').replace(/[^\w-]/g,'').slice(0,64)||'x',data:function(){return{hits:[{d:m,w:x.w,t:x.t,n:x.n}]}}}})})},err)}};return api}
  function mkDb(){return{doc:function(p){return wrapDoc(p)},collection:function(p){if(p==='accounts')return accountsColl();if(p==='arena')return arenaColl();if(p==='arena_hits')return hitsColl();return colRef(p)}}}
  function mkUser(){return{id:async function(){return uid()},isOwner:async function(){return !!window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID},canEdit:async function(){return !!window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID},can:async function(){return true}}}
  // ---------- ผู้เล่นออนไลน์ & แชทสด (Realtime presence/broadcast) ----------
  /* 1.81.2: Guest ไม่มีโทเค็นล็อกอิน → supabase-js ส่งคีย์สาธารณะ (sb_publishable_…) เป็น access_token ให้ Realtime
     ซึ่งไม่ใช่ JWT → เซิร์ฟปฏิเสธ (MalformedJWT) ช่องหลุดวน ผู้ชมจึงไม่ถูกนับ
     แก้: Guest ใช้ตัวเชื่อม Realtime แยก (ไม่ผูกกับระบบล็อกอิน) และเข้าช่องโดยไม่ส่งโทเค็นเลย → เซิร์ฟใช้สิทธิ์ anon จากคีย์ตอนต่อ */
  function noTok(R){if(!R)return;var nop=function(){return Promise.resolve()};
    try{R.setAuth=nop}catch(e){}try{if(typeof R._performAuth==='function')R._performAuth=nop}catch(e){}try{if('accessToken' in R)R.accessToken=null}catch(e){}
    try{Object.defineProperty(R,'accessTokenValue',{configurable:true,get:function(){return null},set:function(){}})}catch(e){try{R.accessTokenValue=null}catch(e2){}}}
  function guestRt(){var RCl=window.supabase&&window.supabase.RealtimeClient,R=null;
    if(typeof RCl==='function'){try{R=new RCl(String(C.url).replace(/\/+$/,'').replace(/^http/i,'ws')+'/realtime/v1',{params:{apikey:C.key,eventsPerSecond:20}})}catch(e){R=null}}
    noTok(R||sb.realtime);GRT=R}/* ไม่มีคลาสแยก → ใช้ตัวเดิมแต่ปิดการส่งโทเค็น */
  /* 1.81.1: Guest เข้าห้องนี้ด้วย (คีย์ g-…, ติดธง g) เพื่อนับ "ผู้ชม" · ช่องชื่อ room คงที่ ต่อใหม่ผ่าน chOff/chNew */
  function mkRoom(guest){var pres={},sent='',peersCb=[],chatCb=[],ch=null,gen=0,rt=null,fixing=0,K=me;
    if(guest){var gk=String(gkey()).replace(/[^\w-]/g,'').slice(0,40);if(!gk||gk==='offline'){try{gk=sessionStorage.getItem('ss_gp')||''}catch(e){}if(!gk){gk='t'+Math.random().toString(36).slice(2,10);try{sessionStorage.setItem('ss_gp',gk)}catch(e){}}}K='g-'+gk}
    var norm=function(p){var o=Object.assign({},p||{});delete o.g;if(guest)o.g=1;return o};
    var emit=function(){var st=ch?ch.presenceState():{},peers=Object.keys(st).map(function(k){var x=(st[k]&&st[k][0])||{};return{peer:k,isMe:k===K,kind:'viewer',presence:x.p||{}}});
      if(!peers.some(function(x){return x.isMe}))peers.push({peer:K,isMe:true,kind:'viewer',presence:pres});peersCb.forEach(function(f){try{f({peers:peers})}catch(e){}})};
    var track=function(force){var j=JSON.stringify(pres);if(!conn||!ch||(!force&&j===sent))return;sent=j;var c0=ch;presCall('room',function(){return c0.track({p:pres,t:snow()})})};
    var redo=function(old){if(fixing)return;fixing=1;conn=false;chOff('room',old).then(function(){fixing=0;if(ch===old||!ch)build()})};
    var build=function(){var x=chNew('room',{config:{presence:{key:K},broadcast:{self:false}}});if(!x){var o=ch;ch=null;return redo(o)}ch=x;gen++;
      x.on('presence',{event:'sync'},function(){if(ch===x)emit()}).on('broadcast',{event:'chat'},function(m){if(ch!==x)return;var v=m&&m.payload;if(!v||v.u===K)return;chatCb.forEach(function(f){try{f({isMe:false,sameTab:false,data:v.d})}catch(e){}})})
        .subscribe(function(s){if(ch!==x)return;if(s==='SUBSCRIBED'){conn=true;clearTimeout(rt);track(1);emit()}else if(BAD[s]){conn=false;emit();clearTimeout(rt);rt=setTimeout(function(){if(!conn&&ch===x)redo(x)},s==='CLOSED'?2500:12000)}})};
    build();ROOMX={fix:function(){if(!conn&&!fixing)redo(ch)}};
    return{onPeers:function(f){peersCb.push(f);return function(){}},on:function(t,f){if(t==='chat')chatCb.push(f);return function(){}},
      presence:async function(p){pres=norm(p);track(0)},emit:async function(t,d){if(t==='chat'&&conn&&ch)await ch.send({type:'broadcast',event:'chat',payload:{u:K,d:d}})},connected:function(){return conn}}}
  // ---------- เข้าสู่ระบบ ----------
  function idEmail(id){return String(id||'').trim().toLowerCase()+IDD}
  function idOk(id){return /^[a-z0-9_]{4,16}$/.test(String(id||'').trim().toLowerCase())}
  function gkey(){try{return localStorage.getItem('pmu_gk')||'offline'}catch(e){return'offline'}}
  function markPrev(){try{if(!sess)localStorage.setItem('pmu_prev_anon',gkey())}catch(e){}}
  function emailOf(){return sess&&sess.user&&sess.user.email||''}
  async function fbLogin(){try{markPrev();var r=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(r.error)throw r.error}
    catch(e){say('เข้าสู่ระบบไม่สำเร็จ: '+((e&&(e.code||e.message))||'unknown'))}}
  async function fbRegister(id,pw){if(!idOk(id))throw{code:'id/bad'};if(String(pw||'').length<6)throw{code:'auth/weak-password'};markPrev();
    var r=await sb.auth.signUp({email:idEmail(id),password:pw});
    if(r.error){var m=String(r.error.message||'');throw{code:/registered|exists|Database error|เจ้าของ/i.test(m)?'auth/email-already-in-use':/password/i.test(m)?'auth/weak-password':'auth/'+(r.error.code||'error')}}
    if(!r.data||!r.data.session){var s2=await sb.auth.signInWithPassword({email:idEmail(id),password:pw});if(s2.error)throw{code:'auth/'+(s2.error.code||'error')}}
    try{var u=await rpc('app_uid',{});await write([{t:'set',p:'accounts/'+u,d:{idn:String(id).trim().toLowerCase(),reg:new Date().toISOString()},m:true}])}catch(e){}
    location.reload()}
  async function fbLoginPw(id,pw){if(!idOk(id))throw{code:'id/bad'};markPrev();
    var r=await sb.auth.signInWithPassword({email:idEmail(id),password:pw});
    if(r.error){/* บัญชีจาก Firebase เดิม: ให้ฟังก์ชันย้ายบัญชีตรวจรหัสกับระบบเดิมแล้วสร้างบัญชีใหม่ด้วยรหัสเดิม */
      var mv=null;try{mv=await sb.functions.invoke('migrate-account',{body:{kind:'pw',id:String(id).trim().toLowerCase(),pw:pw}})}catch(e){}
      if(mv&&mv.data&&mv.data.ok){r=await sb.auth.signInWithPassword({email:idEmail(id),password:pw});if(!r.error){location.reload();return}}
      throw{code:/invalid|credentials/i.test(String(r.error.message))?'auth/wrong-password':'auth/'+(r.error.code||'error')}}
    location.reload()}
  function fbEmail(){var e=emailOf();if(!e)return'';return e.slice(-IDD.length)===IDD?'ไอดี '+e.slice(0,-IDD.length):e}
  function fbProv(){if(!sess)return'';var e=emailOf();return e&&e.slice(-IDD.length)===IDD?'id':'google'}
  async function fbLogout(){try{await sb.auth.signOut()}catch(e){}location.reload()}
  // ---------- นำเข้าข้อมูลจาก Firebase (เจ้าของเกมกดครั้งเดียว) ----------
  // นำเข้าเฉพาะไอดีที่เล่นจริง (เซฟคลาวด์ผ่านหอคอยชั้น 1 ขึ้นไป หรือมีชื่อบนบอร์ดหอคอย) · ไอดีที่สมัครแล้วไม่เล่นไม่ดึงมา
  var UIDC=['accounts','arena','arena_hits','stats','lobby','flags','gmem','redeem'];/* คอลเลกชันที่ชื่อเอกสาร = ไอดี */
  var ALLC=['meta','chat','feedback','codes','codesrc','mail','raid','bans','mutes','tower_s','arena_s','mkt','auc','guilds','tlog','dlog'];
  var SUBC={arena_in:['h'],inv:['in'],shops:['l','sold'],mkt_sold:['s'],ginv:['i'],raid_p:['p','got']};
  async function fbImport(log){await ready;if(!sess)throw new Error('ต้องเข้าสู่ระบบด้วย Google ก่อน');log=log||function(){};var st={docs:0,users:0,act:0,skip:0,calls:0};
    var call=async function(body){var d=null;for(var k=0;k<4;k++){st.calls++;var r=await sb.functions.invoke('fb-import',{body:body});d=r.data;
        if(!d&&r.error&&r.error.context&&r.error.context.json){try{d=await r.error.context.json()}catch(e){}}
        if(d&&d.ok)return d;if(d&&d.e&&!/5\d\d|UNAVAILABLE|DEADLINE|RESOURCE_EXHAUSTED|token/.test(d.e))throw new Error(d.e);await new Promise(function(r){setTimeout(r,1500*(k+1))})}
      throw new Error((d&&d.e)||'เรียกฟังก์ชันไม่สำเร็จ')};
    var listAll=async function(col,o){o=o||{};var page=null,par=[],ids=[],skip=false;do{var d=await call(Object.assign({act:'list',col:col,page:page},o));st.docs+=d.n;par=par.concat(d.parents||[]);ids=ids.concat(d.ids||[]);if(d.skip)skip=true;page=d.next}while(page);return{par:par,ids:ids,skip:skip}};
    var pool=async function(items,n,f){var i=0;await Promise.all(Array.from({length:Math.min(n,items.length)},async function(){while(i<items.length){var x=items[i++];await f(x)}}))};
    await call({act:'me'});log('ยืนยันเจ้าของเกมแล้ว');
    log('อ่านบอร์ดหอคอย…');var T=new Set((await listAll('tower',{meta:true})).ids);
    var uids=(await call({act:'cols',doc:'data/users'})).ids||[],A=new Set(T),n=0;A.add(window.GAME_OWNER_UID||'');
    log('ตรวจเซฟผู้เล่น '+uids.length+' ไอดี (ข้ามไอดีที่ยังไม่ผ่านหอคอยชั้น 1)');
    await pool(uids,4,async function(u){var r=await listAll('data/users/'+u,{minTower:1,force:T.has(u)||u===window.GAME_OWNER_UID});if(r.skip)st.skip++;else A.add(u);n++;if(n%25===0)log('เซฟผู้เล่น '+n+'/'+uids.length+' · เล่นจริง '+(A.size-1)+' · ข้าม '+st.skip)});
    var keep=Array.from(A).filter(Boolean);st.act=keep.length;log('ไอดีที่เล่นจริง '+keep.length+' · ไม่ดึงมา '+st.skip);
    var page=null;do{var d=await call({act:'users',page:page,keep:keep});st.users+=d.n;page=d.next}while(page);log('รายชื่อบัญชีสำหรับย้ายล็อกอิน '+st.users);
    for(var i=0;i<UIDC.length;i++){log('นำเข้า '+UIDC[i]+' … (รวม '+st.docs+' เอกสาร)');await listAll(UIDC[i],{keep:keep})}
    for(var j=0;j<ALLC.length;j++){log('นำเข้า '+ALLC[j]+' … (รวม '+st.docs+' เอกสาร)');await listAll(ALLC[j])}
    for(var c in SUBC){log('นำเข้า '+c+' … (รวม '+st.docs+' เอกสาร)');var par=(await listAll(c,{missing:true,keep:c==='raid_p'?undefined:keep})).par;
      if(c!=='raid_p')par=par.filter(function(pp){return A.has(pp.split('/')[1])});
      await pool(par,4,async function(pp){for(var k=0;k<SUBC[c].length;k++)await listAll(pp+'/'+SUBC[c][k])})}
    log('เสร็จแล้ว: ไอดีเล่นจริง '+st.act+' · ข้าม '+st.skip+' · เอกสาร '+st.docs+' · เรียก '+st.calls+' ครั้ง');return st}
  // ---------- เริ่มระบบ ----------
  var ready=(async function(){try{
    if(!window.supabase||!window.supabase.createClient)await load(SDK);
    sb=window.supabase.createClient(C.url,C.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'},realtime:{params:{eventsPerSecond:20}}});
    window.SB=sb;
    var g=await sb.auth.getSession();sess=g.data&&g.data.session||null;
    sb.auth.onAuthStateChange(function(ev,s){sess=s||null;try{if(s&&s.access_token)sb.realtime.setAuth(s.access_token)}catch(e){}});
    if(!sess){DONE=true;var gr=null;try{guestRt();gr=mkRoom(1)}catch(e){}return gr?{db:null,user:null,room:gr,downloads:null}:null}/* Guest: ไม่เชื่อมฐานข้อมูล เซฟอยู่ในเครื่อง · 1.81.1 เข้าห้องออนไลน์ในฐานะผู้ชม (นับ "ผู้ชม" + เห็นแชทเด้ง) */
    try{sb.realtime.setAuth(sess.access_token)}catch(e){}
    /* ล็อกอิน Google ครั้งแรก: จับคู่กับบัญชี Firebase เดิมด้วยอีเมล (ถ้ามี) */
    try{if(fbProv()==='google'&&!localStorage.getItem('sb_mv_'+sess.user.id)){var mv=await sb.functions.invoke('migrate-account',{body:{kind:'google'}});if(mv&&mv.data)localStorage.setItem('sb_mv_'+sess.user.id,'1');
      /* เจ้าของเกม: ยืนยันกับบัญชีเดิมแล้วผูก uid ผู้พัฒนา (ลองครั้งเดียวต่อบัญชี จนได้คำตอบแน่นอน) */
      if(mv&&mv.data&&mv.data.e==='none'&&!localStorage.getItem('sb_me_'+sess.user.id)){var me0=await sb.functions.invoke('fb-import',{body:{act:'me'}}),dd=me0.data;
        if(!dd&&me0.error&&me0.error.context&&me0.error.context.json){try{dd=await me0.error.context.json()}catch(e){}}
        if(dd&&(dd.ok||/owner|mapped/.test(dd.e||'')))localStorage.setItem('sb_me_'+sess.user.id,'1')}}}catch(e){}
    me=await rpc('app_uid',{});
    try{var t0=Date.now(),sv=await rpc('server_ms',{});off=+sv-Math.round((Date.now()+t0)/2)}catch(e){}
    DONE=true;return{db:mkDb(),user:mkUser(),room:mkRoom(),downloads:null};
  }catch(e){console.warn('Supabase init failed',e);DONE=true;return null}})();
  window.claude={fb:true,sb:true,use:async function(n){var x=await ready;return x&&x[n]||null},fbAnon:function(){return !sess},fbEmail:fbEmail,fbProv:fbProv,fbRegister:fbRegister,fbLoginPw:fbLoginPw,fbIdOk:idOk,fbUid:function(){return uid()||''},fbLogin:fbLogin,fbLogout:fbLogout,
    fbDone:function(){return DONE},fbGuestKey:gkey,
    fbRaw:function(){return window.GAME_OWNER_UID&&uid()===window.GAME_OWNER_UID?{fs:FS,rt:RT}:null},
    fbImport:fbImport,fbMigrateMe:async function(){var r=await sb.functions.invoke('fb-import',{body:{act:'me'}});return r.data}};
})();
