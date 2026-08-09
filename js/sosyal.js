// GOOGLE APPS SCRIPT FORM GÖNDERİMİ (FETCH)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    const successMsg = document.getElementById('form-status-success');
    const errorMsg = document.getElementById('form-status-error');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = "<span>⏳</span> Gönderiliyor...";
        }

        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            form.reset();
            form.classList.add('hidden');
            if (successMsg) successMsg.classList.remove('hidden');
        })
        .catch(error => {
            console.error('Hata:', error);
            if (errorMsg) errorMsg.classList.remove('hidden');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "<span>🚀</span> Mesajı Gönder";
            }
        });
    });
});
