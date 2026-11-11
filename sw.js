// Service worker เบาๆ: ไม่แคชตัวเกม (อัปเดตได้ทันทีเสมอ) แค่มีหน้าแจ้งเมื่อออฟไลน์
// v2: โหลดหน้าเกมแบบ no-store ทุกครั้ง กันมือถือ/เบราว์เซอร์จำไฟล์เก่า
// v4 (1.66.0): ถอดการแจ้งเตือน (Push) ออกแล้ว · ยกเลิกการสมัครรับ Push เดิมของเครื่องนี้
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),self.registration.pushManager?self.registration.pushManager.getSubscription().then(x=>x&&x.unsubscribe()).catch(()=>{}):null])));
self.addEventListener('fetch',e=>{if(e.request.mode!=='navigate')return;e.respondWith(fetch(e.request.url,{cache:'no-store',credentials:'same-origin'}).catch(()=>fetch(e.request)).catch(()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="background:#0a080b;color:#ece4da;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><div><h2>ออฟไลน์อยู่</h2><p>เชื่อมต่ออินเทอร์เน็ตแล้วเปิดเกมใหม่อีกครั้ง</p></div>',{headers:{'content-type':'text/html; charset=utf-8'}})))});
