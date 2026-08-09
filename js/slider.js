// ==========================================
// HERO SLIDER & DUYURU YÖNETİMİ (js/slider.js)
// ==========================================

const DEFAULT_SLIDES = [
    {
        id: "default-whoami",
        isDefault: true,
        icon: "👋",
        badge: "📌 Biyografi",
        title: "Ben Kimim?",
        description: "Gazi Üniversitesi Elektrik-Elektronik Mühendisliği öğrencisi. FPGA mimarileri, SystemVerilog, STM32 & FreeRTOS gömülü sistemler ve yapay zeka projeleri. Detaylı teknik öz geçmişimi inceleyin.",
        buttonText: "Detayları İncele ↓",
        targetUrl: "#about-details",
        isAnchor: true
    },
    {
        id: "default-courses",
        isDefault: true,
        icon: "📚",
        badge: "🎓 Akademik",
        title: "Dersler & Akademik Notlar",
        description: "Mantık Devreleri Tasarımı, Microprocessors, İşaretler ve Sistemler ders notları, sınav hazırlık belgeleri ve açık kaynak anlatımlar.",
        buttonText: "Derslere Git →",
        targetUrl: "dersler.html",
        isAnchor: false
    },
    {
        id: "default-academy",
        isDefault: true,
        icon: "🚀",
        badge: "⚡ Topluluk",
        title: "Mali Academy İş Birliği Platformu",
        description: "Mühendislik takımları için geliştirilmiş ortak çalışma alanı: Kanban panosu, bütçe takibi ve görüntülü Virtual Lab odaları.",
        buttonText: "Platforma Git ↗",
        targetUrl: "https://academy.maliyildirimtr.com",
        isAnchor: false,
        isExternal: true
    }
];

let allSlides = [...DEFAULT_SLIDES];
let rawDynamicSlides = [];
let currentSlideIndex = 0;
let slideInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
});

// SLIDER BAŞLATICI & FIRESTORE ABONELİĞİ
function initHeroSlider() {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("announcements").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            let dynamicSlides = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach((doc) => {
                    dynamicSlides.push({ id: doc.id, ...doc.data() });
                });
            }
            rawDynamicSlides = dynamicSlides;
            allSlides = [...DEFAULT_SLIDES, ...dynamicSlides];
            renderSliderUI();
            if (typeof isAdmin === 'function' && isAdmin()) {
                renderAdminAnnouncementsList(dynamicSlides);
            }
        }, (err) => {
            console.warn("Firestore duyurular okunamadı, varsayılan slider kartları gösteriliyor:", err);
            allSlides = [...DEFAULT_SLIDES];
            renderSliderUI();
        });
    } else {
        allSlides = [...DEFAULT_SLIDES];
        renderSliderUI();
    }
}

// SLIDER ARAYÜZÜNÜ ÇİZME
function renderSliderUI() {
    const track = document.getElementById('slider-track');
    const dotsContainer = document.getElementById('slider-dots');
    const countBadge = document.getElementById('slider-count-badge');

    if (!track) return;

    if (currentSlideIndex >= allSlides.length) {
        currentSlideIndex = 0;
    }

    if (countBadge) {
        countBadge.innerText = `${currentSlideIndex + 1} / ${allSlides.length}`;
    }

    const adminBtn = document.getElementById('admin-announcement-btn');
    if (adminBtn) {
        if (typeof isAdmin === 'function' && isAdmin()) {
            adminBtn.classList.remove('hidden');
            adminBtn.classList.add('inline-flex');
        } else {
            adminBtn.classList.add('hidden');
            adminBtn.classList.remove('inline-flex');
        }
    }

    let slidesHTML = "";
    allSlides.forEach((slide, idx) => {
        const isActive = idx === currentSlideIndex;
        const icon = slide.icon || "📢";
        const badge = slide.badge || "Duyuru";
        const title = slide.title || "Duyuru Başlığı";
        const desc = slide.description || "";
        const buttonText = slide.buttonText || "Detaylar ↗";
        const targetUrl = slide.targetUrl || "#";
        const isAnchor = slide.isAnchor || targetUrl.startsWith('#');
        const isExternal = slide.isExternal || targetUrl.startsWith('http');

        let buttonOnClick = "";
        if (isAnchor) {
            buttonOnClick = `onclick="scrollToAboutDetails(event)"`;
        }

        slidesHTML += `
            <div class="w-full shrink-0 transition-opacity duration-500 ease-in-out ${isActive ? 'block opacity-100' : 'hidden opacity-0'}">
                <div class="relative rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 shadow-xl backdrop-blur-md overflow-hidden">
                    
                    <div class="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-tsBordo via-rose-500 to-tsMavi"></div>

                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div class="space-y-3 max-w-2xl">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tsMavi/10 text-tsMavi dark:text-sky-400 border border-tsMavi/20 text-xs font-bold">
                                <span>${icon}</span> ${badge}
                            </div>
                            
                            <h2 class="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                                ${title}
                            </h2>

                            <p class="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                                ${desc}
                            </p>
                        </div>

                        <div class="shrink-0 flex items-center gap-3">
                            <a href="${targetUrl}" ${buttonOnClick} ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''} class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-bold text-xs shadow-lg shadow-tsBordo/20 hover:opacity-90 transition-all flex items-center gap-2">
                                ${buttonText}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    track.innerHTML = slidesHTML;

    // Nokta İndikatörleri
    if (dotsContainer) {
        let dotsHTML = "";
        allSlides.forEach((_, idx) => {
            const isActive = idx === currentSlideIndex;
            dotsHTML += `
                <button onclick="goToSlide(${idx})" title="Slayt ${idx + 1}" class="h-2 rounded-full transition-all duration-300 ${isActive ? 'w-8 bg-tsMavi' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'}"></button>
            `;
        });
        dotsContainer.innerHTML = dotsHTML;
    }

    startAutoSlide();
}

// SLIDER KONTROL FONKSİYONLARI
function goToSlide(index) {
    currentSlideIndex = index;
    renderSliderUI();
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % allSlides.length;
    renderSliderUI();
}

function prevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + allSlides.length) % allSlides.length;
    renderSliderUI();
}

function startAutoSlide() {
    stopAutoSlide();
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

function stopAutoSlide() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

// YUMUŞAK KAYDIRMA (SMOOTH SCROLL)
function scrollToAboutDetails(e) {
    if (e && e.preventDefault) e.preventDefault();
    const el = document.getElementById('about-details');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==========================================
// ADMİN DUYURU / SLIDER YÖNETİMİ (CRUD: CREATE, READ, UPDATE, DELETE)
// ==========================================
function openAnnouncementModal() {
    if (typeof isAdmin === 'function' && !isAdmin()) {
        alert("Bu işlem yalnızca Yönetici (Admin) yetkisine açıktır.");
        return;
    }
    const modal = document.getElementById('announcement-admin-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAnnouncementModal() {
    const modal = document.getElementById('announcement-admin-modal');
    if (modal) modal.classList.add('hidden');
    resetAnnouncementForm();
}

function resetAnnouncementForm() {
    const form = document.getElementById('announcement-form');
    const editIdInput = document.getElementById('announcement-edit-id');
    const submitBtn = document.getElementById('announcement-submit-btn');
    const formTitle = document.getElementById('announcement-form-title');
    const cancelBtn = document.getElementById('announcement-cancel-edit-btn');

    if (form) form.reset();
    if (editIdInput) editIdInput.value = "";
    if (submitBtn) {
        submitBtn.innerHTML = "<span>＋</span> Slider'a Ekle";
        submitBtn.className = "px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md";
    }
    if (formTitle) formTitle.innerText = "Yeni Slider Kartı Ekle";
    if (cancelBtn) cancelBtn.classList.add('hidden');
}

function handleCreateOrUpdateAnnouncement(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (typeof isAdmin === 'function' && !isAdmin()) {
        alert("Bu işlemi gerçekleştirme yetkiniz bulunmuyor.");
        return;
    }

    const editId = document.getElementById('announcement-edit-id')?.value;
    const title = document.getElementById('announcement-title')?.value.trim();
    const desc = document.getElementById('announcement-desc')?.value.trim();
    const badge = document.getElementById('announcement-badge')?.value.trim() || "Duyuru";
    const icon = document.getElementById('announcement-icon')?.value.trim() || "📢";
    const buttonText = document.getElementById('announcement-button-text')?.value.trim() || "Detaylar ↗";
    const targetUrl = document.getElementById('announcement-target-url')?.value.trim() || "#";

    if (!title || !desc) {
        alert("Lütfen en azından Duyuru Başlığı ve Açıklama alanlarını doldurun.");
        return;
    }

    const announcementData = {
        title: title,
        description: desc,
        badge: badge,
        icon: icon,
        buttonText: buttonText,
        targetUrl: targetUrl,
        updatedAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date().toISOString()
    };

    if (typeof db !== 'undefined' && db && db.collection) {
        if (editId) {
            // UPDATE EXISTING ANNOUNCEMENT
            db.collection("announcements").doc(editId).update(announcementData).then(() => {
                alert("✨ Duyuru slider kartı başarıyla güncellendi!");
                closeAnnouncementModal();
            }).catch(err => {
                console.error("Duyuru güncelleme hatası:", err);
                alert("❌ Duyuru güncellenirken bir hata oluştu.");
            });
        } else {
            // CREATE NEW ANNOUNCEMENT
            announcementData.createdAt = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
                ? firebase.firestore.FieldValue.serverTimestamp()
                : new Date().toISOString();

            db.collection("announcements").add(announcementData).then(() => {
                alert("✅ Yeni duyuru slider kartı başarıyla eklendi!");
                closeAnnouncementModal();
            }).catch(err => {
                console.error("Duyuru ekleme hatası:", err);
                alert("❌ Duyuru eklenirken bir hata oluştu.");
            });
        }
    } else {
        alert("❌ Veritabanı bağlantısı kurulamadı.");
    }
}

function editAnnouncement(id) {
    if (typeof isAdmin === 'function' && !isAdmin()) return;
    const target = rawDynamicSlides.find(item => item.id === id);
    if (!target) return;

    const editIdInput = document.getElementById('announcement-edit-id');
    const titleInput = document.getElementById('announcement-title');
    const descInput = document.getElementById('announcement-desc');
    const badgeInput = document.getElementById('announcement-badge');
    const iconInput = document.getElementById('announcement-icon');
    const buttonTextInput = document.getElementById('announcement-button-text');
    const targetUrlInput = document.getElementById('announcement-target-url');
    const submitBtn = document.getElementById('announcement-submit-btn');
    const formTitle = document.getElementById('announcement-form-title');
    const cancelBtn = document.getElementById('announcement-cancel-edit-btn');

    if (editIdInput) editIdInput.value = target.id;
    if (titleInput) titleInput.value = target.title || "";
    if (descInput) descInput.value = target.description || "";
    if (badgeInput) badgeInput.value = target.badge || "";
    if (iconInput) iconInput.value = target.icon || "";
    if (buttonTextInput) buttonTextInput.value = target.buttonText || "";
    if (targetUrlInput) targetUrlInput.value = target.targetUrl || "";

    if (submitBtn) {
        submitBtn.innerHTML = "<span>✨</span> Değişiklikleri Güncelle";
        submitBtn.className = "px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-colors";
    }
    if (formTitle) formTitle.innerText = "✏️ Duyuru Kartını Düzenle";
    if (cancelBtn) cancelBtn.classList.remove('hidden');

    const modal = document.getElementById('announcement-admin-modal');
    if (modal) modal.classList.remove('hidden');
}

function deleteAnnouncement(id) {
    if (typeof isAdmin === 'function' && !isAdmin()) return;
    if (!confirm("Bu duyuru slider kartını silmek istediğinize emin misiniz?")) return;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("announcements").doc(id).delete().then(() => {
            alert("🗑️ Duyuru başarıyla silindi.");
        }).catch(err => {
            console.error("Duyuru silme hatası:", err);
            alert("❌ Duyuru silinirken bir hata oluştu.");
        });
    }
}

function renderAdminAnnouncementsList(dynamicSlides) {
    const listContainer = document.getElementById('admin-announcements-list');
    if (!listContainer) return;

    if (!dynamicSlides || dynamicSlides.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">Henüz eklenmiş özel duyuru yok.</p>`;
        return;
    }

    let html = "";
    dynamicSlides.forEach(item => {
        const safeTitle = (item.title || '').replace(/'/g, "\\'");
        html += `
            <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
                <div class="space-y-0.5 min-w-0 pr-2">
                    <div class="flex items-center gap-1.5">
                        <span class="font-bold text-tsMavi">${item.icon || '📢'} ${item.badge || 'Duyuru'}</span>
                    </div>
                    <h4 class="font-bold text-slate-900 dark:text-slate-100 truncate">${item.title}</h4>
                    <p class="text-[11px] text-slate-500 line-clamp-1">${item.description}</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="editAnnouncement('${item.id}')" title="Duyuruyu Düzenle" class="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 font-bold transition-all text-[11px]">
                        ✏️ Düzenle
                    </button>
                    <button onclick="deleteAnnouncement('${item.id}')" title="Duyuruyu Sil" class="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-bold transition-all text-[11px]">
                        🗑️ Sil
                    </button>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}
