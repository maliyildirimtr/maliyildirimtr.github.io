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

// DEMO GEÇİCİ VERİLER
const DEMO_TASKS = [
    { id: "t1", title: "SystemVerilog Top-Level Modülü Mimarisi", status: "completed", priority: "Yüksek", assignee: "Mehmet Ali", description: "Quartus projesi için ana modül pin atamaları ve saat sinyali yapılandırması." },
    { id: "t2", title: "Matris Çarpanı Pipelined ALU Tasarımı", status: "in_progress", priority: "Yüksek", assignee: "Ahmet", description: "32-bit kayan noktalı sayı çarpanı mimarisi ve Quartus sentezi." },
    { id: "t3", title: "Testbench Simülasyonu & ModelSim Verifikasyonu", status: "todo", priority: "Orta", assignee: "Zeynep", description: "Testbench yazımı ve ModelSim üzerinde doğrulama dalga şekillerinin çekilmesi." }
];

const DEMO_EXPENSES = [
    { id: "e1", title: "Intel DE10-Lite FPGA Geliştirme Kartı", amount: 2450.00, payer: "Mehmet Ali", date: "02.08.2026" },
    { id: "e2", title: "USB Blaster Programlama Kablosu & Adaptör", amount: 350.00, payer: "Ahmet", date: "03.08.2026" }
];

const DEMO_MESSAGES = [
    { id: "m1", sender: "Mehmet Ali", role: "Lider", text: "Selamlar takım! SystemVerilog ALU mimarisini tamamladım, ModelSim testbench sonuçlarını inceleyebilirsiniz.", time: "14:20" },
    { id: "m2", sender: "Ahmet Yılmaz", role: "Üye", text: "Eline sağlık Mehmet Ali, ben de Quartus sentez raporundaki saat frekansını (Fmax) test ediyorum.", time: "14:25" }
];

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

function loadGroupWorkspace() {
    if (typeof db !== 'undefined') {
        db.collection("groups").doc(groupId).onSnapshot((doc) => {
            if (doc.exists) {
                currentGroup = { id: doc.id, ...doc.data() };
            } else {
                currentGroup = {
                    id: groupId,
                    name: "FPGA Tabanlı YZ Hızlandırıcı Tasarımı",
                    category: "Donanım / FPGA",
                    inviteCode: "MP-8492",
                    leader: "Mehmet Ali Yıldırım",
                    description: "SystemVerilog ve Intel Quartus Prime kullanarak Evrişimli Sinir Ağları (CNN) matris çarpımlarını dikey boru hattı (pipelined) mimari ile FPGA üzerinde hızlandırma projesi.",
                    targetBudget: 7500,
                    spentBudget: 2800,
                    membersCount: 4
                };
            }
            renderWorkspaceUI();
        }, () => {
            fallbackLoadWorkspace();
        });
    } else {
        fallbackLoadWorkspace();
    }
}

function fallbackLoadWorkspace() {
    currentGroup = {
        id: groupId,
        name: "FPGA Tabanlı YZ Hızlandırıcı Tasarımı",
        category: "Donanım / FPGA",
        inviteCode: "MP-8492",
        leader: "Mehmet Ali Yıldırım",
        description: "SystemVerilog ve Intel Quartus Prime kullanarak Evrişimli Sinir Ağları (CNN) matris çarpımlarını dikey boru hattı (pipelined) mimari ile FPGA üzerinde hızlandırma projesi.",
        targetBudget: 7500,
        spentBudget: 2800,
        membersCount: 4
    };
    renderWorkspaceUI();
}

function renderWorkspaceUI() {
    const container = document.getElementById('group-workspace-content');
    if (!container || !currentGroup) return;

    container.innerHTML = `
        <!-- HEADER BÖLÜMÜ -->
        <div class="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl backdrop-blur-md space-y-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-3 py-1 rounded-full bg-tsMavi/10 text-tsMavi font-bold text-xs border border-tsMavi/20">
                            ${currentGroup.category || 'Genel'}
                        </span>
                        <button onclick="copyInviteCode('${currentGroup.inviteCode || 'MP-8492'}')" title="Kodu Kopyala" class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-400 hover:text-tsMavi border border-slate-200 dark:border-slate-700 transition-colors">
                            🔑 Davet Kodu: <strong class="text-slate-200">${currentGroup.inviteCode || 'MP-8492'}</strong> 📋
                        </button>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">${currentGroup.name}</h1>
                </div>
                <div class="flex items-center gap-2">
                    <a href="gruplar.html" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        ← Gruplara Dön
                    </a>
                </div>
            </div>

            <!-- TAB MENÜSÜ -->
            <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                <button onclick="switchTab('overview')" id="tab-btn-overview" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-tsMavi text-tsMavi transition-all">
                    📌 Genel Bakış & Üyeler
                </button>
                <button onclick="switchTab('kanban')" id="tab-btn-kanban" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-all">
                    📋 Görev Panosu (Kanban)
                </button>
                <button onclick="switchTab('budget')" id="tab-btn-budget" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-all">
                    💳 Ortak Kasa & Bütçe Takibi
                </button>
                <button onclick="switchTab('chat')" id="tab-btn-chat" class="tab-btn px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-all">
                    💬 Grup İçi Sohbet
                </button>
            </div>
        </div>

        <!-- TAB İÇERİK ALANI -->
        <div id="tab-content-area" class="space-y-6"></div>
    `;

    switchTab('overview');
}

// TAB DEĞİŞTİRME MANTIĞI
function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-tsMavi', 'text-tsMavi');
        btn.classList.add('border-transparent', 'text-slate-400');
    });

    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-slate-400');
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
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 class="font-bold text-base flex items-center gap-2">📖 Proje Hakkında</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${currentGroup.description}</p>
                </div>

                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 class="font-bold text-base flex items-center gap-2">🎯 Proje Hedefleri & Dönüm Noktaları</h3>
                    <div class="space-y-3 text-xs">
                        <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                            <span class="text-emerald-500 font-bold">✓</span>
                            <span>SystemVerilog Top-Level Modül Mimarisi ve Pin Atamaları</span>
                        </div>
                        <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                            <span class="text-tsMavi font-bold">⏳</span>
                            <span>Pipelined Matris Çarpanı Sentezi ve ModelSim Doğrulaması</span>
                        </div>
                        <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                            <span class="text-slate-500 font-bold">⭕</span>
                            <span>DE10-Lite FPGA Kartına Yükleme ve Donanım Testi</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SAĞ ÜYE LİSTESİ -->
            <div class="space-y-6">
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 class="font-bold text-base flex items-center justify-between">
                        <span>👥 Takım Üyeleri</span>
                        <span class="text-xs font-mono bg-tsMavi/10 text-tsMavi px-2.5 py-0.5 rounded-full">4 Üye</span>
                    </h3>

                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-tsBordo to-tsMavi text-white font-bold text-xs flex items-center justify-center">MA</div>
                                <div>
                                    <p class="font-bold text-xs">Mehmet Ali Yıldırım</p>
                                    <p class="text-[10px] text-slate-400">maliyildirimtr@gmail.com</p>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-lg bg-tsBordo/10 text-tsBordo text-[10px] font-bold border border-tsBordo/20">Lider</span>
                        </div>

                        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-tsMavi/20 text-tsMavi font-bold text-xs flex items-center justify-center">AY</div>
                                <div>
                                    <p class="font-bold text-xs">Ahmet Yılmaz</p>
                                    <p class="text-[10px] text-slate-400">Donanım Mühendisi</p>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 text-[10px] font-bold">Üye</span>
                        </div>

                        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">ZK</div>
                                <div>
                                    <p class="font-bold text-xs">Zeynep Kaya</p>
                                    <p class="text-[10px] text-slate-400">Yazılım Geliştirici</p>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 text-[10px] font-bold">Üye</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 2. KANBAN GÖREV PANOSU TABI
function renderKanbanTab(container) {
    container.innerHTML = `
        <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg">📋 Takım Görev Panosu (Kanban)</h3>
            <button onclick="openAddTaskModal()" class="px-4 py-2 rounded-xl bg-tsMavi text-white text-xs font-bold shadow-md hover:bg-sky-500 transition-all flex items-center gap-1">
                <span>＋</span> Görev Ekle
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- YAPILACAK (TODO) -->
            <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 class="font-bold text-xs text-slate-400 flex items-center gap-2"><span>🔴</span> Yapılacak</h4>
                    <span id="count-todo" class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold">0</span>
                </div>
                <div id="kanban-todo" class="space-y-3 min-h-[180px]"></div>
            </div>

            <!-- SÜRÜYOR (IN PROGRESS) -->
            <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 class="font-bold text-xs text-tsMavi flex items-center gap-2"><span>🟡</span> Devam Ediyor</h4>
                    <span id="count-in-progress" class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold">0</span>
                </div>
                <div id="kanban-in-progress" class="space-y-3 min-h-[180px]"></div>
            </div>

            <!-- TAMAMLANDI (DONE) -->
            <div class="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 class="font-bold text-xs text-emerald-500 flex items-center gap-2"><span>🟢</span> Tamamlandı</h4>
                    <span id="count-done" class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold">0</span>
                </div>
                <div id="kanban-done" class="space-y-3 min-h-[180px]"></div>
            </div>
        </div>
    `;

    loadTasks();
}

function loadTasks() {
    if (typeof db !== 'undefined') {
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
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${t.priority === 'Yüksek' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}">
                    ${t.priority || 'Orta'}
                </span>
                <span class="text-[10px] text-slate-400">👤 ${t.assignee || 'Atanmadı'}</span>
            </div>
            <h5 class="font-bold text-xs">${t.title}</h5>
            <p class="text-[11px] text-slate-400 line-clamp-2">${t.description || ''}</p>
            <div class="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-1">
                ${t.status !== 'todo' ? `<button onclick="updateTaskStatus('${t.id}', 'todo')" class="text-[10px] text-slate-400 hover:text-white">⬅ Yapılacak</button>` : '<span></span>'}
                ${t.status !== 'in_progress' ? `<button onclick="updateTaskStatus('${t.id}', 'in_progress')" class="text-[10px] text-tsMavi hover:underline">Sürüyor ➡</button>` : ''}
                ${t.status !== 'completed' ? `<button onclick="updateTaskStatus('${t.id}', 'completed')" class="text-[10px] text-emerald-500 font-bold hover:underline">✓ Bitir</button>` : ''}
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

    document.getElementById('count-todo').innerText = todoCount;
    document.getElementById('count-in-progress').innerText = progressCount;
    document.getElementById('count-done').innerText = doneCount;
}

function updateTaskStatus(taskId, newStatus) {
    if (typeof db !== 'undefined') {
        db.collection("groups").doc(groupId).collection("tasks").doc(taskId).update({
            status: newStatus
        }).catch(err => console.log(err));
    }
}

// 3. ORTAK KASA & BÜTÇE TAKİBİ TABI
function renderBudgetTab(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-base flex items-center gap-2">💳 Harcama Kalemleri (Ortak Kasa)</h3>
                        <button onclick="openAddExpenseModal()" class="px-4 py-2 rounded-xl ts-gradient-btn text-white text-xs font-bold shadow-md hover:opacity-90 transition-all">
                            ＋ Harcama Ekle
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th class="p-3 font-semibold">Harcama Kalemi</th>
                                    <th class="p-3 font-semibold">Tutar</th>
                                    <th class="p-3 font-semibold">Harcayan Üye</th>
                                    <th class="p-3 font-semibold">Tarih</th>
                                </tr>
                            </thead>
                            <tbody id="expenses-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr><td colspan="4" class="p-4 text-center text-slate-500">Yükleniyor...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- ÖZET BÜTÇE KARTI -->
            <div class="space-y-6">
                <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 class="font-bold text-base">📊 Kasa Özeti</h3>
                    <div class="space-y-3 text-xs">
                        <div class="flex justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                            <span class="text-slate-400">Hedef Bütçe:</span>
                            <span class="font-bold">₺7,500.00</span>
                        </div>
                        <div class="flex justify-between p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span class="font-bold">Toplam Harcanan:</span>
                            <span class="font-extrabold" id="total-spent-display">₺2,800.00</span>
                        </div>
                        <div class="flex justify-between p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span class="font-bold">Kalan Bütçe:</span>
                            <span class="font-extrabold" id="remaining-budget-display">₺4,700.00</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadExpenses();
}

function loadExpenses() {
    if (typeof db !== 'undefined') {
        db.collection("groups").doc(groupId).collection("expenses").onSnapshot((snapshot) => {
            let expenses = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach(doc => expenses.push({ id: doc.id, ...doc.data() }));
            } else {
                expenses = DEMO_EXPENSES;
            }
            renderExpensesTable(expenses);
        }, () => renderExpensesTable(DEMO_EXPENSES));
    } else {
        renderExpensesTable(DEMO_EXPENSES);
    }
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;

    let html = "";
    let totalSpent = 0;

    expenses.forEach(e => {
        totalSpent += (e.amount || 0);
        html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="p-3 font-semibold">${e.title}</td>
                <td class="p-3 font-bold text-rose-400">₺${(e.amount || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</td>
                <td class="p-3 text-slate-400">👤 ${e.payer || 'Üye'}</td>
                <td class="p-3 text-slate-500 font-mono text-[10px]">${e.date || 'Bugün'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    const spentEl = document.getElementById('total-spent-display');
    const remainEl = document.getElementById('remaining-budget-display');

    if (spentEl) spentEl.innerText = `₺${totalSpent.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
    if (remainEl) remainEl.innerText = `₺${(7500 - totalSpent).toLocaleString('tr-TR', {minimumFractionDigits: 2})}`;
}

// 4. GRUP İÇİ SOHBET (TEAM CHAT) TABI
function renderChatTab(container) {
    container.innerHTML = `
        <div class="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 max-w-3xl mx-auto shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="font-bold text-base flex items-center gap-2">💬 Takım İçi Canlı Sohbet</h3>
                <span class="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">● Canlı Takım Akışı</span>
            </div>

            <div id="chat-messages-container" class="space-y-3 h-[360px] overflow-y-auto p-2 no-scrollbar">
                <div class="text-center py-10 text-slate-500 text-xs">Mesajlar yükleniyor...</div>
            </div>

            <form id="chat-form" onsubmit="handleSendMessage(event)" class="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input type="text" id="chat-input" required placeholder="Takım arkadaşlarınıza bir mesaj yazın..." class="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-tsMavi text-white font-bold text-xs hover:bg-sky-500 transition-all shadow-md">
                    Gönder ➔
                </button>
            </form>
        </div>
    `;

    loadMessages();
}

function loadMessages() {
    if (typeof db !== 'undefined') {
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

    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const currentName = user ? (user.displayName || user.email.split('@')[0]) : "Yönetici Admin";

    let html = "";
    messages.forEach(m => {
        const isMe = m.sender === currentName;
        html += `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <div class="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                    <span class="font-bold text-slate-300">${m.sender}</span>
                    <span>• ${m.time || '12:00'}</span>
                </div>
                <div class="max-w-md px-4 py-2.5 rounded-2xl text-xs ${isMe ? 'bg-tsMavi text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'}">
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

    const user = (typeof window.auth !== 'undefined' && window.auth) ? window.auth.currentUser : null;
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

// YARDIMCI MODAL DÜZENLEYİCİLERİ
function openAddTaskModal() { document.getElementById('add-task-modal').classList.remove('hidden'); }
function closeAddTaskModal() { 
    const modal = document.getElementById('add-task-modal');
    const form = document.getElementById('add-task-form');
    if (modal) modal.classList.add('hidden');
    if (form) form.reset();
}

function openAddExpenseModal() { document.getElementById('add-expense-modal').classList.remove('hidden'); }
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
    const assigneeInput = document.getElementById('task-assignee-input');
    const descInput = document.getElementById('task-desc-input');

    const title = titleInput ? titleInput.value.trim() : '';
    const priority = priorityInput ? priorityInput.value : 'Orta';
    const assignee = assigneeInput ? (assigneeInput.value.trim() || 'Mehmet Ali') : 'Mehmet Ali';
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
            // Gruba özel görev sayılarını güncelle
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

    const titleInput = document.getElementById('expense-title-input');
    const amountInput = document.getElementById('expense-amount-input');
    const payerInput = document.getElementById('expense-payer-input');

    const title = titleInput ? titleInput.value.trim() : '';
    const amount = amountInput ? (parseFloat(amountInput.value) || 0) : 0;
    const payer = payerInput ? (payerInput.value.trim() || 'Mehmet Ali') : 'Mehmet Ali';

    if (!title || amount <= 0) return;

    const timestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
        ? firebase.firestore.FieldValue.serverTimestamp() 
        : new Date().toISOString();

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
            // Gruba özel bütçe harcamasını güncelle
            if (firebase && firebase.firestore && firebase.firestore.FieldValue) {
                db.collection("groups").doc(groupId).update({
                    spentBudget: firebase.firestore.FieldValue.increment(amount)
                }).catch(() => {});
            }
        }).catch(() => {
            DEMO_EXPENSES.push({ id: 'e' + Date.now(), ...newExpense });
            closeAddExpenseModal();
            renderExpensesTable(DEMO_EXPENSES);
        });
    } else {
        DEMO_EXPENSES.push({ id: 'e' + Date.now(), ...newExpense });
        closeAddExpenseModal();
        renderExpensesTable(DEMO_EXPENSES);
    }
}

function copyInviteCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`📋 Davet Kodu (${code}) kopyalandı! Takım arkadaşlarınıza gönderebilirsiniz.`);
    });
}
