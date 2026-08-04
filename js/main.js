// ==========================================
// 1. YÖNETİCİ ŞİFRE VE OTURUM KONTROLÜ
// ==========================================
const ADMIN_PASSWORD = "258061";

function isAdmin() {
    return localStorage.getItem('mali_admin_session') === 'active';
}

function checkAdminPassword() {
    const input = document.getElementById('admin-password-input');
    const errorMsg = document.getElementById('login-error-msg');
    
    if (input && input.value === ADMIN_PASSWORD) {
        localStorage.setItem('mali_admin_session', 'active');
        closeLoginModal();
        location.reload();
    } else if (errorMsg) {
        errorMsg.classList.remove('hidden');
    }
}

function logoutAdmin() {
    localStorage.removeItem('mali_admin_session');
    location.reload();
}

function openLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.classList.add('hidden');
        const errorMsg = document.getElementById('login-error-msg');
        const input = document.getElementById('admin-password-input');
        if (errorMsg) errorMsg.classList.add('hidden');
        if (input) input.value = '';
    }
}

// ==========================================
// 2. GİZLİ GİRİŞ KISAYOLLARI (Klavye & Tıklama)
// ==========================================
document.addEventListener('keydown', function(e) {
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

function handleLogoClick() {
    logoClickCount++;
    clearTimeout(logoClickTimer);
    
    if (logoClickCount === 3) {
        openLoginModal();
        logoClickCount = 0;
    } else {
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1000);
    }
}

// MOBİL MENÜ AÇMA / KAPAMA
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// ==========================================
// 3. ORTAK İKON / RESİM DETEKTÖRÜ
// ==========================================
function renderIcon(iconData) {
    if (!iconData) return '📚';
    
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
// 4. ORTAK NAVBAR RENDER FONKSİYONU (Mobil Uyumlu)
// ==========================================
function renderNavbar(activePage) {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    const loggedIn = isAdmin();

    const activeClass = "bg-slate-100 dark:bg-slate-800 text-tsMavi font-bold shadow-sm";
    const inactiveClass = "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50";

    container.innerHTML = `
        <nav class="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0d0f12]/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
            <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                
                <!-- LOGO -->
                <div onclick="handleLogoClick()" class="cursor-pointer font-black text-lg tracking-wider text-slate-900 dark:text-white hover:opacity-85 transition-opacity select-none flex items-center gap-1">
                    <span>M. ALİ</span>
                    <span class="text-tsMavi bg-gradient-to-r from-tsMavi to-tsMavi-light bg-clip-text text-transparent">YILDIRIM</span>
                </div>

                <!-- MASAÜSTÜ MENÜ LİNKLERİ (md:flex) -->
                <div class="hidden md:flex items-center gap-2 text-xs font-semibold">
                    <a href="index.html" class="px-3.5 py-2 rounded-xl transition-all duration-200 ${activePage === 'home' ? activeClass : inactiveClass}">
                        Hakkımda
                    </a>
                    <a href="projeler.html" class="px-3.5 py-2 rounded-xl transition-all duration-200 ${activePage === 'projeler' ? activeClass : inactiveClass}">
                        Projeler
                    </a>
                    <a href="dersler.html" class="px-3.5 py-2 rounded-xl transition-all duration-200 ${activePage === 'dersler' ? activeClass : inactiveClass}">
                        Dersler & Notlar
                    </a>
                    <a href="iletisim.html" class="px-3.5 py-2 rounded-xl transition-all duration-200 ${activePage === 'iletisim' ? activeClass : inactiveClass}">
                        İletişim
                    </a>
                    
                    ${loggedIn ? `
                        <button onclick="logoutAdmin()" class="ml-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-medium transition-all duration-200 border border-red-500/20 flex items-center gap-1">
                            🔓 Çıkış Yap
                        </button>
                    ` : ''}
                </div>

                <!-- MOBİL MENÜ BUTONU (BURGER) -->
                <button onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-tsMavi focus:outline-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>

            <!-- MOBİL AÇILIR MENÜ ALANI -->
            <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d0f12] px-4 py-4 space-y-2 text-xs font-semibold">
                <a href="index.html" class="block px-4 py-2.5 rounded-xl ${activePage === 'home' ? activeClass : inactiveClass}">
                    Hakkımda
                </a>
                <a href="projeler.html" class="block px-4 py-2.5 rounded-xl ${activePage === 'projeler' ? activeClass : inactiveClass}">
                    Projeler
                </a>
                <a href="dersler.html" class="block px-4 py-2.5 rounded-xl ${activePage === 'dersler' ? activeClass : inactiveClass}">
                    Dersler & Notlar
                </a>
                <a href="iletisim.html" class="block px-4 py-2.5 rounded-xl ${activePage === 'iletisim' ? activeClass : inactiveClass}">
                    İletişim
                </a>
                ${loggedIn ? `
                    <button onclick="logoutAdmin()" class="w-full text-left px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 font-medium">
                        🔓 Çıkış Yap
                    </button>
                ` : ''}
            </div>
        </nav>

        <!-- YÖNETİCİ GİRİŞ MODAL (GİZLİ) -->
        <div id="admin-login-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tsBordo to-tsMavi"></div>
                <div class="w-12 h-12 rounded-2xl bg-tsMavi/10 text-tsMavi mx-auto flex items-center justify-center text-xl font-bold shadow-inner">
                    🔒
                </div>
                <div>
                    <h3 class="text-base font-bold">Yönetici Girişi</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">İçerik düzenlemek için lütfen şifrenizi girin.</p>
                </div>
                <div>
                    <input type="password" id="admin-password-input" placeholder="Şifreniz..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-center focus:outline-none focus:border-tsMavi transition-colors">
                    <p id="login-error-msg" class="text-xs text-red-500 mt-2 hidden">Hatalı şifre! Lütfen tekrar deneyin.</p>
                </div>
                <div class="flex gap-2 pt-2">
                    <button type="button" onclick="closeLoginModal()" class="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">İptal</button>
                    <button type="button" onclick="checkAdminPassword()" class="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md hover:opacity-95 transition-opacity">Giriş Yap</button>
                </div>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('theme')) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});
