/* =====================================================
   Core/auth.js - Authentication Yönetimi
   HomeOS için JWT token ve kullanıcı oturum yönetimi
   ===================================================== */

// =====================================================
// PATH YÖNETİMİ
// =====================================================

/**
 * Sayfa yolu döndürür
 * @param {string} page - Sayfa adı
 * @returns {string} Tam yol
 */
function getHomeOsPath(page) {
    const inPagesDir = /\/Pages\/[^/]*$/i.test(window.location.pathname);

    if (page === 'index.html') {
        return inPagesDir ? '../index.html' : 'index.html';
    }

    return inPagesDir ? page : `Pages/${page}`;
}

// =====================================================
// JWT TOKEN YÖNETİMİ
// =====================================================

/**
 * JWT token çeker
 * @returns {string|null} Token
 */
function getAuthToken() {
    return (
        localStorage.getItem('accessToken') ||
        localStorage.getItem('homeos_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('homeos_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('jwt') ||
        null
    );
}

/**
 * JWT token kaydeder
 * @param {string} token - Kaydedilecek token
 * @param {boolean} remember - Hatırlansın mı
 * @returns {boolean} Başarılı mı
 */
function saveAuthToken(token, remember = true) {
    if (!token) {
        console.error('[AUTH] JWT token bulunamadı.');
        return false;
    }

    clearAuthToken();

    if (remember) {
        localStorage.setItem('accessToken', token);
    } else {
        sessionStorage.setItem('accessToken', token);
    }

    console.log('[AUTH] JWT token kaydedildi.');
    return true;
}

/**
 * JWT token temizler
 */
function clearAuthToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('homeos_token');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');

    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('homeos_token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('jwt');
}

// =====================================================
// LOGIN STATE YÖNETİMİ
// =====================================================

/**
 * Login state çeker
 * @returns {string|null} Login state
 */
function getLoginState() {
    return (
        localStorage.getItem('homeasistan_login_state') ||
        sessionStorage.getItem('homeasistan_login_state')
    );
}

/**
 * Login kontrolü yapar
 * @returns {boolean} Giriş yapılmış mı
 */
function isLoggedIn() {
    const token = getAuthToken();
    const loginState = getLoginState();

    return Boolean(token && loginState === 'true');
}

/**
 * Login state kaydeder
 * @param {boolean} state - Login durumu
 * @param {boolean} remember - Hatırlansın mı
 */
function setLoginState(state, remember = true) {
    if (remember) {
        localStorage.setItem('homeasistan_login_state', String(state));
    } else {
        sessionStorage.setItem('homeasistan_login_state', String(state));
    }
}

/**
 * Login state temizler
 */
function clearLoginState() {
    localStorage.removeItem('homeasistan_login_state');
    sessionStorage.removeItem('homeasistan_login_state');
}

// =====================================================
// USER ROLE YÖNETİMİ
// =====================================================

/**
 * Kullanıcı rolü çeker
 * @returns {string} Kullanıcı rolü
 */
function getUserRole() {
    return (
        localStorage.getItem('homeasistan_user_role') ||
        sessionStorage.getItem('homeasistan_user_role') ||
        'misafir'
    );
}

/**
 * Kullanıcı rolü kaydeder
 * @param {string} role - Kullanıcı rolü
 * @param {boolean} remember - Hatırlansın mı
 */
function setUserRole(role, remember = true) {
    if (remember) {
        localStorage.setItem('homeasistan_user_role', role);
    } else {
        sessionStorage.setItem('homeasistan_user_role', role);
    }
}

/**
 * Kullanıcı rolü temizler
 */
function clearUserRole() {
    localStorage.removeItem('homeasistan_user_role');
    sessionStorage.removeItem('homeasistan_user_role');
}

/**
 * Rol seviyesini döndürür
 * @param {string} role - Kullanıcı rolü
 * @returns {number} Rol seviyesi
 */
function getRoleLevel(role) {
    const ROLE_LEVELS = {
        admin: 3,
        administrator: 3,
        superadmin: 3,
        uye: 2,
        user: 2,
        member: 2,
        mod: 2,
        moderator: 2,
        misafir: 1,
        guest: 1
    };

    if (!role) return 1;

    const normalized = String(role).toLowerCase().trim();
    return ROLE_LEVELS[normalized] || 1;
}

/**
 * Rol yetkisi kontrolü yapar
 * @param {string} requiredRole - Gereken rol
 * @returns {boolean} Yetkili mi
 */
function hasRole(requiredRole) {
    const userRole = getUserRole();
    const userLevel = getRoleLevel(userRole);
    const requiredLevel = getRoleLevel(requiredRole);

    return userLevel >= requiredLevel;
}

// =====================================================
// AUTH SESSION TEMİZLEME
// =====================================================

/**
 * Tüm auth session verilerini temizler
 */
function clearAuthSession() {
    clearLoginState();
    clearUserRole();
    clearAuthToken();
}

// =====================================================
// LOGOUT
// =====================================================

/**
 * Kullanıcı çıkış yapar
 * @param {boolean} redirect - Yönlendirme yapılsın mı
 */
function logoutHomeOS(redirect = true) {
    console.log('[AUTH] Kullanıcı çıkış yapıyor.');
    clearAuthSession();

    if (redirect) {
        window.location.href = getHomeOsPath('Login.html');
    }
}

// =====================================================
// GLOBAL FETCH AUTH GUARD
// =====================================================

(function installAuthFetchGuard() {
    if (window.__homeosAuthFetchGuardInstalled) {
        return;
    }

    window.__homeosAuthFetchGuardInstalled = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async function (...args) {
        const request = args[0];
        let options = args[1] || {};

        const requestUrl = typeof request === 'string' ? request : request?.url || '';
        const normalizedUrl = requestUrl.toLowerCase();

        // Auth endpointlerinde JWT zorunlu değil
        const isAuthEndpoint =
            normalizedUrl.includes('/api/auth/login') ||
            normalizedUrl.includes('/api/login') ||
            normalizedUrl.includes('/api/signup') ||
            normalizedUrl.includes('/api/auth/register') ||
            normalizedUrl.includes('/api/register');

        const token = getAuthToken();

        // JWT HEADER EKLE
        if (token && !isAuthEndpoint) {
            const headers = new Headers(
                options.headers ||
                (request instanceof Request ? request.headers : {})
            );

            if (!headers.has('Authorization')) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            options.headers = headers;
        }

        // REQUEST İLE GÖNDER
        let finalRequest = request;
        if (request instanceof Request && options.headers) {
            finalRequest = new Request(request, {
                ...request,
                headers: options.headers
            });
            delete options.headers;
        }

        try {
            const response = await nativeFetch(finalRequest, options);

            // 401 durumunda otomatik logout
            if (response.status === 401 && !isAuthEndpoint) {
                console.warn('[AUTH] 401 Unauthorized - Token geçersiz');
                logoutHomeOS(false);
            }

            return response;
        } catch (error) {
            console.error('[AUTH] Fetch hatası:', error);
            throw error;
        }
    };
})();