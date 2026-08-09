// Akademi Panelini Sağ Taraf için Çiz
function renderAcademyUserPanel() {
    const panel = document.getElementById('academy-user-panel');
    if (!panel) return;

    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const adminState = typeof isAdmin === 'function' && isAdmin();

    if (user || adminState) {
        const displayName = adminState ? '👑 Admin' : ('👤 ' + (user.displayName || user.email.split('@')[0]));

        panel.innerHTML = `
            <div class="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                ${adminState ? `
                    <button onclick="openAddCourseModal()" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-1">
                        <span>＋</span> Ders Ekle
                    </button>
                ` : ''}

                <!-- KULLANICI ADI BUTONU -->
                <button type="button" onclick="${adminState ? '' : 'openProfileModal()'}" title="${adminState ? '' : 'Kullanıcı Adını Değiştir'}" class="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${adminState ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-default' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-tsMavi hover:text-tsMavi cursor-pointer'}">
                    ${displayName}
                </button>

                <button type="button" onclick="logoutUser()" title="Çıkış Yap" class="text-xs px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-semibold transition-colors">
                    🚪 Çıkış
                </button>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <button type="button" onclick="openAuthModal()" class="px-4 py-2 rounded-2xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2">
                🔑 Öğrenci Girişi / Kayıt
            </button>
        `;
    }
}

// Dersleri Yükleme Fonksiyonu
function loadCourses() {
    const grid = document.getElementById('courses-grid');
    if (!grid) return;

    const renderCourseList = (coursesList) => {
        const adminState = typeof isAdmin === 'function' && isAdmin();
        let html = "";

        coursesList.forEach((course) => {
            const courseId = course.id;
            const iconContent = typeof renderIcon === 'function' ? renderIcon(course.icon) : (course.icon || '⚡');

            html += `
                <div onclick="window.location.href='ders-detay.html?id=${courseId}'" class="group relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 hover:border-tsMavi transition-all shadow-sm flex flex-col justify-between cursor-pointer overflow-hidden backdrop-blur-md">
                    
                    <!-- Sol Kenar Bordo-Mavi Geçiş Çizgisi -->
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsBordo to-tsMavi opacity-80 group-hover:opacity-100 transition-opacity"></div>

                    ${adminState ? `
                        <div class="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                            <button onclick="openEditCourseModal('${courseId}', '${(course.title||'').replace(/'/g, "\\'")}', '${course.code||''}', '${course.icon||''}', '${(course.description||'').replace(/'/g, "\\'")}')" class="text-xs text-yellow-400 hover:text-yellow-300 px-1">✏️</button>
                            <button onclick="deleteCourse('${courseId}', '${(course.title||'').replace(/'/g, "\\'")}')" class="text-xs text-red-400 hover:text-red-300 px-1">🗑️</button>
                        </div>
                    ` : ''}

                    <div>
                        <div class="w-12 h-12 rounded-2xl bg-tsMavi/10 text-tsMavi flex items-center justify-center text-2xl font-bold mb-4 overflow-hidden">
                            ${iconContent}
                        </div>
                        <h3 class="font-bold text-lg group-hover:text-tsMavi transition-colors">${course.title}</h3>
                        <p class="text-xs font-mono text-slate-400 mt-1">${course.code || 'Genel Notlar'}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">${course.description || ''}</p>
                    </div>

                    <div class="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <span class="text-xs text-tsMavi font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            İçeriği İncele (<span id="topic-count-${courseId}">...</span>) →
                        </span>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

        // Her ders için konu ve video sayısını Firestore'dan canlı takip et
        coursesList.forEach((course) => {
            const courseId = course.id;
            const countEl = document.getElementById(`topic-count-${courseId}`);

            if (typeof db !== 'undefined') {
                db.collection("courses").doc(courseId).collection("topics").onSnapshot((topicsSnap) => {
                    let count = topicsSnap.size;
                    if (count === 0 && courseId === 'systemverilog-kursu' && typeof SYSTEMVERILOG_TOPICS !== 'undefined') {
                        count = SYSTEMVERILOG_TOPICS.length;
                    }
                    if (countEl) {
                        countEl.innerText = `${count} Konu & Video`;
                    }
                }, (err) => {
                    let fallbackCount = (courseId === 'systemverilog-kursu' && typeof SYSTEMVERILOG_TOPICS !== 'undefined') ? SYSTEMVERILOG_TOPICS.length : 0;
                    if (countEl) {
                        countEl.innerText = `${fallbackCount} Konu & Video`;
                    }
                });
            } else {
                let fallbackCount = (courseId === 'systemverilog-kursu' && typeof SYSTEMVERILOG_TOPICS !== 'undefined') ? SYSTEMVERILOG_TOPICS.length : 0;
                if (countEl) {
                    countEl.innerText = `${fallbackCount} Konu & Video`;
                }
            }
        });
    };

    if (typeof db !== 'undefined') {
        db.collection("courses").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            let courses = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach((doc) => {
                    courses.push({ id: doc.id, ...doc.data() });
                });
            }
            
            if (courses.length === 0 && typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined') {
                courses = [SYSTEMVERILOG_COURSE_DATA];
            }

            renderCourseList(courses);
        }, (err) => {
            console.warn("Firestore çekme hatası, varsayılan dersler yükleniyor:", err);
            if (typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined') {
                renderCourseList([SYSTEMVERILOG_COURSE_DATA]);
            } else {
                grid.innerHTML = `<div class="col-span-full py-12 text-center text-red-500 text-xs">Veri yükleme hatası: ${err.message}</div>`;
            }
        });
    } else if (typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined') {
        renderCourseList([SYSTEMVERILOG_COURSE_DATA]);
    }
}

// Modal Yönetimi
function openAddCourseModal() {
    document.getElementById('edit-course-id').value = '';
    const form = document.getElementById('add-course-form');
    if (form) form.reset();
    const modalTitle = document.getElementById('course-modal-title');
    if (modalTitle) modalTitle.innerText = "➕ Yeni Ders Ekle";
    const modal = document.getElementById('add-course-modal');
    if (modal) modal.classList.remove('hidden');
}

function openEditCourseModal(id, title, code, icon, description) {
    document.getElementById('edit-course-id').value = id;
    document.getElementById('course-title').value = title;
    document.getElementById('course-code').value = code;
    document.getElementById('course-icon').value = icon;
    document.getElementById('course-description').value = description;
    document.getElementById('course-modal-title').innerText = "✏️ Dersi Düzenle";
    document.getElementById('add-course-modal').classList.remove('hidden');
}

function closeCourseModal() {
    const modal = document.getElementById('add-course-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('add-course-form');
    if (form) form.reset();
    document.getElementById('edit-course-id').value = '';
}

function deleteCourse(id, title) {
    if (typeof isAdmin === 'function' && !isAdmin()) return;
    if (confirm(`"${title}" dersini ve tüm alt konularını silmek istediğinize emin misiniz?`)) {
        if (typeof db !== 'undefined') {
            db.collection("courses").doc(id).delete();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderAcademyUserPanel();
    loadCourses();

    const courseForm = document.getElementById('add-course-form');
    if (courseForm) {
        courseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof isAdmin === 'function' && !isAdmin()) return;

            const editId = document.getElementById('edit-course-id').value;
            const title = document.getElementById('course-title').value.trim();
            const code = document.getElementById('course-code').value.trim();
            const icon = document.getElementById('course-icon').value.trim();
            const description = document.getElementById('course-description').value.trim();

            if (editId) {
                db.collection("courses").doc(editId).update({
                    title, code, icon, description
                }).then(() => closeCourseModal());
            } else {
                db.collection("courses").add({
                    title, code, icon, description,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => closeCourseModal());
            }
        });
    }

    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(() => {
            renderAcademyUserPanel();
        });
    }
});
