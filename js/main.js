// ==========================================
// 1. YÖNETİCİ E-POSTASI VE ROL KONTROLÜ
// ==========================================
// Yönetici yetkisine sahip e-posta adresin ve gizli şifren
const ADMIN_EMAIL = "maliyildirimtr@gmail.com"; 
const ADMIN_PASSWORD = "258061"; // Logoya 3 kez basınca kullanılan şifre

function isAdmin() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const isEmailAdmin = user && user.email === ADMIN_EMAIL;
    const isLocalAdmin = localStorage.getItem('is_admin') === 'true' || localStorage.getItem('mali_admin_session') === 'active';
    
    return isEmailAdmin || isLocalAdmin;
}

// ==========================================
// 2. DARK / LIGHT MODE LOGIC
// ==========================================
function initThemeIcons() {
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    if (!darkIcon || !lightIcon) return;

    if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
    } else {
        lightIcon.classList.remove('hidden');
        darkIcon.classList.add('hidden');
    }
}

function toggleTheme() {
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }

    if (darkIcon && lightIcon) {
        darkIcon.classList.toggle('hidden');
        lightIcon.classList.toggle('hidden');
    }
}

(function applyInitialTheme() {
    const savedTheme = localStorage.getItem('color-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

// ==========================================
// 3. MOBİL MENÜ LOGIC
// ==========================================
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// ==========================================
// 4. ORTAK NAVBAR COMPONENT & ARAYÜZ (SADELEŞTİRİLMİŞ)
// ==========================================
function renderNavbar(activePage) {
    const navbarHTML = `
    <nav class="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0d0f12]/80 glass-card backdrop-blur-md">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            
            <!-- Logo (3 Kez Tıklayınca Gizli Yönetici Girişi Açılır) -->
            <a href="index.html" onclick="handleLogoClick(event)" class="text-xl font-bold tracking-wider uppercase select-none cursor-pointer">
                M. Ali <span class="ts-gradient-text">Yıldırım</span>
            </a>

            <!-- MASAÜSTÜ MENÜ -->
            <div class="hidden md:flex items-center space-x-1 border border-slate-200 dark:border-slate-800 p-1 rounded-full bg-slate-100/50 dark:bg-slate-900/50">
                <a href="index.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'index' || activePage === 'home' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Hakkımda</a>
                <a href="projeler.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'projeler' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Projeler</a>
                <a href="dersler.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'dersler' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Dersler & Notlar</a>
                <a href="sosyal.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'sosyal' || activePage === 'iletişim' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">İletişim</a>
            </div>

            <!-- SAĞ BUTONLAR -->
            <div class="flex items-center gap-2">
                <!-- Tema Değiştirici -->
                <button id="theme-toggle" onclick="toggleTheme()" class="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center w-10 h-10">
                    <svg id="theme-toggle-dark-icon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                    <svg id="theme-toggle-light-icon" class="w-4 h-4 hidden text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                </button>

                <!-- Mobil Hamburger Menü Butonu -->
                <button id="mobile-menu-btn" onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center w-10 h-10">
                    ☰
                </button>
            </div>
        </div>

        <!-- MOBİL MENÜ -->
        <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d0f12] px-4 py-4 space-y-2">
            <a href="index.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Hakkımda</a>
            <a href="projeler.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Projeler</a>
            <a href="dersler.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Dersler & Notlar</a>
            <a href="sosyal.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">İletişim</a>
        </div>
    </nav>

    <!-- KULLANICI AUTH MODAL (GİRİŞ & KAYIT PENCERESİ) -->
    <div id="auth-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="text-base font-bold" id="auth-modal-title">🔑 Hesabınıza Giriş Yapın</h3>
                <button onclick="closeAuthModal()" class="text-slate-400 hover:text-white">✕</button>
            </div>

            <!-- Google ile Giriş -->
            <button onclick="loginWithGoogle()" class="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs font-semibold flex items-center justify-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Google ile Devam Et
            </button>

            <div class="relative flex py-1 items-center">
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span class="flex-shrink mx-2 text-[10px] text-slate-400 uppercase">veya e-posta</span>
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <form id="auth-form" onsubmit="handleAuthSubmit(event)" class="space-y-3">
                <input type="email" id="auth-email" required placeholder="E-posta Adresiniz" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                <div>
                    <input type="password" id="auth-password" required placeholder="Şifreniz" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                    
                    <!-- ŞİFREMİ UNUTTUM LİNKİ -->
                    <div class="text-right mt-1">
                        <button type="button" onclick="handleForgotPassword()" class="text-[10px] text-tsMavi hover:underline">
                            Şifrenizi mi unuttunuz?
                        </button>
                    </div>
                </div>
                
                <button type="submit" id="auth-submit-btn" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity">
                    Giriş Yap
                </button>
            </form>

            <div class="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <button onclick="toggleAuthMode()" id="auth-toggle-btn" class="text-xs text-tsMavi hover:underline">
                    Hesabınız yok mu? Kayıt Olun
                </button>
            </div>
        </div>
    </div>

    <!-- GİZLİ ŞİFRELİ YÖNETİCİ GİRİŞ MODAL (3 LOGO TIK / CTRL+SHIFT+A) -->
    <div id="admin-login-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative overflow-hidden">
            <div class="w-12 h-12 rounded-2xl bg-tsMavi/10 text-tsMavi mx-auto flex items-center justify-center text-xl font-bold shadow-inner">
                🔒
            </div>
            <div>
                <h3 class="text-base font-bold">Yönetici Girişi</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">İçerik düzenlemek için şifrenizi girin.</p>
            </div>
            <div>
                <input type="password" id="admin-password-input" placeholder="Şifreniz..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-center focus:outline-none focus:border-tsMavi transition-colors">
                <p id="login-error-msg" class="text-xs text-red-500 mt-2 hidden">Hatalı şifre! Tekrar deneyin.</p>
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" onclick="closeLoginModal()" class="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">İptal</button>
                <button type="button" onclick="checkAdminPassword()" class="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md hover:opacity-95 transition-opacity">Giriş Yap</button>
            </div>
        </div>
    </div>
    `;

    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        navContainer.innerHTML = navbarHTML;
        initThemeIcons();
    }
}

// ==========================================
// 5. OTURUM DURUMU VE FIREBASE DİNAMİKLERİ
// ==========================================
let isSignUpMode = false;

if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        renderNavbar(currentPath.replace('.html', ''));
    });
}

function openAuthModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.classList.remove('hidden'); 
}
function closeAuthModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.classList.add('hidden'); 
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    
    if(title) title.innerText = isSignUpMode ? "📝 Yeni Hesap Oluştur" : "🔑 Hesabınıza Giriş Yapın";
    if(submitBtn) submitBtn.innerText = isSignUpMode ? "Kayıt Ol" : "Giriş Yap";
    if(toggleBtn) toggleBtn.innerText = isSignUpMode ? "Zaten hesabınız var mı? Giriş Yapın" : "Hesabınız yok mu? Kayıt Olun";
}

// E-POSTA İLE GİRİŞ & KAYIT
function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    if (isSignUpMode) {
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => closeAuthModal())
            .catch(err => {
                if (err.code === 'auth/email-already-in-use') {
                    alert("⚠️ Bu e-posta adresi zaten kullanımda! Lütfen 'Giriş Yap' sekmesini kullanın.");
                } else if (err.code === 'auth/weak-password') {
                    alert("⚠️ Şifreniz çok zayıf! En az 6 karakter giriniz.");
                } else {
                    alert("Kayıt Hatası: " + err.message);
                }
            });
    } else {
        auth.signInWithEmailAndPassword(email, password)
            .then(() => closeAuthModal())
            .catch(err => {
                if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                    alert("⚠️ E-posta veya şifre hatalı!");
                } else {
                    alert("Giriş Hatası: " + err.message);
                }
            });
    }
}

// ŞİFREMİ UNUTTUM LOGIC
function handleForgotPassword() {
    const emailInput = document.getElementById('auth-email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        alert("Lütfen önce E-posta kutusuna adresinizi yazın, ardından 'Şifrenizi mi unuttunuz?' butonuna tıklayın.");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert(`✅ ${email} adresine şifre sıfırlama bağlantısı gönderildi! Lütfen e-postanızı (ve Spam klasörünü) kontrol edin.`);
            closeAuthModal();
        })
        .catch((err) => {
            if (err.code === 'auth/user-not-found') {
                alert("⚠️ Bu e-posta adresine ait kayıtlı bir kullanıcı bulunamadı.");
            } else {
                alert("Sıfırlama Hatası: " + err.message);
            }
        });
}

function loginWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .then(() => closeAuthModal())
        .catch(err => alert("Google Giriş Hatası: " + err.message));
}

function logoutUser() {
    localStorage.removeItem('is_admin');
    localStorage.removeItem('mali_admin_session');
    if (typeof auth !== 'undefined' && auth.currentUser) {
        auth.signOut().then(() => location.reload());
    } else {
        location.reload();
    }
}

// ==========================================
// 6. GİZLİ ŞİFRELİ ADMIN GİRİŞİ LOGIC
// ==========================================
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openLoginModal();
    }
    
    const modal = document.getElementById('admin-login-modal');
    if (modal && !modal.classList.contains('hidden') && e.key === 'Enter') {
        checkAdminPassword();
    }
});

let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick(e) {
    logoClickCount++;
    clearTimeout(logoClickTimer);
    
    if (logoClickCount === 3) {
        if (e) e.preventDefault();
        openLoginModal();
        logoClickCount = 0;
    } else {
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1000);
    }
}

function openLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    const errorMsg = document.getElementById('login-error-msg');
    const inputPass = document.getElementById('admin-password-input');
    if (modal) modal.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    if (inputPass) inputPass.value = '';
}

function checkAdminPassword() {
    const inputPass = document.getElementById('admin-password-input').value;
    const errorMsg = document.getElementById('login-error-msg');

    if (inputPass === ADMIN_PASSWORD) {
        localStorage.setItem('is_admin', 'true');
        localStorage.setItem('mali_admin_session', 'active');
        closeLoginModal();
        location.reload();
    } else {
        if (errorMsg) errorMsg.classList.remove('hidden');
    }
}

// ==========================================
// 7. RESİM / İKON DETEKTÖRÜ
// ==========================================
function renderIcon(iconData) {
    if (!iconData) return '⚡';
    
    const isImage = iconData.startsWith('images/') || 
                    iconData.startsWith('http://') || 
                    iconData.startsWith('https://') || 
                    /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(iconData);

    if (isImage) {
        return `<img src="${iconData}" class="w-full h-full object-cover rounded-xl" alt="Görsel">`;
    }
    
    return iconData;
}

// ==========================================
// 8. DERS EKLE MODALINI AÇMA & YÖNLENDİRME
// ==========================================
function openAddModal() {
    if (!window.location.pathname.includes('dersler.html')) {
        window.location.href = 'dersler.html?openModal=true';
        return;
    }

    const modal = document.getElementById('add-course-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openModal') === 'true') {
        const modal = document.getElementById('add-course-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
});
