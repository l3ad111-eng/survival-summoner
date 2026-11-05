// ส่งการแจ้งเตือนที่ถึงเวลา (เรียกจาก GitHub Actions ทุก ~15 นาที)
// ต้องมี secret FIREBASE_SA = เนื้อหาไฟล์ JSON ของ Service account (Firebase → Project settings → Service accounts)
import admin from 'firebase-admin';
const URL='https://l3ad111-eng.github.io/survival-summoner/';
const raw=process.env.FIREBASE_SA;
if(!raw){console.log('ยังไม่ได้ตั้ง secret FIREBASE_SA — ข้าม');process.exit(0)}
admin.initializeApp({credential:admin.credential.cert(JSON.parse(raw))});
const db=admin.firestore(),now=Date.now();
const qs=await db.collection('push').where('nx','<=',now+60000).limit(400).get();
let sent=0,dead=0,skip=0;
for(const doc of qs.docs){const d=doc.data()||{},L=Array.isArray(d.n)?d.n:[];
  const due=L.filter(x=>x&&x.at<=now+60000),rest=L.filter(x=>x&&x.at>now+60000);
  const fresh=due.filter(x=>now-x.at<6*3600000);// เกิน 6 ชม. แล้วไม่ส่ง (เช่นเครื่องปิดนาน)
  const up={n:rest,nx:rest.length?rest[0].at:9e15,ls:now};
  if(!d.on||!d.tk||!fresh.length){await doc.ref.update(up);skip++;continue}
  const title=fresh.length===1?fresh[0].ti:`มีเรื่องรอท่าน ${fresh.length} เรื่อง`,body=fresh.length===1?fresh[0].tx:fresh.map(x=>x.ti).join(' · ');
  try{await admin.messaging().send({token:d.tk,data:{title:String(title).slice(0,80),body:String(body).slice(0,180),tag:'ss-'+fresh[0].k,url:URL},webpush:{headers:{Urgency:'high',TTL:'3600'}}});sent++}
  catch(e){const c=e&&e.code||'';if(/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(c)){up.on=false;dead++}else console.log('ส่งไม่สำเร็จ',doc.id,c)}
  await doc.ref.update(up)}
console.log(`ส่งแล้ว ${sent} · โทเคนหมดอายุ ${dead} · ข้าม ${skip} · ตรวจ ${qs.size}`);
process.exit(0);
