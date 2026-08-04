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

// Belirlediğin Yönetici Şifresi (Burayı dilediğin şifre yapabilirsin)
const ADMIN_PASSWORD = "1967"; 

document.addEventListener('DOMContentLoaded', () => {
    // Daha önce başarılı giriş yapılmışsa + butonunu otomatik göster
    if (localStorage.getItem('is_admin') === 'true') {
        showAdminButton();
    }
});

// Klavyeden "Ctrl + Shift + A" basıldığında Şifre Penceresini Aç
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
        localStorage.setItem('is_admin', 'true'); // Cihaza yönetici olduğunu kaydet
        showAdminButton();
        closeLoginModal();
        alert('Giriş Başarılı! Ders Ekle (+) butonu aktifleştirildi.');
    } else {
        if (errorMsg) errorMsg.classList.remove('hidden');
    }
}

function showAdminButton() {
    const adminBtn = document.getElementById('admin-add-btn');
    if (adminBtn) adminBtn.classList.remove('hidden');
}

// İleride çıkış yapmak istersen konsoldan: logoutAdmin() çağırabilirsin
function logoutAdmin() {
    localStorage.removeItem('is_admin');
    location.reload();
}
