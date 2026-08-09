// ==========================================
// MALI NETWORK - SINGLE SIGN-ON (SSO) ENGINE
// Ortak Oturum ve Cross-Domain Senkronizasyonu
// ==========================================

const SSO_CONFIG = {
    cookieDomain: ".maliyildirimtr.com",
    storageKey: "_mali_sso_user"
};

// UTF-8 UYUMLU GÜVENLİ BASE64 DÖNÜŞTÜRÜCÜLERİ
const safeBtoa = (str) => {
    try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
    } catch (e) {
        return '';
    }
};

const safeAtob = (str) => {
    try {
        return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch (e) {
        return '';
    }
};

const SSO = {
    // 1. OTURUM KAYDETME (LOGIN SYNC)
    onLogin(user) {
        if (!user) return;
        try {
            const payload = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı'),
                photoURL: user.photoURL || '',
                ts: Date.now()
            };

            const jsonStr = JSON.stringify(payload);
            localStorage.setItem(SSO_CONFIG.storageKey, jsonStr);
            this.setCookie(SSO_CONFIG.storageKey, encodeURIComponent(jsonStr), 7);
            this.postToBridge('SYNC_SSO', payload);
            this.decorateLinks();
        } catch (e) {
            console.warn("SSO kaydetme uyarısı:", e);
        }
    },

    // 2. OTURUM TEMİZLEME (LOGOUT SYNC)
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

            const jsonDecoded = safeAtob(ssoRaw);
            if (!jsonDecoded) return;

            const decoded = JSON.parse(jsonDecoded);
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
        try {
            const user = this.getSSOUser();
            if (!user) return;

            const tokenStr = safeBtoa(JSON.stringify({ ...user, ts: Date.now() }));
            if (!tokenStr) return;

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
        try {
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
        } catch (e) {}
    },

    getCookie(name) {
        try {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
        } catch (e) {}
        return null;
    },

    deleteCookie(name) {
        try {
            let domain = "";
            if (window.location.hostname.includes("maliyildirimtr.com")) {
                domain = "; domain=" + SSO_CONFIG.cookieDomain;
            }
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;' + domain;
        } catch (e) {}
    },

    // POSTMESSAGE BRIDGE IFRAME
    postToBridge(action, payload) {
        try {
            const iframe = document.getElementById('sso-bridge-iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: action, data: payload }, '*');
            }
        } catch (e) {}
    },

    initBridge() {
        try {
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
        } catch (e) {}
    }
};

// OTOMATİK BAŞLATMA (HATA KORUMALI)
try {
    SSO.checkSSOHandoff();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            SSO.decorateLinks();
            SSO.initBridge();
        });
    } else {
        SSO.decorateLinks();
        SSO.initBridge();
    }
} catch (e) {
    console.warn("SSO init hatası:", e);
}
