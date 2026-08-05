// ==========================================
// PROJE GRUPLARI MANTIGI & SEED VERILERI (js/gruplar.js)
// ==========================================

const DEMO_GROUPS = [
    {
        id: "fpga-ai-accel",
        name: "FPGA Tabanlı YZ Hızlandırıcı Tasarımı",
        category: "FPGA / Donanım",
        inviteCode: "MP-8492",
        leader: "Mehmet Ali Yıldırım",
        description: "SystemVerilog ve Intel Quartus Prime kullanarak Evrişimli Sinir Ağları (CNN) matris çarpımlarını dikey boru hattı (pipelined) mimari ile FPGA üzerinde hızlandırma projesi.",
        targetBudget: 7500,
        spentBudget: 3200,
        membersCount: 4,
        tasksDone: 8,
        tasksTotal: 12,
        createdAt: new Date().toISOString()
    },
    {
        id: "stm32-uav-flight",
        name: "STM32 & FreeRTOS Otonom İHA Kartı",
        category: "Gömülü Sistemler",
        inviteCode: "UAV-9102",
        leader: "Ahmet Yılmaz",
        description: "STM32F4 serisi mikrodenetleyici üzerinde FreeRTOS gerçek zamanlı işletim sistemi ile Kalman filtresi destekli otonom uçuş kontrol kartı donanım ve yazılımı.",
        targetBudget: 4800,
        spentBudget: 2150,
        membersCount: 3,
        tasksDone: 5,
        tasksTotal: 9,
        createdAt: new Date().toISOString()
    },
    {
        id: "edge-ai-camera",
        name: "Edge AI Akıllı Güvenlik Kamerası",
        category: "Yapay Zeka / Otonom",
        inviteCode: "AI-3341",
        leader: "Zeynep Kaya",
        description: "Raspberry Pi ve Coral NPU modülü ile nesne tespiti yapan, nesneleri yerel olarak işleyerek Firebase veritabanına anlık alarm gönderen akıllı kamera sistemi.",
        targetBudget: 3200,
        spentBudget: 1400,
        membersCount: 3,
        tasksDone: 6,
        tasksTotal: 7,
        createdAt: new Date().toISOString()
    }
];

let allGroups = [];
let currentCategoryFilter = 'all';

// Sayfa Yüklendiğinde Admin Kontrolü ve Başlatma
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderNavbar === 'function') {
        renderNavbar('gruplar');
    }

    const adminGuard = document.getElementById('admin-access-guard');
    const mainContent = document.getElementById('groups-main-content');

    const adminState = typeof isAdmin === 'function' && isAdmin();

    if (!adminState) {
        if (adminGuard) adminGuard.classList.remove('hidden');
        if (mainContent) mainContent.classList.add('hidden');
        return;
    } else {
        if (adminGuard) adminGuard.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
    }

    loadGroupsList();
});

// Grupları Yükleme Fonksiyonu
function loadGroupsList() {
    const grid = document.getElementById('groups-grid');
    if (!grid) return;

    if (typeof db !== 'undefined') {
        db.collection("groups").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            let groups = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach((doc) => {
                    groups.push({ id: doc.id, ...doc.data() });
                });
            }

            if (groups.length === 0) {
                groups = DEMO_GROUPS;
            }

            allGroups = groups;
            renderGroupsUI(allGroups);
            updateStatsBar(allGroups);
        }, (err) => {
            console.warn("Firestore gruplar çekilemedi, demo gruplar gösteriliyor:", err);
            allGroups = DEMO_GROUPS;
            renderGroupsUI(allGroups);
            updateStatsBar(allGroups);
        });
    } else {
        allGroups = DEMO_GROUPS;
        renderGroupsUI(allGroups);
        updateStatsBar(allGroups);
    }
}

// İstatistik Barını Güncelleme (Yalnızca Genel Metrikler)
function updateStatsBar(groups) {
    const groupCountEl = document.getElementById('stat-group-count');
    const memberCountEl = document.getElementById('stat-member-count');

    let totalMembers = 0;
    groups.forEach(g => {
        totalMembers += (g.membersCount || 1);
    });

    if (groupCountEl) groupCountEl.innerText = groups.length;
    if (memberCountEl) memberCountEl.innerText = totalMembers;
}

// Grupları Ekrana Çizme
function renderGroupsUI(groups) {
    const grid = document.getElementById('groups-grid');
    if (!grid) return;

    let filtered = groups;
    if (currentCategoryFilter !== 'all') {
        filtered = groups.filter(g => g.category === currentCategoryFilter);
    }

    const searchInput = document.getElementById('search-groups-input');
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (q) {
        filtered = filtered.filter(g => (g.name || '').toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-16 text-center text-slate-500 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl">Aradığınız kriterde proje grubu bulunamadı.</div>`;
        return;
    }

    let html = "";
    const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
    const isPlatformAdmin = (typeof isAdmin === 'function' && isAdmin());

    filtered.forEach(g => {
        const progress = g.tasksTotal > 0 ? Math.round((g.tasksDone / g.tasksTotal) * 100) : 0;
        const budgetPercent = g.targetBudget > 0 ? Math.min(100, Math.round((g.spentBudget / g.targetBudget) * 100)) : 0;
        
        const isCreator = user && (g.leaderUid === user.uid || (g.leader && user.displayName && g.leader === user.displayName));
        const canDelete = isPlatformAdmin || isCreator;

        html += `
            <div onclick="window.location.href='grup-detay.html?id=${g.id}'" class="group relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 hover:border-tsMavi transition-all shadow-sm flex flex-col justify-between cursor-pointer overflow-hidden backdrop-blur-md">
                
                <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsBordo to-tsMavi opacity-80 group-hover:opacity-100 transition-opacity"></div>

                <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="px-3 py-1 rounded-full bg-tsMavi/10 text-tsMavi font-bold text-[10px] border border-tsMavi/20">
                            ${g.category || 'Genel'}
                        </span>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                🔑 ${g.inviteCode || 'MP-0000'}
                            </span>
                            ${canDelete ? `
                                <button onclick="event.stopPropagation(); deleteGroup('${g.id}', '${(g.name||'').replace(/'/g, "\\'")}')" title="Grubu Sil" class="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold transition-all">
                                    🗑️ Sil
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <h3 class="font-bold text-base group-hover:text-tsMavi transition-colors leading-snug text-slate-900 dark:text-slate-100">${g.name}</h3>
                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">${g.description}</p>

                    <!-- LİDER & ÜYELER -->
                    <div class="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-tsBordo to-tsMavi text-white font-bold text-[10px] flex items-center justify-center">
                            👤
                        </div>
                        <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${g.leader || 'Yönetici Admin'}</span>
                        <span class="ml-auto text-[10px] text-slate-500 dark:text-slate-400 font-medium">👥 ${g.membersCount || 1} Üye</span>
                    </div>
                </div>

                <!-- GÖREV VE BÜTÇE İLERLEMESİ -->
                <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
                    <div class="space-y-1">
                        <div class="flex justify-between text-[10px] font-bold">
                            <span class="text-slate-500 dark:text-slate-400">Görev İlerlemesi</span>
                            <span class="text-emerald-500">%${progress} (${g.tasksDone || 0}/${g.tasksTotal || 0})</span>
                        </div>
                        <div class="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div class="h-full bg-emerald-500 rounded-full transition-all" style="width: ${progress}%"></div>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <div class="flex justify-between text-[10px] font-bold">
                            <span class="text-slate-500 dark:text-slate-400">Ortak Kasa</span>
                            <span class="text-rose-500 dark:text-rose-400">₺${(g.spentBudget||0).toLocaleString('tr-TR')} / ₺${(g.targetBudget||0).toLocaleString('tr-TR')}</span>
                        </div>
                        <div class="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div class="h-full bg-rose-500 rounded-full transition-all" style="width: ${budgetPercent}%"></div>
                        </div>
                    </div>

                    <div class="pt-2 flex items-center justify-between">
                        <span class="text-xs text-tsMavi font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Çalışma Alanına Git →
                        </span>
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// GRUP SİLME MANTIĞI
function deleteGroup(groupId, groupName) {
    if (!confirm(`"${groupName}" projesini ve tüm çalışma alanı verilerini tamamen silmek istediğinizden emin misiniz?`)) return;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).delete().then(() => {
            alert(`✅ "${groupName}" projesi başarıyla silindi.`);
        }).catch(err => {
            alert("Silme Hatası: " + err.message);
        });
    } else {
        allGroups = allGroups.filter(g => g.id !== groupId);
        renderGroupsUI(allGroups);
        updateStatsBar(allGroups);
        alert(`✅ "${groupName}" projesi silindi.`);
    }
}

// Filtreleme Fonksiyonları
function filterGroups(category) {
    currentCategoryFilter = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-tsMavi', 'text-white');
        btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active', 'bg-tsMavi', 'text-white');
        event.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    }
    renderGroupsUI(allGroups);
}

function searchGroups() {
    renderGroupsUI(allGroups);
}

// Dinamik "Diğer" Kategori Alanı Göster/Gizle Mantığı
function handleCategorySelectChange(selectEl) {
    const customContainer = document.getElementById('custom-category-container');
    const customInput = document.getElementById('custom-category-input');

    if (selectEl && selectEl.value === 'other') {
        if (customContainer) {
            customContainer.classList.remove('hidden');
            setTimeout(() => {
                customContainer.classList.remove('scale-95', 'opacity-0');
                customContainer.classList.add('scale-100', 'opacity-100');
            }, 10);
        }
        if (customInput) customInput.setAttribute('required', 'true');
    } else {
        if (customContainer) {
            customContainer.classList.remove('scale-100', 'opacity-100');
            customContainer.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                customContainer.classList.add('hidden');
            }, 200);
        }
        if (customInput) {
            customInput.removeAttribute('required');
            customInput.value = '';
        }
    }
}

// MODAL AÇMA / KAPAMA
function openCreateGroupModal() {
    document.getElementById('create-group-modal').classList.remove('hidden');
}
function closeCreateGroupModal() {
    const modal = document.getElementById('create-group-modal');
    const form = document.getElementById('create-group-form');
    const categorySelect = document.getElementById('group-category');
    
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
    if (categorySelect) handleCategorySelectChange(categorySelect);
}

function openJoinModal() {
    document.getElementById('join-group-modal').classList.remove('hidden');
}
function closeJoinModal() {
    document.getElementById('join-group-modal').classList.add('hidden');
    document.getElementById('join-group-form').reset();
}

// YENİ GRUP OLUŞTURMA SÜRECİ
function handleCreateGroup(e) {
    if (e && e.preventDefault) e.preventDefault();

    try {
        const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
        const nameEl = document.getElementById('group-name');
        const categoryEl = document.getElementById('group-category');
        const customCategoryEl = document.getElementById('custom-category-input');
        const budgetEl = document.getElementById('group-target-budget');
        const descEl = document.getElementById('group-desc');

        const name = nameEl ? nameEl.value.trim() : '';
        let category = categoryEl ? categoryEl.value : 'FPGA / Donanım';
        
        // Eğer kullanıcı "Diğer (Özel Kategori)" seçtiyse, özel metin alanındaki yazıyı al
        if (category === 'other') {
            const customVal = customCategoryEl ? customCategoryEl.value.trim() : '';
            category = customVal || 'Özel Kategori';
        }

        const targetBudget = budgetEl ? (parseFloat(budgetEl.value) || 0) : 0;
        const desc = descEl ? descEl.value.trim() : '';

        if (!name || !desc) {
            alert("Lütfen tüm zorunlu alanları (Grup Adı ve Proje Açıklaması) doldurun!");
            return;
        }

        const randomCode = 'MP-' + Math.floor(1000 + Math.random() * 9000);
        const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
            ? firebase.firestore.FieldValue.serverTimestamp() 
            : new Date().toISOString();

        let creatorName = user ? (user.displayName || user.email.split('@')[0]) : "Mehmet Ali Yıldırım";
        let creatorEmail = user ? user.email : "maliyildirimtr@gmail.com";
        let creatorUid = user ? user.uid : "admin-mali-uid";

        const newGroup = {
            name: name,
            category: category,
            inviteCode: randomCode,
            leader: creatorName,
            leaderUid: creatorUid,
            description: desc,
            targetBudget: targetBudget,
            spentBudget: 0,
            membersCount: 1,
            members: [
                { uid: creatorUid, name: creatorName, email: creatorEmail, role: "Yönetici", joinedAt: new Date().toISOString() }
            ],
            milestones: [
                { id: "m1", text: "Proje Mimarisi ve Gereksinim Analizi", status: "completed" },
                { id: "m2", text: "Donanım / Yazılım Geliştirme Fazı", status: "in_progress" },
                { id: "m3", text: "Test, Doğrulama ve Canlıya Alma", status: "planned" }
            ],
            tasksDone: 0,
            tasksTotal: 0,
            createdAt: timestamp
        };

        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").add(newGroup).then((docRef) => {
                alert(`✅ "${name}" projesi başarıyla oluşturuldu!\n🔑 Davet Kodu: ${randomCode}`);
                closeCreateGroupModal();
                window.location.href = `grup-detay.html?id=${docRef.id}`;
            }).catch(err => {
                console.warn("Firestore kayıt hatası, yerel yönlendirme yapılıyor:", err);
                const localId = 'grp-' + Date.now();
                newGroup.id = localId;
                DEMO_GROUPS.unshift(newGroup);
                alert(`✅ "${name}" projesi başarıyla oluşturuldu!\n🔑 Davet Kodu: ${randomCode}`);
                closeCreateGroupModal();
                window.location.href = `grup-detay.html?id=${localId}`;
            });
        } else {
            const localId = 'grp-' + Date.now();
            newGroup.id = localId;
            DEMO_GROUPS.unshift(newGroup);
            alert(`✅ "${name}" projesi başarıyla oluşturuldu!\n🔑 Davet Kodu: ${randomCode}`);
            closeCreateGroupModal();
            window.location.href = `grup-detay.html?id=${localId}`;
        }
    } catch (err) {
        console.error("Grup kurma hatası:", err);
        alert("Grup oluşturulurken bir hata oluştu: " + err.message);
    }
}

// DAVET KODU İLE KATILMA
function handleJoinGroup(e) {
    if (e && e.preventDefault) e.preventDefault();

    try {
        const inputEl = document.getElementById('invite-code-input');
        const code = inputEl ? inputEl.value.trim().toUpperCase() : '';

        if (!code) return;

        const matched = allGroups.find(g => (g.inviteCode || '').toUpperCase() === code);

        if (matched) {
            alert(`✅ "${matched.name}" grubuna başarıyla katıldınız!`);
            closeJoinModal();
            window.location.href = `grup-detay.html?id=${matched.id}`;
        } else {
            alert("⚠️ Geçersiz veya bulunamayan davet kodu! Lütfen doğru kodu girdiğinizden emin olun.");
        }
    } catch (err) {
        console.error("Davet kodu hatası:", err);
    }
}
