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
let groupDocuments = [];
let groupApplications = [];
let currentArchiveFilter = 'all';

// YEDEK DEMO TEMİZ VERİLER
const DEMO_TASKS = [];
const DEMO_EXPENSES = [];
const DEMO_MESSAGES = [];
const DEMO_DOCUMENTS = [];
const DEMO_APPLICATIONS = [];

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
        lookingRoles: "Verilog / FPGA Uzmanı, PCB Tasarımcısı",
        githubRepoUrl: "https://github.com/maliyildirimtr/fpga-ai-accelerator",
        gdriveUrl: "https://drive.google.com/drive/folders/mali-academy-fpga-demo",
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

    const lookingRolesBadges = currentGroup.lookingRoles ? `
        <div class="flex items-center gap-1.5 mt-2 flex-wrap">
            <span class="text-[10px] font-bold text-amber-500">🎯 Aranan Roller:</span>
            ${currentGroup.lookingRoles.split(',').map(r => `<span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20">${r.trim()}</span>`).join('')}
        </div>
    ` : '';

    container.innerHTML = `
        <!-- HEADER BÖLÜMÜ -->
        <div class="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl backdrop-blur-md space-y-4">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
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
                    ${lookingRolesBadges}
                </div>

                <div class="flex flex-wrap items-center gap-2 shrink-0">
                    <button onclick="openJitsiMeeting()" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5">
                        📹 Görüntülü Toplantı Başlat (Virtual Lab)
                    </button>
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
                <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-tsMavi text-tsMavi transition-all shrink-0">
                    📌 Genel Bakış & Üyeler
                </button>
                <button onclick="switchTab('archive')" id="tab-btn-archive" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all shrink-0">
                    📂 Arşiv & Dokümanlar (Resource Hub)
                </button>
                <button onclick="switchTab('kanban')" id="tab-btn-kanban" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all shrink-0">
                    📋 Görev Panosu (Kanban)
                </button>
                <button onclick="switchTab('budget')" id="tab-btn-budget" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all shrink-0">
                    💳 Ortak Kasa & Bütçe Takibi
                </button>
                <button onclick="switchTab('chat')" id="tab-btn-chat" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all shrink-0">
                    💬 Grup İçi Sohbet
                </button>
            </div>
        </div>

        <!-- TAB İÇERİK ALANI -->
        <div id="tab-content-area" class="space-y-6"></div>
    `;

    switchTab(currentTab);
}

// JITSI MEET VIRTUAL LAB TOPLANTI ODA KONTROLÜ
function openJitsiMeeting() {
    const roomName = `maliacademy-workspace-${groupId}`;
    const url = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;

    const iframe = document.getElementById('jitsi-iframe');
    const externalLink = document.getElementById('jitsi-external-link');
    const modal = document.getElementById('jitsi-modal');

    if (iframe) iframe.src = url;
    if (externalLink) externalLink.href = url;
    if (modal) modal.classList.remove('hidden');
}

function closeJitsiMeeting() {
    const iframe = document.getElementById('jitsi-iframe');
    const modal = document.getElementById('jitsi-modal');
    if (iframe) iframe.src = '';
    if (modal) modal.classList.add('hidden');
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
    } else if (tabName === 'archive') {
        renderArchiveTab(contentArea);
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

                <!-- GELEN KATILMA BAŞVURULARI (TALENT MATCH APPLICATIONS) -->
                ${isAuth ? `
                    <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                        <div class="flex items-center justify-between">
                            <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">📩 Gelen Katılma Başvuruları (Talent Match)</h3>
                            <span class="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">Yönetici Paneli</span>
                        </div>
                        <div id="applications-list-container" class="space-y-3">
                            <div class="text-slate-500 text-xs py-4 text-center">Başvurular yükleniyor...</div>
                        </div>
                    </div>
                ` : ''}
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

    if (isAuth) {
        loadApplications();
    }
}

// TALENT MATCH BAŞVURULARI YÜKLEME VE İŞLEMLERİ
function loadApplications() {
    const container = document.getElementById('applications-list-container');
    if (!container) return;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("applications").onSnapshot((snapshot) => {
            let apps = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach(doc => {
                    if (doc.data().status === 'pending') {
                        apps.push({ id: doc.id, ...doc.data() });
                    }
                });
            }
            renderApplicationsList(apps);
        }, () => renderApplicationsList([]));
    } else {
        renderApplicationsList([]);
    }
}

function renderApplicationsList(apps) {
    const container = document.getElementById('applications-list-container');
    if (!container) return;

    if (apps.length === 0) {
        container.innerHTML = `<div class="py-6 text-center text-slate-400 text-xs italic">Bekleyen başvuru bulunmuyor.</div>`;
        return;
    }

    let html = "";
    apps.forEach(a => {
        html += `
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-bold text-xs text-slate-900 dark:text-slate-100">${a.name}</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">${a.email || 'İletişim yok'} • <strong class="text-amber-500">${a.requestedRole || 'Rol Belirtilmedi'}</strong></p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="acceptApplication('${a.id}', '${a.applicantUid}', '${(a.name||'').replace(/'/g, "\\'")}', '${a.email||''}', '${a.requestedRole||'Üye'}')" class="px-3 py-1 rounded-xl bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-colors shadow-sm">
                            ✓ Kabul Et
                        </button>
                        <button onclick="rejectApplication('${a.id}')" class="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold hover:bg-rose-500 hover:text-white transition-colors">
                            ✕ Reddet
                        </button>
                    </div>
                </div>
                ${a.note ? `<p class="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">"${a.note}"</p>` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

function acceptApplication(appId, uid, name, email, role) {
    if (!isUserAuthorized()) return;
    const members = currentGroup.members || [];
    if (!members.some(m => m.uid === uid || m.email === email)) {
        members.push({ uid, name, email, role: 'Üye', joinedAt: new Date().toISOString() });
    }

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).update({ members, membersCount: members.length }).then(() => {
            db.collection("groups").doc(groupId).collection("applications").doc(appId).update({ status: 'accepted' });
            alert(`✅ ${name} başvuru onaylanarak gruba üye eklendi!`);
            renderWorkspaceUI();
        });
    }
}

function rejectApplication(appId) {
    if (!isUserAuthorized()) return;
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("applications").doc(appId).update({ status: 'rejected' });
    }
}

// 2. 📂 AKILLI PROJE ARŞİVİ VE SÜRÜM KONTROLÜ (RESOURCE HUB) TABI
function renderArchiveTab(container) {
    const isAuth = isUserAuthorized();
    const githubUrl = currentGroup.githubRepoUrl || '';
    const gdriveUrl = currentGroup.gdriveUrl || '';

    container.innerHTML = `
        <div class="space-y-6">
            <!-- HARCİ ALTYAPI LİNKLERİ (GITHUB & DRIVE) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">💻</span>
                            <div>
                                <h4 class="font-bold text-xs text-slate-900 dark:text-slate-100">GitHub Reposu & Kod Deposu</h4>
                                <p class="text-[10px] text-slate-500 dark:text-slate-400">Versiyon kontrolü ve kod tabanı</p>
                            </div>
                        </div>
                        ${isAuth ? `<button onclick="openEditExternalLinksModal()" class="text-[10px] text-tsMavi font-bold hover:underline">✏️ Düzenle</button>` : ''}
                    </div>
                    ${githubUrl ? `
                        <a href="${githubUrl}" target="_blank" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-tsMavi font-mono text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors truncate max-w-full">
                            🔗 Repoyu İncele (${githubUrl.replace('https://github.com/', '')}) ↗
                        </a>
                    ` : `<p class="text-xs text-slate-400 italic">Henüz GitHub reposu bağlanmadı.</p>`}
                </div>

                <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">☁️</span>
                            <div>
                                <h4 class="font-bold text-xs text-slate-900 dark:text-slate-100">Google Drive Klasörü</h4>
                                <p class="text-[10px] text-slate-500 dark:text-slate-400">Bulut depolama ve ham veriler</p>
                            </div>
                        </div>
                        ${isAuth ? `<button onclick="openEditExternalLinksModal()" class="text-[10px] text-tsMavi font-bold hover:underline">✏️ Düzenle</button>` : ''}
                    </div>
                    ${gdriveUrl ? `
                        <a href="${gdriveUrl}" target="_blank" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors truncate max-w-full">
                            📁 Drive Klasörünü Aç ↗
                        </a>
                    ` : `<p class="text-xs text-slate-400 italic">Henüz Google Drive klasörü bağlanmadı.</p>`}
                </div>
            </div>

            <!-- DOKÜMAN KÜTÜPHANESİ VE KATEGORİ FİLTRELERİ -->
            <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div class="flex items-center gap-2">
                        <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">📂 Proje Arşivi ve Dokümanlar</h3>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <button onclick="openAddDocModal()" class="px-4 py-2 rounded-xl ts-gradient-btn text-white text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1">
                            ＋ Doküman / Çizim Ekle
                        </button>
                    </div>
                </div>

                <!-- KATEGORİ FİLTRE BUTONLARI -->
                <div class="flex items-center gap-2 overflow-x-auto pb-2">
                    <button onclick="filterArchiveDocs('all', this)" class="archive-filter-btn active px-3 py-1.5 rounded-xl text-xs font-bold bg-tsMavi text-white border border-tsMavi">
                        Tümü
                    </button>
                    <button onclick="filterArchiveDocs('Teknik Dokümanlar', this)" class="archive-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                        📄 Teknik Dokümanlar
                    </button>
                    <button onclick="filterArchiveDocs('Devre / CAD Çizimleri', this)" class="archive-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                        📐 Devre / CAD Çizimleri
                    </button>
                    <button onclick="filterArchiveDocs('Sunumlar & Raporlar', this)" class="archive-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                        📊 Sunumlar & Raporlar
                    </button>
                </div>

                <!-- DOKÜMAN LİSTESİ TABLOSU -->
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th class="p-3 font-semibold">Doküman Adı</th>
                                <th class="p-3 font-semibold">Kategori</th>
                                <th class="p-3 font-semibold">Ekleme Yapan</th>
                                <th class="p-3 font-semibold">Tarih / Versiyon</th>
                                <th class="p-3 font-semibold text-right">Erişim & İşlemler</th>
                            </tr>
                        </thead>
                        <tbody id="documents-table-body" class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                            <tr><td colspan="5" class="p-6 text-center text-slate-500">Dokümanlar yükleniyor...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    populateMemberSelect('doc-uploader-select');
    loadDocuments();
}

function loadDocuments() {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("documents").onSnapshot((snapshot) => {
            let docs = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach(d => docs.push({ id: d.id, ...d.data() }));
            } else {
                docs = DEMO_DOCUMENTS;
            }
            groupDocuments = docs;
            renderDocumentsTable(groupDocuments);
        }, () => renderDocumentsTable(DEMO_DOCUMENTS));
    } else {
        renderDocumentsTable(DEMO_DOCUMENTS);
    }
}

function filterArchiveDocs(cat, btn) {
    currentArchiveFilter = cat;
    document.querySelectorAll('.archive-filter-btn').forEach(b => {
        b.classList.remove('bg-tsMavi', 'text-white', 'border-tsMavi');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    });
    if (btn) {
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
        btn.classList.add('bg-tsMavi', 'text-white', 'border-tsMavi');
    }
    renderDocumentsTable(groupDocuments);
}

function renderDocumentsTable(docs) {
    const tbody = document.getElementById('documents-table-body');
    if (!tbody) return;

    let filtered = docs;
    if (currentArchiveFilter !== 'all') {
        filtered = docs.filter(d => d.category === currentArchiveFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 text-xs italic">Henüz bu kategoride doküman eklenmedi.</td></tr>`;
        return;
    }

    const isAuth = isUserAuthorized();
    let html = "";

    filtered.forEach(d => {
        const catBadgeClass = d.category === 'Devre / CAD Çizimleri' 
            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' 
            : d.category === 'Sunumlar & Raporlar' 
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
            : 'bg-tsMavi/10 text-tsMavi border-tsMavi/20';

        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="p-3 font-semibold text-slate-900 dark:text-slate-100">
                    <div>${d.title}</div>
                    ${d.note ? `<div class="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">${d.note}</div>` : ''}
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${catBadgeClass}">
                        ${d.category || 'Genel'}
                    </span>
                </td>
                <td class="p-3 text-slate-700 dark:text-slate-300 font-medium">👤 ${d.uploader || 'Üye'}</td>
                <td class="p-3 text-slate-500 dark:text-slate-400 font-mono text-[10px]">${d.date || 'Bugün'}</td>
                <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <a href="${d.url}" target="_blank" class="px-3 py-1 rounded-xl bg-tsMavi/10 text-tsMavi text-[11px] font-bold hover:bg-tsMavi hover:text-white transition-all">
                            🔗 Aç ↗
                        </a>
                        ${isAuth ? `
                            <button onclick="openEditDocModal('${d.id}', '${(d.title||'').replace(/'/g, "\\'")}', '${d.category||''}', '${(d.url||'').replace(/'/g, "\\'")}', '${(d.note||'').replace(/'/g, "\\'")}')" class="text-xs text-amber-500 hover:text-amber-600 px-1">✏️</button>
                            <button onclick="deleteDocument('${d.id}')" class="text-xs text-rose-500 hover:text-rose-600 px-1">🗑️</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function openAddDocModal() {
    document.getElementById('edit-doc-id').value = '';
    document.getElementById('doc-title-input').value = '';
    document.getElementById('doc-url-input').value = '';
    document.getElementById('doc-desc-input').value = '';
    document.getElementById('doc-modal-title').innerText = "📂 Doküman / Çizim Ekle";
    document.getElementById('add-doc-modal').classList.remove('hidden');
}

function openEditDocModal(id, title, category, url, note) {
    if (!isUserAuthorized()) return;
    document.getElementById('edit-doc-id').value = id;
    document.getElementById('doc-title-input').value = title;
    document.getElementById('doc-category-select').value = category;
    document.getElementById('doc-url-input').value = url;
    document.getElementById('doc-desc-input').value = note;
    document.getElementById('doc-modal-title').innerText = "✏️ Dokümanı Düzenle";
    document.getElementById('add-doc-modal').classList.remove('hidden');
}

function closeAddDocModal() {
    document.getElementById('add-doc-modal').classList.add('hidden');
}

function handleSaveDocument(e) {
    if (e && e.preventDefault) e.preventDefault();

    const editId = document.getElementById('edit-doc-id').value;
    const title = document.getElementById('doc-title-input').value.trim();
    const category = document.getElementById('doc-category-select').value;
    const uploader = document.getElementById('doc-uploader-select').value;
    const url = document.getElementById('doc-url-input').value.trim();
    const note = document.getElementById('doc-desc-input').value.trim();

    if (!title || !url) return;

    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

    if (editId) {
        if (!isUserAuthorized()) return;
        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").doc(groupId).collection("documents").doc(editId).update({
                title, category, uploader, url, note
            }).then(() => closeAddDocModal());
        }
    } else {
        const newDoc = {
            title, category, uploader, url, note,
            date: new Date().toLocaleDateString('tr-TR'),
            createdAt: timestamp
        };

        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").doc(groupId).collection("documents").add(newDoc).then(() => {
                closeAddDocModal();
            });
        } else {
            groupDocuments.push({ id: 'd' + Date.now(), ...newDoc });
            closeAddDocModal();
            renderDocumentsTable(groupDocuments);
        }
    }
}

function deleteDocument(docId) {
    if (!isUserAuthorized()) return;
    if (!confirm("Bu dokümanı arşivden silmek istediğinizden emin misiniz?")) return;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("documents").doc(docId).delete();
    } else {
        groupDocuments = groupDocuments.filter(d => d.id !== docId);
        renderDocumentsTable(groupDocuments);
    }
}

// EXTERNAL REPO & DRIVE MODAL HANDLERS
function openEditExternalLinksModal() {
    if (!isUserAuthorized()) return;
    document.getElementById('github-repo-input').value = currentGroup.githubRepoUrl || '';
    document.getElementById('gdrive-folder-input').value = currentGroup.gdriveUrl || '';
    document.getElementById('edit-external-links-modal').classList.remove('hidden');
}

function closeEditExternalLinksModal() {
    document.getElementById('edit-external-links-modal').classList.add('hidden');
}

function handleSaveExternalLinks(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!isUserAuthorized()) return;

    const githubRepoUrl = document.getElementById('github-repo-input').value.trim();
    const gdriveUrl = document.getElementById('gdrive-folder-input').value.trim();

    currentGroup.githubRepoUrl = githubRepoUrl;
    currentGroup.gdriveUrl = gdriveUrl;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).update({
            githubRepoUrl, gdriveUrl
        }).then(() => {
            closeEditExternalLinksModal();
            renderWorkspaceUI();
        });
    } else {
        closeEditExternalLinksModal();
        renderWorkspaceUI();
    }
}

// 3. KANBAN GÖREV PANOSU TABI
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

// 4. ORTAK KASA & BÜTÇE TAKİBİ TABI
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

// 5. GRUP İÇİ SOHBET (TEAM CHAT) TABI METOTLARI
let pendingAttachment = null;
let mediaRecorder = null;
let audioChunks = [];
let voiceTimerInterval = null;
let voiceRecordSeconds = 0;

function renderChatTab(container) {
    container.innerHTML = `
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 max-w-4xl mx-auto shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">💬 Takım İçi Canlı Sohbet & Medya Paylaşımı</h3>
                <span class="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-semibold">● Canlı Akış</span>
            </div>

            <!-- SOHBET AKIŞ ALANI -->
            <div id="chat-messages-container" class="space-y-3 h-[420px] overflow-y-auto p-2 no-scrollbar">
                <div class="text-center py-10 text-slate-500 text-xs">Mesajlar yükleniyor...</div>
            </div>

            <!-- EKLENTİ SEÇİM ÖNİZLEME ALANI -->
            <div id="chat-preview-container" class="hidden p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 truncate" id="chat-preview-content"></div>
                <button type="button" onclick="cancelPendingAttachment()" class="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1">✕ Kaldır</button>
            </div>

            <!-- YÜKLENİYOR / İLERLEME ÇUBUĞU (WHATSAPP TARZI PROGRESS BAR) -->
            <div id="chat-upload-progress-panel" class="hidden p-3 rounded-2xl bg-tsMavi/10 border border-tsMavi/30 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-tsMavi">
                    <span id="upload-progress-filename" class="truncate max-w-xs">⏳ Dosya Gönderiliyor...</span>
                    <span id="upload-progress-percent" class="font-mono text-slate-900 dark:text-slate-100">%0</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div id="upload-progress-bar" class="h-full bg-tsMavi rounded-full transition-all duration-200" style="width: 0%"></div>
                </div>
            </div>

            <!-- SES KAYDI AKTİF UYARI / SAYAC PANELİ -->
            <div id="voice-recording-panel" class="hidden p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                    <span class="text-xs font-bold text-rose-600 dark:text-rose-400">🎤 Ses Kaydediliyor...</span>
                    <span id="voice-recording-timer" class="font-mono text-xs font-extrabold text-slate-900 dark:text-slate-100">00:00</span>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="stopAndSendVoiceNote()" class="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-md hover:bg-emerald-600">
                        ▶️ Kaydı Tamamla & Gönder
                    </button>
                    <button type="button" onclick="cancelVoiceRecording()" class="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300">
                        ✕ İptal
                    </button>
                </div>
            </div>

            <!-- GİZLİ DOSYA / GÖRSEL YÜKLEME INPUTLARI -->
            <input type="file" id="chat-file-input" class="hidden" accept=".pdf,.doc,.docx,.txt,.zip,.rar,.v,.sv,.c,.cpp,.py,.json" onchange="handleFileSelection(event)">
            <input type="file" id="chat-image-input" class="hidden" accept="image/*" onchange="handleImageSelection(event)">

            <!-- MESAJ YAZMA & EKLENTİ BARI -->
            <form id="chat-form" onsubmit="handleSendMessage(event)" class="space-y-2">
                <div class="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 focus-within:border-tsMavi transition-all shadow-inner">
                    
                    <!-- EKLENTİ BUTONLARI -->
                    <div class="flex items-center gap-1 pl-1 shrink-0">
                        <button type="button" onclick="document.getElementById('chat-file-input').click()" title="Dosya / Doküman Ekle (PDF, Code, Zip)" class="p-2 rounded-xl text-slate-500 hover:text-tsMavi dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            📎
                        </button>
                        <button type="button" onclick="document.getElementById('chat-image-input').click()" title="Görsel / Fotoğraf Ekle" class="p-2 rounded-xl text-slate-500 hover:text-tsMavi dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            🖼️
                        </button>
                        <button type="button" onclick="startVoiceRecording()" title="Ses Kaydı Gönder (Mikrofon)" class="p-2 rounded-xl text-slate-500 hover:text-rose-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            🎤
                        </button>
                    </div>

                    <!-- METİN GİRDİ ALANI -->
                    <input type="text" id="chat-input" placeholder="Takım arkadaşlarınıza mesaj yazın veya dosya/ses ekleyin..." class="flex-grow bg-transparent text-slate-900 dark:text-slate-100 text-xs focus:outline-none px-2 py-1.5">

                    <!-- GÖNDER BUTONU -->
                    <button type="submit" id="chat-send-btn" class="px-5 py-2.5 rounded-xl bg-tsMavi text-white font-bold text-xs hover:bg-sky-500 transition-all shadow-md shrink-0 flex items-center gap-1">
                        Gönder ➔
                    </button>
                </div>
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
        c.innerHTML = `<div class="text-center py-12 text-slate-400 text-xs italic">Henüz sohbet mesajı gönderilmedi. İlk mesajı veya medya dosyasını gönderin!</div>`;
        return;
    }

    let html = "";
    messages.forEach(m => {
        const isMe = m.sender === currentName;

        let attachmentHTML = "";
        if (m.attachment) {
            if (m.attachment.type === 'image') {
                attachmentHTML = `
                    <div class="my-1.5">
                        <img src="${m.attachment.url}" alt="Görsel" onclick="window.open('${m.attachment.url}', '_blank')" class="max-w-xs max-h-60 rounded-xl shadow-md cursor-pointer hover:opacity-95 transition-opacity border border-slate-200 dark:border-slate-700">
                    </div>
                `;
            } else if (m.attachment.type === 'file') {
                attachmentHTML = `
                    <div class="my-1.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-slate-900 dark:text-slate-100 max-w-sm">
                        <div class="flex items-center gap-2 truncate">
                            <span class="text-lg">📄</span>
                            <div class="truncate">
                                <p class="font-bold text-xs truncate">${m.attachment.name}</p>
                                <p class="text-[10px] text-slate-500 dark:text-slate-400">${m.attachment.size || 'Doküman'}</p>
                            </div>
                        </div>
                        <a href="${m.attachment.url}" download="${m.attachment.name}" target="_blank" class="px-2.5 py-1 rounded-lg bg-tsMavi text-white font-bold text-[10px] hover:bg-sky-500 transition-colors shrink-0">
                            💾 İndir ↗
                        </a>
                    </div>
                `;
            } else if (m.attachment.type === 'voice') {
                attachmentHTML = `
                    <div class="my-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1 max-w-xs">
                        <div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            <span>🎙️ Ses Mesajı</span>
                        </div>
                        <audio controls src="${m.attachment.url}" class="w-full h-8 rounded-lg focus:outline-none"></audio>
                    </div>
                `;
            }
        }

        html += `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <div class="flex items-center gap-1.5 mb-1 text-[10px] text-slate-600 dark:text-slate-400">
                    <span class="font-bold text-slate-800 dark:text-slate-200">${m.sender}</span>
                    <span>• ${m.time || '12:00'}</span>
                </div>
                
                ${m.text ? `
                    <div class="max-w-md px-4 py-2.5 rounded-2xl text-xs ${isMe ? 'bg-tsMavi text-white rounded-tr-none shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm'}">
                        ${m.text}
                    </div>
                ` : ''}

                ${attachmentHTML}
            </div>
        `;
    });

    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
}

// DOSYA VE GÖRSEL SEÇİM HANDLERLARI
function handleFileSelection(e) {
    const file = e.target.files[0];
    if (!file) return;
    prepareAttachment(file, file.type.startsWith('image/') ? 'image' : 'file');
}

function handleImageSelection(e) {
    const file = e.target.files[0];
    if (!file) return;
    prepareAttachment(file, 'image');
}

function prepareAttachment(file, type) {
    pendingAttachment = { file, type, name: file.name, size: formatBytes(file.size) };
    const container = document.getElementById('chat-preview-container');
    const content = document.getElementById('chat-preview-content');
    
    if (type === 'image') {
        content.innerHTML = `🖼️ <strong>Görsel Seçildi:</strong> ${file.name} (${formatBytes(file.size)})`;
    } else {
        content.innerHTML = `📄 <strong>Doküman Seçildi:</strong> ${file.name} (${formatBytes(file.size)})`;
    }
    
    if (container) container.classList.remove('hidden');
}

function cancelPendingAttachment() {
    pendingAttachment = null;
    const container = document.getElementById('chat-preview-container');
    if (container) container.classList.add('hidden');
    const fileInp = document.getElementById('chat-file-input');
    const imgInp = document.getElementById('chat-image-input');
    if (fileInp) fileInp.value = '';
    if (imgInp) imgInp.value = '';
}

// SES KAYDI (VOICE NOTE) MANTIĞI
function startVoiceRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tarayıcınız mikrofon kaydını desteklemiyor!");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.start();
        voiceRecordSeconds = 0;

        const panel = document.getElementById('voice-recording-panel');
        if (panel) panel.classList.remove('hidden');
        
        voiceTimerInterval = setInterval(() => {
            voiceRecordSeconds++;
            const mins = String(Math.floor(voiceRecordSeconds / 60)).padStart(2, '0');
            const secs = String(voiceRecordSeconds % 60).padStart(2, '0');
            const timerEl = document.getElementById('voice-recording-timer');
            if (timerEl) timerEl.innerText = `${mins}:${secs}`;
        }, 1000);

    }).catch(err => {
        console.error("Mikrofon hatası:", err);
        alert("Mikrofon erişim izni alınamadı!");
    });
}

function stopAndSendVoiceNote() {
    if (!mediaRecorder) return;
    
    clearInterval(voiceTimerInterval);
    const panel = document.getElementById('voice-recording-panel');
    if (panel) panel.classList.add('hidden');

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        uploadAndSendAttachment(audioBlob, 'voice', `ses-kaydi-${Date.now()}.webm`);
    };

    mediaRecorder.stop();
}

function cancelVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    clearInterval(voiceTimerInterval);
    audioChunks = [];
    const panel = document.getElementById('voice-recording-panel');
    if (panel) panel.classList.add('hidden');
}

// MESAJ GÖNDERME SÜRECİ
function handleSendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();

    const user = getCurrentUser();
    const input = document.getElementById('chat-input');
    const text = input ? input.value.trim() : '';

    if (!text && !pendingAttachment) return;

    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    if (pendingAttachment) {
        uploadAndSendAttachment(pendingAttachment.file, pendingAttachment.type, pendingAttachment.name, text);
    } else {
        sendChatMessage(currentName, text, null);
        if (input) input.value = '';
    }
}

// WHATSAPP TARZI YÜKLEME İLERLEME KONTROLÜ (PROGRESS TRACKING)
function showUploadProgress(fileName, percent = 0) {
    const panel = document.getElementById('chat-upload-progress-panel');
    const nameEl = document.getElementById('upload-progress-filename');
    const percentEl = document.getElementById('upload-progress-percent');
    const barEl = document.getElementById('upload-progress-bar');
    const sendBtn = document.getElementById('chat-send-btn');

    if (panel) panel.classList.remove('hidden');
    if (nameEl) nameEl.innerText = `⏳ Yükleniyor: ${fileName}`;
    if (percentEl) percentEl.innerText = `%${percent}`;
    if (barEl) barEl.style.width = `${percent}%`;
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerText = `⏳ %${percent}`;
        sendBtn.classList.add('opacity-70', 'cursor-not-allowed');
    }
}

function hideUploadProgress() {
    const panel = document.getElementById('chat-upload-progress-panel');
    const sendBtn = document.getElementById('chat-send-btn');
    if (panel) panel.classList.add('hidden');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerText = `Gönder ➔`;
        sendBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

// GÖRSEL SIKIŞTIRMA MANTIĞI (9.5MB ve büyük görselleri 150KB'a düşürerek CORS/Ağ hatalarını engeller)
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
            img.src = e.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

function uploadAndSendAttachment(fileOrBlob, type, fileName, messageText = '') {
    const user = getCurrentUser();
    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    showUploadProgress(fileName, 20);

    // Eğer yüklenen bir görsel ise client-side anında sıkıştırıp DataURL ile gönder (CORS hatasını engeller)
    if (type === 'image' && fileOrBlob instanceof File) {
        showUploadProgress(fileName, 50);
        compressImage(fileOrBlob).then(compressedUrl => {
            showUploadProgress(fileName, 95);
            setTimeout(() => {
                hideUploadProgress();
                sendChatMessage(currentName, messageText, {
                    type: 'image',
                    url: compressedUrl,
                    name: fileName,
                    size: formatBytes(fileOrBlob.size || 0)
                });
                cancelPendingAttachment();
                const input = document.getElementById('chat-input');
                if (input) input.value = '';
            }, 150);
        }).catch(err => {
            console.warn("Görsel sıkıştırma hatası, standart FileReader kullanılıyor:", err);
            fallbackDataURL(fileOrBlob, type, fileName, currentName, messageText);
        });
    } else {
        // Dokümanlar ve Ses Kayıtları için DataURL fallback
        fallbackDataURL(fileOrBlob, type, fileName, currentName, messageText);
    }
}

function fallbackDataURL(fileOrBlob, type, fileName, currentName, messageText) {
    const reader = new FileReader();

    reader.onprogress = function(e) {
        if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            showUploadProgress(fileName, Math.max(20, progress));
        }
    };

    reader.onload = function(e) {
        showUploadProgress(fileName, 100);
        setTimeout(() => {
            hideUploadProgress();
            const url = e.target.result;
            sendChatMessage(currentName, messageText, { type, url, name: fileName, size: formatBytes(fileOrBlob.size || 0) });
            cancelPendingAttachment();
            const input = document.getElementById('chat-input');
            if (input) input.value = '';
        }, 150);
    };

    reader.readAsDataURL(fileOrBlob);
}

function sendChatMessage(sender, text, attachment) {
    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

    const newMsg = {
        sender: sender,
        text: text || '',
        attachment: attachment || null,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: timestamp
    };

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("messages").add(newMsg).catch(() => {
            DEMO_MESSAGES.push(newMsg);
            renderMessagesFeed(DEMO_MESSAGES);
        });
    } else {
        DEMO_MESSAGES.push(newMsg);
        renderMessagesFeed(DEMO_MESSAGES);
    }
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
