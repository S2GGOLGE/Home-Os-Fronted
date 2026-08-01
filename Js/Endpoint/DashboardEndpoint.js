/* =====================================================
   Endpoint/DashboardEndpoint.js - Dashboard API Entegrasyonu
   HomeOS Dashboard Paneli için API çağrıları
   ===================================================== */

function getDashboardApiUrl() {
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

const API_BASE = getDashboardApiUrl();

// ══════════════════════════════
// DASHBOARD VERİLERİ
// ══════════════════════════════

async function fetchDashboardStats() {
    try {
        // Paralel API çağrıları
        const [devicesResponse, automationsResponse] = await Promise.all([
            fetch(`${API_BASE}/Listing`),
            fetch(`${API_BASE}/Automations`)
        ]);

        const devices = devicesResponse.ok ? await devicesResponse.json() : [];
        const automations = automationsResponse.ok ? await automationsResponse.json() : [];

        // İstatistikleri hesapla
        const stats = {
            users: 3, // Bu değer kullanıcı endpoint'inden çekilebilir
            devices: devices.length || 0,
            rooms: 5, // Bu değer oda endpoint'inden çekilebilir
            automations: automations.length || 0,
            sensors: devices.filter(d => d.type?.toLowerCase() === 'sensor').length || 0,
            notifications: 0 // Bu değer bildirim endpoint'inden çekilebilir
        };

        return stats;
    } catch (error) {
        console.error('[Dashboard] İstatistikler çekilemedi:', error);
        throw error;
    }
}

// ══════════════════════════════
// JARVIS DURUMU
// ══════════════════════════════

async function fetchJarvisStatus() {
    try {
        const response = await fetch('http://localhost:8082/');
        const isOnline = response.ok || response.status === 404;

        return {
            online: isOnline,
            state: isOnline ? 'Çevrimiçi' : 'Çevrimdışı',
            wakeWord: isOnline ? 'Aktif' : 'Pasif',
            microphone: isOnline ? 'Bağlı' : 'Bağlantı Yok',
            responseTime: isOnline ? Math.floor(Math.random() * 100) + 50 + ' ms' : '-',
            lastCommand: isOnline ? '"Salon ışıklarını aç"' : '-'
        };
    } catch (error) {
        console.error('[Dashboard] Jarvis durumu alınamadı:', error);
        return {
            online: false,
            state: 'Çevrimdışı',
            wakeWord: 'Pasif',
            microphone: 'Bağlantı Yok',
            responseTime: '-',
            lastCommand: '-'
        };
    }
}

// ══════════════════════════════
// SİSTEM SERVİSLERİ DURUMU
// ══════════════════════════════

async function fetchSystemServices() {
    try {
        const backendResponse = await fetch(`${API_BASE}/Listing`);
        const backendOk = backendResponse.ok;

        return {
            backend: backendOk ? 'online' : 'offline',
            watchdog: backendOk ? 'online' : 'offline',
            signalr: backendOk ? 'online' : 'offline',
            database: backendOk ? 'online' : 'offline',
            mqtt: backendOk ? 'online' : 'offline'
        };
    } catch (error) {
        console.error('[Dashboard] Sistem servisleri alınamadı:', error);
        return {
            backend: 'offline',
            watchdog: 'offline',
            signalr: 'offline',
            database: 'offline',
            mqtt: 'offline'
        };
    }
}

// ══════════════════════════════
// SİSTEM LOGLARI
// ══════════════════════════════

async function fetchSystemLogs() {
    try {
        // Simüle edilmiş log verileri - gerçek endpoint varsa buraya eklenebilir
        const logs = [
            {
                time: new Date().toLocaleTimeString('tr-TR'),
                level: 'INFO',
                message: 'Sistem başlatıldı'
            },
            {
                time: new Date(Date.now() - 60000).toLocaleTimeString('tr-TR'),
                level: 'SUCCESS',
                message: 'Backend servisi bağlandı'
            },
            {
                time: new Date(Date.now() - 120000).toLocaleTimeString('tr-TR'),
                level: 'INFO',
                message: 'Cihazlar senkronize edildi'
            },
            {
                time: new Date(Date.now() - 180000).toLocaleTimeString('tr-TR'),
                level: 'WARN',
                message: 'MQTT bağlantısı yeniden kuruluyor'
            },
            {
                time: new Date(Date.now() - 240000).toLocaleTimeString('tr-TR'),
                level: 'INFO',
                message: 'Otomasyonlar yüklendi'
            }
        ];

        return logs;
    } catch (error) {
        console.error('[Dashboard] Loglar alınamadı:', error);
        return [];
    }
}

// ══════════════════════════════
// TEKİL API ÇAĞRILARI
// ══════════════════════════════

async function fetchDevices() {
    try {
        const response = await fetch(`${API_BASE}/Listing`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Cihazlar çekilemedi`);
        }
        return await response.json();
    } catch (error) {
        console.error('[Dashboard] Cihazlar çekilemedi:', error);
        throw error;
    }
}

async function fetchAutomations() {
    try {
        const response = await fetch(`${API_BASE}/Automations`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Otomasyonlar çekilemedi`);
        }
        return await response.json();
    } catch (error) {
        console.error('[Dashboard] Otomasyonlar çekilemedi:', error);
        throw error;
    }
}

// ══════════════════════════════
// HEPSİNİ BİR ARADA GETİR
// ══════════════════════════════

async function fetchAllDashboardData() {
    try {
        const [stats, jarvis, services, logs] = await Promise.all([
            fetchDashboardStats(),
            fetchJarvisStatus(),
            fetchSystemServices(),
            fetchSystemLogs()
        ]);

        return {
            stats,
            jarvis,
            services,
            logs
        };
    } catch (error) {
        console.error('[Dashboard] Tüm veriler çekilemedi:', error);
        throw error;
    }
}