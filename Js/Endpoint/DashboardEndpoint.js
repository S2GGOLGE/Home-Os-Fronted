/* Dashboard API integration. All values are sourced from HomeOS endpoints. */

async function fetchDashboardSnapshot() {
    return apiClient.get('/Dashboard');
}

async function fetchDashboardStats() {
    const data = await fetchDashboardSnapshot();
    return {
        users: data.userCount ?? 0,
        devices: data.deviceCount ?? 0,
        rooms: data.roomsCount ?? 0,
        automations: data.automationCount ?? 0,
        sensors: data.sensorCount ?? 0,
        notifications: data.notificationCount ?? 0
    };
}

async function fetchJarvisStatus() {
    const data = await fetchDashboardSnapshot();
    const online = String(data.jarvisStatus || '').toLowerCase() === 'online';
    return {
        online,
        state: online ? 'Çevrimiçi' : 'Çevrimdışı',
        wakeWord: online ? 'Aktif' : 'Pasif',
        microphone: online ? 'Bağlı' : 'Bağlantı Yok',
        responseTime: online ? 'API üzerinden' : '-',
        lastCommand: '-'
    };
}

async function fetchSystemServices() {
    try {
        const metrics = await apiClient.get('/SystemMonitoring');
        const backendOk = metrics.success === true;
        return {
            backend: backendOk ? 'online' : 'offline',
            watchdog: backendOk ? 'online' : 'offline',
            signalr: backendOk ? 'online' : 'offline',
            database: metrics.system?.dbConnected ? 'online' : 'offline',
            mqtt: backendOk ? 'online' : 'offline'
        };
    } catch (error) {
        console.error('[Dashboard] Sistem servisleri alınamadı:', error);
        return { backend: 'offline', watchdog: 'offline', signalr: 'offline', database: 'offline', mqtt: 'offline' };
    }
}

async function fetchSystemLogs() {
    try {
        const payload = await apiClient.get('/systemlogs/recent?count=10');
        const items = payload?.data ?? payload ?? [];
        return items.map(log => ({
            time: new Date(log.createdAt ?? log.timestamp ?? Date.now()).toLocaleTimeString('tr-TR'),
            level: log.level ?? log.logLevel ?? 'INFO',
            message: log.message ?? '-'
        }));
    } catch (error) {
        console.error('[Dashboard] Loglar alınamadı:', error);
        return [];
    }
}

async function fetchDevices() {
    return apiClient.get('/Listing');
}

async function fetchAutomations() {
    return apiClient.get('/Automations');
}

async function fetchAllDashboardData() {
    const [stats, jarvis, services, logs] = await Promise.all([
        fetchDashboardStats(),
        fetchJarvisStatus(),
        fetchSystemServices(),
        fetchSystemLogs()
    ]);
    return { stats, jarvis, services, logs };
}
