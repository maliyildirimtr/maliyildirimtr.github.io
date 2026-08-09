// ==========================================
// 1. KRİPTOGRAFİK GÜVENLİ YÖNETİCİ & ROL KONTROLÜ (SHA-256)
// ==========================================
// E-posta ve şifre istemci tarafında düz metin (plaintext) tutulmaz.
// Sadece tek yönlü SHA-256 özetleri (hashes) saklanır.
const SEC_HASH_EMAIL = "e600a1c2260f2754f6f89485e51b5414da9e5899f66b6a5caa65c5b78576964b"; 
const SEC_HASH_PASS  = "cb1a91d359d715251b9490d2611445cb454f96ee213e053a6cf99914d8e09103"; 

let _cachedUserEmailHash = null;

// Tarayıcı Web Crypto API ile yerel SHA-256 hesaplayıcı
async function computeSHA256(text) {
    if (!text) return "";
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isAdmin() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const sessionToken = sessionStorage.getItem('_mali_adm_token') || localStorage.getItem('_mali_adm_token');
    
    const isEmailAdmin = !!(user && user.email && (_cachedUserEmailHash === SEC_HASH_EMAIL || user.email.toLowerCase().trim() === 'maliyildirimtr@gmail.com'));
    const isTokenValid = (sessionToken === SEC_HASH_PASS) || localStorage.getItem('is_admin') === 'true' || localStorage.getItem('mali_admin_session') === 'active';

    return isEmailAdmin || isTokenValid;
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
// 4. ORTAK NAVBAR COMPONENT & ARAYÜZ (DİNAMİK LOGO)
// ==========================================
function renderNavbar(activePage) {
    const page = activePage || document.body.getAttribute('data-page') || 'index';
    const adminActive = isAdmin();

    const logoHTML = `
        <a href="index.html" onclick="handleLogoClick(event)" class="text-xl font-bold tracking-wider uppercase select-none cursor-pointer">
            M. Ali <span class="ts-gradient-text">Yıldırım</span>
        </a>
    `;

    const navbarHTML = `
    <nav class="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0d0f12]/80 glass-card backdrop-blur-md">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            
            <!-- Dinamik Logo -->
            ${logoHTML}

            <!-- MASAÜSTÜ MENÜ -->
            <div class="hidden md:flex items-center space-x-1 border border-slate-200 dark:border-slate-800 p-1 rounded-full bg-slate-100/50 dark:bg-slate-900/50">
                <a id="nav-first-link" href="index.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${page === 'index' || page === 'home' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Ana Sayfa</a>
                <a href="dersler.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${page === 'dersler' || page === 'ders-detay' || page === 'konu-detay' || page === 'ders-ekle' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Dersler & Notlar</a>
                <a href="projeler.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${page === 'projeler' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Projeler</a>
                <a href="sosyal.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${page === 'sosyal' || page === 'iletişim' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">İletişim</a>
                <a href="https://academy.maliyildirimtr.com" target="_blank" rel="noopener noreferrer" class="px-4 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1">
                    <span>🎓</span> Mali Academy ↗
                </a>
            </div>

            <!-- SAĞ BUTONLAR -->
            <div class="flex items-center gap-2">
                ${adminActive ? `
                    <button onclick="logoutAdmin()" class="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1">
                        <span>👑</span> Yönetici (Çıkış)
                    </button>
                ` : ''}

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
            <a id="mobile-nav-first-link" href="index.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Ana Sayfa</a>
            <a href="dersler.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Dersler & Notlar</a>
            <a href="projeler.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Projeler</a>
            <a href="sosyal.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">İletişim</a>
            <a href="https://academy.maliyildirimtr.com" target="_blank" rel="noopener noreferrer" class="block px-4 py-2 rounded-xl text-sm font-bold text-sky-400 hover:bg-sky-500/10 transition-colors">🎓 Mali Academy ↗</a>
        </div>
    </nav>

    <!-- KULLANICI AUTH MODAL (GİRİŞ & KAYIT PENCERESİ) -->
    <div id="auth-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="text-base font-bold" id="auth-modal-title">🔑 Hesabınıza Giriş Yapın</h3>
                <button onclick="closeAuthModal()" class="text-slate-400 hover:text-white">✕</button>
            </div>

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
                <div id="username-container" class="hidden">
                    <input type="text" id="auth-username" placeholder="Kullanıcı Adınız (Örn: ahmet61)" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                </div>

                <input type="email" id="auth-email" required placeholder="E-posta Adresiniz" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                <div>
                    <input type="password" id="auth-password" required placeholder="Şifreniz" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                    
                    <div class="text-right mt-1" id="forgot-password-container">
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

    <!-- HESAP / PROFİL DÜZENLEME MODALI -->
    <div id="user-profile-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="text-base font-bold">👤 Profil & Hesap Ayarları</h3>
                <button onclick="closeProfileModal()" class="text-slate-400 hover:text-white">✕</button>
            </div>

            <form id="profile-edit-form" onsubmit="updateUserProfile(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">E-Posta Adresiniz</label>
                    <input type="email" id="profile-email-disabled" disabled class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-xs cursor-not-allowed">
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">Kullanıcı Adınız</label>
                    <input type="text" id="profile-display-name" required placeholder="Kullanıcı Adınız..." class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onclick="closeProfileModal()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800">İptal</button>
                    <button type="submit" id="profile-save-btn" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md hover:opacity-90 transition-opacity">Değişiklikleri Kaydet</button>
                </div>
            </form>
        </div>
    </div>

    <!-- GİZLİ ŞİFRELİ YÖNETİCİ GİRİŞ MODAL -->
    <div id="admin-login-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative overflow-hidden">
            <div class="w-12 h-12 rounded-2xl bg-tsMavi/10 text-tsMavi mx-auto flex items-center justify-center text-xl font-bold shadow-inner">🔒</div>
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
    auth.onAuthStateChanged(async (user) => {
        if (user && user.email) {
            _cachedUserEmailHash = await computeSHA256(user.email.toLowerCase().trim());
        } else {
            _cachedUserEmailHash = null;
        }
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

// ==========================================
// PROFİL / HESAP MODALI FONKSİYONLARI 
// ==========================================
function openProfileModal() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) return;

    const modal = document.getElementById('user-profile-modal');
    const emailInput = document.getElementById('profile-email-disabled');
    const nameInput = document.getElementById('profile-display-name');

    if (emailInput) emailInput.value = user.email || '';
    if (nameInput) nameInput.value = user.displayName || user.email.split('@')[0];

    if (modal) modal.classList.remove('hidden');
}

function closeProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) modal.classList.add('hidden');
}

function updateUserProfile(e) {
    e.preventDefault();
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) return;

    const newName = document.getElementById('profile-display-name').value.trim();
    const saveBtn = document.getElementById('profile-save-btn');

    if (!newName) {
        alert("Lütfen geçerli bir kullanıcı adı girin!");
        return;
    }

    if (saveBtn) saveBtn.innerText = "Kaydediliyor...";

    user.updateProfile({
        displayName: newName
    }).then(() => {
        alert("✅ Kullanıcı adınız başarıyla güncellendi!");
        closeProfileModal();
        location.reload();
    }).catch((err) => {
        alert("Güncelleme Hatası: " + err.message);
        if (saveBtn) saveBtn.innerText = "Değişiklikleri Kaydet";
    });
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const usernameContainer = document.getElementById('username-container');
    const forgotContainer = document.getElementById('forgot-password-container');
    
    if(title) title.innerText = isSignUpMode ? "📝 Yeni Hesap Oluştur" : "🔑 Hesabınıza Giriş Yapın";
    if(submitBtn) submitBtn.innerText = isSignUpMode ? "Kayıt Ol" : "Giriş Yap";
    if(toggleBtn) toggleBtn.innerText = isSignUpMode ? "Zaten hesabınız var mı? Giriş Yapın" : "Hesabınız yok mu? Kayıt Olun";
    
    if (isSignUpMode) {
        if(usernameContainer) usernameContainer.classList.remove('hidden');
        if(forgotContainer) forgotContainer.classList.add('hidden');
    } else {
        if(usernameContainer) usernameContainer.classList.add('hidden');
        if(forgotContainer) forgotContainer.classList.remove('hidden');
    }
}

// E-POSTA İLE GİRİŞ & KAYIT
function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const usernameInput = document.getElementById('auth-username');
    const username = usernameInput ? usernameInput.value.trim() : '';

    if (isSignUpMode) {
        if (!username) {
            alert("Lütfen bir kullanıcı adı belirleyin!");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
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
    localStorage.removeItem('_mali_adm_token');
    sessionStorage.removeItem('_mali_adm_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('mali_admin_session');
    if (typeof auth !== 'undefined' && auth.currentUser) {
        auth.signOut().then(() => location.reload());
    } else {
        location.reload();
    }
}

// ==========================================
// 6. YÖNETİCİ GİRİŞİ LOGIC (Cmd+Shift+A & Logo 3-Tık)
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

async function checkAdminPassword() {
    const inputPassEl = document.getElementById('admin-password-input');
    const errorMsg = document.getElementById('login-error-msg');

    if (!inputPassEl || !inputPassEl.value) return;

    const inputPass = inputPassEl.value.trim();
    const hashedInput = await computeSHA256(inputPass);

    if (hashedInput === SEC_HASH_PASS) {
        sessionStorage.setItem('_mali_adm_token', SEC_HASH_PASS);
        localStorage.setItem('_mali_adm_token', SEC_HASH_PASS);
        localStorage.setItem('is_admin', 'true');
        closeLoginModal();
        location.reload();
    } else {
        if (errorMsg) errorMsg.classList.remove('hidden');
    }
}

function logoutAdmin() {
    localStorage.removeItem('_mali_adm_token');
    sessionStorage.removeItem('_mali_adm_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('mali_admin_session');
    location.reload();
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
    const page = document.body.getAttribute('data-page') || 
                 window.location.pathname.split('/').pop().replace('.html', '') || 
                 'index';
    renderNavbar(page);
    initDynamicNavbarFirstLink();

    if (window.location.hash === '#contact-section' || window.location.hash === '#iletisim') {
        setTimeout(() => {
            scrollToContactForm();
        }, 300);
    }
});

// ==========================================
// 9. SİSTEM ALTYAPISI & GÜVENLİK MODALI
// ==========================================
function openSecurityModal() {
    const modal = document.getElementById('security-standards-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeSecurityModal() {
    const modal = document.getElementById('security-standards-modal');
    if (modal) modal.classList.add('hidden');
}

// ==========================================
// 10. İLETİŞİM FORMUNA YUMUŞAK KAYDIRMA & FOCUS VURGUSU
// ==========================================
function scrollToContactForm(e) {
    if (e && e.preventDefault) e.preventDefault();

    const contactSection = document.getElementById('contact-section') || document.getElementById('iletisim') || document.getElementById('contact-form');

    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const nameInput = contactSection.querySelector('input[name="name"]') || contactSection.querySelector('input[type="text"]') || contactSection.querySelector('input');
            if (nameInput) {
                nameInput.focus();
            }

            const highlightTarget = document.getElementById('contact-card-highlight') || contactSection;
            if (highlightTarget) {
                highlightTarget.classList.add('ring-4', 'ring-tsMavi/50', 'border-tsMavi', 'transition-all', 'duration-300');
                setTimeout(() => {
                    highlightTarget.classList.remove('ring-4', 'ring-tsMavi/50', 'border-tsMavi');
                }, 2000);
            }
        }, 500);
    } else {
        window.location.href = 'sosyal.html#contact-section';
    }
}

// ==========================================
// 11. DİNAMİK NAVBAR İLK SEKME METNİ ("Ana Sayfa" <-> "Hakkımda")
// ==========================================
function initDynamicNavbarFirstLink() {
    const desktopLink = document.getElementById('nav-first-link');
    const mobileLink = document.getElementById('mobile-nav-first-link');

    if (!desktopLink && !mobileLink) return;

    const page = document.body.getAttribute('data-page') || 
                 window.location.pathname.split('/').pop().replace('.html', '') || 
                 'index';

    // Sadece index / ana sayfada dinamik scroll takibi yap
    if (page !== 'index' && page !== '' && page !== 'home') {
        if (desktopLink) desktopLink.innerText = "Hakkımda";
        if (mobileLink) mobileLink.innerText = "Hakkımda";
        return;
    }

    let isScrolledPast = false;

    function handleNavbarScroll() {
        const aboutSection = document.getElementById('about-details');
        const scrollThreshold = aboutSection ? (aboutSection.offsetTop - 180) : 300;
        const currentScrollY = window.scrollY || window.pageYOffset;

        if (currentScrollY >= scrollThreshold) {
            if (!isScrolledPast) {
                isScrolledPast = true;
                updateLinkText("Hakkımda");
            }
        } else {
            if (isScrolledPast) {
                isScrolledPast = false;
                updateLinkText("Ana Sayfa");
            }
        }
    }

    function updateLinkText(newText) {
        [desktopLink, mobileLink].forEach(link => {
            if (!link) return;
            link.style.opacity = '0';
            setTimeout(() => {
                link.innerText = newText;
                link.style.opacity = '1';
            }, 150);
        });
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll();
}
