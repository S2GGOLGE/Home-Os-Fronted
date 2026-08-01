/* =====================================================
   Core/api-config.js - API Konfigürasyon Yönetimi
   HomeOS için API URL yönetimi
   ===================================================== */

/**
 * API Base URL konfigürasyonu
 * Android interface veya localStorage üzerinden yönetilir
 */
if (window.AndroidInterface && typeof window.AndroidInterface.getApiUrl === 'function') {
    window.HOMEOS_API_BASE_URL = window.AndroidInterface.getApiUrl();
} else {
    window.HOMEOS_API_BASE_URL = window.HOMEOS_API_BASE_URL || "https://localhost:7201/api";
}

/**
 * API Base URL'ini döndürür
 * @returns {string} API Base URL
 */
function getApiBaseUrl() {
    const queryApiBase = new URLSearchParams(window.location.search).get('apiBase');
    
    if (queryApiBase) {
        localStorage.setItem('homeos_api_base_url', queryApiBase);
        return queryApiBase.replace(/\/$/, '');
    }

    const configuredApiBase = window.HOMEOS_API_BASE_URL || localStorage.getItem('homeos_api_base_url');
    
    if (configuredApiBase) {
        return configuredApiBase.replace(/\/$/, '');
    }

    const liveServerPorts = ['5500', '5501', '5502'];
    const isLiveServer = ['localhost', '127.0.0.1'].includes(window.location.hostname)
        && liveServerPorts.includes(window.location.port);

    if (window.location.protocol === 'file:' || isLiveServer) {
        return 'https://localhost:7201/api';
    }

    return `${window.location.origin}/api`;
}

/**
 * API Base URL'ini günceller
 * @param {string} url - Yeni API Base URL
 */
function setApiBaseUrl(url) {
    if (url) {
        localStorage.setItem('homeos_api_base_url', url.replace(/\/$/, ''));
        window.HOMEOS_API_BASE_URL = url.replace(/\/$/, '');
    }
}