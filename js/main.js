// ==========================================
// 1. ORTAK NAVBAR COMPONENT & TEMA BAĞLANTISI
// ==========================================
function renderNavbar(activePage) {
    const navbarHTML = `
    <nav class="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0d0f12]/80 glass-card">
        <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            
            <!-- Logo -->
            <a href="index.html" class="text-xl font-bold tracking-wider uppercase">
                M. Ali <span class="ts-gradient-text">Yıldırım</span>
            </a>

            <!-- MASAÜSTÜ MENÜ -->
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
            <a href="sosyal.html" class="block px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">Sosyal Medya</a>
        </div>
    </nav>
    `;

    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        navContainer.innerHTML = navbarHTML;
        
        // Navbar yüklendikten hemen sonra tema ve admin buton durumunu güncelle
        initThemeIcons();
        if (localStorage.getItem('is_admin') === 'true') {
            showAdminButton();
        }
    }
}

// ==========================================
// 2. MOBİL MENÜ LOGIC
// ==========================================
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// ==========================================
// 3. DARK / LIGHT MODE LOGIC
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

// Sayfa ilk yüklendiğinde hafızadaki temayı uygula
(function applyInitialTheme() {
    const savedTheme = localStorage.getItem('color-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

// ==========================================
// 4. 🔐 ŞİFRELİ ADMIN GİRİŞİ LOGIC
// ==========================================
const ADMIN_PASSWORD = "1967"; // Yönetici şifren

// Klavyeden Ctrl + Shift + A basıldığında Şifre Penceresini Aç
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

function logoutAdmin() {
    localStorage.removeItem('is_admin');
    location.reload();
}

// ==========================================
// 5. DERS EKLE MODALINI AÇMA & SAYFA YÖNLENDİRME LOGIC
// ==========================================
function openAddModal() {
    // Eğer şu an dersler.html sayfasında değilsek, otomatik olarak dersler.html'e yönlendir ve modalı aç
    if (!window.location.pathname.includes('dersler.html')) {
        window.location.href = 'dersler.html?openModal=true';
        return;
    }

    // Eğer zaten dersler.html sayfasındaysak modal penceresini direkt aç
    const modal = document.getElementById('add-course-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Başka sayfadan tıklandığında (URL'de ?openModal=true varsa) formu otomatik açar
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openModal') === 'true') {
        const modal = document.getElementById('add-course-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
});
