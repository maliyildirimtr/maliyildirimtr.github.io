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
        location.reload(); // Butonların görünmesi için sayfayı yenile
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

// Enter tuşuyla şifre girişini tetikleme
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('admin-login-modal');
    if (modal && !modal.classList.contains('hidden') && e.key === 'Enter') {
        checkAdminPassword();
    }
});

// ==========================================
// 2. ORTAK NAVBAR RENDER FONKSİYONU
// ==========================================
function renderNavbar(activePage) {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    const loggedIn = isAdmin();

    container.innerHTML = `
        <nav class="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0d0f12]/80 backdrop-blur-md sticky top-0 z-40">
            <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <a href="index.html" class="font-extrabold text-lg tracking-wider text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
                    M. ALİ <span class="text-tsMavi">YILDIRIM</span>
                </a>

                <div class="flex items-center gap-6 text-xs font-semibold">
                    <a href="index.html" class="${activePage === 'home' ? 'text-tsMavi font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'} transition-colors">Hakkımda</a>
                    <a href="dersler.html" class="${activePage === 'dersler' ? 'text-tsMavi font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'} transition-colors">Dersler & Notlar</a>
                    
                    ${loggedIn ? `
                        <button onclick="logoutAdmin()" class="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 font-sans">
                            🔓 Çıkış Yap
                        </button>
                    ` : `
                        <button onclick="openLoginModal()" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-tsMavi transition-all flex items-center gap-1 font-sans">
                            🔒 Yönetici Girişi
                        </button>
                    `}
                </div>
            </div>
        </nav>

        <!-- YÖNETİCİ GİRİŞ MODAL -->
        <div id="admin-login-modal" class="fixed inset-0 z-50 hidden bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
                <div class="w-12 h-12 rounded-2xl bg-tsBordo/10 text-tsBordo dark:bg-tsMavi/10 dark:text-tsMavi mx-auto flex items-center justify-center text-xl font-bold">
                    🔒
                </div>
                <div>
                    <h3 class="text-base font-bold">Yönetici Girişi</h3>
                    <p class="text-xs text-slate-500 mt-1">İçerik düzenlemek için lütfen şifrenizi girin.</p>
                </div>
                <div>
                    <input type="password" id="admin-password-input" placeholder="Şifreniz..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-center focus:outline-none focus:border-tsMavi">
                    <p id="login-error-msg" class="text-xs text-red-500 mt-2 hidden">Hatalı şifre! Lütfen tekrar deneyin.</p>
                </div>
                <div class="flex gap-2">
                    <button type="button" onclick="closeLoginModal()" class="w-1/2 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">İptal</button>
                    <button type="button" onclick="checkAdminPassword()" class="w-1/2 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md">Giriş Yap</button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 3. GENEL SAYFA YÜKLENME AYARLARI
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Sayfa yüklendiğinde varsayılan Dark Mode ayarı
    if (!localStorage.getItem('theme')) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});
