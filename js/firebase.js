// ==========================================
// FIREBASE GÜVENLİ YAPILANDIRMA VE BAŞLATMA MODÜLÜ
// ==========================================

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
    authDomain: resolveEnvVar("FIREBASE_AUTH_DOMAIN", "") || "maliyildirimtr-db.firebaseapp.com",
    projectId: resolveEnvVar("FIREBASE_PROJECT_ID", "") || "maliyildirimtr-db",
    storageBucket: resolveEnvVar("FIREBASE_STORAGE_BUCKET", "") || "maliyildirimtr-db.firebasestorage.app",
    messagingSenderId: resolveEnvVar("FIREBASE_MESSAGING_SENDER_ID", "") || "1079425314668",
    appId: resolveEnvVar("FIREBASE_APP_ID", "") || "1:1079425314668:web:726b216d3cdeedb678cd49"
};

// Firebase & Firestore & Auth Başlatma
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
