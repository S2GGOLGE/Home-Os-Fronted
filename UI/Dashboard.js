/* =====================================================
   Dashboard.js - Dashboard Paneli Ana JavaScript
   HomeOS Dashboard Paneli
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Dashboard] Panel başlatılıyor...');

    // DOM Elementleri
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    const loaderPercentage = document.getElementById('loader-percentage');
    const errorBanner = document.getElementById('error-banner');
    const errorMessage = document.getElementById('error-message');
    const closeError = document.getElementById('closeError');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearLogsBtn = document.getElementById('clearLogs');
    const serverTime = document.getElementById('serverTime');

    // İstatistik Elementleri
    const usersCount = document.getElementById('usersCount');
    const devicesCount = document.getElementById('devicesCount');
    const roomsCount = document.getElementById('roomsCount');
    const automationsCount = document.getElementById('automationsCount');
    const sensorsCount = document.getElementById('sensorsCount');
    const notificationsCount = document.getElementById('notificationsCount');

    // Jarvis Elementleri
    const jarvisStatus = document.getElementById('jarvisStatus');
    const jarvisState = document.getElementById('jarvisState');
    const jarvisWakeWord = document.getElementById('jarvisWakeWord');
    const jarvisMicrophone = document.getElementById('jarvisMicrophone');
    const jarvisResponseTime = document.getElementById('jarvisResponseTime');
    const lastCommand = document.getElementById('lastCommand');

    // Sistem Servis Elementleri
    const backendService = document.getElementById('backendService');
    const watchdogService = document.getElementById('watchdogService');
    const signalrService = document.getElementById('signalrService');
    const databaseService = document.getElementById('databaseService');
    const mqttService = document.getElementById('mqttService');

    // Log Container
    const logsContainer = document.getElementById('logsContainer');

    // ══════════════════════════════
    // LOADER YÖNETİMİ
    // ══════════════════════════════

    function showLoader() {
        if (loaderOverlay) {
            loaderOverlay.classList.remove('hidden');
        }
    }

    function hideLoader() {
        if (loaderOverlay) {
            loaderOverlay.classList.add('hidden');
        }
    }

    function updateLoaderProgress(percentage, text) {
        if (loaderBar) loaderBar.style.width = percentage + '%';
        if (loaderPercentage) loaderPercentage.textContent = percentage + '%';
        if (loaderText) loaderText.textContent = text;
    }

    // ══════════════════════════════
    // HATA YÖNETİMİ
    // ══════════════════════════════

    function showError(message) {
        if (errorBanner && errorMessage) {
            errorMessage.textContent = message;
            errorBanner.classList.remove('hidden');
        }
    }

    function hideError() {
        if (errorBanner) {
            errorBanner.classList.add('hidden');
        }
    }

    if (closeError) {
        closeError.addEventListener('click', hideError);
    }

    // ══════════════════════════════
    // SUNUCU ZAMANI
    // ══════════════════════════════

    function updateServerTime() {
        if (serverTime) {
            const now = new Date();
            const timeSpan = serverTime.querySelector('span');
            if (timeSpan) {
                timeSpan.textContent = now.toLocaleTimeString('tr-TR');
            }
        }
    }

    // Her saniye güncelle
    setInterval(updateServerTime, 1000);
    updateServerTime();

    // ══════════════════════════════
    // İSTATİSTİKLERİ GÜNCELLE
    // ══════════════════════════════

    function updateStats(stats) {
        if (usersCount) usersCount.textContent = stats.users || '-';
        if (devicesCount) devicesCount.textContent = stats.devices || '-';
        if (roomsCount) roomsCount.textContent = stats.rooms || '-';
        if (automationsCount) automationsCount.textContent = stats.automations || '-';
        if (sensorsCount) sensorsCount.textContent = stats.sensors || '-';
        if (notificationsCount) notificationsCount.textContent = stats.notifications || '-';
    }

    // ══════════════════════════════
    // JARVIS DURUMUNU GÜNCELLE
    // ══════════════════════════════

    function updateJarvisStatus(jarvis) {
        if (jarvisStatus) {
            const statusDot = jarvisStatus.querySelector('.status-dot');
            const statusText = jarvisStatus.querySelector('.status-text');

            if (statusDot) {
                statusDot.classList.remove('online', 'offline');
                statusDot.classList.add(jarvis.online ? 'online' : 'offline');
            }

            if (statusText) {
                statusText.textContent = jarvis.online ? 'Çevrimiçi' : 'Çevrimdışı';
            }
        }

        if (jarvisState) jarvisState.textContent = jarvis.state || '-';
        if (jarvisWakeWord) jarvisWakeWord.textContent = jarvis.wakeWord || '-';
        if (jarvisMicrophone) jarvisMicrophone.textContent = jarvis.microphone || '-';
        if (jarvisResponseTime) jarvisResponseTime.textContent = jarvis.responseTime || '-';
        if (lastCommand) lastCommand.textContent = jarvis.lastCommand || '-';
    }

    // ══════════════════════════════
    // SİSTEM SERVİSLERİNİ GÜNCELLE
    // ══════════════════════════════

    function updateServiceBadge(element, status) {
        if (!element) return;

        element.classList.remove('online', 'offline', 'loading');
        element.classList.add(status);

        const statusText = status === 'online' ? 'Çalışıyor' : 
                          status === 'offline' ? 'Çevrimdışı' : 'Yükleniyor';
        element.textContent = statusText;
    }

    function updateSystemServices(services) {
        updateServiceBadge(backendService, services.backend);
        updateServiceBadge(watchdogService, services.watchdog);
        updateServiceBadge(signalrService, services.signalr);
        updateServiceBadge(databaseService, services.database);
        updateServiceBadge(mqttService, services.mqtt);
    }

    // ══════════════════════════════
    // LOGLARI GÜNCELLE
    // ══════════════════════════════

    function updateLogs(logs) {
        if (!logsContainer) return;

        logsContainer.innerHTML = '';

        if (!logs || logs.length === 0) {
            logsContainer.innerHTML = `
                <div class="log-entry">
                    <span class="log-time">--:--:--</span>
                    <span class="log-level INFO">INFO</span>
                    <span class="log-message">Log bulunamadı</span>
                </div>
            `;
            return;
        }

        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <span class="log-time">${log.time}</span>
                <span class="log-level ${log.level}">${log.level}</span>
                <span class="log-message">${log.message}</span>
            `;
            logsContainer.appendChild(logEntry);
        });
    }

    function addLog(level, message) {
        if (!logsContainer) return;

        const now = new Date();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${now.toLocaleTimeString('tr-TR')}</span>
            <span class="log-level ${level}">${level}</span>
            <span class="log-message">${message}</span>
        `;

        logsContainer.insertBefore(logEntry, logsContainer.firstChild);

        // Maksimum 10 log tut
        while (logsContainer.children.length > 10) {
            logsContainer.removeChild(logsContainer.lastChild);
        }
    }

    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            if (logsContainer) {
                logsContainer.innerHTML = `
                    <div class="log-entry">
                        <span class="log-time">--:--:--</span>
                        <span class="log-level INFO">INFO</span>
                        <span class="log-message">Loglar temizlendi</span>
                    </div>
                `;
            }
        });
    }

    // ══════════════════════════════
    // PANELİ YENİLE
    // ══════════════════════════════

    async function refreshDashboard() {
        showLoader();
        hideError();
        updateLoaderProgress(20, 'Veriler çekiliyor...');

        try {
            updateLoaderProgress(40, 'İstatistikler yükleniyor...');
            const data = await fetchAllDashboardData();

            updateLoaderProgress(70, 'Arayüz güncelleniyor...');

            if (data.stats) {
                updateStats(data.stats);
            }

            if (data.jarvis) {
                updateJarvisStatus(data.jarvis);
            }

            if (data.services) {
                updateSystemServices(data.services);
            }

            if (data.logs) {
                updateLogs(data.logs);
            }

            updateLoaderProgress(100, 'Tamamlandı');

            addLog('SUCCESS', 'Dashboard başarıyla güncellendi');

            setTimeout(() => {
                hideLoader();
            }, 500);

        } catch (error) {
            console.error('[Dashboard] Yenileme hatası:', error);
            updateLoaderProgress(100, 'Hata oluştu');
            showError('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.');
            addLog('ERROR', 'Dashboard güncellenemedi: ' + error.message);

            setTimeout(() => {
                hideLoader();
            }, 500);
        }
    }

    // ══════════════════════════════
    // EVENT LISTENERS
    // ══════════════════════════════

    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }

    // ══════════════════════════════
    // AUTH UI UYGULA
    // ══════════════════════════════

    function applyAuthUi() {
        const loggedIn = isLoggedIn();
        const authActionBtn = document.getElementById('authActionBtn');

        if (authActionBtn) {
            const icon = authActionBtn.querySelector('i');
            const text = authActionBtn.querySelector('span');
            if (text) text.textContent = loggedIn ? 'Çıkış Yap' : 'Giriş Yap';
            if (icon) {
                icon.className = loggedIn ? 'fas fa-sign-out-alt' : 'fas fa-sign-in-alt';
            }
            authActionBtn.setAttribute('aria-label', loggedIn ? 'Çıkış Yap' : 'Giriş Yap');
        }
    }

    if (document.getElementById('authActionBtn')) {
        document.getElementById('authActionBtn').addEventListener('click', () => {
            if (isLoggedIn()) {
                logoutHomeOS(true);
            } else {
                window.location.href = 'Login.html';
            }
        });
    }

    applyAuthUi();

    // ══════════════════════════════
    // İLK YÜKLEME
    // ══════════════════════════════

    // İlk yükleme animasyonu
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 30) {
            clearInterval(loadingInterval);
            refreshDashboard();
        } else {
            updateLoaderProgress(Math.floor(progress), 'Sistem başlatılıyor...');
        }
    }, 200);

    // ══════════════════════════════
    // OTOMATİK YENİLEME (5 dakika)
    // ══════════════════════════════

    setInterval(() => {
        console.log('[Dashboard] Otomatik yenileme...');
        refreshDashboard();
    }, 5 * 60 * 1000); // 5 dakika

    console.log('[Dashboard] Panel başlatıldı.');
});