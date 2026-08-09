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

// Sayfa Yüklendiğinde Grupları Yükleme
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderNavbar === 'function') {
        renderNavbar('gruplar');
    }

    const adminGuard = document.getElementById('admin-access-guard');
    const mainContent = document.getElementById('groups-main-content');

    // Herkes proje gruplarını görüntüleyebilir ve katılabilir
    if (adminGuard) adminGuard.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');

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

// KULLANICI GRUP ÜYELİĞİ / LİDERLİĞİ KONTROLÜ
function isUserGroupMember(group) {
    if (!group) return false;
    const isPlatformAdmin = (typeof isAdmin === 'function' && isAdmin());
    if (isPlatformAdmin) return true; // Platform Yöneticisi doğrudan erişebilir

    const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
    if (!user) return false;

    // Grup kurucusu / lideri mi?
    if (group.leaderUid === user.uid || (group.leader && user.displayName && group.leader === user.displayName)) {
        return true;
    }

    // Grubun üyeler dizisinde var mı?
    if (group.members && Array.isArray(group.members)) {
        return group.members.some(m => m.uid === user.uid || (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase()));
    }

    return false;
}

function handleGroupCardClick(event, groupId) {
    if (event) event.stopPropagation();

    const group = allGroups.find(g => g.id === groupId);
    if (!group) return;

    if (isUserGroupMember(group)) {
        window.location.href = `grup-detay.html?id=${groupId}`;
    } else {
        openJoinModalForGroup(group);
    }
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
        const isMember = isUserGroupMember(g);

        const lookingRolesHTML = g.lookingRoles ? `
            <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
                <div class="flex items-center justify-between gap-1">
                    <span class="text-[10px] font-bold text-amber-500 flex items-center gap-1">🎯 Aranan Yetenekler:</span>
                    <button onclick="event.stopPropagation(); openApplyGroupModal('${g.id}', '${(g.name||'').replace(/'/g, "\\'")}')" class="text-[10px] font-bold text-tsMavi hover:underline flex items-center gap-0.5">
                        📩 Başvur ↗
                    </button>
                </div>
                <div class="flex flex-wrap gap-1">
                    ${g.lookingRoles.split(',').map(r => `<span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20">${r.trim()}</span>`).join('')}
                </div>
            </div>
        ` : '';

        html += `
            <div onclick="handleGroupCardClick(event, '${g.id}')" class="group relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 hover:border-tsMavi transition-all shadow-sm flex flex-col justify-between cursor-pointer overflow-hidden backdrop-blur-md">
                
                <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsBordo to-tsMavi opacity-80 group-hover:opacity-100 transition-opacity"></div>

                <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="px-3 py-1 rounded-full bg-tsMavi/10 text-tsMavi font-bold text-[10px] border border-tsMavi/20">
                            ${g.category || 'Genel'}
                        </span>
                        <div class="flex items-center gap-1.5">
                            ${isMember ? `
                                <span class="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                                    ✓ Üyesiniz
                                </span>
                            ` : `
                                <span class="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold">
                                    🔒 Davet Kodu Gerekli
                                </span>
                            `}
                            ${canDelete ? `
                                <button onclick="event.stopPropagation(); deleteGroup('${g.id}', '${(g.name||'').replace(/'/g, "\\'")}')" title="Grubu Sil" class="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold transition-all">
                                    🗑️ Sil
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <h3 class="font-bold text-base group-hover:text-tsMavi transition-colors leading-snug text-slate-900 dark:text-slate-100">${g.name}</h3>
                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">${g.description}</p>

                    ${lookingRolesHTML}

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
                            ${isMember ? 'Çalışma Alanına Git →' : '🔑 Davet Kodu Gir & Katıl →'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// GRUP SİLME MANTIĞI (Güvenli ZIP Arşivi ve 15 Günlük İndirme Modalı)
function deleteGroup(groupId, groupName) {
    window.location.href = `grup-detay.html?id=${groupId}&open_delete_modal=true`;
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

function checkAuthOrPrompt() {
    const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
    if (!user) {
        if (typeof openAuthModal === 'function') {
            openAuthModal();
        } else {
            alert("Bu işlemi gerçekleştirmek için lütfen giriş yapın veya kayıt olun.");
        }
        return false;
    }
    return true;
}

// MODAL AÇMA / KAPAMA
function openCreateGroupModal() {
    if (!checkAuthOrPrompt()) return;
    const modal = document.getElementById('create-group-modal');
    if (modal) modal.classList.remove('hidden');
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
    openJoinModalForGroup(null);
}

function openJoinModalForGroup(group) {
    if (!checkAuthOrPrompt()) return;

    const modal = document.getElementById('join-group-modal');
    const targetInput = document.getElementById('join-group-target-id');
    const nameDisplay = document.getElementById('join-group-name-display');
    const inputCode = document.getElementById('invite-code-input');
    const errorMsg = document.getElementById('join-invite-error');

    if (targetInput) targetInput.value = group ? group.id : '';
    if (nameDisplay) {
        nameDisplay.innerText = group 
            ? `📌 "${group.name}" çalışma alanına erişmek için grup liderinden aldığınız davet kodunu giriniz.`
            : "Bu grubun çalışma alanına erişmek için grup liderinden aldığınız davet kodunu giriniz.";
    }
    if (inputCode) {
        inputCode.value = '';
        setTimeout(() => inputCode.focus(), 100);
    }
    if (errorMsg) errorMsg.classList.add('hidden');

    if (modal) modal.classList.remove('hidden');
}

function closeJoinModal() {
    const modal = document.getElementById('join-group-modal');
    const errorMsg = document.getElementById('join-invite-error');
    if (modal) modal.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    if (document.getElementById('join-group-form')) document.getElementById('join-group-form').reset();
}

function handleJoinGroup(e) {
    if (e && e.preventDefault) e.preventDefault();

    const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
    if (!user) {
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    const targetIdInput = document.getElementById('join-group-target-id');
    const inputCodeEl = document.getElementById('invite-code-input');
    const errorMsg = document.getElementById('join-invite-error');

    const enteredCode = inputCodeEl ? inputCodeEl.value.trim().toUpperCase() : '';
    const targetId = targetIdInput ? targetIdInput.value : '';

    if (!enteredCode) return;

    let targetGroup = null;

    if (targetId) {
        targetGroup = allGroups.find(g => g.id === targetId);
    } else {
        targetGroup = allGroups.find(g => (g.inviteCode || '').trim().toUpperCase() === enteredCode);
    }

    if (!targetGroup) {
        if (errorMsg) {
            errorMsg.innerText = "❌ Girdiğiniz davet koduna ait bir proje grubu bulunamadı.";
            errorMsg.classList.remove('hidden');
        }
        return;
    }

    const expectedCode = (targetGroup.inviteCode || '').trim().toUpperCase();

    if (enteredCode === expectedCode) {
        const creatorName = user.displayName || user.email.split('@')[0];
        const newMember = {
            uid: user.uid,
            name: creatorName,
            email: user.email,
            role: "Üye",
            joinedAt: new Date().toISOString()
        };

        if (typeof db !== 'undefined' && db && db.collection && targetGroup.id) {
            db.collection("groups").doc(targetGroup.id).update({
                members: firebase.firestore.FieldValue.arrayUnion(newMember),
                membersCount: firebase.firestore.FieldValue.increment(1)
            }).then(() => {
                closeJoinModal();
                alert(`🎉 Tebrikler! "${targetGroup.name}" projesine üye olarak katıldınız.`);
                window.location.href = `grup-detay.html?id=${targetGroup.id}`;
            }).catch(err => {
                console.warn("Firestore üye güncelleme hatası:", err);
                closeJoinModal();
                window.location.href = `grup-detay.html?id=${targetGroup.id}`;
            });
        } else {
            closeJoinModal();
            alert(`🎉 Tebrikler! "${targetGroup.name}" projesine üye olarak katıldınız.`);
            window.location.href = `grup-detay.html?id=${targetGroup.id}`;
        }
    } else {
        if (errorMsg) {
            errorMsg.innerText = "❌ Girdiğiniz davet kodu hatalı. Lütfen kontrol edip tekrar deneyiniz.";
            errorMsg.classList.remove('hidden');
        }
    }
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
        const rolesEl = document.getElementById('group-looking-roles');

        const name = nameEl ? nameEl.value.trim() : '';
        let category = categoryEl ? categoryEl.value : 'FPGA / Donanım';
        
        // Eğer kullanıcı "Diğer (Özel Kategori)" seçtiyse, özel metin alanındaki yazıyı al
        if (category === 'other') {
            const customVal = customCategoryEl ? customCategoryEl.value.trim() : '';
            category = customVal || 'Özel Kategori';
        }

        const targetBudget = budgetEl ? (parseFloat(budgetEl.value) || 0) : 0;
        const desc = descEl ? descEl.value.trim() : '';
        const lookingRoles = rolesEl ? rolesEl.value.trim() : '';

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
            lookingRoles: lookingRoles,
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

        function saveGroupToLocalCache(grp) {
            try {
                let cached = JSON.parse(localStorage.getItem('mali_created_groups') || '[]');
                cached = cached.filter(g => g.id !== grp.id);
                cached.unshift(grp);
                localStorage.setItem('mali_created_groups', JSON.stringify(cached));
            } catch(e) {}
        }

        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").add(newGroup).then((docRef) => {
                newGroup.id = docRef.id;
                saveGroupToLocalCache(newGroup);
                alert(`✅ "${name}" projesi başarıyla oluşturuldu!\n🔑 Davet Kodu: ${randomCode}`);
                closeCreateGroupModal();
                window.location.href = `grup-detay.html?id=${docRef.id}`;
            }).catch(err => {
                console.warn("Firestore kayıt hatası, yerel yönlendirme yapılıyor:", err);
                const localId = 'grp-' + Date.now();
                newGroup.id = localId;
                saveGroupToLocalCache(newGroup);
                DEMO_GROUPS.unshift(newGroup);
                alert(`✅ "${name}" projesi başarıyla oluşturuldu!\n🔑 Davet Kodu: ${randomCode}`);
                closeCreateGroupModal();
                window.location.href = `grup-detay.html?id=${localId}`;
            });
        } else {
            const localId = 'grp-' + Date.now();
            newGroup.id = localId;
            saveGroupToLocalCache(newGroup);
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

// TALENT MATCH BAŞVURU SÜRECİ
function openApplyGroupModal(groupId, groupName) {
    if (!checkAuthOrPrompt()) return;
    const modal = document.getElementById('apply-group-modal');
    if (document.getElementById('apply-group-id')) document.getElementById('apply-group-id').value = groupId;
    const nameEl = document.getElementById('apply-group-name-display');
    if (nameEl) nameEl.innerText = `📌 Başvurulacak Proje: ${groupName}`;

    const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
    if (user) {
        if (document.getElementById('applicant-name')) document.getElementById('applicant-name').value = user.displayName || user.email.split('@')[0] || '';
        if (document.getElementById('applicant-email')) document.getElementById('applicant-email').value = user.email || '';
    }

    if (modal) modal.classList.remove('hidden');
}

function closeApplyGroupModal() {
    document.getElementById('apply-group-modal').classList.add('hidden');
    document.getElementById('apply-group-form').reset();
}

function handleSendGroupApplication(e) {
    if (e && e.preventDefault) e.preventDefault();

    const groupId = document.getElementById('apply-group-id').value;
    const name = document.getElementById('applicant-name').value.trim();
    const email = document.getElementById('applicant-email').value.trim();
    const role = document.getElementById('applicant-role').value.trim();
    const note = document.getElementById('applicant-note').value.trim();

    if (!groupId || !name || !email || !role) return;

    const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

    const applicationData = {
        applicantUid: user ? user.uid : 'uid-' + Date.now(),
        name,
        email,
        requestedRole: role,
        note,
        status: 'pending',
        createdAt: timestamp
    };

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("applications").add(applicationData).then(() => {
            alert(`✅ Katılma başvurunuz proje liderine başarıyla iletildi!`);
            closeApplyGroupModal();
        }).catch(err => {
            alert("Başvuru gönderilirken bir hata oluştu: " + err.message);
        });
    } else {
        alert(`✅ Katılma başvurunuz proje liderine başarıyla iletildi!`);
        closeApplyGroupModal();
    }
}
