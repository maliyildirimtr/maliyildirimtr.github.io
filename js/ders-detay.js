const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id') || 'systemverilog-kursu';
let completedTopicIds = new Set();

function getYouTubeId(url) {
    if(!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// --- İLERLEME ÇUBUĞU VE VERİLERİ HESAPLAMA ---
function fetchUserProgressAndRenderBar(totalTopics) {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const progressContainer = document.getElementById('course-progress-container');
    
    if (!user) {
        if(progressContainer) progressContainer.innerHTML = '';
        completedTopicIds.clear();
        return;
    }

    if (typeof db !== 'undefined') {
        db.collection("user_progress")
          .where("userId", "==", user.uid)
          .where("courseId", "==", courseId)
          .where("completed", "==", true)
          .get()
          .then((snapshot) => {
              completedTopicIds = new Set(snapshot.docs.map(doc => doc.data().topicId));
              const completedCount = completedTopicIds.size;
              const percentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

              if (progressContainer) {
                  progressContainer.innerHTML = `
                      <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 shadow-sm mb-6">
                          <div class="flex justify-between items-center text-xs font-bold">
                              <span class="text-slate-600 dark:text-slate-400">📊 Ders İlerlemeniz</span>
                              <span class="text-emerald-500 font-extrabold">%${percentage} Tamamlandı (${completedCount}/${totalTopics})</span>
                          </div>
                          <div class="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full" style="width: ${percentage}%"></div>
                          </div>
                      </div>
                  `;
              }
          });
    }
}

function openTopicModal(editId = null, currentTitle = '', currentVideo = '') {
    if(typeof isAdmin === 'function' && !isAdmin()) return;
    document.getElementById('edit-topic-id').value = editId || '';
    document.getElementById('topic-title').value = currentTitle;
    document.getElementById('topic-video').value = currentVideo;
    document.getElementById('modal-title').innerText = editId ? '✏️ Konuyu Düzenle' : '➕ Yeni Konu Ekle';
    document.getElementById('topic-modal').classList.remove('hidden');
}

function closeTopicModal() { 
    const modal = document.getElementById('topic-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('topic-form');
    if (form) form.reset();
}

function renderCourseUI(course) {
    const container = document.getElementById('course-detail-container');
    if (!container) return;

    const loggedIn = typeof isAdmin === 'function' && isAdmin();
    const iconStr = typeof renderIcon === 'function' ? renderIcon(course.icon) : (course.icon || '⚡');

    container.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-tsMavi/10 text-tsMavi flex items-center justify-center text-3xl font-bold overflow-hidden">
                    ${iconStr}
                </div>
                <div>
                    <h1 class="text-3xl font-extrabold tracking-tight">${course.title}</h1>
                    <p class="text-slate-500 text-xs mt-1 font-mono">${course.code || 'Genel Notlar'}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${loggedIn ? `
                    <button onclick="openTopicModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white text-xs font-semibold shadow-md flex items-center gap-1.5">
                        <span>＋</span> Yeni Konu Ekle
                    </button>
                ` : ''}
                <a href="dersler.html" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700">
                    ← Derslere Dön
                </a>
            </div>
        </div>
        
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <p class="text-sm text-slate-600 dark:text-slate-300">${course.description || ''}</p>
        </div>
        
        <!-- İLERLEME ÇUBUĞU KUTUSU -->
        <div id="course-progress-container"></div>

        <div class="space-y-4">
            <h3 class="text-lg font-bold">Konular & Video Serileri</h3>
            <div id="topics-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="col-span-full text-center py-8 text-slate-500 text-xs">Yükleniyor...</div>
            </div>
        </div>
    `;
    loadTopics();
}

function renderTopicsGrid(topicsList) {
    const topicsGrid = document.getElementById('topics-grid');
    if (!topicsGrid) return;

    if (topicsList.length === 0) {
        topicsGrid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl">Henüz konu eklenmemiş.</div>`;
        fetchUserProgressAndRenderBar(0);
        return;
    }

    const totalTopics = topicsList.length;
    fetchUserProgressAndRenderBar(totalTopics);

    let html = "";
    const loggedIn = typeof isAdmin === 'function' && isAdmin();

    topicsList.forEach((topic, index) => {
        const topicId = topic.id;
        const ytId = getYouTubeId(topic.videoUrl);
        const coverImg = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
        const isCompleted = completedTopicIds.has(topicId);

        html += `
            <a href="konu-detay.html?courseId=${courseId}&topicId=${topicId}" class="group relative rounded-2xl border ${isCompleted ? 'border-emerald-500/50 dark:border-emerald-500/40' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900/60 overflow-hidden hover:border-tsMavi transition-all shadow-sm flex flex-col justify-between cursor-pointer">
                
                ${loggedIn ? `
                    <div class="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onclick="event.preventDefault(); event.stopPropagation();">
                        ${index > 0 ? `<button onclick="moveTopic('${topicId}', ${topic.orderIndex}, ${topicsList[index-1].orderIndex}, '${topicsList[index-1].id}')" title="Yukarı Taşı" class="text-xs text-white hover:text-tsMavi px-1">⬅</button>` : ''}
                        ${index < topicsList.length - 1 ? `<button onclick="moveTopic('${topicId}', ${topic.orderIndex}, ${topicsList[index+1].orderIndex}, '${topicsList[index+1].id}')" title="Aşağı Taşı" class="text-xs text-white hover:text-tsMavi px-1">➡</button>` : ''}
                        <button onclick="openTopicModal('${topicId}', '${(topic.title||'').replace(/'/g, "\\'")}', '${topic.videoUrl || ''}')" title="Düzenle" class="text-xs text-yellow-400 hover:text-yellow-300 px-1">✏️</button>
                        <button onclick="deleteTopic('${topicId}', '${(topic.title||'').replace(/'/g, "\\'")}')" title="Sil" class="text-xs text-red-400 hover:text-red-300 px-1">🗑️</button>
                    </div>
                ` : ''}

                <div>
                    ${coverImg ? `
                        <div class="relative aspect-video w-full overflow-hidden bg-slate-900">
                            <img src="${coverImg}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                            <div class="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                                <div class="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center pl-0.5 shadow-lg">▶</div>
                            </div>
                        </div>
                    ` : `
                        <div class="aspect-video w-full bg-slate-100 dark:bg-slate-800/80 flex flex-col items-center justify-center gap-2 text-slate-400">
                            <span class="text-3xl">📖</span>
                            <span class="text-xs font-semibold">Konu İçeriği</span>
                        </div>
                    `}

                    <div class="p-5">
                        <h4 class="font-bold text-base group-hover:text-tsMavi transition-colors leading-snug">${topic.title}</h4>
                    </div>
                </div>
                
                <div class="px-5 pb-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-auto">
                    <span class="text-xs text-tsMavi font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">İçeriğe Git →</span>
                    ${isCompleted ? `
                        <span class="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Tamamlandı
                        </span>
                    ` : ''}
                </div>
            </a>
        `;
    });
    topicsGrid.innerHTML = html;
}

function loadTopics() {
    if (typeof db !== 'undefined') {
        db.collection("courses").doc(courseId).collection("topics").orderBy("orderIndex", "asc").onSnapshot((snapshot) => {
            let topics = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach((doc) => {
                    topics.push({ id: doc.id, ...doc.data() });
                });
            }

            if (topics.length === 0 && typeof SYSTEMVERILOG_TOPICS !== 'undefined' && courseId === 'systemverilog-kursu') {
                topics = SYSTEMVERILOG_TOPICS;
            }

            renderTopicsGrid(topics);
        }, (err) => {
            if (typeof SYSTEMVERILOG_TOPICS !== 'undefined' && courseId === 'systemverilog-kursu') {
                renderTopicsGrid(SYSTEMVERILOG_TOPICS);
            }
        });
    } else if (typeof SYSTEMVERILOG_TOPICS !== 'undefined' && courseId === 'systemverilog-kursu') {
        renderTopicsGrid(SYSTEMVERILOG_TOPICS);
    }
}

function moveTopic(currentId, currentOrder, targetOrder, targetId) {
    if(typeof isAdmin === 'function' && !isAdmin()) return;
    if (typeof db !== 'undefined') {
        db.collection("courses").doc(courseId).collection("topics").doc(currentId).update({ orderIndex: targetOrder });
        db.collection("courses").doc(courseId).collection("topics").doc(targetId).update({ orderIndex: currentOrder });
    }
}

function deleteTopic(topicId, title) {
    if(typeof isAdmin === 'function' && !isAdmin()) return;
    if (confirm(`"${title}" konusunu silmek istediğinize emin misiniz?`)) {
        if (typeof db !== 'undefined') {
            db.collection("courses").doc(courseId).collection("topics").doc(topicId).delete();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('course-detail-container');
    if (!courseId) {
        if (container) container.innerHTML = `<div class="text-center py-20 text-red-500">Ders bulunamadı!</div>`;
        return;
    }

    if (typeof db !== 'undefined') {
        db.collection("courses").doc(courseId).get().then((doc) => {
            if (doc.exists) {
                renderCourseUI(doc.data());
            } else if (typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined' && courseId === 'systemverilog-kursu') {
                renderCourseUI(SYSTEMVERILOG_COURSE_DATA);
            } else {
                if (container) container.innerHTML = `<div class="text-center py-20 text-red-500">Ders bulunamadı!</div>`;
            }
        }).catch(err => {
            if (typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined' && courseId === 'systemverilog-kursu') {
                renderCourseUI(SYSTEMVERILOG_COURSE_DATA);
            }
        });
    } else if (typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined' && courseId === 'systemverilog-kursu') {
        renderCourseUI(SYSTEMVERILOG_COURSE_DATA);
    }

    const topicForm = document.getElementById('topic-form');
    if (topicForm) {
        topicForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if(typeof isAdmin === 'function' && !isAdmin()) return;

            const editId = document.getElementById('edit-topic-id').value;
            const title = document.getElementById('topic-title').value;
            const videoUrl = document.getElementById('topic-video').value;

            if (editId) {
                db.collection("courses").doc(courseId).collection("topics").doc(editId).update({
                    title: title,
                    videoUrl: videoUrl
                }).then(() => closeTopicModal());
            } else {
                const newTopic = {
                    title: title,
                    videoUrl: videoUrl,
                    orderIndex: Date.now(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                db.collection("courses").doc(courseId).collection("topics").add(newTopic).then(() => closeTopicModal());
            }
        });
    }

    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(() => {
            const topicCards = document.querySelectorAll('#topics-grid a');
            fetchUserProgressAndRenderBar(topicCards.length);
        });
    }
});
