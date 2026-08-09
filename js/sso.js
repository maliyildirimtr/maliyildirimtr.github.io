// ==========================================
// MALI NETWORK - SINGLE SIGN-ON (SSO) ENGINE
// Ortak Oturum ve Cross-Domain Senkronizasyonu
// ==========================================

const SSO_CONFIG = {
    cookieDomain: ".maliyildirimtr.com",
    storageKey: "_mali_sso_user"
};

const SSO = {
    // 1. OTURUM KAYDETME (LOGIN SINC)
    onLogin(user) {
        if (!user) return;
        const payload = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı'),
            photoURL: user.photoURL || '',
            ts: Date.now()
        };

        const jsonStr = JSON.stringify(payload);
        try {
            localStorage.setItem(SSO_CONFIG.storageKey, jsonStr);
            this.setCookie(SSO_CONFIG.storageKey, encodeURIComponent(jsonStr), 7);
            this.postToBridge('SYNC_SSO', payload);
            this.decorateLinks();
        } catch (e) {
            console.warn("SSO kaydetme uyarısı:", e);
        }
    },

    // 2. OTURUM TEMİZLEME (LOGOUT SINC)
    onLogout() {
        try {
            localStorage.removeItem(SSO_CONFIG.storageKey);
            this.deleteCookie(SSO_CONFIG.storageKey);
            this.postToBridge('CLEAR_SSO', null);
        } catch (e) {}
    },

    // 3. MEVCUT OTURUMU GETİR
    getSSOUser() {
        // A. LocalStorage Kontrolü
        try {
            const localData = localStorage.getItem(SSO_CONFIG.storageKey);
            if (localData) {
                return JSON.parse(localData);
            }
        } catch (e) {}

        // B. Cookie Kontrolü
        try {
            const cookieData = this.getCookie(SSO_CONFIG.storageKey);
            if (cookieData) {
                const parsed = JSON.parse(decodeURIComponent(cookieData));
                localStorage.setItem(SSO_CONFIG.storageKey, JSON.stringify(parsed));
                return parsed;
            }
        } catch (e) {}

        return null;
    },

    // 4. CROSS-DOMAIN URL HANDOFF OKUYUCU
    checkSSOHandoff() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const ssoRaw = urlParams.get('_sso');
            if (!ssoRaw) return;

            const decoded = JSON.parse(atob(ssoRaw));
            // 10 dakika içindeyse kabul et
            if (decoded && decoded.ts && (Date.now() - decoded.ts < 10 * 60 * 1000)) {
                localStorage.setItem(SSO_CONFIG.storageKey, JSON.stringify(decoded));
                this.setCookie(SSO_CONFIG.storageKey, encodeURIComponent(JSON.stringify(decoded)), 7);
                
                // URL'den _sso parametresini temizle
                urlParams.delete('_sso');
                const newQuery = urlParams.toString();
                const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '') + window.location.hash;
                window.history.replaceState({}, document.title, newUrl);
            }
        } catch (e) {
            console.warn("SSO Handoff okuma hatası:", e);
        }
    },

    // 5. GEÇİŞ LİNKLERİNİ EMBEDDED TOKEN İLE SÜSLE
    decorateLinks() {
        const user = this.getSSOUser();
        if (!user) return;

        try {
            const tokenStr = btoa(JSON.stringify({ ...user, ts: Date.now() }));
            document.querySelectorAll('a[href]').forEach(a => {
                const href = a.getAttribute('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

                if (href.includes('academy.maliyildirimtr.com') || href.includes('maliyildirimtr.github.io') || href.includes('maliyildirimtr.com')) {
                    try {
                        const targetUrl = new URL(href, window.location.origin);
                        targetUrl.searchParams.set('_sso', tokenStr);
                        a.setAttribute('href', targetUrl.toString());
                    } catch (e) {}
                }
            });
        } catch (e) {}
    },

    // COOKIE YARDIMCILARI
    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        let domain = "";
        if (window.location.hostname.includes("maliyildirimtr.com")) {
            domain = "; domain=" + SSO_CONFIG.cookieDomain;
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/" + domain + "; SameSite=Lax";
    },

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    deleteCookie(name) {
        let domain = "";
        if (window.location.hostname.includes("maliyildirimtr.com")) {
            domain = "; domain=" + SSO_CONFIG.cookieDomain;
        }
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;' + domain;
    },

    // POSTMESSAGE BRIDGE IFRAME
    postToBridge(action, payload) {
        const iframe = document.getElementById('sso-bridge-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: action, data: payload }, '*');
        }
    },

    initBridge() {
        if (document.getElementById('sso-bridge-iframe')) return;
        const iframe = document.createElement('iframe');
        iframe.id = 'sso-bridge-iframe';
        iframe.style.display = 'none';
        
        const currentHost = window.location.hostname;
        let bridgeUrl = 'https://maliyildirimtr.github.io/sso-bridge.html';
        if (currentHost.includes('maliyildirimtr.github.io') || currentHost === 'maliyildirimtr.com') {
            bridgeUrl = 'https://academy.maliyildirimtr.com/sso-bridge.html';
        }
        iframe.src = bridgeUrl;
        document.body.appendChild(iframe);

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SSO_BRIDGE_RESPONSE') {
                if (event.data.data && !localStorage.getItem(SSO_CONFIG.storageKey)) {
                    localStorage.setItem(SSO_CONFIG.storageKey, JSON.stringify(event.data.data));
                }
            }
        });
    }
};

// OTOMATİK BAŞLATMA
SSO.checkSSOHandoff();
document.addEventListener('DOMContentLoaded', () => {
    SSO.decorateLinks();
    SSO.initBridge();
});
