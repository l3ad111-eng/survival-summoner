// Service worker เบาๆ: ไม่แคชตัวเกม (อัปเดตได้ทันทีเสมอ) แค่มีหน้าแจ้งเมื่อออฟไลน์
// v2: โหลดหน้าเกมแบบ no-store ทุกครั้ง กันมือถือ/เบราว์เซอร์จำไฟล์เก่า
// v3 (1.54.0): รับการแจ้งเตือน (Push จาก Firebase Cloud Messaging) และกดแล้วเปิดเกม
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.mode!=='navigate')return;e.respondWith(fetch(e.request.url,{cache:'no-store',credentials:'same-origin'}).catch(()=>fetch(e.request)).catch(()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="background:#0a080b;color:#ece4da;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h2>ออฟไลน์อยู่</h2><p>เชื่อมต่ออินเทอร์เน็ตแล้วเปิดเกมใหม่อีกครั้ง</p></div>',{headers:{'content-type':'text/html; charset=utf-8'}})))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){try{d={data:{body:e.data.text()}}}catch(y){}}
 const n=d.notification||{},dd=d.data||{},title=dd.title||n.title||'Survival Summoner',body=dd.body||n.body||'';
 e.waitUntil(self.registration.showNotification(title,{body,icon:dd.icon||'icon-180.png',badge:dd.badge||'icon-180.png',tag:dd.tag||'ss',renotify:true,data:{url:dd.url||self.registration.scope}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||self.registration.scope;
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(L=>{for(const c of L)if(c.url.startsWith(self.registration.scope)&&'focus'in c)return c.focus();return self.clients.openWindow(url)}))});
