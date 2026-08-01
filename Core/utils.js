/* =====================================================
   Core/utils.js - Yardımcı Fonksiyonlar
   HomeOS için genel kullanım yardımcıları
   ===================================================== */

/**
 * HTML karakterlerini kaçış karakterlerine dönüştürür
 * @param {string} text - İşlenecek metin
 * @returns {string} Güvenli metin
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Tarihi formatlar
 * @param {Date|string} date - Tarih
 * @param {string} format - Format ('tr-TR', 'en-US', vb.)
 * @returns {string} Formatlanmış tarih
 */
function formatDate(date, format = 'tr-TR') {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '-';
    
    return dateObj.toLocaleDateString(format);
}

/**
 * Saati formatlar
 * @param {Date|string} date - Tarih
 * @param {string} format - Format ('tr-TR', 'en-US', vb.)
 * @returns {string} Formatlanmış saat
 */
function formatTime(date, format = 'tr-TR') {
    if (!date) return '--:--:--';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '--:--:--';
    
    return dateObj.toLocaleTimeString(format);
}

/**
 * Tarih ve saati birlikte formatlar
 * @param {Date|string} date - Tarih
 * @param {string} format - Format ('tr-TR', 'en-US', vb.)
 * @returns {string} Formatlanmış tarih ve saat
 */
function formatDateTime(date, format = 'tr-TR') {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '-';
    
    return dateObj.toLocaleString(format);
}

/**
 * Byte cinsinden boyutu okunabilir formata dönüştürür
 * @param {number} bytes - Byte cinsinden boyut
 * @returns {string} Okunabilir boyut
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sayıyı binlik ayracı ile formatlar
 * @param {number} num - Formatlanacak sayı
 * @returns {string} Formatlanmış sayı
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Rastgele ID oluşturur
 * @param {number} length - ID uzunluğu
 * @returns {string} Rastgele ID
 */
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * Objeyi deep clone eder
 * @param {object} obj - Klonlanacak obje
 * @returns {object} Klonlanmış obje
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return new Date(obj.getTime());
    
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    
    return clonedObj;
}

/**
 * debounce fonksiyonu
 * @param {function} func - Debounce edilecek fonksiyon
 * @param {number} wait - Bekleme süresi (ms)
 * @returns {function} Debounce edilmiş fonksiyon
 */
function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * throttle fonksiyonu
 * @param {function} func - Throttle edilecek fonksiyon
 * @param {number} limit - Zaman sınırı (ms)
 * @returns {function} Throttle edilmiş fonksiyon
 */
function throttle(func, limit = 300) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * LocalStorage'dan veri çeker
 * @param {string} key - Anahtar
 * @param {*} defaultValue - Varsayılan değer
 * @returns {*} Çekilen veri
 */
function getStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`[Utils] Storage okuma hatası (${key}):`, error);
        return defaultValue;
    }
}

/**
 * LocalStorage'a veri yazar
 * @param {string} key - Anahtar
 * @param {*} value - Yazılacak veri
 * @returns {boolean} Başarılı mı
 */
function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`[Utils] Storage yazma hatası (${key}):`, error);
        return false;
    }
}

/**
 * LocalStorage'dan veri siler
 * @param {string} key - Anahtar
 * @returns {boolean} Başarılı mı
 */
function removeStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`[Utils] Storage silme hatası (${key}):`, error);
        return false;
    }
}

/**
 * URL parametresi çeker
 * @param {string} name - Parametre adı
 * @returns {string|null} Parametre değeri
 */
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Query string oluşturur
 * @param {object} params - Parametreler objesi
 * @returns {string} Query string
 */
function buildQueryString(params) {
    return Object.keys(params)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
        .join('&');
}

/**
 * Array'i belirli bir property'e göre gruplar
 * @param {Array} array - Gruplanacak array
 * @param {string} property - Gruplama property'si
 * @returns {object} Gruplanmış obje
 */
function groupBy(array, property) {
    return array.reduce((groups, item) => {
        const key = item[property];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Array'i belirli bir property'e göre sıralar
 * @param {Array} array - Sıralanacak array
 * @param {string} property - Sıralama property'si
 * @param {string} order - Sıralama yönü ('asc' veya 'desc')
 * @returns {Array} Sıralanmış array
 */
function sortBy(array, property, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Cihaz tipine göre ikon döndürür
 * @param {string} type - Cihaz tipi
 * @returns {string} Font Awesome ikon sınıfı
 */
function getDeviceIcon(type) {
    const icons = {
        light: 'fas fa-lightbulb',
        camera: 'fas fa-video',
        plug: 'fas fa-plug',
        sensor: 'fas fa-microchip',
        climate: 'fas fa-snowflake',
        lock: 'fas fa-lock',
        blind: 'fas fa-bars',
        speaker: 'fas fa-volume-up'
    };
    
    return icons[type?.toLowerCase()] || 'fas fa-laptop';
}

/**
 * Log seviyesine göre renk döndürür
 * @param {string} level - Log seviyesi
 * @returns {string} CSS renk değeri
 */
function getLogLevelColor(level) {
    const colors = {
        INFO: 'var(--color-info)',
        WARN: 'var(--color-warn)',
        ERROR: 'var(--color-error)',
        SUCCESS: 'var(--accent-green)',
        DEBUG: 'var(--text-muted)'
    };
    
    return colors[level] || 'var(--text-primary)';
}