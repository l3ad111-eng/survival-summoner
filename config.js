/* ===== ตั้งค่า Firebase ของเกม =====
   1) วางค่า firebaseConfig ที่ได้จาก Firebase Console (Project settings → Your apps → Web app) แทนค่าว่างด้านล่าง
   2) หลังเข้าเกมและเข้าสู่ระบบด้วย Google แล้ว เปิดเมนู ☰ คัดลอก UID ของท่านมาใส่ใน GAME_OWNER_UID
      (ต้องใส่ UID เดียวกันใน firestore.rules ด้วย) จะได้สิทธิ์ผู้พัฒนา: ประกาศอัปเดต สร้างโค้ด ส่งจดหมาย ดูสถิติ
*/
window.FB_CFG = {
  apiKey: "AIzaSyAtH4bUTkTpv4OQ0IQSfiwnMNS3Sidx8Zk",
  authDomain: "survival-summoner-pick-up.firebaseapp.com",
  databaseURL: "https://survival-summoner-pick-up-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "survival-summoner-pick-up",
  storageBucket: "survival-summoner-pick-up.firebasestorage.app",
  messagingSenderId: "220805605322",
  appId: "1:220805605322:web:caf36a8463a2e5a3425133"
};
window.GAME_OWNER_UID = "Qxui1LePkQXWfsGaHMfpfVUOs8B3";
