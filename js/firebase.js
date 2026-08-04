// Firebase Ayarların
const firebaseConfig = {
    apiKey: "AIzaSyAGh5rutIe9rYhB7ZJIuKzwZxPWLxtc6m4",
    authDomain: "maliyildirimtr-db.firebaseapp.com",
    projectId: "maliyildirimtr-db",
    storageBucket: "maliyildirimtr-db.firebasestorage.app",
    messagingSenderId: "1079425314668",
    appId: "1:1079425314668:web:726b216d3cdeedb678cd49"
};

// Firebase & Firestore & Auth Başlatma
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
