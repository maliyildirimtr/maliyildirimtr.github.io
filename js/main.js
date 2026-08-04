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
