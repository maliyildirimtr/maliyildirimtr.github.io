// ==========================================
// FIREBASE GÜVENLİ YAPILANDIRMA VE BAŞLATMA MODÜLÜ
// ==========================================

/**
 * 📌 FIREBASE AUTHORIZED DOMAINS (YETKİLİ ALAN ADLARI) HATIRLATMASI:
 * Google ile Giriş (Google Auth) ve Firebase servislerinin canlı ortamda çalışabilmesi için
 * Firebase Console > Authentication > Settings > Authorized Domains sekmesinde aşağıdaki adreslerin tanımlı olması gerekmektedir:
 * 1. localhost (Geliştirme ortamı)
 * 2. 127.0.0.1 (Yerel canlı sunucu)
 * 3. academy.maliyildirimtr.com (Mali Academy Portalı)
 * 4. maliyildirimtr.github.io (Kişisel Portfolio Portalı)
 */

var auth = null;
var db = null;
var googleProvider = null;

try {
    const firebaseConfig = {
        apiKey: "AIzaSyAGh5rutIe9rYhB7ZJIuKzwZxPWLxtc6m4",
        authDomain: "maliyildirimtr-db.firebaseapp.com",
        projectId: "maliyildirimtr-db",
        storageBucket: "maliyildirimtr-db.firebasestorage.app",
        messagingSenderId: "1079425314668",
        appId: "1:1079425314668:web:726b216d3cdeedb678cd49"
    };

    if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    if (typeof firebase !== 'undefined') {
        if (firebase.firestore) {
            db = firebase.firestore();
        }
        if (firebase.auth) {
            auth = firebase.auth();
            googleProvider = new firebase.auth.GoogleAuthProvider();
        }
    }
} catch (err) {
    console.warn("Firebase başlatma uyarısı:", err);
}

window.auth = auth;
window.db = db;
window.googleProvider = googleProvider;
