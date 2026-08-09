const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');
const topicId = urlParams.get('topicId');
let isTopicCompleted = false;

function getYouTubeId(url) {
    if(!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function copyCode(button) {
    const codeBlock = button.parentElement.nextElementSibling.querySelector('code');
    navigator.clipboard.writeText(codeBlock.innerText).then(() => {
        const originalText = button.innerText;
        button.innerText = "✓ Kopyalandı!";
        button.classList.add('text-emerald-400');
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.remove('text-emerald-400');
        }, 2000);
    });
}

// --- TAMAMLANDI / İLERLEME SİSTEMİ ---
function checkUserProgress() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user || !topicId || typeof db === 'undefined') return;

    db.collection("user_progress").doc(`${user.uid}_${topicId}`).get().then((doc) => {
        if (doc.exists && doc.data().completed) {
            isTopicCompleted = true;
            updateCompleteButtonUI(true);
        }
    }).catch(e => console.log(e));
}

function toggleTopicComplete() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) {
        alert("İlerlemenizi kaydetmek için lütfen giriş yapın!");
        if(typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    isTopicCompleted = !isTopicCompleted;
    updateCompleteButtonUI(isTopicCompleted);

    if (typeof db !== 'undefined') {
        db.collection("user_progress").doc(`${user.uid}_${topicId}`).set({
            userId: user.uid,
            courseId: courseId,
            topicId: topicId,
            completed: isTopicCompleted,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
}

function updateCompleteButtonUI(completed) {
    const btn = document.getElementById('complete-toggle-btn');
    if (!btn) return;

    if (completed) {
        btn.className = "px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-1.5";
        btn.innerHTML = `✓ Tamamlandı`;
    } else {
        btn.className = "px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700";
        btn.innerHTML = `⭕ Tamamlandı Olarak İşaretle`;
    }
}

// FORM VE MODAL FONKSİYONLARI
function addPdfInput(title = '', url = '') {
    const c = document.getElementById('pdf-inputs-container');
    if (!c) return;
    const div = document.createElement('div');
    div.className = "p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-2 items-center pdf-row";
    div.innerHTML = `
        <input type="text" placeholder="PDF Başlığı" value="${title}" class="pdf-title w-1/3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-tsMavi">
        <input type="text" placeholder="PDF Linki / Yolu" value="${url}" class="pdf-url w-2/3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-tsMavi">
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 text-xs font-bold">✕</button>
    `;
    c.appendChild(div);
}

function addCodeInput(title = '', content = '') {
    const c = document.getElementById('code-inputs-container');
    if (!c) return;
    const div = document.createElement('div');
    div.className = "p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2 code-row relative";
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <input type="text" placeholder="Kod Başlığı" value="${title}" class="code-title w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-tsMavi">
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-500 hover:text-red-700 px-3 text-xs font-bold">Sil ✕</button>
        </div>
        <textarea rows="6" placeholder="// Kodlar..." class="code-content w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:border-tsMavi resize-none">${content}</textarea>
    `;
    c.appendChild(div);
}

function openEditModal(topicData) {
    document.getElementById('input-video-url').value = topicData.videoUrl || '';
    const pdfContainer = document.getElementById('pdf-inputs-container');
    if (pdfContainer) {
        pdfContainer.innerHTML = '';
        (topicData.pdfList || []).forEach(pdf => addPdfInput(pdf.title, pdf.url));
        if (!topicData.pdfList || topicData.pdfList.length === 0) addPdfInput();
    }

    const codeContainer = document.getElementById('code-inputs-container');
    if (codeContainer) {
        codeContainer.innerHTML = '';
        (topicData.codeList || []).forEach(code => addCodeInput(code.title, code.content));
        if (!topicData.codeList || topicData.codeList.length === 0) addCodeInput();
    }

    const modal = document.getElementById('topic-edit-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeEditModal() { 
    const modal = document.getElementById('topic-edit-modal');
    if (modal) modal.classList.add('hidden'); 
}

function updateCommentFormUI() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const form = document.getElementById('add-comment-form');
    const warning = document.getElementById('comment-login-warning');

    if (user) {
        if (form) form.classList.remove('hidden');
        if (warning) warning.classList.add('hidden');
    } else {
        if (form) form.classList.add('hidden');
        if (warning) warning.classList.remove('hidden');
    }
}

function loadComments() {
    if (!topicId || typeof db === 'undefined') return;

    db.collection("comments")
      .where("topicId", "==", topicId)
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
          const list = document.getElementById('comments-list');
          const countBadge = document.getElementById('comments-count');
          
          if (countBadge) countBadge.innerText = snapshot.docs.length;

          if (snapshot.empty) {
              if (list) list.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">Henüz yorum yapılmamış. İlk yorumu sen yap!</div>`;
              return;
          }

          const currentUser = typeof auth !== 'undefined' ? auth.currentUser : null;
          const adminState = typeof isAdmin === 'function' && isAdmin();

          const allComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          const mainComments = allComments.filter(c => !c.parentId);
          const replies = allComments.filter(c => c.parentId);

          let html = "";
          mainComments.forEach((comment) => {
              const isMyComment = currentUser && currentUser.uid === comment.userId;
              const dateStr = comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Az önce';
              const commentReplies = replies.filter(r => r.parentId === comment.id);

              html += `
                  <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm">
                      <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                              <div class="w-8 h-8 rounded-full bg-tsMavi/10 text-tsMavi flex items-center justify-center font-bold text-xs uppercase">
                                  ${(comment.userName || 'K')[0]}
                              </div>
                              <div>
                                  <span class="text-xs font-bold">${comment.userName || 'Kullanıcı'}</span>
                                  <span class="text-[10px] text-slate-400 ml-2">${dateStr}</span>
                              </div>
                          </div>
                          
                          ${(isMyComment || adminState) ? `
                              <button onclick="deleteComment('${comment.id}')" class="text-[10px] text-red-400 hover:text-red-600 font-semibold px-2 py-0.5 rounded bg-red-500/10">
                                  Sil 🗑️
                              </button>
                          ` : ''}
                      </div>

                      <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-10">${comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>

                      <div class="pl-10 flex items-center gap-4">
                          <button onclick="toggleReplyBox('${comment.id}')" class="text-[11px] font-semibold text-tsMavi hover:underline flex items-center gap-1">
                              ↪ Yanıtla
                          </button>
                      </div>

                      <div id="reply-box-${comment.id}" class="hidden pl-10 pt-2">
                          <div class="flex gap-2">
                              <input type="text" id="reply-input-${comment.id}" placeholder="${comment.userName} kişisine yanıt ver..." class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                              <button onclick="submitReply('${comment.id}')" class="px-4 py-2 rounded-xl bg-tsMavi text-white font-semibold text-xs shrink-0 shadow-sm">Gönder</button>
                          </div>
                      </div>

                      ${commentReplies.length > 0 ? `
                          <div class="pl-8 pt-2 space-y-2 border-l-2 border-slate-100 dark:border-slate-800/80 ml-4">
                              ${commentReplies.map(reply => {
                                  const isMyReply = currentUser && currentUser.uid === reply.userId;
                                  const replyDate = reply.createdAt ? new Date(reply.createdAt.toDate()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Az önce';
                                  
                                  return `
                                      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 space-y-1.5">
                                          <div class="flex items-center justify-between">
                                              <div class="flex items-center gap-2">
                                                  <div class="w-6 h-6 rounded-full bg-tsBordo/10 text-tsBordo dark:text-tsMavi flex items-center justify-center font-bold text-[10px] uppercase">
                                                      ${(reply.userName || 'K')[0]}
                                                  </div>
                                                  <span class="text-xs font-bold">${reply.userName || 'Kullanıcı'}</span>
                                                  <span class="text-[9px] text-slate-400">${replyDate}</span>
                                              </div>
                                              ${(isMyReply || adminState) ? `
                                                  <button onclick="deleteComment('${reply.id}')" class="text-[9px] text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded bg-red-500/10">Sil</button>
                                              ` : ''}
                                          </div>
                                          <p class="text-xs text-slate-600 dark:text-slate-300 pl-8 leading-snug">${reply.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                                      </div>
                                  `;
                              }).join('')}
                          </div>
                      ` : ''}
                  </div>
              `;
          });

          if (list) list.innerHTML = html;
      }, (err) => console.log("Yorumlar çekilemedi:", err));
}

function toggleReplyBox(commentId) {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) {
        alert("Yanıt verebilmek için giriş yapmalısınız.");
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    const box = document.getElementById(`reply-box-${commentId}`);
    if (box) box.classList.toggle('hidden');
}

function submitReply(parentId) {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user || typeof db === 'undefined') return;

    const input = document.getElementById(`reply-input-${parentId}`);
    const replyText = input ? input.value.trim() : '';

    if (!replyText) return;

    db.collection("comments").add({
        topicId: topicId,
        courseId: courseId,
        parentId: parentId,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        text: replyText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        if (input) input.value = '';
    }).catch(err => alert("Yanıt gönderilemedi: " + err.message));
}

function handleCommentSubmit(e, parentId = null) {
    if (e && e.preventDefault) e.preventDefault();
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) {
        alert("Yorum yapmak için giriş yapmalısınız.");
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    const input = document.getElementById('comment-input');
    const commentText = input ? input.value.trim() : '';

    if (!commentText) return;

    if (typeof db !== 'undefined') {
        db.collection("comments").add({
            topicId: topicId,
            courseId: courseId,
            parentId: null,
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            text: commentText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            if (input) input.value = '';
        }).catch(err => alert("Yorum gönderilemedi: " + err.message));
    }
}

function deleteComment(commentId) {
    if (confirm("Bu yorumu (varsa alt yanıtlarıyla birlikte) silmek istediğinize emin misiniz?")) {
        if (typeof db !== 'undefined') {
            db.collection("comments").doc(commentId).delete();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('topic-container');
    if (!courseId || !topicId) {
        if (container) container.innerHTML = `<div class="text-center py-20 text-red-500 font-bold">Geçersiz URL! Ders veya Konu ID bulunamadı.</div>`;
        return;
    }

    if (typeof db !== 'undefined') {
        db.collection("courses").doc(courseId).collection("topics").doc(topicId).onSnapshot((doc) => {
            if (!doc.exists) {
                if (container) container.innerHTML = `<div class="text-center py-20 text-red-500 font-bold">Aradığınız konu veritabanında bulunamadı!</div>`;
                return;
            }

            const topic = doc.data();
            const ytId = getYouTubeId(topic.videoUrl);
            const loggedInAdmin = typeof isAdmin === 'function' && isAdmin();

            const pdfList = topic.pdfList || (topic.pdfUrl ? [{ title: 'Ders Notu (PDF)', url: topic.pdfUrl }] : []);
            const codeList = topic.codeList || (topic.codeContent ? [{ title: topic.codeTitle || 'Kaynak Kod', content: topic.codeContent }] : []);

            if (container) {
                container.innerHTML = `
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div>
                            <h1 class="text-3xl font-extrabold tracking-tight">${topic.title}</h1>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <button id="complete-toggle-btn" onclick="toggleTopicComplete()" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                                ⭕ Tamamlandı Olarak İşaretle
                            </button>

                            ${loggedInAdmin ? `
                                <button id="open-edit-btn" class="px-4 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-semibold hover:bg-yellow-500 hover:text-black transition-all">
                                    ⚙️ Düzenle
                                </button>
                            ` : ''}

                            <a href="ders-detay.html?id=${courseId}" class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                ← Konulara Dön
                            </a>
                        </div>
                    </div>

                    ${ytId ? `
                        <div class="relative aspect-video w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-black">
                            <iframe class="w-full h-full" src="https://www.youtube.com/embed/${ytId}" title="${topic.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    ` : ''}

                    ${pdfList.length > 0 ? `
                        <div class="space-y-3">
                            <h3 class="font-bold text-base flex items-center gap-2">📄 Ders Notları & Dokümanlar (${pdfList.length})</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${pdfList.map(pdf => `
                                    <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between shadow-sm">
                                        <div class="flex items-center gap-3 overflow-hidden">
                                            <div class="w-10 h-10 shrink-0 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-lg">📄</div>
                                            <div class="truncate">
                                                <h4 class="font-bold text-xs truncate">${pdf.title || 'Ders Notu (PDF)'}</h4>
                                                <p class="text-[10px] text-slate-500 truncate mt-0.5">${pdf.url}</p>
                                            </div>
                                        </div>
                                        <a href="${pdf.url}" target="_blank" class="shrink-0 ml-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold border border-red-500/20">İncele ↗</a>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${codeList.length > 0 ? `
                        <div class="space-y-6 pt-2">
                            <h3 class="font-bold text-base flex items-center gap-2">💻 Kaynak Kodlar (${codeList.length})</h3>
                            ${codeList.map(code => `
                                <div class="rounded-3xl border border-slate-800 bg-[#0a0c10] overflow-hidden shadow-xl">
                                    <div class="px-5 py-3 bg-[#12151c] border-b border-slate-800 flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                                            <span class="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                                            <span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                                            <span class="ml-2 text-xs font-mono text-slate-400 font-semibold">${code.title || 'Kaynak Kod'}</span>
                                        </div>
                                        <button onclick="copyCode(this)" class="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors border border-slate-700/50">📋 Kopyala</button>
                                    </div>
                                    <div class="p-5 overflow-x-auto">
                                        <pre class="font-mono text-xs text-slate-200 leading-relaxed"><code>${(code.content || '').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <section class="border-t border-slate-200 dark:border-slate-800 pt-8 space-y-6">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold flex items-center gap-2">
                                💬 Yorumlar & Soru-Cevap <span id="comments-count" class="text-xs bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-mono text-slate-500">0</span>
                            </h3>
                        </div>

                        <div id="comment-form-container" class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                            <form id="add-comment-form" onsubmit="handleCommentSubmit(event, null)" class="space-y-3 hidden">
                                <textarea id="comment-input" rows="3" required placeholder="Bu konu veya video hakkında bir şey sorun ya da yorum yapın..." class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi resize-none"></textarea>
                                <div class="flex justify-end">
                                    <button type="submit" class="px-5 py-2 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity">
                                        Yorum Gönder
                                    </button>
                                </div>
                            </form>

                            <div id="comment-login-warning" class="text-center py-4 space-y-2">
                                <p class="text-xs text-slate-500 dark:text-slate-400">🔒 Yorum yapabilmek için üye olmanız veya giriş yapmanız gerekmektedir.</p>
                                <button onclick="openAuthModal()" class="px-4 py-1.5 rounded-full bg-tsMavi/10 text-tsMavi border border-tsMavi/20 text-xs font-semibold hover:bg-tsMavi hover:text-white transition-all">
                                    Giriş Yap / Üye Ol
                                </button>
                            </div>
                        </div>

                        <div id="comments-list" class="space-y-4">
                            <div class="text-center py-6 text-xs text-slate-500">Yorumlar yükleniyor...</div>
                        </div>
                    </section>
                `;
            }

            const editBtn = document.getElementById('open-edit-btn');
            if (editBtn) editBtn.onclick = () => openEditModal({ ...topic, pdfList, codeList });

            checkUserProgress();
            updateCommentFormUI();
            loadComments();
        }, (err) => {
            if (container) container.innerHTML = `<div class="text-center py-20 text-red-500 font-bold">Veri Çekme Hatası: ${err.message}</div>`;
        });
    }

    const editTopicForm = document.getElementById('edit-topic-form');
    if (editTopicForm) {
        editTopicForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if(typeof isAdmin === 'function' && !isAdmin()) return;

            const videoUrl = document.getElementById('input-video-url').value;
            const pdfList = [];
            document.querySelectorAll('.pdf-row').forEach(row => {
                const title = row.querySelector('.pdf-title').value.trim();
                const url = row.querySelector('.pdf-url').value.trim();
                if (url) pdfList.push({ title: title || 'Ders Notu (PDF)', url: url });
            });

            const codeList = [];
            document.querySelectorAll('.code-row').forEach(row => {
                const title = row.querySelector('.code-title').value.trim();
                const content = row.querySelector('.code-content').value;
                if (content.trim()) codeList.push({ title: title || 'Kaynak Kod', content: content });
            });

            if (typeof db !== 'undefined') {
                db.collection("courses").doc(courseId).collection("topics").doc(topicId).update({
                    videoUrl: videoUrl,
                    pdfList: pdfList,
                    codeList: codeList
                }).then(() => closeEditModal()).catch(err => alert("Hata: " + err.message));
            }
        });
    }

    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(() => {
            checkUserProgress();
            updateCommentFormUI();
            loadComments();
        });
    }
});
