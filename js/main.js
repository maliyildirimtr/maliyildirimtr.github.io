// --- 🧭 ORTAK NAVBAR COMPONENT (YÖNTEM 1) ---
function renderNavbar(activePage) {
    const navbarHTML = `
    <nav class="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0d0f12]/80 glass-card">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            
            <!-- Logo -->
            <a href="index.html" class="text-xl font-bold tracking-wider uppercase">
                M. Ali <span class="ts-gradient-text">Yıldırım</span>
            </a>

            <!-- MASAÜSTÜ MENÜ (Büyük Ekranlar) -->
            <div class="hidden md:flex items-center space-x-1 border border-slate-200 dark:border-slate-800 p-1 rounded-full bg-slate-100/50 dark:bg-slate-900/50">
                <a href="index.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'index' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Hakkımda</a>
                <a href="projeler.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'projeler' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Projeler</a>
                <a href="dersler.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'dersler' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Dersler & Notlar</a>
                <a href="sosyal.html" class="px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${activePage === 'sosyal' ? 'bg-white dark:bg-slate-800 text-tsBordo dark:text-tsMavi shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">Sosyal Medya</a>
            </div>

            <!-- SAĞ BUTONLAR -->
            <div class="flex items-center gap-2">
                <!-- Admin Ders Ekle (+) Butonu -->
                <button id="admin-add-btn" onclick="openAddModal()" class="hidden flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity">
                    <span class="text-base leading-none">+</span> Ders Ekle
                </button>

                <!-- Tema Değiştirici (Dark/Light) -->
                <button id="theme-toggle" class="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center w-10 h-10">
                    <svg id="theme-toggle-dark-icon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                    <svg id="theme-toggle-light-icon" class="w-4 h-4 hidden text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                </button>

                <!-- Mobil Hamburger Menü Butonu -->
                <button id="mobile-menu-btn" onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center w-10 h-10">
                    ☰
                </button>
            </div>
        </div>

        <!-- MOBİL MENÜ (Mobil Ekranlar İçin) -->
        <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d0f12] px-4 py-4 space-y-2">
            <a href="index.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Hakkımda</a>
            <a href="projeler.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Projeler</a>
            <a href="dersler.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Dersler & Notlar</a>
            <a href="sosyal.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Sosyal Medya</a>
        </div>
    </nav>
    `;

    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        navContainer.innerHTML = navbarHTML;
    }
}
// --- 1. TEMA DEĞİŞTİRME LOGIC (DARK/LIGHT MODE) ---
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    if (!themeToggleBtn) return;

    // Sistem veya localStorage tercihi
    if (localStorage.getItem('color-theme') === 'light' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches)) {
        document.documentElement.classList.remove('dark');
        if (lightIcon) lightIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.add('dark');
        if (darkIcon) darkIcon.classList.remove('hidden');
    }

    themeToggleBtn.addEventListener('click', function() {
        if (darkIcon) darkIcon.classList.toggle('hidden');
        if (lightIcon) lightIcon.classList.toggle('hidden');

        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });
});

// --- 2. DERS NOTLARI CANLI ARAMA ---
function filterNotes() {
    const input = document.getElementById('note-search').value.toLowerCase();
    const cards = document.querySelectorAll('.note-card');

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(input) ? 'flex' : 'none';
    });
}

// --- 3. DERS NOTLARI KATEGORİ FİLTRELEME ---
function filterCategory(cat) {
    const cards = document.querySelectorAll('.note-card');
    cards.forEach(card => {
        if (cat === 'all' || card.classList.contains('note-' + cat)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}
// --- 🔐 ŞİFRELİ ADMIN GİRİŞİ LOGIC ---
const ADMIN_PASSWORD = "1967"; // Kendi belirlediğin şifre

document.addEventListener('DOMContentLoaded', () => {
    const adminBtn = document.getElementById('admin-add-btn');

    // Eğer daha önce giriş YAPILMAMIŞSA butonu kesin olarak gizle
    if (localStorage.getItem('is_admin') === 'true') {
        if (adminBtn) adminBtn.classList.remove('hidden');
    } else {
        if (adminBtn) adminBtn.classList.add('hidden');
    }
});

// Ctrl + Shift + A ile Şifre Penceresini Açma
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openLoginModal();
    }
});

function openLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    const errorMsg = document.getElementById('login-error-msg');
    if (modal) modal.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
}

function checkAdminPassword() {
    const inputPass = document.getElementById('admin-password-input').value;
    const errorMsg = document.getElementById('login-error-msg');

    if (inputPass === ADMIN_PASSWORD) {
        localStorage.setItem('is_admin', 'true');
        showAdminButton();
        closeLoginModal();
        alert('Giriş Başarılı! Yönetici modu aktif.');
    } else {
        if (errorMsg) errorMsg.classList.remove('hidden');
    }
}

function showAdminButton() {
    const adminBtn = document.getElementById('admin-add-btn');
    if (adminBtn) adminBtn.classList.remove('hidden');
}
// --- MOBİL MENÜ AÇ / KAPA LOGIC ---
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}
