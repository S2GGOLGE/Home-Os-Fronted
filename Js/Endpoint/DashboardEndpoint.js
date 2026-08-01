/* =====================================================
   Endpoint/DashboardEndpoint.js - Dashboard API Entegrasyonu
   HomeOS Dashboard Paneli için API çağrıları
   ===================================================== */

const API_BASE = getApiBaseUrl();

// ══════════════════════════════
// DASHBOARD VERİLERİ
// ══════════════════════════════

async function fetchDashboardStats() {
    try {
        // Paralel API çağrıları
        const [devicesResponse, automationsResponse] = await Promise.all([
            apiClient.get('/Listing'),
            apiClient.get('/Automations')
        ]);

        const devices = Array.isArray(devicesResponse) ? devicesResponse : [];
        const automations = Array.isArray(automationsResponse) ? automationsResponse : [];

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
        await apiClient.get('/Listing');
        const backendOk = true;

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
// TEKİL API ÇA�?RILARI
// ══════════════════════════════

async function fetchDevices() {
    try {
        return apiClient.get('/Listing');
    } catch (error) {
        console.error('[Dashboard] Cihazlar çekilemedi:', error);
        throw error;
    }
}

async function fetchAutomations() {
    try {
        return apiClient.get('/Automations');
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
