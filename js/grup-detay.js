// ==========================================
// GRUP ÇALIŞMA ALANI & TAB YÖNETİMİ (js/grup-detay.js)
// ==========================================

const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('id') || 'fpga-ai-accel';

let currentGroup = null;
let currentTab = 'overview';

let groupTasks = [];
let groupExpenses = [];
let groupMessages = [];

// ÇEVRİMDİŞİ / YEDEK DEMO TEMİZ VERİLER (Varsayılanlar tamamen boş başlar)
const DEMO_TASKS = [];
const DEMO_EXPENSES = [];
const DEMO_MESSAGES = [];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderNavbar === 'function') {
        renderNavbar('gruplar');
    }

    const adminGuard = document.getElementById('admin-access-guard');
    const workspaceContent = document.getElementById('group-workspace-content');

    const adminState = typeof isAdmin === 'function' && isAdmin();

    if (!adminState) {
        if (adminGuard) adminGuard.classList.remove('hidden');
        if (workspaceContent) workspaceContent.classList.add('hidden');
        return;
    } else {
        if (adminGuard) adminGuard.classList.add('hidden');
        if (workspaceContent) workspaceContent.classList.remove('hidden');
    }

    loadGroupWorkspace();
});

// KULLANICI ROLÜ VE YETKİ KONTROLLERİ
function getCurrentUser() {
    return (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
}

function getCurrentUserRole() {
    const user = getCurrentUser();
    if (!currentGroup || !currentGroup.members || !Array.isArray(currentGroup.members)) {
        return (typeof isAdmin === 'function' && isAdmin()) ? 'Yönetici' : 'Üye';
    }

    if (user) {
        const found = currentGroup.members.find(m => m.uid === user.uid || (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase()));
        if (found) return found.role || 'Üye';
    }

    // Admin oturumu açıksa varsayılan Yönetici
    if (typeof isAdmin === 'function' && isAdmin()) {
        return 'Yönetici';
    }

    return 'Üye';
}

function isUserAuthorized() {
    const role = getCurrentUserRole();
    return role === 'Yönetici' || role === 'Yönetici Yardımcısı' || role === 'Lider';
}

function isUserAdmin() {
    const role = getCurrentUserRole();
    return role === 'Yönetici' || role === 'Lider';
}

function isCurrentUserMember() {
    const user = getCurrentUser();
    if (!currentGroup || !currentGroup.members) return false;
    if (user) {
        return currentGroup.members.some(m => m.uid === user.uid || (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase()));
    }
    return (typeof isAdmin === 'function' && isAdmin());
}

// GRUP ÇALIŞMA ALANINI YÜKLEME
function loadGroupWorkspace() {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).onSnapshot((doc) => {
            if (doc.exists) {
                currentGroup = { id: doc.id, ...doc.data() };
            } else {
                fallbackLoadWorkspace();
            }
            renderWorkspaceUI();
        }, () => {
            fallbackLoadWorkspace();
            renderWorkspaceUI();
        });
    } else {
        fallbackLoadWorkspace();
        renderWorkspaceUI();
    }
}

function fallbackLoadWorkspace() {
    const user = getCurrentUser();
    const adminName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    currentGroup = {
        id: groupId,
        name: "FPGA Tabanlı YZ Hızlandırıcı Tasarımı",
        category: "FPGA / Donanım",
        inviteCode: "MP-8492",
        leader: adminName,
        description: "SystemVerilog ve Intel Quartus Prime kullanarak Evrişimli Sinir Ağları (CNN) matris çarpımlarını dikey boru hattı (pipelined) mimari ile FPGA üzerinde hızlandırma projesi.",
        targetBudget: 5000,
        spentBudget: 0,
        membersCount: 1,
        members: [
            { uid: user ? user.uid : 'admin-uid', name: adminName, email: user ? user.email : 'admin@maliyildirimtr.com', role: 'Yönetici' }
        ],
        milestones: [
            { id: "m1", text: "SystemVerilog Top-Level Modül Mimarisi", status: "completed" },
            { id: "m2", text: "Pipelined Matris Çarpanı Sentezi ve ModelSim Verifikasyonu", status: "in_progress" },
            { id: "m3", text: "FPGA Donanım Testi ve Canlıya Alma", status: "planned" }
        ]
    };
}

// ANA ARAYÜZÜ RENDER ETME
function renderWorkspaceUI() {
    const container = document.getElementById('group-workspace-content');
    if (!container || !currentGroup) return;

    const isMember = isCurrentUserMember();
    const roleText = getCurrentUserRole();
    const targetBudget = currentGroup.targetBudget || 0;

    container.innerHTML = `
        <!-- HEADER BÖLÜMÜ -->
        <div class="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl backdrop-blur-md space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        <span class="px-3 py-1 rounded-full bg-tsMavi/10 text-tsMavi font-bold text-xs border border-tsMavi/20">
                            ${currentGroup.category || 'Genel'}
                        </span>
                        <button onclick="copyInviteCode('${currentGroup.inviteCode || 'MP-8492'}')" title="Kodu Kopyala" class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-700 dark:text-slate-300 hover:text-tsMavi border border-slate-300 dark:border-slate-700 transition-colors">
                            🔑 Davet Kodu: <strong class="text-slate-900 dark:text-slate-100">${currentGroup.inviteCode || 'MP-8492'}</strong> 📋
                        </button>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">${currentGroup.name}</h1>
                </div>

                <div class="flex flex-wrap items-center gap-2 shrink-0">
                    ${!isMember ? `
                        <button onclick="joinCurrentGroup()" class="px-4 py-2.5 rounded-xl ts-gradient-btn text-white text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5">
                            <span>➕</span> Gruba Üye Ol
                        </button>
                    ` : `
                        <span class="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                            ✓ Grubun Üyesisiniz (${roleText})
                        </span>
                    `}
                    ${((typeof isAdmin === 'function' && isAdmin()) || isUserAdmin()) ? `
                        <button onclick="deleteCurrentWorkspaceGroup()" title="Grubu tamamen sil" class="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1">
                            🗑️ Grubu Sil
                        </button>
                    ` : ''}
                    <a href="gruplar.html" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-slate-700">
                        ← Gruplara Dön
                    </a>
                </div>
            </div>

            <!-- TAB MENÜSÜ -->
            <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-tsMavi text-tsMavi transition-all">
                    📌 Genel Bakış & Üyeler
                </button>
                <button onclick="switchTab('kanban')" id="tab-btn-kanban" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all">
                    📋 Görev Panosu (Kanban)
                </button>
                <button onclick="switchTab('budget')" id="tab-btn-budget" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all">
                    💳 Ortak Kasa & Bütçe Takibi
                </button>
                <button onclick="switchTab('chat')" id="tab-btn-chat" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all">
                    💬 Grup İçi Sohbet
                </button>
            </div>
        </div>

        <!-- TAB İÇERİK ALANI -->
        <div id="tab-content-area" class="space-y-6"></div>
    `;

    switchTab('overview');
}

// GRUBA ÜYE OLMA
function joinCurrentGroup() {
    const user = getCurrentUser();
    const name = user ? (user.displayName || user.email.split('@')[0]) : "Katılan Üye";
    const email = user ? user.email : "uye@maliyildirimtr.com";
    const uid = user ? user.uid : 'uid-' + Date.now();

    const members = currentGroup.members || [];
    if (members.some(m => m.uid === uid || m.email === email)) {
        alert("Zaten bu grubun üyesisiniz!");
        return;
    }

    const newMember = { uid, name, email, role: 'Üye', joinedAt: new Date().toISOString() };
    members.push(newMember);

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).update({
            members: members,
            membersCount: members.length
        }).then(() => {
            alert(`✅ "${currentGroup.name}" grubuna üye olarak başarıyla katıldınız!`);
        }).catch(err => {
            console.error(err);
            currentGroup.members = members;
            renderWorkspaceUI();
        });
    } else {
        currentGroup.members = members;
        renderWorkspaceUI();
        alert(`✅ "${currentGroup.name}" grubuna üye olarak başarıyla katıldınız!`);
    }
}

// TAB DEĞİŞTİRME MANTIĞI
function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-tsMavi', 'text-tsMavi');
        btn.classList.add('border-transparent', 'text-slate-500', 'dark:text-slate-400');
    });

    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-slate-500', 'dark:text-slate-400');
        activeBtn.classList.add('border-tsMavi', 'text-tsMavi');
    }

    const contentArea = document.getElementById('tab-content-area');
    if (!contentArea) return;

    if (tabName === 'overview') {
        renderOverviewTab(contentArea);
    } else if (tabName === 'kanban') {
        renderKanbanTab(contentArea);
    } else if (tabName === 'budget') {
        renderBudgetTab(contentArea);
    } else if (tabName === 'chat') {
        renderChatTab(contentArea);
    }
}

// 1. GENEL BAKIŞ & ÜYELER TABI
function renderOverviewTab(container) {
    const isAuth = isUserAuthorized();
    const isAdminUser = isUserAdmin();
    const members = currentGroup.members || [];
    const milestones = currentGroup.milestones || [];

    let membersHTML = "";
    members.forEach((m, idx) => {
        const roleColor = m.role === 'Yönetici' || m.role === 'Lider' 
            ? 'bg-tsBordo/10 text-tsBordo dark:text-rose-400 border-tsBordo/20' 
            : m.role === 'Yönetici Yardımcısı' 
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

        membersHTML += `
            <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-tsBordo to-tsMavi text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        ${(m.name || 'Üye').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-bold text-xs text-slate-900 dark:text-slate-100">${m.name}</p>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">${m.email || 'Takım Üyesi'}</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleColor}">
                        ${m.role || 'Üye'}
                    </span>

                    ${(isAdminUser && m.role !== 'Yönetici') ? `
                        <select onchange="changeMemberRole('${m.uid}', this.value)" class="text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none">
                            <option value="Yönetici Yardımcısı" ${m.role === 'Yönetici Yardımcısı' ? 'selected' : ''}>Yönetici Yrd.</option>
                            <option value="Üye" ${m.role === 'Üye' ? 'selected' : ''}>Üye</option>
                        </select>
                        <button onclick="removeMember('${m.uid}', '${m.name}')" title="Gruptan Çıkar" class="text-xs text-rose-500 hover:text-rose-700 p-1">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });

    let milestonesHTML = "";
    if (milestones.length === 0) {
        milestonesHTML = `<div class="py-6 text-center text-slate-500 text-xs italic">Henüz belirlenmiş hedef/dönüm noktası bulunmuyor.</div>`;
    } else {
        milestones.forEach((ms, i) => {
            const icon = ms.status === 'completed' ? '✓' : ms.status === 'in_progress' ? '⏳' : '⭕';
            const color = ms.status === 'completed' ? 'text-emerald-500' : ms.status === 'in_progress' ? 'text-tsMavi' : 'text-slate-400';

            milestonesHTML += `
                <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-3">
                        <span class="${color} font-bold text-sm">${icon}</span>
                        <span class="text-xs text-slate-800 dark:text-slate-200 font-medium">${ms.text}</span>
                    </div>
                    ${isAuth ? `
                        <div class="flex items-center gap-1">
                            <button onclick="openEditMilestoneModal('${ms.id}', '${(ms.text||'').replace(/'/g, "\\'")}', '${ms.status||'planned'}')" class="text-xs text-amber-500 hover:text-amber-600 px-1">✏️</button>
                            <button onclick="deleteMilestone('${ms.id}')" class="text-xs text-rose-500 hover:text-rose-600 px-1">🗑️</button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <!-- PROJE HAKKINDA -->
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">📖 Proje Hakkında</h3>
                        ${isAuth ? `
                            <button onclick="openEditDescModal()" class="text-xs font-semibold text-tsMavi hover:underline flex items-center gap-1">
                                ✏️ Açıklamayı Düzenle
                            </button>
                        ` : ''}
                    </div>
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">${currentGroup.description || 'Henüz proje açıklaması girilmedi.'}</p>
                </div>

                <!-- PROJE HEDEFLERİ & DÖNÜM NOKTALARI -->
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">🎯 Proje Hedefleri & Dönüm Noktaları</h3>
                        ${isAuth ? `
                            <button onclick="openAddMilestoneModal()" class="px-3 py-1.5 rounded-xl bg-tsMavi/10 text-tsMavi text-xs font-bold hover:bg-tsMavi/20 border border-tsMavi/20 transition-all">
                                ＋ Hedef Ekle
                            </button>
                        ` : ''}
                    </div>
                    <div class="space-y-3">
                        ${milestonesHTML}
                    </div>
                </div>
            </div>

            <!-- SAĞ ÜYE LİSTESİ -->
            <div class="space-y-6">
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>👥 Takım Üyeleri</span>
                        <span class="text-xs font-mono bg-tsMavi/10 text-tsMavi px-2.5 py-0.5 rounded-full font-bold">${members.length} Üye</span>
                    </h3>

                    <div class="space-y-3">
                        ${membersHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ÜYE ROLÜ DEĞİŞTİRME & ÇIKARMA
function changeMemberRole(uid, newRole) {
    if (!isUserAdmin()) return;
    const members = currentGroup.members || [];
    const target = members.find(m => m.uid === uid);
    if (target) {
        target.role = newRole;
        saveGroupMembers(members);
    }
}

function removeMember(uid, name) {
    if (!isUserAdmin()) return;
    if (!confirm(`"${name}" adlı üyeyi gruptan çıkarmak istediğinizden emin misiniz?`)) return;

    const members = (currentGroup.members || []).filter(m => m.uid !== uid);
    saveGroupMembers(members);
}

function saveGroupMembers(members) {
    currentGroup.members = members;
    currentGroup.membersCount = members.length;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).update({
            members: members,
            membersCount: members.length
        }).then(() => {
            renderWorkspaceUI();
        });
    } else {
        renderWorkspaceUI();
    }
}

// PROJE HAKKINDA DÜZENLEME
function openEditDescModal() {
    if (!isUserAuthorized()) return;
    const input = document.getElementById('edit-desc-text');
    if (input) input.value = currentGroup.description || '';
    document.getElementById('edit-desc-modal').classList.remove('hidden');
}
function closeEditDescModal() {
    document.getElementById('edit-desc-modal').classList.add('hidden');
}
function handleSaveDescription(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isUserAuthorized()) return;

    const text = document.getElementById('edit-desc-text').value.trim();
    if (!text) return;

    currentGroup.description = text;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).update({ description: text }).then(() => {
            closeEditDescModal();
            renderWorkspaceUI();
        });
    } else {
        closeEditDescModal();
        renderWorkspaceUI();
    }
}

// DÖNÜM NOKTASI (MILESTONE) YÖNETİMİ
function openAddMilestoneModal() {
    if (!isUserAuthorized()) return;
    document.getElementById('edit-milestone-id').value = '';
    document.getElementById('milestone-text-input').value = '';
    document.getElementById('milestone-modal-title').innerText = "🎯 Proje Hedefi / Dönüm Noktası Ekle";
    document.getElementById('add-milestone-modal').classList.remove('hidden');
}
function openEditMilestoneModal(id, text, status) {
    if (!isUserAuthorized()) return;
    document.getElementById('edit-milestone-id').value = id;
    document.getElementById('milestone-text-input').value = text;
    document.getElementById('milestone-status-select').value = status;
    document.getElementById('milestone-modal-title').innerText = "✏️ Dönüm Noktasını Düzenle";
    document.getElementById('add-milestone-modal').classList.remove('hidden');
}
function closeMilestoneModal() {
    document.getElementById('add-milestone-modal').classList.add('hidden');
}
function handleSaveMilestone(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isUserAuthorized()) return;

    const editId = document.getElementById('edit-milestone-id').value;
    const text = document.getElementById('milestone-text-input').value.trim();
    const status = document.getElementById('milestone-status-select').value;

    if (!text) return;

    let milestones = currentGroup.milestones || [];
    if (editId) {
        const item = milestones.find(m => m.id === editId);
        if (item) {
            item.text = text;
            item.status = status;
        }
    } else {
        milestones.push({ id: 'ms-' + Date.now(), text, status });
    }

    currentGroup.milestones = milestones;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).update({ milestones }).then(() => {
            closeMilestoneModal();
            renderWorkspaceUI();
        });
    } else {
        closeMilestoneModal();
        renderWorkspaceUI();
    }
}

function deleteMilestone(id) {
    if (!isUserAuthorized()) return;
    let milestones = (currentGroup.milestones || []).filter(m => m.id !== id);
    currentGroup.milestones = milestones;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).update({ milestones }).then(() => {
            renderWorkspaceUI();
        });
    } else {
        renderWorkspaceUI();
    }
}

// 2. KANBAN GÖREV PANOSU TABI
function renderKanbanTab(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg text-slate-900 dark:text-slate-100">📋 Takım Görev Panosu (Kanban)</h3>
            <button onclick="openAddTaskModal()" class="px-4 py-2 rounded-xl bg-tsMavi text-white text-xs font-bold shadow-md hover:bg-sky-500 transition-all flex items-center gap-1">
                <span>＋</span> Görev Ekle
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- YAPILACAK (TODO) -->
            <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 class="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2"><span>🔴</span> Yapılacak</h4>
                    <span id="count-todo" class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">0</span>
                </div>
                <div id="kanban-todo" class="space-y-3 min-h-[180px]"></div>
            </div>

            <!-- SÜRÜYOR (IN PROGRESS) -->
            <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 class="font-bold text-xs text-tsMavi flex items-center gap-2"><span>🟡</span> Devam Ediyor</h4>
                    <span id="count-in-progress" class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">0</span>
                </div>
                <div id="kanban-in-progress" class="space-y-3 min-h-[180px]"></div>
            </div>

            <!-- TAMAMLANDI (DONE) -->
            <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 class="font-bold text-xs text-emerald-500 flex items-center gap-2"><span>🟢</span> Tamamlandı</h4>
                    <span id="count-done" class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">0</span>
                </div>
                <div id="kanban-done" class="space-y-3 min-h-[180px]"></div>
            </div>
        </div>
    `;

    // Görev ekleme modalındaki atanan üye menüsünü doldur
    populateMemberSelect('task-assignee-select');
    loadTasks();
}

function loadTasks() {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("tasks").onSnapshot((snapshot) => {
            let tasks = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
            } else {
                tasks = DEMO_TASKS;
            }
            renderKanbanColumns(tasks);
        }, () => renderKanbanColumns(DEMO_TASKS));
    } else {
        renderKanbanColumns(DEMO_TASKS);
    }
}

function renderKanbanColumns(tasks) {
    const colTodo = document.getElementById('kanban-todo');
    const colProgress = document.getElementById('kanban-in-progress');
    const colDone = document.getElementById('kanban-done');

    if (!colTodo || !colProgress || !colDone) return;

    colTodo.innerHTML = '';
    colProgress.innerHTML = '';
    colDone.innerHTML = '';

    let todoCount = 0, progressCount = 0, doneCount = 0;

    tasks.forEach(t => {
        const card = document.createElement('div');
        card.className = "p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3 hover:border-tsMavi transition-all shadow-sm";
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${t.priority === 'Yüksek' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}">
                    ${t.priority || 'Orta'}
                </span>
                <span class="text-[10px] text-slate-600 dark:text-slate-400 font-medium">👤 ${t.assignee || 'Atanmadı'}</span>
            </div>
            <h5 class="font-bold text-xs text-slate-900 dark:text-slate-100">${t.title}</h5>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">${t.description || ''}</p>
            <div class="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-1">
                ${t.status !== 'todo' ? `<button onclick="updateTaskStatus('${t.id}', 'todo')" class="text-[10px] text-slate-500 dark:text-slate-400 hover:text-tsMavi font-semibold">⬅ Yapılacak</button>` : '<span></span>'}
                ${t.status !== 'in_progress' ? `<button onclick="updateTaskStatus('${t.id}', 'in_progress')" class="text-[10px] text-tsMavi hover:underline font-semibold">Sürüyor ➡</button>` : ''}
                ${t.status !== 'completed' ? `<button onclick="updateTaskStatus('${t.id}', 'completed')" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline">✓ Bitir</button>` : ''}
                <button onclick="deleteTask('${t.id}')" title="Görevi Sil" class="text-xs text-rose-500 hover:text-rose-700 px-1">🗑️</button>
            </div>
        `;

        if (t.status === 'todo') {
            colTodo.appendChild(card);
            todoCount++;
        } else if (t.status === 'in_progress') {
            colProgress.appendChild(card);
            progressCount++;
        } else {
            colDone.appendChild(card);
            doneCount++;
        }
    });

    if (tasks.length === 0) {
        colTodo.innerHTML = `<div class="py-8 text-center text-slate-400 text-xs italic">Görev yok</div>`;
    }

    document.getElementById('count-todo').innerText = todoCount;
    document.getElementById('count-in-progress').innerText = progressCount;
    document.getElementById('count-done').innerText = doneCount;
}

function updateTaskStatus(taskId, newStatus) {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("tasks").doc(taskId).update({
            status: newStatus
        }).catch(err => console.log(err));
    }
}

function deleteTask(taskId) {
    if (!confirm("Bu görevi silmek istediğinizden emin misiniz?")) return;
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("tasks").doc(taskId).delete();
    }
}

// 3. ORTAK KASA & BÜTÇE TAKİBİ TABI
function renderBudgetTab(container) {
    const targetBudget = currentGroup.targetBudget || 0;

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">💳 Harcama Kalemleri (Ortak Kasa)</h3>
                        <button onclick="openAddExpenseModal()" class="px-4 py-2 rounded-xl ts-gradient-btn text-white text-xs font-bold shadow-md hover:opacity-90 transition-all">
                            ＋ Harcama Ekle
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th class="p-3 font-semibold">Harcama Kalemi</th>
                                    <th class="p-3 font-semibold">Tutar</th>
                                    <th class="p-3 font-semibold">Harcayan Üye</th>
                                    <th class="p-3 font-semibold">Tarih</th>
                                    <th class="p-3 font-semibold text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody id="expenses-table-body" class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                                <tr><td colspan="5" class="p-4 text-center text-slate-500">Harcamalar yükleniyor...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- ÖZET BÜTÇE KARTI -->
            <div class="space-y-6">
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                    <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">📊 Kasa Özeti</h3>
                    <div class="space-y-3 text-xs">
                        <div class="flex justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                            <span class="text-slate-600 dark:text-slate-400 font-medium">Hedef Bütçe:</span>
                            <span class="font-bold text-slate-900 dark:text-slate-100">₺${targetBudget.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="flex justify-between p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <span class="font-bold">Toplam Harcanan:</span>
                            <span class="font-extrabold" id="total-spent-display">₺0.00</span>
                        </div>
                        <div class="flex justify-between p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span class="font-bold">Kalan Bütçe:</span>
                            <span class="font-extrabold" id="remaining-budget-display">₺${targetBudget.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    populateMemberSelect('expense-payer-input');
    loadExpenses();
}

function loadExpenses() {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("expenses").onSnapshot((snapshot) => {
            let expenses = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach(doc => expenses.push({ id: doc.id, ...doc.data() }));
            } else {
                expenses = DEMO_EXPENSES;
            }
            groupExpenses = expenses;
            renderExpensesTable(groupExpenses);
        }, () => renderExpensesTable(DEMO_EXPENSES));
    } else {
        renderExpensesTable(DEMO_EXPENSES);
    }
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;

    const targetBudget = currentGroup ? (currentGroup.targetBudget || 0) : 0;

    if (expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 text-xs italic">Henüz bu gruba ait harcama kaydı eklenmedi.</td></tr>`;
        const spentEl = document.getElementById('total-spent-display');
        const remainEl = document.getElementById('remaining-budget-display');
        if (spentEl) spentEl.innerText = `₺0.00`;
        if (remainEl) remainEl.innerText = `₺${targetBudget.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
        return;
    }

    let html = "";
    let totalSpent = 0;

    expenses.forEach(e => {
        totalSpent += (e.amount || 0);
        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="p-3 font-semibold text-slate-900 dark:text-slate-100">${e.title}</td>
                <td class="p-3 font-bold text-rose-600 dark:text-rose-400">₺${(e.amount || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                <td class="p-3 text-slate-700 dark:text-slate-300 font-medium">👤 ${e.payer || 'Üye'}</td>
                <td class="p-3 text-slate-500 dark:text-slate-400 font-mono text-[10px]">${e.date || 'Bugün'}</td>
                <td class="p-3 text-right">
                    <button onclick="openEditExpenseModal('${e.id}', '${(e.title||'').replace(/'/g, "\\'")}', ${e.amount||0}, '${(e.payer||'').replace(/'/g, "\\'")}')" class="text-xs text-amber-500 hover:text-amber-600 px-1">✏️</button>
                    <button onclick="deleteExpense('${e.id}', ${e.amount||0})" class="text-xs text-rose-500 hover:text-rose-600 px-1">🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    const spentEl = document.getElementById('total-spent-display');
    const remainEl = document.getElementById('remaining-budget-display');

    if (spentEl) spentEl.innerText = `₺${totalSpent.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
    if (remainEl) remainEl.innerText = `₺${(targetBudget - totalSpent).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
}

function deleteExpense(expenseId, amount) {
    if (!confirm("Bu harcama kaydını silmek istediğinizden emin misiniz?")) return;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("expenses").doc(expenseId).delete().then(() => {
            if (firebase && firebase.firestore && firebase.firestore.FieldValue) {
                db.collection("groups").doc(groupId).update({
                    spentBudget: firebase.firestore.FieldValue.increment(-amount)
                }).catch(() => {});
            }
        });
    } else {
        groupExpenses = groupExpenses.filter(e => e.id !== expenseId);
        renderExpensesTable(groupExpenses);
    }
}

// 4. GRUP İÇİ SOHBET (TEAM CHAT) TABI
function renderChatTab(container) {
    container.innerHTML = `
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 max-w-3xl mx-auto shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">💬 Takım İçi Canlı Sohbet</h3>
                <span class="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-semibold">● Canlı Takım Akışı</span>
            </div>

            <div id="chat-messages-container" class="space-y-3 h-[380px] overflow-y-auto p-2 no-scrollbar">
                <div class="text-center py-10 text-slate-500 text-xs">Mesajlar yükleniyor...</div>
            </div>

            <form id="chat-form" onsubmit="handleSendMessage(event)" class="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input type="text" id="chat-input" required placeholder="Takım arkadaşlarınıza bir mesaj yazın..." class="flex-grow px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-tsMavi">
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-tsMavi text-white font-bold text-xs hover:bg-sky-500 transition-all shadow-md">
                    Gönder ➔
                </button>
            </form>
        </div>
    `;

    loadMessages();
}

function loadMessages() {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("messages").orderBy("createdAt", "asc").onSnapshot((snapshot) => {
            let messages = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
            } else {
                messages = DEMO_MESSAGES;
            }
            renderMessagesFeed(messages);
        }, () => renderMessagesFeed(DEMO_MESSAGES));
    } else {
        renderMessagesFeed(DEMO_MESSAGES);
    }
}

function renderMessagesFeed(messages) {
    const c = document.getElementById('chat-messages-container');
    if (!c) return;

    const user = getCurrentUser();
    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    if (messages.length === 0) {
        c.innerHTML = `<div class="text-center py-12 text-slate-400 text-xs italic">Henüz sohbet mesajı gönderilmedi. İlk mesajı yazın!</div>`;
        return;
    }

    let html = "";
    messages.forEach(m => {
        const isMe = m.sender === currentName;
        html += `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <div class="flex items-center gap-1.5 mb-1 text-[10px] text-slate-600 dark:text-slate-400">
                    <span class="font-bold text-slate-800 dark:text-slate-200">${m.sender}</span>
                    <span>• ${m.time || '12:00'}</span>
                </div>
                <div class="max-w-md px-4 py-2.5 rounded-2xl text-xs ${isMe ? 'bg-tsMavi text-white rounded-tr-none shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm'}">
                    ${m.text}
                </div>
            </div>
        `;
    });

    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
}

function handleSendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();

    const user = getCurrentUser();
    const input = document.getElementById('chat-input');
    const text = input ? input.value.trim() : '';

    if (!text) return;

    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

    const newMsg = {
        sender: user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin",
        text: text,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: timestamp
    };

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("messages").add(newMsg).then(() => {
            if (input) input.value = '';
        }).catch(() => {
            DEMO_MESSAGES.push(newMsg);
            renderMessagesFeed(DEMO_MESSAGES);
            if (input) input.value = '';
        });
    } else {
        DEMO_MESSAGES.push(newMsg);
        renderMessagesFeed(DEMO_MESSAGES);
        if (input) input.value = '';
    }
}

// YARDIMCI DOLDURUCULAR (ÜYE SEÇİM KUTUSU)
function populateMemberSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select || !currentGroup || !currentGroup.members) return;

    let html = "";
    currentGroup.members.forEach(m => {
        html += `<option value="${m.name}">${m.name} (${m.role || 'Üye'})</option>`;
    });

    select.innerHTML = html;
}

// MODAL YÖNETİMİ
function openAddTaskModal() { document.getElementById('add-task-modal').classList.remove('hidden'); }
function closeAddTaskModal() { 
    const modal = document.getElementById('add-task-modal');
    const form = document.getElementById('add-task-form');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
}

function openAddExpenseModal() {
    document.getElementById('edit-expense-id').value = '';
    document.getElementById('expense-modal-title').innerText = "💳 Yeni Harcama Kaydı Ekle";
    document.getElementById('add-expense-modal').classList.remove('hidden');
}
function openEditExpenseModal(id, title, amount, payer) {
    document.getElementById('edit-expense-id').value = id;
    document.getElementById('expense-title-input').value = title;
    document.getElementById('expense-amount-input').value = amount;
    const payerSelect = document.getElementById('expense-payer-input');
    if (payerSelect) payerSelect.value = payer;
    document.getElementById('expense-modal-title').innerText = "✏️ Harcama Kaydını Düzenle";
    document.getElementById('add-expense-modal').classList.remove('hidden');
}
function closeAddExpenseModal() { 
    const modal = document.getElementById('add-expense-modal');
    const form = document.getElementById('add-expense-form');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
}

function handleSaveTask(e) {
    if (e && e.preventDefault) e.preventDefault();

    const titleInput = document.getElementById('task-title-input');
    const priorityInput = document.getElementById('task-priority-input');
    const assigneeSelect = document.getElementById('task-assignee-select');
    const descInput = document.getElementById('task-desc-input');

    const title = titleInput ? titleInput.value.trim() : '';
    const priority = priorityInput ? priorityInput.value : 'Orta';
    const assignee = assigneeSelect ? assigneeSelect.value : 'Yönetici Admin';
    const desc = descInput ? descInput.value.trim() : '';

    if (!title) return;

    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

    const newTask = {
        title,
        priority,
        assignee,
        description: desc,
        status: "todo",
        createdAt: timestamp
    };

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("tasks").add(newTask).then(() => {
            closeAddTaskModal();
            if (firebase && firebase.firestore && firebase.firestore.FieldValue) {
                db.collection("groups").doc(groupId).update({
                    tasksTotal: firebase.firestore.FieldValue.increment(1)
                }).catch(() => {});
            }
        }).catch(() => {
            DEMO_TASKS.push({ id: 't' + Date.now(), ...newTask });
            closeAddTaskModal();
            renderKanbanColumns(DEMO_TASKS);
        });
    } else {
        DEMO_TASKS.push({ id: 't' + Date.now(), ...newTask });
        closeAddTaskModal();
        renderKanbanColumns(DEMO_TASKS);
    }
}

function handleSaveExpense(e) {
    if (e && e.preventDefault) e.preventDefault();

    const editId = document.getElementById('edit-expense-id').value;
    const titleInput = document.getElementById('expense-title-input');
    const amountInput = document.getElementById('expense-amount-input');
    const payerSelect = document.getElementById('expense-payer-input');

    const title = titleInput ? titleInput.value.trim() : '';
    const amount = amountInput ? (parseFloat(amountInput.value) || 0) : 0;
    const payer = payerSelect ? payerSelect.value : 'Yönetici Admin';

    if (!title || amount <= 0) return;

    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

    if (editId) {
        // Harcama düzenleme
        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").doc(groupId).collection("expenses").doc(editId).update({
                title, amount, payer
            }).then(() => closeAddExpenseModal());
        } else {
            const item = groupExpenses.find(x => x.id === editId);
            if (item) {
                item.title = title;
                item.amount = amount;
                item.payer = payer;
            }
            closeAddExpenseModal();
            renderExpensesTable(groupExpenses);
        }
    } else {
        // Yeni harcama ekleme
        const newExpense = {
            title,
            amount,
            payer,
            date: new Date().toLocaleDateString('tr-TR'),
            createdAt: timestamp
        };

        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").doc(groupId).collection("expenses").add(newExpense).then(() => {
                closeAddExpenseModal();
                if (firebase && firebase.firestore && firebase.firestore.FieldValue) {
                    db.collection("groups").doc(groupId).update({
                        spentBudget: firebase.firestore.FieldValue.increment(amount)
                    }).catch(() => {});
                }
            });
        } else {
            groupExpenses.push({ id: 'e' + Date.now(), ...newExpense });
            closeAddExpenseModal();
            renderExpensesTable(groupExpenses);
        }
    }
}

function copyInviteCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`📋 Davet Kodu (${code}) kopyalandı! Takım arkadaşlarınıza gönderebilirsiniz.`);
    });
}

function deleteCurrentWorkspaceGroup() {
    if (!currentGroup) return;
    if (!confirm(`"${currentGroup.name}" projesini ve tüm çalışma alanı verilerini tamamen silmek istediğinizden emin misiniz?`)) return;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).delete().then(() => {
            alert(`✅ "${currentGroup.name}" projesi başarıyla silindi.`);
            window.location.href = "gruplar.html";
        }).catch(err => {
            alert("Silme Hatası: " + err.message);
        });
    } else {
        alert(`✅ "${currentGroup.name}" projesi silindi.`);
        window.location.href = "gruplar.html";
    }
}
