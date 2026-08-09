document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('add-course-form');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = "<span>⏳</span> Veritabanına Yazılıyor...";
        }

        const newCourse = {
            title: document.getElementById('course-title').value,
            code: document.getElementById('course-code').value,
            icon: document.getElementById('course-icon').value,
            description: document.getElementById('course-desc').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (typeof db !== 'undefined') {
            db.collection("courses").add(newCourse)
            .then(() => {
                window.location.assign('dersler.html');
            })
            .catch((error) => {
                alert('Hata oluştu: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = "<span>➕</span> Veritabanına Kaydet";
                }
            });
        }
    });
});
