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

    // Tüm kullanıcılar ve ziyaretçiler grup çalışma alanına erişebilir
    if (adminGuard) adminGuard.classList.add('hidden');
    if (workspaceContent) workspaceContent.classList.remove('hidden');

    loadGroupWorkspace();

    if (typeof auth !== 'undefined' && auth && auth.onAuthStateChanged) {
        auth.onAuthStateChanged(() => {
            if (currentGroup) {
                renderWorkspaceUI();
            }
        });
    }
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
            if (doc && doc.exists) {
                const data = doc.data() || {};
                currentGroup = { 
                    id: doc.id, 
                    name: data.name || "Proje Çalışma Alanı",
                    category: data.category || "Mühendislik & YZ",
                    inviteCode: data.inviteCode || ("MP-" + Math.floor(1000 + Math.random() * 9000)),
                    description: data.description || "Proje grup açıklaması.",
                    lookingRoles: data.lookingRoles || "",
                    members: Array.isArray(data.members) ? data.members : [],
                    milestones: Array.isArray(data.milestones) ? data.milestones : [],
                    ...data 
                };
            } else {
                fallbackLoadWorkspace();
            }
            renderWorkspaceUI();
        }, (err) => {
            console.warn("Firestore grup yükleme uyarısı:", err);
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

    // 1. Önce localStorage'da yerel önbellekte var mı kontrol et
    let localGroups = [];
    try {
        const stored = localStorage.getItem('mali_created_groups');
        if (stored) localGroups = JSON.parse(stored);
    } catch(e) {}

    const foundLocal = localGroups.find(g => g.id === groupId);
    if (foundLocal) {
        currentGroup = { ...foundLocal };
        return;
    }

    // 2. Demo grupları dizisinde var mı bak
    const foundDemo = (typeof DEMO_GROUPS !== 'undefined' && Array.isArray(DEMO_GROUPS)) 
        ? DEMO_GROUPS.find(g => g.id === groupId) 
        : null;

    if (foundDemo) {
        currentGroup = { ...foundDemo };
        if (!currentGroup.members) {
            currentGroup.members = [
                { uid: user ? user.uid : 'admin-uid', name: currentGroup.leader || adminName, email: user ? user.email : 'admin@maliyildirimtr.com', role: 'Yönetici' }
            ];
        }
        return;
    }

    // 3. Bulunamadıysa dinamik grup nesnesi oluştur
    currentGroup = {
        id: groupId,
        name: "Proje Çalışma Alanı",
        category: "Mühendislik & YZ",
        inviteCode: "MP-" + Math.floor(1000 + Math.random() * 9000),
        leader: adminName,
        description: "Bu proje kuluçka grubu üniversiteler arası ortak mühendislik ve geliştirme alanıdır.",
        lookingRoles: "Yazılımcı, Donanım Geliştirici",
        targetBudget: 5000,
        spentBudget: 0,
        membersCount: 1,
        members: [
            { uid: user ? user.uid : 'admin-uid', name: adminName, email: user ? user.email : 'admin@maliyildirimtr.com', role: 'Yönetici' }
        ],
        milestones: [
            { id: "m1", text: "Proje Mimarisi ve İhtiyaç Analizi", status: "completed" },
            { id: "m2", text: "Donanım ve Yazılım Geliştirme Fazı", status: "in_progress" },
            { id: "m3", text: "Test, Doğrulama ve Canlıya Alma", status: "planned" }
        ]
    };
}

// ANA ARAYÜZÜ RENDER ETME
function renderWorkspaceUI() {
    try {
        const container = document.getElementById('group-workspace-content');
        if (!container) return;

        if (!currentGroup) {
            fallbackLoadWorkspace();
        }

        const isMember = isCurrentUserMember();
        const roleText = getCurrentUserRole();
        const targetBudget = currentGroup.targetBudget || 0;

        let lookingRolesBadges = "";
        if (currentGroup.lookingRoles) {
            let rolesArr = [];
            if (typeof currentGroup.lookingRoles === 'string') {
                rolesArr = currentGroup.lookingRoles.split(',');
            } else if (Array.isArray(currentGroup.lookingRoles)) {
                rolesArr = currentGroup.lookingRoles;
            }
            if (rolesArr.length > 0) {
                lookingRolesBadges = `
                    <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span class="text-[10px] font-bold text-amber-500">🎯 Aranan Roller:</span>
                        ${rolesArr.map(r => `<span class="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20">${String(r).trim()}</span>`).join('')}
                    </div>
                `;
            }
        }

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
                        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">${currentGroup.name || 'Proje Çalışma Alanı'}</h1>
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
    } catch (err) {
        console.error("renderWorkspaceUI kritik hata:", err);
        const container = document.getElementById('group-workspace-content');
        if (container) {
            container.innerHTML = `
                <div class="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-center">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">${(currentGroup && currentGroup.name) ? currentGroup.name : 'Proje Çalışma Alanı'}</h2>
                    <p class="text-xs text-slate-500">${(currentGroup && currentGroup.description) ? currentGroup.description : 'Grup çalışma alanına hoş geldiniz.'}</p>
                    <a href="gruplar.html" class="inline-block px-5 py-2.5 rounded-xl bg-tsMavi text-white font-bold text-xs">← Gruplara Dön</a>
                </div>
            `;
        }
    }
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

// SAFE FILE DOWNLOAD, LIGHTBOX & IMAGE VIEWING HELPERS
let activePreviewImageUrl = "";
let activePreviewImageName = "";

function openChatAttachment(msgId) {
    let msg = null;
    if (window.currentLoadedMessages) {
        msg = window.currentLoadedMessages.find((m, idx) => (m.id === msgId || ('m_' + idx) === msgId));
    }
    
    if (!msg || !msg.attachment || !msg.attachment.url) {
        alert("Bağlantıya ulaşılamadı veya dosya henüz hazır değil!");
        return;
    }

    const att = msg.attachment;
    if (att.type === 'image') {
        openImagePreviewModal(att.url, att.name || 'Görsel');
    } else {
        downloadBlobOrUrl(att.url, att.name || 'dokuman');
    }
}

function openImagePreviewModal(url, fileName) {
    activePreviewImageUrl = url;
    activePreviewImageName = fileName || 'Görsel';
    const modal = document.getElementById('image-preview-modal');
    const img = document.getElementById('image-preview-img');
    const title = document.getElementById('image-preview-title');

    if (img) img.src = url;
    if (title) title.innerText = fileName || 'Görsel Önizleme';
    if (modal) modal.classList.remove('hidden');
}

function closeImagePreviewModal() {
    const modal = document.getElementById('image-preview-modal');
    if (modal) modal.classList.add('hidden');
}

function downloadActivePreviewImage() {
    if (activePreviewImageUrl) {
        downloadBlobOrUrl(activePreviewImageUrl, activePreviewImageName);
    }
}

function downloadBlobOrUrl(url, fileName) {
    if (!url || url === '#' || url === 'null' || url === 'undefined') {
        alert("Üzgünüz, dosya bağlantısı geçerli değil veya bulunamadı!");
        return;
    }

    const safeFileName = fileName || 'dokuman';

    if (url.startsWith('data:')) {
        try {
            const parts = url.split(';base64,');
            const contentType = parts[0].split(':')[1] || 'application/octet-stream';
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }
            const blob = new Blob([uInt8Array], { type: contentType });
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = safeFileName;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }, 2000);
        } catch (e) {
            console.error("DataURL indirme hatası:", e);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = safeFileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 1000);
        }
    } else {
        // Firebase Storage veya HTTPS URL'si
        fetch(url).then(res => res.blob()).then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = safeFileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }, 2000);
        }).catch(() => {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 1000);
        });
    }
}

function downloadChatAttachment(encodedUrl, fileName) {
    downloadBlobOrUrl(decodeURIComponent(encodedUrl || ''), fileName);
}

function viewChatImage(encodedUrl, fileName) {
    openImagePreviewModal(decodeURIComponent(encodedUrl || ''), fileName);
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

        const encUrl = encodeURIComponent(d.url || '');
        const encTitle = (d.title || 'dokuman').replace(/'/g, "\\'");

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
                        <button type="button" onclick="downloadChatAttachment('${encUrl}', '${encTitle}')" class="px-3 py-1 rounded-xl bg-tsMavi/10 text-tsMavi text-[11px] font-bold hover:bg-tsMavi hover:text-white transition-all shadow-sm">
                            🔗 Aç / İndir ↗
                        </button>
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
    const fileInp = document.getElementById('doc-file-input');
    if (fileInp) fileInp.value = '';
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

function handleArchiveFileSelection(e) {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizeBytes = 15 * 1024 * 1024; // 15 MB
    if (file.size > maxSizeBytes) {
        e.target.value = '';
        alert("Eyvah! Dosya boyutu sınırı aşıldı (Maksimum 15 MB). Lütfen devasa boyutlardaki projeleriniz için Google Drive veya GitHub gibi bulut platformları üzerinden link (URL) paylaşarak arşive ekleyin.");
        return;
    }

    const titleInput = document.getElementById('doc-title-input');
    if (titleInput && !titleInput.value.trim()) {
        titleInput.value = file.name;
    }

    const categorySelect = document.getElementById('doc-category-select');
    if (categorySelect) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (['v', 'sv', 'c', 'cpp', 'py', 'json', 'cad', 'dwg', 'pcb'].includes(ext)) {
            categorySelect.value = 'Devre / CAD Çizimleri';
        } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
            categorySelect.value = 'Sunumlar & Raporlar';
        } else {
            categorySelect.value = 'Teknik Dokümanlar';
        }
    }
}

function handleSaveDocument(e) {
    if (e && e.preventDefault) e.preventDefault();

    const editId = document.getElementById('edit-doc-id').value;
    const title = document.getElementById('doc-title-input').value.trim();
    const category = document.getElementById('doc-category-select').value;
    const uploader = document.getElementById('doc-uploader-select').value;
    let url = document.getElementById('doc-url-input').value.trim();
    const note = document.getElementById('doc-desc-input').value.trim();
    const fileInp = document.getElementById('doc-file-input');
    const file = fileInp ? fileInp.files[0] : null;

    if (!title) {
        alert("Lütfen bir doküman başlığı girin!");
        return;
    }

    if (file) {
        if (file.size > 15 * 1024 * 1024) {
            alert("Eyvah! Dosya boyutu sınırı aşıldı (Maksimum 15 MB). Lütfen devasa boyutlardaki projeleriniz için Google Drive veya GitHub gibi bulut platformları üzerinden link (URL) paylaşarak arşive ekleyin.");
            return;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
            url = evt.target.result;
            saveDocData(editId, title, category, uploader, url, note);
        };
        reader.readAsDataURL(file);
    } else if (url) {
        saveDocData(editId, title, category, uploader, url, note);
    } else {
        alert("Lütfen bir dosya seçin veya bir link (URL) adresi girin!");
    }
}

function saveDocData(editId, title, category, uploader, url, note) {
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

// 5. GRUP İÇİ SOHBET (WHATSAPP WEB TASARIMI & İŞLEMLERİ)
function renderChatTab(container) {
    container.innerHTML = `
        <div class="p-4 md:p-6 rounded-3xl bg-[#efeae2] dark:bg-[#0b141a] border border-slate-200 dark:border-slate-800/80 space-y-4 max-w-4xl mx-auto shadow-2xl transition-colors">
            
            <!-- HEADER -->
            <div class="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-3 px-2">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-tsBordo to-tsMavi text-white font-bold flex items-center justify-center shadow-md">
                        👥
                    </div>
                    <div>
                        <h3 class="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">${currentGroup.name}</h3>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Takım Üyeleri (${currentGroup.members ? currentGroup.members.length : 1})</p>
                    </div>
                </div>
                <span class="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    ● Canlı Sohbet
                </span>
            </div>

            <!-- SOHBET AKIŞ ALANI (WHATSAPP DUVAR KAĞIDI HİSSİ) -->
            <div id="chat-messages-container" class="space-y-4 h-[440px] overflow-y-auto p-3 no-scrollbar rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
                <div class="text-center py-10 text-slate-500 text-xs">Mesajlar yükleniyor...</div>
            </div>

            <!-- EKLENTİ SEÇİM ÖNİZLEME ALANI -->
            <div id="chat-preview-container" class="hidden p-3 rounded-2xl bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-md">
                <div class="flex items-center gap-2 text-xs text-slate-900 dark:text-slate-100 truncate" id="chat-preview-content"></div>
                <button type="button" onclick="cancelPendingAttachment()" class="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1">✕ Kaldır</button>
            </div>

            <!-- YÜKLENİYOR / İLERLEME ÇUBUĞU (WHATSAPP PROGRESS BAR) -->
            <div id="chat-upload-progress-panel" class="hidden p-3 rounded-2xl bg-tsMavi/10 border border-tsMavi/30 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-tsMavi">
                    <span id="upload-progress-filename" class="truncate max-w-xs">⏳ Yükleniyor...</span>
                    <span id="upload-progress-percent" class="font-mono text-slate-900 dark:text-slate-100">%0</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div id="upload-progress-bar" class="h-full bg-tsMavi rounded-full transition-all duration-200" style="width: 0%"></div>
                </div>
            </div>

            <!-- WHATSAPP TARZI SES KAYIT BARI (RECORDING STATE - EKRAN GÖRÜNTÜSÜ BİREBİR) -->
            <div id="voice-recording-panel" class="hidden flex items-center gap-3 p-1 w-full">
                <!-- TRASH BIN (CANCEL) -->
                <button type="button" onclick="cancelVoiceRecording()" title="Kaydı İptal Et / Sil" class="p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-lg shrink-0">
                    🗑️
                </button>

                <!-- RECORDING CAPSULE BAR -->
                <div class="flex-grow flex items-center justify-between gap-3 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#202c33] shadow-md">
                    <!-- RED DOT + COUNTER -->
                    <div class="flex items-center gap-2 shrink-0">
                        <span class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                        <span id="voice-recording-timer" class="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">0:00</span>
                    </div>

                    <!-- WAVEFORM ANIMATION -->
                    <div class="flex-grow flex items-center justify-center gap-0.5 h-6 overflow-hidden px-2">
                        <div class="w-0.5 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse"></div>
                        <div class="w-0.5 h-5 bg-slate-400 dark:bg-slate-300 rounded-full animate-pulse" style="animation-delay: 0.1s"></div>
                        <div class="w-0.5 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                        <div class="w-0.5 h-6 bg-slate-400 dark:bg-slate-200 rounded-full animate-pulse" style="animation-delay: 0.15s"></div>
                        <div class="w-0.5 h-4 bg-slate-400 dark:bg-slate-400 rounded-full animate-pulse" style="animation-delay: 0.25s"></div>
                        <div class="w-0.5 h-5 bg-slate-400 dark:bg-slate-300 rounded-full animate-pulse" style="animation-delay: 0.05s"></div>
                        <div class="w-0.5 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.3s"></div>
                        <div class="w-0.5 h-6 bg-slate-400 dark:bg-slate-200 rounded-full animate-pulse" style="animation-delay: 0.12s"></div>
                        <div class="w-0.5 h-4 bg-slate-400 dark:bg-slate-400 rounded-full animate-pulse" style="animation-delay: 0.22s"></div>
                        <div class="w-0.5 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.18s"></div>
                        <div class="w-0.5 h-5 bg-slate-400 dark:bg-slate-300 rounded-full animate-pulse" style="animation-delay: 0.08s"></div>
                        <div class="w-0.5 h-3 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" style="animation-delay: 0.28s"></div>
                    </div>

                    <!-- PAUSE / RESUME BUTTON -->
                    <button type="button" onclick="togglePauseVoiceRecording()" id="voice-pause-btn" title="Duraklat / Devam Et" class="p-1.5 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm shrink-0">
                        ⏸️
                    </button>

                    <!-- SEND CIRCLE BUTTON -->
                    <button type="button" onclick="stopAndSendVoiceNote()" title="Kaydı Gönder" class="w-8 h-8 rounded-full bg-tsMavi hover:bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-md transition-transform active:scale-95 shrink-0">
                        ➔
                    </button>
                </div>
            </div>

            <!-- YANITLANAN MESAJ ÖNİZLEME ALANI (REPLY PREVIEW BAR) -->
            <div id="chat-reply-container" class="hidden p-3 rounded-2xl bg-tsMavi/10 border-l-4 border-tsMavi flex items-center justify-between gap-3 shadow-md">
                <div class="space-y-0.5 truncate text-xs">
                    <span id="chat-reply-sender" class="font-bold text-tsMavi block">Sender</span>
                    <p id="chat-reply-text" class="text-slate-700 dark:text-slate-300 truncate text-[11px]">Message text snippet...</p>
                </div>
                <button type="button" onclick="cancelReplyMessage()" class="text-xs text-slate-400 hover:text-rose-500 font-bold px-2 py-1">✕</button>
            </div>

            <!-- GİZLİ DOSYA / GÖRSEL YÜKLEME INPUTLARI -->
            <input type="file" id="chat-file-input" class="hidden" accept=".pdf,.doc,.docx,.txt,.zip,.rar,.v,.sv,.c,.cpp,.py,.json" onchange="handleFileSelection(event)">
            <input type="file" id="chat-image-input" class="hidden" accept="image/*" onchange="handleImageSelection(event)">

            <!-- WHATSAPP TARZI MESAJ YAZMA BARI -->
            <form id="chat-form" onsubmit="handleSendMessage(event)" class="relative space-y-2">

                <!-- WHATSAPP (+) AÇILIR EKLENTİ MENÜSÜ (+ BUTONUNUN TAM ÜSTÜNDE HİZALI) -->
                <div id="whatsapp-attach-menu" class="hidden absolute bottom-14 left-0 z-50 p-4 rounded-3xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-xl space-y-3 w-72">
                    <div class="grid grid-cols-4 gap-2 text-center">
                        <!-- File -->
                        <button type="button" onclick="document.getElementById('chat-file-input').click(); toggleWhatsappAttachMenu();" class="flex flex-col items-center gap-1 group">
                            <div class="w-11 h-11 rounded-full bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-md">
                                📁
                            </div>
                            <span class="text-[10px] font-bold text-slate-700 dark:text-slate-300">File</span>
                        </button>

                        <!-- Photos & Videos -->
                        <button type="button" onclick="document.getElementById('chat-image-input').click(); toggleWhatsappAttachMenu();" class="flex flex-col items-center gap-1 group">
                            <div class="w-11 h-11 rounded-full bg-sky-600/20 text-sky-500 border border-sky-500/30 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-md">
                                🖼️
                            </div>
                            <span class="text-[10px] font-bold text-slate-700 dark:text-slate-300">Photos</span>
                        </button>

                        <!-- Poll -->
                        <button type="button" onclick="insertQuickPoll(); toggleWhatsappAttachMenu();" class="flex flex-col items-center gap-1 group">
                            <div class="w-11 h-11 rounded-full bg-amber-600/20 text-amber-500 border border-amber-500/30 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-md">
                                📊
                            </div>
                            <span class="text-[10px] font-bold text-slate-700 dark:text-slate-300">Poll</span>
                        </button>

                        <!-- Event -->
                        <button type="button" onclick="openAddMilestoneModal(); toggleWhatsappAttachMenu();" class="flex flex-col items-center gap-1 group">
                            <div class="w-11 h-11 rounded-full bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-md">
                                📅
                            </div>
                            <span class="text-[10px] font-bold text-slate-700 dark:text-slate-300">Event</span>
                        </button>
                    </div>

                    <div class="grid grid-cols-4 gap-2 text-center border-t border-slate-200 dark:border-slate-800 pt-2.5">
                        <!-- Contact -->
                        <button type="button" onclick="shareLeaderContact(); toggleWhatsappAttachMenu();" class="flex flex-col items-center gap-1 group">
                            <div class="w-11 h-11 rounded-full bg-orange-600/20 text-orange-500 border border-orange-500/30 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-md">
                                👤
                            </div>
                            <span class="text-[10px] font-bold text-slate-700 dark:text-slate-300">Contact</span>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#202c33] focus-within:border-tsMavi transition-all shadow-md">
                    
                    <!-- (+) ATTACHMENT MENU BUTTON -->
                    <button type="button" id="whatsapp-attach-btn" onclick="toggleWhatsappAttachMenu()" title="Eklenti Ekle (+)" class="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-lg transition-transform active:scale-95 shrink-0">
                        ➕
                    </button>

                    <!-- METİN GİRDİ ALANI -->
                    <input type="text" id="chat-input" oninput="handleChatInputTyping(this)" placeholder="Bir mesaj yazın..." class="flex-grow bg-transparent text-slate-900 dark:text-slate-100 text-xs focus:outline-none px-2 py-1">

                    <!-- 😊 EMOJI BUTONU -->
                    <button type="button" onclick="insertQuickEmoji('😊')" title="Emoji Ekle" class="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-amber-500 text-base transition-colors shrink-0">
                        😊
                    </button>

                    <!-- SAĞ AKSİYON (MİKROFON VEYA GÖNDER) -->
                    <div id="chat-actions-right" class="shrink-0 flex items-center gap-1">
                        <button type="button" onclick="startVoiceRecording()" id="chat-mic-btn" title="Ses Kaydı Gönder" class="p-2 rounded-full text-slate-500 dark:text-slate-300 hover:text-rose-500 transition-colors text-base">
                            🎤
                        </button>
                        <button type="submit" id="chat-send-btn" title="Gönder" class="hidden px-4 py-2 rounded-full bg-tsMavi text-white font-bold text-xs hover:bg-sky-500 transition-transform active:scale-95 shadow-md">
                            ➔
                        </button>
                    </div>
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

function toggleWhatsappAttachMenu() {
    const menu = document.getElementById('whatsapp-attach-menu');
    if (menu) menu.classList.toggle('hidden');
}

function handleChatInputTyping(input) {
    const micBtn = document.getElementById('chat-mic-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const inputEl = input || document.getElementById('chat-input');
    const val = inputEl ? inputEl.value.trim() : '';

    if (val.length > 0 || pendingAttachment) {
        if (micBtn) micBtn.classList.add('hidden');
        if (sendBtn) sendBtn.classList.remove('hidden');
    } else {
        if (micBtn) micBtn.classList.remove('hidden');
        if (sendBtn) sendBtn.classList.add('hidden');
    }
}

function insertQuickEmoji(emoji) {
    const input = document.getElementById('chat-input');
    if (input) {
        input.value += emoji;
        handleChatInputTyping(input);
        input.focus();
    }
}

function shareLeaderContact() {
    const leaderName = currentGroup ? currentGroup.leader : "Mehmet Ali Yıldırım";
    const leaderEmail = "maliyildirimtr@gmail.com";
    const user = getCurrentUser();
    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    sendChatMessage(currentName, `👤 Contact Card: ${leaderName} (${leaderEmail})`, null);
}

// WHATSAPP TARZI ANKET (CREATE POLL) MANTIĞI & VOTE ENGINE
let pollOptionsList = ["", ""];

function insertQuickPoll() {
    openCreatePollModal();
}

function openCreatePollModal() {
    pollOptionsList = ["", ""];
    const qInp = document.getElementById('poll-question-input');
    const mChk = document.getElementById('poll-multiple-allow');
    if (qInp) qInp.value = '';
    if (mChk) mChk.checked = false;
    renderPollOptionsInputs();
    const modal = document.getElementById('create-poll-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeCreatePollModal() {
    const modal = document.getElementById('create-poll-modal');
    if (modal) modal.classList.add('hidden');
}

function renderPollOptionsInputs() {
    const container = document.getElementById('poll-options-container');
    if (!container) return;

    let html = "";
    pollOptionsList.forEach((optVal, idx) => {
        html += `
            <div class="flex items-center gap-2">
                <span class="text-slate-400 font-bold text-xs shrink-0 cursor-grab">≡</span>
                <input type="text" value="${optVal.replace(/"/g, '&quot;')}" oninput="updatePollOptionValue(${idx}, this.value)" placeholder="Option ${idx + 1}" class="flex-grow px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-tsMavi transition-colors">
                ${pollOptionsList.length > 2 ? `
                    <button type="button" onclick="removePollOptionInput(${idx})" title="Sil" class="text-xs text-rose-500 hover:text-rose-600 p-1 shrink-0 font-bold">✕</button>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

function updatePollOptionValue(idx, val) {
    pollOptionsList[idx] = val;
    if (idx === pollOptionsList.length - 1 && val.trim() !== '') {
        pollOptionsList.push("");
        renderPollOptionsInputs();
    }
}

function addPollOptionInput() {
    pollOptionsList.push("");
    renderPollOptionsInputs();
}

function removePollOptionInput(idx) {
    if (pollOptionsList.length <= 2) return;
    pollOptionsList.splice(idx, 1);
    renderPollOptionsInputs();
}

function handleSendPollForm(e) {
    if (e && e.preventDefault) e.preventDefault();

    const qInp = document.getElementById('poll-question-input');
    const question = qInp ? qInp.value.trim() : '';

    if (!question) {
        alert("Lütfen bir anket sorusu yazın!");
        return;
    }

    const validOptions = pollOptionsList.map(o => o.trim()).filter(o => o.length > 0);
    if (validOptions.length < 2) {
        alert("Anket için en az 2 geçerli seçenek yazmalısınız!");
        return;
    }

    const allowMultiple = document.getElementById('poll-multiple-allow') ? document.getElementById('poll-multiple-allow').checked : false;
    const user = getCurrentUser();
    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    const pollData = {
        question: question,
        allowMultiple: allowMultiple,
        options: validOptions.map((optText, index) => ({
            id: index,
            text: optText,
            votes: []
        }))
    };

    sendChatMessage(currentName, '', null, pollData);
    closeCreatePollModal();
}

function votePollOption(msgId, optionIndex) {
    const user = getCurrentUser();
    const userKey = user ? (user.uid || user.email) : "demo_user";

    if (typeof db !== 'undefined' && db && db.collection) {
        const msgRef = db.collection("groups").doc(groupId).collection("messages").doc(msgId);
        msgRef.get().then(doc => {
            if (!doc.exists) return;
            const msgData = doc.data();
            if (!msgData || !msgData.poll) return;

            const poll = msgData.poll;
            const allowMultiple = poll.allowMultiple || false;

            poll.options.forEach((opt, idx) => {
                if (!opt.votes) opt.votes = [];
                if (idx === optionIndex) {
                    if (opt.votes.includes(userKey)) {
                        opt.votes = opt.votes.filter(u => u !== userKey);
                    } else {
                        opt.votes.push(userKey);
                    }
                } else if (!allowMultiple) {
                    opt.votes = opt.votes.filter(u => u !== userKey);
                }
            });

            msgRef.update({ poll: poll });
        }).catch(err => console.error("Oy kullanma hatası:", err));
    } else {
        const msg = DEMO_MESSAGES.find(m => m.id === msgId);
        if (msg && msg.poll) {
            const allowMultiple = msg.poll.allowMultiple || false;
            msg.poll.options.forEach((opt, idx) => {
                if (!opt.votes) opt.votes = [];
                if (idx === optionIndex) {
                    if (opt.votes.includes(userKey)) {
                        opt.votes = opt.votes.filter(u => u !== userKey);
                    } else {
                        opt.votes.push(userKey);
                    }
                } else if (!allowMultiple) {
                    opt.votes = opt.votes.filter(u => u !== userKey);
                }
            });
            renderMessagesFeed(DEMO_MESSAGES);
        }
    }
}

// WHATSAPP TARZI ETKİNLİK (CREATE EVENT) MANTIĞI & RSVP ENGINE
function openAddMilestoneModal() {
    openCreateEventModal();
}

function openCreateEventModal() {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const nameInp = document.getElementById('event-name-input');
    const descInp = document.getElementById('event-desc-input');
    const locInp = document.getElementById('event-location-input');
    const sDate = document.getElementById('event-start-date');
    const sTime = document.getElementById('event-start-time');
    const incEnd = document.getElementById('event-include-endtime');
    const descCounter = document.getElementById('event-desc-counter');

    if (nameInp) nameInp.value = '';
    if (descInp) descInp.value = '';
    if (locInp) locInp.value = '';
    if (sDate) sDate.value = today;
    if (sTime) sTime.value = nowTime;
    if (incEnd) {
        incEnd.checked = false;
        toggleEndTimeFields(false);
    }
    if (descCounter) descCounter.innerText = '0/1000';

    const modal = document.getElementById('create-event-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeCreateEventModal() {
    const modal = document.getElementById('create-event-modal');
    if (modal) modal.classList.add('hidden');
}

function updateEventDescCounter(textarea) {
    const len = textarea ? textarea.value.length : 0;
    const counter = document.getElementById('event-desc-counter');
    if (counter) counter.innerText = `${len}/1000`;
}

function toggleEndTimeFields(checked) {
    const container = document.getElementById('event-endtime-container');
    if (container) {
        if (checked) container.classList.remove('hidden');
        else container.classList.add('hidden');
    }
}

function handleSendEventForm(e) {
    if (e && e.preventDefault) e.preventDefault();

    const nameInp = document.getElementById('event-name-input');
    const descInp = document.getElementById('event-desc-input');
    const locInp = document.getElementById('event-location-input');
    const sDate = document.getElementById('event-start-date');
    const sTime = document.getElementById('event-start-time');
    const incEnd = document.getElementById('event-include-endtime');
    const eDate = document.getElementById('event-end-date');
    const eTime = document.getElementById('event-end-time');
    const allowGuests = document.getElementById('event-allow-guests');

    const title = nameInp ? nameInp.value.trim() : '';
    if (!title) {
        alert("Lütfen etkinlik adını girin!");
        return;
    }

    const startDate = sDate ? sDate.value : '';
    const startTime = sTime ? sTime.value : '';
    if (!startDate || !startTime) {
        alert("Lütfen başlangıç tarihi ve saatini seçin!");
        return;
    }

    const user = getCurrentUser();
    const userKey = user ? (user.uid || user.email) : "demo_user";
    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    const eventData = {
        title: title,
        description: descInp ? descInp.value.trim() : '',
        startDate: startDate,
        startTime: startTime,
        endDate: (incEnd && incEnd.checked && eDate) ? eDate.value : '',
        endTime: (incEnd && incEnd.checked && eTime) ? eTime.value : '',
        location: locInp ? locInp.value.trim() : '',
        allowGuests: allowGuests ? allowGuests.checked : true,
        attendees: [userKey]
    };

    sendChatMessage(currentName, '', null, null, eventData);
    closeCreateEventModal();
}

function toggleEventAttendance(msgId) {
    const user = getCurrentUser();
    const userKey = user ? (user.uid || user.email) : "demo_user";

    if (typeof db !== 'undefined' && db && db.collection) {
        const msgRef = db.collection("groups").doc(groupId).collection("messages").doc(msgId);
        msgRef.get().then(doc => {
            if (!doc.exists) return;
            const msgData = doc.data();
            if (!msgData || !msgData.eventData) return;

            const ev = msgData.eventData;
            if (!ev.attendees) ev.attendees = [];

            if (ev.attendees.includes(userKey)) {
                ev.attendees = ev.attendees.filter(u => u !== userKey);
            } else {
                ev.attendees.push(userKey);
            }

            msgRef.update({ eventData: ev });
        }).catch(err => console.error("Etkinlik katılım hatası:", err));
    } else {
        const msg = DEMO_MESSAGES.find(m => m.id === msgId);
        if (msg && msg.eventData) {
            if (!msg.eventData.attendees) msg.eventData.attendees = [];
            if (msg.eventData.attendees.includes(userKey)) {
                msg.eventData.attendees = msg.eventData.attendees.filter(u => u !== userKey);
            } else {
                msg.eventData.attendees.push(userKey);
            }
            renderMessagesFeed(DEMO_MESSAGES);
        }
    }
}

function toggleMsgActionsMenu(msgId) {
    const menu = document.getElementById('msg-actions-' + msgId);
    const bubble = document.getElementById('msg-bubble-' + msgId);
    const row = bubble ? bubble.closest('.group\\/msg') : null;

    const isCurrentlyHidden = menu ? menu.classList.contains('hidden') : false;

    // Tüm açık menülerin ve z-index yükseltmelerinin sıfırlanması
    document.querySelectorAll('[id^="msg-actions-"]').forEach(m => m.classList.add('hidden'));
    document.querySelectorAll('.group\\/msg').forEach(r => r.style.zIndex = '');
    document.querySelectorAll('.msg-bubble-card').forEach(b => b.style.zIndex = '');

    if (menu && isCurrentlyHidden) {
        menu.classList.remove('hidden');
        if (row) row.style.zIndex = '50';
        if (bubble) bubble.style.zIndex = '50';
    }
}

// Dışarıya tıklanınca tüm açılır menüleri kapat
document.addEventListener('click', function(e) {
    if (!e.target.closest('[id^="msg-actions-"]') && !e.target.closest('button[title="İşlemler"]') && !e.target.closest('.msg-bubble-card')) {
        document.querySelectorAll('[id^="msg-actions-"]').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('.group\\/msg').forEach(r => r.style.zIndex = '');
        document.querySelectorAll('.msg-bubble-card').forEach(b => b.style.zIndex = '');
    }
});

function deleteChatMessage(msgId) {
    if (!confirm("Bu mesajı silmek istediğinizden emin misiniz?")) return;
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("messages").doc(msgId).delete();
    }
}

function addChatMessageToArchive(sender, text, attachmentJsonStr) {
    let attachment = null;
    try {
        if (attachmentJsonStr) attachment = JSON.parse(decodeURIComponent(attachmentJsonStr));
    } catch(e) {}

    const title = attachment ? attachment.name : (text ? (text.substring(0, 35) + '...') : 'Sohbet Dokümanı');
    const url = attachment ? attachment.url : '#';
    const note = `Sohbet alanından (${sender} tarafından) arşivlendi.`;

    let category = "Teknik Dokümanlar";
    if (attachment && attachment.name) {
        const ext = attachment.name.split('.').pop().toLowerCase();
        if (['v', 'sv', 'c', 'cpp', 'py', 'json', 'cad', 'dwg', 'pcb'].includes(ext)) {
            category = "Devre / CAD Çizimleri";
        } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
            category = "Sunumlar & Raporlar";
        }
    }

    const newDoc = {
        title,
        category,
        uploader: sender || "Üye",
        url,
        note,
        date: new Date().toLocaleDateString('tr-TR'),
        createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date().toISOString()
    };

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("groups").doc(groupId).collection("documents").add(newDoc).then(() => {
            alert("Doküman başarıyla Proje Arşivine eklendi! 📂");
        }).catch(err => {
            console.error("Arşive ekleme hatası:", err);
            alert("Doküman Proje Arşivine eklendi! 📂");
        });
    } else {
        groupDocuments.push({ id: 'd' + Date.now(), ...newDoc });
        alert("Doküman başarıyla Proje Arşivine eklendi! 📂");
    }
}

let selectedMsgIds = new Set();
let isSelectModeActive = false;

function renderMessagesFeed(messages) {
    window.currentLoadedMessages = messages || [];
    const c = document.getElementById('chat-messages-container');
    if (!c) return;

    const user = getCurrentUser();
    const userKey = user ? (user.uid || user.email) : "demo_user";
    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    if (messages.length === 0) {
        c.innerHTML = `<div class="text-center py-16 text-slate-400 text-xs italic">Henüz sohbet mesajı gönderilmedi. İlk mesajı gönderin!</div>`;
        return;
    }

    let html = "";
    messages.forEach((m, idx) => {
        // "Benden sil" kontrolü: kullanıcı bu mesajı kendisinden sildiyse gösterme
        if (m.deletedForArr && Array.isArray(m.deletedForArr) && m.deletedForArr.includes(userKey)) {
            return;
        }

        const isMe = m.sender === currentName;
        const timeStr = m.time || '17:09';
        const msgId = m.id || ('m_' + idx);
        const isDeleted = m.isDeleted || false;
        const attachmentJsonStr = encodeURIComponent(JSON.stringify(m.attachment || null));

        let attachmentHTML = "";
        if (m.attachment && !isDeleted) {
            if (m.attachment.type === 'image') {
                attachmentHTML = `
                    <div class="my-1.5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-md max-w-xs">
                        <img src="${m.attachment.url}" alt="Görsel" onclick="openChatAttachment('${msgId}')" class="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity">
                    </div>
                `;
            } else if (m.attachment.type === 'file') {
                attachmentHTML = `
                    <div onclick="openChatAttachment('${msgId}')" class="my-1.5 rounded-2xl bg-slate-900 text-white overflow-hidden border border-slate-700/80 shadow-lg max-w-xs cursor-pointer hover:border-tsMavi transition-all">
                        <div class="p-3.5 flex items-center gap-3 bg-gradient-to-r from-rose-950/60 to-slate-900">
                            <div class="w-10 h-10 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md">
                                PDF
                            </div>
                            <div class="truncate">
                                <h5 class="font-bold text-xs truncate text-white">${m.attachment.name}</h5>
                                <p class="text-[10px] text-slate-300 font-mono mt-0.5">${m.attachment.size || '588 KB'} • pdf</p>
                            </div>
                        </div>
                        <div class="px-3.5 py-2 bg-slate-950/60 flex items-center justify-between border-t border-slate-800">
                            <span class="text-[10px] text-slate-400">İndirmek için tıklayın</span>
                            <button type="button" onclick="openChatAttachment('${msgId}'); event.stopPropagation();" class="px-3 py-1 rounded-xl bg-tsMavi text-white font-bold text-[10px] hover:bg-sky-500 transition-colors shadow-sm">
                                💾 İndir ↗
                            </button>
                        </div>
                    </div>
                `;
            } else if (m.attachment.type === 'voice') {
                attachmentHTML = `
                    <div class="my-1.5 p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md space-y-2 max-w-xs text-slate-900 dark:text-slate-100">
                        <div class="flex items-center gap-2.5">
                            <div class="relative shrink-0">
                                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-tsBordo to-tsMavi text-white font-bold text-xs flex items-center justify-center shadow-md">
                                    ${(m.sender || 'U').substring(0, 2).toUpperCase()}
                                </div>
                                <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold shadow">🎙️</span>
                            </div>

                            <button type="button" onclick="toggleVoicePlayback('${msgId}')" id="voice-play-btn-${msgId}" class="w-8 h-8 rounded-full bg-tsMavi hover:bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-md transition-transform active:scale-95 shrink-0">
                                ▶
                            </button>

                            <div class="flex-grow space-y-1">
                                <input type="range" id="voice-seek-${msgId}" min="0" max="100" value="0" oninput="seekVoiceAudio('${msgId}', this.value)" class="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-tsMavi">
                                <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                    <span id="voice-time-${msgId}">0:00 / 0:15</span>
                                </div>
                            </div>

                            <button type="button" onclick="cycleVoiceSpeed('${msgId}')" id="voice-speed-btn-${msgId}" title="Oynatma Hızı (1x, 1.5x, 2x)" class="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold border border-slate-300 dark:border-slate-600 shrink-0">
                                1x
                            </button>
                        </div>
                        <audio id="voice-audio-${msgId}" src="${m.attachment.url}" preload="metadata" class="hidden" onended="onVoiceEnded('${msgId}')" ontimeupdate="onVoiceTimeUpdate('${msgId}')"></audio>
                    </div>
                `;
            }
        }

        let pollHTML = "";
        if (m.poll && !isDeleted) {
            let totalVotes = 0;
            if (m.poll.options) {
                m.poll.options.forEach(o => {
                    totalVotes += (o.votes ? o.votes.length : 0);
                });
            }

            let optionsHTML = "";
            if (m.poll.options) {
                m.poll.options.forEach((opt, oIdx) => {
                    const votesCount = opt.votes ? opt.votes.length : 0;
                    const hasVoted = opt.votes && opt.votes.includes(userKey);
                    const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

                    optionsHTML += `
                        <div onclick="votePollOption('${msgId}', ${oIdx})" class="p-2.5 rounded-xl border ${hasVoted ? 'border-tsMavi bg-tsMavi/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33]'} hover:border-tsMavi transition-all cursor-pointer space-y-1.5 shadow-sm">
                            <div class="flex items-center justify-between text-xs font-semibold">
                                <div class="flex items-center gap-2 truncate">
                                    <span class="w-4 h-4 rounded-${m.poll.allowMultiple ? 'md' : 'full'} border flex items-center justify-center text-[10px] ${hasVoted ? 'bg-tsMavi text-white border-tsMavi' : 'border-slate-400'}">
                                        ${hasVoted ? '✓' : ''}
                                    </span>
                                    <span class="truncate text-slate-900 dark:text-slate-100">${opt.text}</span>
                                </div>
                                <span class="font-mono text-[10px] font-bold shrink-0 ml-2 text-slate-600 dark:text-slate-300">${votesCount} oy (%${percent})</span>
                            </div>
                            <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div class="h-full bg-tsMavi rounded-full transition-all duration-300" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    `;
                });
            }

            pollHTML = `
                <div class="my-2 p-3.5 rounded-2xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-700/80 shadow-lg space-y-3 min-w-[270px] max-w-sm text-slate-900 dark:text-slate-100">
                    <div class="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <div class="flex items-center gap-1.5 text-xs font-extrabold text-tsMavi">
                            <span>📊 Anket</span>
                        </div>
                        <h4 class="font-bold text-xs leading-snug text-slate-900 dark:text-slate-100">${m.poll.question}</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            ${m.poll.allowMultiple ? '✓ Birden fazla şık seçilebilir' : '• Tek bir şık seçilebilir'}
                        </p>
                    </div>

                    <div class="space-y-2">
                        ${optionsHTML}
                    </div>

                    <div class="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>Total: ${totalVotes} oy</span>
                        <span>${timeStr} ✓✓</span>
                    </div>
                </div>
            `;
        }

        let eventHTML = "";
        if (m.eventData && !isDeleted) {
            const ev = m.eventData;
            const isAttending = ev.attendees && ev.attendees.includes(userKey);
            const attendeesCount = ev.attendees ? ev.attendees.length : 0;

            const dateObj = new Date(ev.startDate || Date.now());
            const dayNum = isNaN(dateObj.getDate()) ? '12' : dateObj.getDate();
            const monthStr = isNaN(dateObj.getDate()) ? 'AĞU' : dateObj.toLocaleString('tr-TR', { month: 'short' }).toUpperCase();

            eventHTML = `
                <div class="my-2 p-3.5 rounded-2xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-700/80 shadow-lg space-y-3 min-w-[270px] max-w-sm text-slate-900 dark:text-slate-100">
                    <div class="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <div class="space-y-1">
                            <div class="flex items-center gap-1.5 text-xs font-extrabold text-rose-500">
                                <span>📅 Etkinlik</span>
                            </div>
                            <h4 class="font-extrabold text-sm leading-snug text-slate-900 dark:text-slate-100">${ev.title}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            <span>${dayNum}</span>
                            <span class="text-[9px] font-mono">${monthStr}</span>
                        </div>
                    </div>

                    <div class="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <div class="flex items-center gap-2">
                            <span>🕒</span>
                            <span>${ev.startDate || ''} • ${ev.startTime || ''} ${ev.endTime ? (' - ' + ev.endTime) : ''}</span>
                        </div>
                        ${ev.location ? `
                            <div class="flex items-center gap-2 text-tsMavi font-bold truncate">
                                <span>📍</span>
                                <span class="truncate">${ev.location}</span>
                            </div>
                        ` : ''}
                        ${ev.description ? `
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#202c33] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">${ev.description}</p>
                        ` : ''}
                    </div>

                    <div class="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div class="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <span>👥</span>
                            <span>${attendeesCount} Katılımcı</span>
                        </div>
                        <button type="button" onclick="toggleEventAttendance('${msgId}')" class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isAttending ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-tsMavi text-white hover:bg-sky-500'}">
                            ${isAttending ? '✓ Katılıyorsunuz' : 'Katıl ➔'}
                        </button>
                    </div>
                </div>
            `;
        }

        // REACTION PILLS RENDERING
        let reactionsHTML = "";
        if (m.reactions && Object.keys(m.reactions).length > 0 && !isDeleted) {
            let pills = "";
            Object.entries(m.reactions).forEach(([emoji, users]) => {
                if (users && users.length > 0) {
                    pills += `
                        <span onclick="addReactionToMessage('${msgId}', '${emoji}')" class="px-2 py-0.5 rounded-full bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:scale-105 transition-transform shadow-sm flex items-center gap-1 text-slate-800 dark:text-slate-100">
                            ${emoji} <span class="text-[9px] font-mono text-slate-500 dark:text-slate-400">${users.length}</span>
                        </span>
                    `;
                }
            });
            if (pills) {
                reactionsHTML = `<div class="flex items-center gap-1 mt-1.5 flex-wrap">${pills}</div>`;
            }
        }

        // WHATSAPP RENK PALETİ VE ÇİFT MAVİ TİK (READ RECEIPT)
        const bubbleBg = isMe 
            ? 'bg-[#005c4b] text-white rounded-2xl rounded-tr-none shadow-md' 
            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700/60 shadow-md';

        const isSelected = selectedMsgIds.has(msgId);

        html += `
            <div class="flex items-center ${isMe ? 'justify-end' : 'justify-start'} gap-2 group/msg relative w-full">
                <!-- TOPLU SEÇİM MODUNDA CHECKBOX -->
                ${isSelectModeActive ? `
                    <div class="shrink-0">
                        <input type="checkbox" onchange="toggleMsgSelection('${msgId}', this.checked)" ${isSelected ? 'checked' : ''} class="w-4 h-4 accent-tsMavi rounded cursor-pointer">
                    </div>
                ` : ''}

                <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} relative max-w-md">
                    ${!isMe ? `<span class="text-[10px] font-bold text-tsMavi dark:text-tsMavi mb-0.5 ml-1">${m.sender}</span>` : ''}
                    
                    <div id="msg-bubble-${msgId}" 
                         onclick="handleBubbleClick('${msgId}', event)" 
                         ondblclick="handleMessageDoubleClick('${msgId}', event)" 
                         onmousedown="handleBubbleTouchStart(event, '${msgId}')" 
                         onmousemove="handleBubbleTouchMove(event, '${msgId}')" 
                         onmouseup="handleBubbleTouchEnd(event, '${msgId}')" 
                         onmouseleave="handleBubbleTouchEnd(event, '${msgId}')" 
                         ontouchstart="handleBubbleTouchStart(event, '${msgId}')" 
                         ontouchmove="handleBubbleTouchMove(event, '${msgId}')" 
                         ontouchend="handleBubbleTouchEnd(event, '${msgId}')" 
                         class="relative p-3 ${bubbleBg} msg-bubble-card transition-all select-none cursor-pointer">
                        
                        ${!isDeleted ? `
                            <!-- EMOJI REACTION HOVER BUTTON -->
                            <div class="absolute ${isMe ? '-left-8' : '-right-8'} top-2 opacity-0 group-hover/msg:opacity-100 transition-opacity z-20">
                                <button type="button" onclick="toggleReactionPicker('${msgId}')" title="Tepki Ver" class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-xs shadow-md transition-all">
                                    😊
                                </button>
                            </div>

                            <!-- REACTION PICKER POPUP PANEL -->
                            <div id="reaction-picker-${msgId}" class="hidden absolute -top-10 ${isMe ? 'right-0' : 'left-0'} z-50 px-3 py-1.5 rounded-full bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 shadow-2xl flex items-center gap-2 text-sm backdrop-blur-md">
                                <button type="button" onclick="addReactionToMessage('${msgId}', '👍')" class="hover:scale-125 transition-transform">👍</button>
                                <button type="button" onclick="addReactionToMessage('${msgId}', '❤️')" class="hover:scale-125 transition-transform">❤️</button>
                                <button type="button" onclick="addReactionToMessage('${msgId}', '😂')" class="hover:scale-125 transition-transform">😂</button>
                                <button type="button" onclick="addReactionToMessage('${msgId}', '😮')" class="hover:scale-125 transition-transform">😮</button>
                                <button type="button" onclick="addReactionToMessage('${msgId}', '😢')" class="hover:scale-125 transition-transform">😢</button>
                                <button type="button" onclick="addReactionToMessage('${msgId}', '🙏')" class="hover:scale-125 transition-transform">🙏</button>
                            </div>

                            <!-- ÜÇ NOKTA İŞLEM MENÜSÜ BUTONU -->
                            <div class="absolute top-1.5 right-1.5 opacity-80 md:opacity-0 group-hover/msg:opacity-100 transition-opacity z-20">
                                <button type="button" onclick="toggleMsgActionsMenu('${msgId}')" title="İşlemler" class="w-5 h-5 rounded-full bg-slate-900/40 hover:bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold transition-all shadow">
                                    ⋮
                                </button>
                                
                                <!-- AÇILIR İŞLEM MENÜSÜ (EKRANA SIĞAN MAX-HEIGHT + OVERFLOW YAPI) -->
                                <div id="msg-actions-${msgId}" class="hidden absolute ${isMe ? 'right-0' : 'left-0'} top-7 z-50 w-52 max-h-56 overflow-y-auto py-1.5 rounded-2xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 shadow-2xl space-y-0.5 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 backdrop-blur-xl">
                                    <button type="button" onclick="replyToMessage('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5">
                                        <span>↩️</span> Reply (Yanıtla)
                                    </button>
                                    <button type="button" onclick="toggleReactionPicker('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5">
                                        <span>😊</span> React (Tepki Ver)
                                    </button>
                                    <button type="button" onclick="starMessage('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5">
                                        <span>⭐</span> ${m.starred ? 'Unstar (Yıldızı Kaldır)' : 'Star (Yıldızla)'}
                                    </button>
                                    <button type="button" onclick="pinMessage('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5">
                                        <span>📌</span> ${m.pinned ? 'Unpin (Sabitlemeyi Kaldır)' : 'Pin (Sabitle)'}
                                    </button>
                                    <button type="button" onclick="forwardMessage('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5">
                                        <span>➡️</span> Forward (İlet)
                                    </button>
                                    <button type="button" onclick="copyMessageText('${(m.text || '').replace(/'/g, "\\'")}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5">
                                        <span>📋</span> Copy (Kopyala)
                                    </button>
                                    <button type="button" onclick="addChatMessageToArchive('${m.sender}', '${(m.text || '').replace(/'/g, "\\'")}', '${attachmentJsonStr}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                                        <span>📂</span> Proje Arşivine Ekle
                                    </button>
                                    <button type="button" onclick="reportMessage('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                                        <span>⚠️</span> Report (Şikayet Et)
                                    </button>
                                    <button type="button" onclick="toggleSelectMode('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800">
                                        <span>✅</span> Select messages (Mesajları Seç)
                                    </button>
                                    ${(isMe || isUserAuthorized()) ? `
                                        <button type="button" onclick="openDeleteMsgModal('${msgId}'); toggleMsgActionsMenu('${msgId}');" class="w-full px-3.5 py-2 text-rose-500 hover:bg-rose-500/10 flex items-center gap-2.5 font-bold border-t border-slate-100 dark:border-slate-800">
                                            <span>🗑️</span> Delete (Sil)
                                        </button>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- ALINTILANAN MESAJ (REPLY BUBBLE) -->
                            ${m.replyTo ? `
                                <div class="mb-2 p-2 rounded-xl bg-black/20 border-l-4 border-tsMavi text-[11px] space-y-0.5">
                                    <span class="font-bold text-tsMavi block">${m.replyTo.sender}</span>
                                    <p class="opacity-90 truncate">${m.replyTo.text}</p>
                                </div>
                            ` : ''}

                            ${m.text ? `<p class="text-xs leading-relaxed whitespace-pre-wrap pr-4">${m.text}</p>` : ''}
                            ${attachmentHTML}
                            ${pollHTML}
                            ${eventHTML}
                            ${reactionsHTML}
                        ` : `
                            <!-- SİLİNMİŞ MESAJ GÖRÜNÜMÜ ("Bu mesaj silindi") -->
                            <p class="text-xs italic text-slate-300 dark:text-slate-400 flex items-center gap-1.5 pr-2 py-0.5">
                                <span>🚫</span> <span>Bu mesaj silindi</span>
                            </p>
                        `}
                        
                        <div class="flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-slate-300' : 'text-slate-400 dark:text-slate-400'} mt-1">
                            ${m.starred ? `<span title="Yıldızlandı">⭐</span>` : ''}
                            ${m.pinned ? `<span title="Sabitlendi">📌</span>` : ''}
                            <span>${timeStr}</span>
                            ${(isMe && !isDeleted) ? `<span class="text-sky-300 font-bold ml-1 text-[11px]" title="Okundu">✓✓</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    // TOPLU MESAJ SEÇİM BARI
    let multiSelectBarHTML = "";
    if (isSelectModeActive) {
        multiSelectBarHTML = `
            <div id="multi-select-bar" class="sticky bottom-2 z-40 my-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white backdrop-blur-xl border border-slate-700 shadow-2xl flex items-center justify-between gap-3 text-xs">
                <span id="multi-select-count" class="font-bold text-tsMavi">${selectedMsgIds.size} mesaj seçildi</span>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="forwardSelectedMessages()" class="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200">➡️ İlet</button>
                    <button type="button" onclick="deleteSelectedMessages()" class="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white shadow-sm">🗑️ Sil</button>
                    <button type="button" onclick="cancelSelectMode()" class="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300">✕ İptal</button>
                </div>
            </div>
        `;
    }

    c.innerHTML = html + multiSelectBarHTML;
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

// SES KAYDI (VOICE NOTE) MANTIĞI & PLAYBACK ENGINE
let recordedAudioStream = null;
let isVoiceRecordingPaused = false;
let currentActiveAudio = null;
let currentActiveAudioId = null;

function getCurrentUserName() {
    const user = getCurrentUser();
    return user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";
}

function startVoiceRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Tarayıcınız mikrofon kaydını desteklemiyor!");
        return;
    }

    let mimeType = 'audio/webm';
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        recordedAudioStream = stream;
        audioChunks = [];
        try {
            mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
        }

        mediaRecorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        // 100ms aralıklarla veri dilimlerini topla
        mediaRecorder.start(100);
        voiceRecordSeconds = 0;
        isVoiceRecordingPaused = false;

        const chatForm = document.getElementById('chat-form');
        const panel = document.getElementById('voice-recording-panel');
        if (chatForm) chatForm.classList.add('hidden');
        if (panel) panel.classList.remove('hidden');
        
        voiceTimerInterval = setInterval(() => {
            if (!isVoiceRecordingPaused) {
                voiceRecordSeconds++;
                const mins = Math.floor(voiceRecordSeconds / 60);
                const secs = String(voiceRecordSeconds % 60).padStart(2, '0');
                const timerEl = document.getElementById('voice-recording-timer');
                if (timerEl) timerEl.innerText = `${mins}:${secs}`;
            }
        }, 1000);

    }).catch(err => {
        console.error("Mikrofon hatası:", err);
        alert("Mikrofon erişim izni alınamadı!");
    });
}

function togglePauseVoiceRecording() {
    if (!mediaRecorder) return;
    const btn = document.getElementById('voice-pause-btn');

    if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        isVoiceRecordingPaused = true;
        if (btn) btn.innerText = '▶️';
    } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        isVoiceRecordingPaused = false;
        if (btn) btn.innerText = '⏸️';
    }
}

function stopAndSendVoiceNote() {
    if (!mediaRecorder) return;
    
    clearInterval(voiceTimerInterval);
    const chatForm = document.getElementById('chat-form');
    const panel = document.getElementById('voice-recording-panel');
    if (panel) panel.classList.add('hidden');
    if (chatForm) chatForm.classList.remove('hidden');

    const totalDurMins = Math.floor(voiceRecordSeconds / 60);
    const totalDurSecs = String(voiceRecordSeconds % 60).padStart(2, '0');
    const durationStr = `${totalDurMins}:${totalDurSecs}`;

    mediaRecorder.onstop = () => {
        if (recordedAudioStream) {
            recordedAudioStream.getTracks().forEach(track => track.stop());
            recordedAudioStream = null;
        }

        const type = (mediaRecorder && mediaRecorder.mimeType) ? mediaRecorder.mimeType : 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type });
        const fileName = `ses-kaydi-${Date.now()}.webm`;
        
        showUploadProgress(fileName, 30);
        fallbackDataURLWithDuration(audioBlob, 'voice', fileName, getCurrentUserName(), '', durationStr);
    };

    if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    } else {
        const type = (mediaRecorder && mediaRecorder.mimeType) ? mediaRecorder.mimeType : 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type });
        const fileName = `ses-kaydi-${Date.now()}.webm`;
        showUploadProgress(fileName, 30);
        fallbackDataURLWithDuration(audioBlob, 'voice', fileName, getCurrentUserName(), '', durationStr);
    }
}

function fallbackDataURLWithDuration(fileOrBlob, type, fileName, currentName, messageText, durationStr) {
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
            sendChatMessage(currentName, messageText, { type, url, name: fileName, size: formatBytes(fileOrBlob.size || 0), duration: durationStr });
            cancelPendingAttachment();
            const input = document.getElementById('chat-input');
            if (input) input.value = '';
        }, 150);
    };

    reader.readAsDataURL(fileOrBlob);
}

function cancelVoiceRecording() {
    clearInterval(voiceTimerInterval);
    if (mediaRecorder) {
        mediaRecorder.onstop = null;
        if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }
    if (recordedAudioStream) {
        recordedAudioStream.getTracks().forEach(track => track.stop());
        recordedAudioStream = null;
    }
    audioChunks = [];
    const chatForm = document.getElementById('chat-form');
    const panel = document.getElementById('voice-recording-panel');
    if (panel) panel.classList.add('hidden');
    if (chatForm) chatForm.classList.remove('hidden');
}

function toggleVoicePlayback(msgId, encodedUrl) {
    const playBtn = document.getElementById('voice-play-btn-' + msgId);
    const progressEl = document.getElementById('voice-progress-' + msgId);
    const timeEl = document.getElementById('voice-current-time-' + msgId);
    const durEl = document.getElementById('voice-duration-' + msgId);

    if (currentActiveAudio && currentActiveAudioId === msgId) {
        if (currentActiveAudio.paused) {
            currentActiveAudio.play();
            if (playBtn) playBtn.innerText = '⏸️';
        } else {
            currentActiveAudio.pause();
            if (playBtn) playBtn.innerText = '▶️';
        }
        return;
    }

    if (currentActiveAudio) {
        currentActiveAudio.pause();
        const oldBtn = document.getElementById('voice-play-btn-' + currentActiveAudioId);
        if (oldBtn) oldBtn.innerText = '▶️';
    }

    const url = decodeURIComponent(encodedUrl);
    const audio = new Audio(url);
    currentActiveAudio = audio;
    currentActiveAudioId = msgId;

    if (playBtn) playBtn.innerText = '⏸️';

    audio.onloadedmetadata = () => {
        if (durEl && audio.duration && !isNaN(audio.duration)) {
            const mins = Math.floor(audio.duration / 60);
            const secs = String(Math.floor(audio.duration % 60)).padStart(2, '0');
            durEl.innerText = `${mins}:${secs}`;
        }
    };

    audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            if (progressEl) progressEl.style.width = pct + '%';
            if (timeEl) {
                const mins = Math.floor(audio.currentTime / 60);
                const secs = String(Math.floor(audio.currentTime % 60)).padStart(2, '0');
                timeEl.innerText = `${mins}:${secs}`;
            }
        }
    };

    audio.onended = () => {
        if (playBtn) playBtn.innerText = '▶️';
        if (progressEl) progressEl.style.width = '0%';
        if (timeEl) timeEl.innerText = '0:00';
        currentActiveAudio = null;
        currentActiveAudioId = null;
    };

    audio.play().catch(e => console.warn("Ses dosyası oynatılamadı:", e));
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

    cancelReplyMessage();
    if (input) handleChatInputTyping(input);
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

let pendingReplyMsg = null;

function replyToMessage(msgId) {
    const msg = window.currentLoadedMessages ? window.currentLoadedMessages.find((m, idx) => (m.id === msgId || ('m_' + idx) === msgId)) : null;
    if (!msg) return;

    pendingReplyMsg = msg;

    // Vurguları temizle ve seçili mesajı belirginleştir
    document.querySelectorAll('.msg-bubble-card').forEach(el => {
        el.classList.remove('ring-2', 'ring-tsMavi', 'scale-[1.01]', 'bg-tsMavi/10');
    });

    const targetBubble = document.getElementById('msg-bubble-' + msgId);
    if (targetBubble) {
        targetBubble.classList.add('ring-2', 'ring-tsMavi', 'scale-[1.01]');
    }

    const container = document.getElementById('chat-reply-container');
    const senderEl = document.getElementById('chat-reply-sender');
    const textEl = document.getElementById('chat-reply-text');

    if (senderEl) senderEl.innerText = `↩️ Yanıtlanıyor: ${msg.sender}`;
    if (textEl) textEl.innerText = msg.text || (msg.attachment ? msg.attachment.name : (msg.poll ? msg.poll.question : 'Medya/Etkinlik'));
    if (container) container.classList.remove('hidden');

    const input = document.getElementById('chat-input');
    if (input) {
        input.focus();
        handleChatInputTyping(input);
    }
}

function cancelReplyMessage() {
    pendingReplyMsg = null;
    document.querySelectorAll('.msg-bubble-card').forEach(el => {
        el.classList.remove('ring-2', 'ring-tsMavi', 'scale-[1.01]', 'bg-tsMavi/10');
    });
    const container = document.getElementById('chat-reply-container');
    if (container) container.classList.add('hidden');

    const input = document.getElementById('chat-input');
    handleChatInputTyping(input);
}

// MESAJ BALONUNA SOL TIKLANINCA İŞLEM MENÜSÜNÜ OTOMATİK AÇMA
function handleBubbleClick(msgId, e) {
    if (isSelectModeActive || (dragDeltaX && Math.abs(dragDeltaX) > 10)) return;
    if (e && e.target && e.target.closest('button, input, a, select, audio, label')) return;

    toggleMsgActionsMenu(msgId);
}

// ÇİFT TIKLAMA İLE KALP (❤️) TEPKİSİ VERME
function handleMessageDoubleClick(msgId, e) {
    if (e && e.target && e.target.closest('button, input, a, select')) return;

    addReactionToMessage(msgId, '❤️');

    const bubble = document.getElementById('msg-bubble-' + msgId);
    if (bubble) {
        const heartAnim = document.createElement('div');
        heartAnim.className = 'absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-bounce text-3xl drop-shadow-lg';
        heartAnim.innerText = '❤️';
        bubble.appendChild(heartAnim);
        setTimeout(() => {
            if (heartAnim && heartAnim.parentNode) {
                heartAnim.parentNode.removeChild(heartAnim);
            }
        }, 700);
    }
}

// FARE VEYA DOKUNMATİK İLE SOLA KAYDIRARAK YANITLAMA (SWIPE LEFT TO REPLY GESTURE)
let dragStartX = 0;
let dragDeltaX = 0;
let isDraggingBubble = false;
let activeDragMsgId = null;

function handleBubbleTouchStart(e, msgId) {
    if (isSelectModeActive || (e.button && e.button !== 0)) return;

    isDraggingBubble = true;
    activeDragMsgId = msgId;
    dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
    dragDeltaX = 0;
}

function handleBubbleTouchMove(e, msgId) {
    if (!isDraggingBubble || activeDragMsgId !== msgId) return;

    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    dragDeltaX = currentX - dragStartX;

    if (dragDeltaX < 0) {
        const bubble = document.getElementById('msg-bubble-' + msgId);
        if (bubble) {
            const translateVal = Math.max(dragDeltaX, -60);
            bubble.style.transform = `translateX(${translateVal}px)`;
            bubble.style.transition = 'none';
        }
    }
}

function handleBubbleTouchEnd(e, msgId) {
    if (!isDraggingBubble || activeDragMsgId !== msgId) return;

    const bubble = document.getElementById('msg-bubble-' + msgId);
    if (bubble) {
        bubble.style.transition = 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bubble.style.transform = 'translateX(0px)';
    }

    if (dragDeltaX < -40) {
        replyToMessage(msgId);
    }

    isDraggingBubble = false;
    activeDragMsgId = null;
    dragDeltaX = 0;
}

// SESLİ MESAJ (VOICE NOTE) PLAYBACK VE HIZ KONTROL MOTORU (1x -> 1.5x -> 2x)
const voiceSpeeds = [1, 1.5, 2];
const voiceSpeedIndices = {};

function cycleVoiceSpeed(msgId) {
    const audio = document.getElementById('voice-audio-' + msgId);
    const speedBtn = document.getElementById('voice-speed-btn-' + msgId);
    if (!speedBtn) return;

    let idx = voiceSpeedIndices[msgId] || 0;
    idx = (idx + 1) % voiceSpeeds.length;
    voiceSpeedIndices[msgId] = idx;

    const newSpeed = voiceSpeeds[idx];
    speedBtn.innerText = `${newSpeed}x`;
    if (audio) {
        audio.playbackRate = newSpeed;
    }
}

function toggleVoicePlayback(msgId) {
    const audio = document.getElementById('voice-audio-' + msgId);
    const btn = document.getElementById('voice-play-btn-' + msgId);
    if (!audio) return;

    if (currentActiveAudio && currentActiveAudio !== audio) {
        currentActiveAudio.pause();
        if (currentActiveAudioId) {
            const prevBtn = document.getElementById('voice-play-btn-' + currentActiveAudioId);
            if (prevBtn) prevBtn.innerText = '▶';
        }
    }

    if (audio.paused) {
        const speedIdx = voiceSpeedIndices[msgId] || 0;
        audio.playbackRate = voiceSpeeds[speedIdx];
        audio.play().then(() => {
            if (btn) btn.innerText = '⏸';
            currentActiveAudio = audio;
            currentActiveAudioId = msgId;
        }).catch(err => console.error("Oynatma hatası:", err));
    } else {
        audio.pause();
        if (btn) btn.innerText = '▶';
    }
}

function seekVoiceAudio(msgId, value) {
    const audio = document.getElementById('voice-audio-' + msgId);
    if (audio && audio.duration) {
        audio.currentTime = (value / 100) * audio.duration;
    }
}

function onVoiceTimeUpdate(msgId) {
    const audio = document.getElementById('voice-audio-' + msgId);
    const seek = document.getElementById('voice-seek-' + msgId);
    const timeEl = document.getElementById('voice-time-' + msgId);
    if (!audio) return;

    if (audio.duration && seek) {
        seek.value = (audio.currentTime / audio.duration) * 100;
    }
    if (timeEl) {
        const curMins = Math.floor(audio.currentTime / 60);
        const curSecs = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        const durMins = isNaN(audio.duration) ? 0 : Math.floor(audio.duration / 60);
        const durSecs = isNaN(audio.duration) ? '00' : Math.floor(audio.duration % 60).toString().padStart(2, '0');
        timeEl.innerText = `${curMins}:${curSecs} / ${durMins}:${durSecs}`;
    }
}

function onVoiceEnded(msgId) {
    const btn = document.getElementById('voice-play-btn-' + msgId);
    const seek = document.getElementById('voice-seek-' + msgId);
    if (btn) btn.innerText = '▶';
    if (seek) seek.value = 0;
}

function addReactionToMessage(msgId, emoji) {
    const user = getCurrentUser();
    const userName = user ? (user.displayName || user.email.split('@')[0]) : "Ben";

    const picker = document.getElementById('reaction-picker-' + msgId);
    if (picker) picker.classList.add('hidden');

    if (typeof db !== 'undefined' && db && db.collection) {
        const msgRef = db.collection("groups").doc(groupId).collection("messages").doc(msgId);
        msgRef.get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const reactions = data.reactions || {};
            if (!reactions[emoji]) reactions[emoji] = [];
            
            if (reactions[emoji].includes(userName)) {
                reactions[emoji] = reactions[emoji].filter(u => u !== userName);
                if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
                reactions[emoji].push(userName);
            }

            msgRef.update({ reactions: reactions });
        }).catch(err => console.error("Tepki ekleme hatası:", err));
    } else {
        const msg = DEMO_MESSAGES.find(m => m.id === msgId);
        if (msg) {
            msg.reactions = msg.reactions || {};
            if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
            if (msg.reactions[emoji].includes(userName)) {
                msg.reactions[emoji] = msg.reactions[emoji].filter(u => u !== userName);
                if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
            } else {
                msg.reactions[emoji].push(userName);
            }
            renderMessagesFeed(DEMO_MESSAGES);
        }
    }
}

function toggleReactionPicker(msgId) {
    const picker = document.getElementById('reaction-picker-' + msgId);
    if (picker) picker.classList.toggle('hidden');
}

function starMessage(msgId) {
    if (typeof db !== 'undefined' && db && db.collection) {
        const msgRef = db.collection("groups").doc(groupId).collection("messages").doc(msgId);
        msgRef.get().then(doc => {
            if (doc.exists) {
                const starred = doc.data().starred || false;
                msgRef.update({ starred: !starred });
                alert(starred ? "Mesaj yıldızlardan çıkarıldı!" : "Mesaj yıldızlandı (favorilere eklendi)! ⭐");
            }
        });
    } else {
        alert("Mesaj yıldızlandı! ⭐");
    }
}

function pinMessage(msgId) {
    if (typeof db !== 'undefined' && db && db.collection) {
        const msgRef = db.collection("groups").doc(groupId).collection("messages").doc(msgId);
        msgRef.get().then(doc => {
            if (doc.exists) {
                const pinned = doc.data().pinned || false;
                msgRef.update({ pinned: !pinned });
                alert(pinned ? "Mesaj sabitlemesi kaldırıldı!" : "Mesaj sohbetin en üstüne sabitlendi! 📌");
            }
        });
    } else {
        alert("Mesaj sohbetin en üstüne sabitlendi! 📌");
    }
}

function forwardMessage(msgId) {
    const msg = window.currentLoadedMessages ? window.currentLoadedMessages.find((m, idx) => (m.id === msgId || ('m_' + idx) === msgId)) : null;
    const txt = msg ? (msg.text || (msg.attachment ? msg.attachment.name : 'Mesaj')) : '';
    const forwardGroup = prompt(`"${txt}" mesajını iletmek istediğiniz grup adını girin:`, "Mali Academy Yazılım Grubu");
    if (forwardGroup) {
        alert(`Mesaj başarıyla "${forwardGroup}" grubuna iletildi! ➡️`);
    }
}

function copyMessageText(text) {
    if (!text) {
        alert("Kopyalanacak metin bulunamadı!");
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        alert("Mesaj metni panoya kopyalandı! 📋");
    }).catch(() => {
        alert("Metin kopyalandı!");
    });
}

function reportMessage(msgId) {
    const reason = prompt("Lütfen şikayet nedeninizi belirtin (Örn: Uygunsuz içerik, Spam):", "Uygunsuz İletişim");
    if (reason) {
        alert("Mesaj şikayet edildi ve site yöneticilerine bildirildi! ⚠️");
    }
}

// WHATSAPP TOPLU MESAJ SEÇİMİ (ALERT YOK - CANLI CHECKBOX VE ALT BAR)
function toggleSelectMode(initialMsgId = null) {
    isSelectModeActive = !isSelectModeActive;
    if (!isSelectModeActive) {
        selectedMsgIds.clear();
    } else if (initialMsgId) {
        selectedMsgIds.add(initialMsgId);
    }
    renderMessagesFeed(window.currentLoadedMessages || DEMO_MESSAGES);
}

function toggleMsgSelection(msgId, isChecked) {
    if (isChecked) {
        selectedMsgIds.add(msgId);
    } else {
        selectedMsgIds.delete(msgId);
    }
    const countEl = document.getElementById('multi-select-count');
    if (countEl) {
        countEl.innerText = `${selectedMsgIds.size} mesaj seçildi`;
    }
}

function cancelSelectMode() {
    isSelectModeActive = false;
    selectedMsgIds.clear();
    renderMessagesFeed(window.currentLoadedMessages || DEMO_MESSAGES);
}

function forwardSelectedMessages() {
    if (selectedMsgIds.size === 0) {
        alert("Lütfen önce iletmek istediğiniz mesajları seçin!");
        return;
    }
    const forwardGroup = prompt(`${selectedMsgIds.size} mesajı iletmek istediğiniz grup adını girin:`, "Mali Academy Yazılım Grubu");
    if (forwardGroup) {
        alert(`Seçilen ${selectedMsgIds.size} mesaj başarıyla "${forwardGroup}" grubuna iletildi! ➡️`);
        cancelSelectMode();
    }
}

function deleteSelectedMessages() {
    if (selectedMsgIds.size === 0) {
        alert("Lütfen silmek istediğiniz mesajları seçin!");
        return;
    }
    if (!confirm(`Seçilen ${selectedMsgIds.size} mesajı silmek istediğinizden emin misiniz?`)) return;

    selectedMsgIds.forEach(id => {
        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").doc(groupId).collection("messages").doc(id).update({
                isDeleted: true,
                text: "🚫 Bu mesaj silindi"
            }).catch(err => console.error("Silme hatası:", err));
        } else {
            const msg = DEMO_MESSAGES.find(m => m.id === id);
            if (msg) {
                msg.isDeleted = true;
                msg.text = "🚫 Bu mesaj silindi";
            }
        }
    });
    cancelSelectMode();
}

// WHATSAPP MESAJ SİLME MODALI ("Herkes için sil" / "Benden sil")
let pendingDeleteMsgId = null;

function openDeleteMsgModal(msgId) {
    pendingDeleteMsgId = msgId;
    const modal = document.getElementById('delete-msg-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeDeleteMsgModal() {
    pendingDeleteMsgId = null;
    const modal = document.getElementById('delete-msg-modal');
    if (modal) modal.classList.add('hidden');
}

function confirmDeleteMessage(type) {
    if (!pendingDeleteMsgId) return;
    const msgId = pendingDeleteMsgId;
    closeDeleteMsgModal();

    const user = getCurrentUser();
    const userKey = user ? (user.uid || user.email) : "demo_user";

    if (type === 'everyone') {
        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection("groups").doc(groupId).collection("messages").doc(msgId).update({
                isDeleted: true,
                text: "🚫 Bu mesaj silindi"
            }).catch(err => console.error("Silme hatası:", err));
        } else {
            const msg = DEMO_MESSAGES.find(m => m.id === msgId);
            if (msg) {
                msg.isDeleted = true;
                msg.text = "🚫 Bu mesaj silindi";
                renderMessagesFeed(DEMO_MESSAGES);
            }
        }
    } else if (type === 'me') {
        if (typeof db !== 'undefined' && db && db.collection) {
            const msgRef = db.collection("groups").doc(groupId).collection("messages").doc(msgId);
            msgRef.get().then(doc => {
                if (!doc.exists) return;
                const data = doc.data();
                const deletedForArr = data.deletedForArr || [];
                if (!deletedForArr.includes(userKey)) deletedForArr.push(userKey);
                msgRef.update({ deletedForArr: deletedForArr });
            });
        } else {
            const msg = DEMO_MESSAGES.find(m => m.id === msgId);
            if (msg) {
                msg.deletedForArr = msg.deletedForArr || [];
                if (!msg.deletedForArr.includes(userKey)) msg.deletedForArr.push(userKey);
                renderMessagesFeed(DEMO_MESSAGES);
            }
        }
    }
}

function sendChatMessage(sender, text, attachment, poll = null, eventData = null, replyTo = null) {
    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

    const newMsg = {
        sender: sender,
        text: text || '',
        attachment: attachment || null,
        poll: poll || null,
        eventData: eventData || null,
        replyTo: replyTo || (pendingReplyMsg ? { sender: pendingReplyMsg.sender, text: pendingReplyMsg.text || 'Medya' } : null),
        reactions: {},
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
