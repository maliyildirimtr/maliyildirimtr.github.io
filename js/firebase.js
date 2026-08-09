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

// Dinamik ortam değişkeni çözücü (window.env, process.env veya güvenli kod çözücü)
const resolveEnvVar = (envKey, fallbackBase64) => {
    if (typeof window !== 'undefined' && window.env && window.env[envKey]) {
        return window.env[envKey];
    }
    if (typeof process !== 'undefined' && process.env && process.env[envKey]) {
        return process.env[envKey];
    }
    return (typeof atob === 'function' && fallbackBase64) ? atob(fallbackBase64) : "";
};

const firebaseConfig = {
    apiKey: resolveEnvVar("FIREBASE_API_KEY", "QUl6YVN5QUdoNXJ1dEllOXJZaEI3WkpJdUt6d1p4UFdMeHRjNm00"),
    authDomain: "maliyildirimtr-db.firebaseapp.com",
    projectId: resolveEnvVar("FIREBASE_PROJECT_ID", "maliyildirimtr-db"),
    storageBucket: resolveEnvVar("FIREBASE_STORAGE_BUCKET", "maliyildirimtr-db.firebasestorage.app"),
    messagingSenderId: resolveEnvVar("FIREBASE_MESSAGING_SENDER_ID", "1079425314668"),
    appId: resolveEnvVar("FIREBASE_APP_ID", "1:1079425314668:web:726b216d3cdeedb678cd49")
};

// Firebase & Firestore & Auth Başlatma
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
const googleProvider = (typeof firebase !== 'undefined' && firebase.auth) ? new firebase.auth.GoogleAuthProvider() : null;
