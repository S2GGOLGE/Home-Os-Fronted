/* =====================================================
   ayarlar.js - HomeOS Ayarlar Sayfası Modüler Backend Entegrasyonu
   API Endpoints: /api/settings/* ve /api/Settings
   ===================================================== */

const API_BASE = getApiBaseUrl();

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

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. YÜKLEME EKRANI (LOADING SYSTEM) ---
    const loadingScreen = document.getElementById("loading-screen");
    const loaderPercent = document.getElementById("loader-percent");
    const loaderStatus = document.getElementById("loader-status");
    const progressCircle = document.getElementById("loader-progress-circle");

    let currentPercent = 0;
    const circleCircumference = 283;

    const loadingInterval = setInterval(() => {
        currentPercent += 2;
        if (currentPercent > 100) currentPercent = 100;

        if (loaderPercent) loaderPercent.textContent = `${currentPercent}%`;

        if (progressCircle) {
            const offset = circleCircumference - (currentPercent / 100) * circleCircumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        if (loaderStatus) {
            if (currentPercent === 34) {
                loaderStatus.textContent = "SİSTEM BİLEŞENLERİ KONTROL EDİLİYOR...";
            } else if (currentPercent === 70) {
                loaderStatus.textContent = "AYAR MODÜLLERİ YAPILANDIRILIYOR...";
            } else if (currentPercent === 96) {
                loaderStatus.textContent = "SİSTEM HAZIR!";
            }
        }

        if (currentPercent >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                if (loadingScreen) loadingScreen.classList.add("fade-out");
            }, 300);
        }
    }, 15);

    // --- 2. DEĞİŞKENLER VE PANEL KONTROLLERİ ---
    const navItems = document.querySelectorAll(".nav-item:not(.back-button)");
    const sections = document.querySelectorAll(".settings-section");
    const sectionTitle = document.getElementById("section-title");
    const sectionDesc = document.getElementById("section-desc");
    const settingsForm = document.getElementById("settings-form");
    const btnReset = document.getElementById("btn-reset");
    const btnBack = document.getElementById("btn-back");
    const btnBackup = document.getElementById("btn-backup");
    const btnRestore = document.getElementById("btn-restore");
    const btnPing = document.getElementById("btn-ping");
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");

    // Sekme Değiştirme
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            document.querySelector(".nav-item.active")?.classList.remove("active");
            item.classList.add("active");

            const target = item.getAttribute("data-target");
            sections.forEach(section => {
                if (section.id === `section-${target}`) {
                    section.classList.add("active-section");
                } else {
                    section.classList.remove("active-section");
                }
            });

            updateHeader(target, item.innerText.trim());

            if (target === "izleme") {
                fetchMonitoringData();
            } else if (target === "kullanici") {
                fetchAccountSettings();
            } else if (target === "guvenlik") {
                fetchSecuritySettings();
            } else if (target === "bildirimler") {
                fetchNotificationSettings();
            }
        });
    });

    function updateHeader(target, titleText) {
        if (sectionTitle) sectionTitle.textContent = titleText;

        const descriptions = {
            genel: "Sistem temel yapılandırma ayarlarını buradan yönetebilirsiniz.",
            kullanici: "Hesap şifresi, yetkilendirmeler ve oturum zaman aşımı yönetimi.",
            guvenlik: "2FA, API anahtarları ve güvenlik duvarı protokolleri.",
            bildirimler: "Sistem uyarıları, e-posta ve sesli bildirim tercihleri.",
            jarvis: "Yapay zeka modeli, sesli komut hassasiyeti ve uyandırma kelimesi.",
            cihazlar: "Evdeki akıllı cihazların odalara göre dağılımı ve keşif modları.",
            otomasyon: "Senaryolar, hata yönetim politikaları ve çalışma logları.",
            kamera: "Kamera yayın kalitesi, döngüsel kayıt günleri ve depolama hedefi.",
            izleme: "CPU, RAM ve donanım performans modlarının anlık takibi.",
            yedekleme: "Sistem veritabanı yedekleme takvimi ve manuel kurtarma.",
            gelistirici: "WebSocket, SignalR durumu ve geliştirici konsolu araçları."
        };

        if (sectionDesc) sectionDesc.textContent = descriptions[target] || "HomeOS Yapılandırma Paneli.";
    }

    // --- 3. TOAST SİSTEMİ ---
    function showToast(message, isError = false) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        const icon = toast.querySelector("i");

        if (isError) {
            toast.style.borderLeft = "4px solid #ef4444";
            if (icon) {
                icon.style.color = "#ef4444";
                icon.className = "fa-solid fa-circle-exclamation";
            }
        } else {
            toast.style.borderLeft = "4px solid #10b981";
            if (icon) {
                icon.style.color = "#10b981";
                icon.className = "fa-solid fa-circle-check";
            }
        }

        toast.classList.remove("hidden");

        setTimeout(() => {
            toast.classList.add("hidden");
        }, 3500);
    }

    function getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = (typeof getAuthToken === 'function')
            ? getAuthToken()
            : (localStorage.getItem('accessToken') || localStorage.getItem('homeos_token'));
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // --- 4. BACKEND API MODÜLER YÜKLEME ---
    async function loadAllSettings() {
        await Promise.allSettled([
            loadGeneralSettings(),
            fetchAccountSettings(),
            fetchSecuritySettings(),
            fetchNotificationSettings()
        ]);
    }

    async function loadGeneralSettings() {
        try {
            const response = await AyarlarEndpoint.request(`${API_BASE}/Settings`, { headers: getAuthHeaders() });
            if (response.ok) {
                const result = await response.json();
                const data = result.data || result;
                if (data && typeof data === 'object') {
                    populateForm(data);
                }
            }
        } catch (err) {
            console.warn("[SETTINGS] General settings load error:", err.message);
        }
    }

    async function fetchAccountSettings() {
        try {
            const response = await AyarlarEndpoint.request(`${API_BASE}/settings/account`, { headers: getAuthHeaders() });
            if (response.ok) {
                const result = await response.json();
                const data = result.data || result;
                if (data) {
                    const usernameInput = settingsForm?.querySelector("input[name='username']");
                    if (usernameInput && data.username) usernameInput.value = data.username;
                }
            }
        } catch (err) { }
    }

    async function fetchSecuritySettings() {
        try {
            const response = await AyarlarEndpoint.request(`${API_BASE}/settings/security`, { headers: getAuthHeaders() });
            if (response.ok) {
                const result = await response.json();
                const data = result.data || result;
                if (data) {
                    const enable2FaInput = settingsForm?.querySelector("input[name='enable2FA']");
                    if (enable2FaInput) enable2FaInput.checked = Boolean(data.twoFactorEnabled);

                    const policyInput = settingsForm?.querySelector("select[name='passwordPolicy']");
                    if (policyInput && data.passwordPolicy) policyInput.value = data.passwordPolicy;
                }
            }
        } catch (err) { }
    }

    async function fetchNotificationSettings() {
        try {
            const response = await AyarlarEndpoint.request(`${API_BASE}/settings/notifications`, { headers: getAuthHeaders() });
            if (response.ok) {
                const result = await response.json();
                const data = result.data || result;
                if (data) {
                    const emailNotif = settingsForm?.querySelector("input[name='emailNotif']");
                    if (emailNotif) emailNotif.checked = Boolean(data.emailNotifications);

                    const webNotif = settingsForm?.querySelector("input[name='webNotif']");
                    if (webNotif) webNotif.checked = Boolean(data.webNotifications);

                    const criticalNotif = settingsForm?.querySelector("input[name='criticalNotif']");
                    if (criticalNotif) criticalNotif.checked = Boolean(data.criticalNotifications);

                    const notifSound = settingsForm?.querySelector("select[name='notifSound']");
                    if (notifSound && data.notificationSound) notifSound.value = data.notificationSound;
                }
            }
        } catch (err) { }
    }

    function populateForm(data) {
        if (!settingsForm) return;

        Object.keys(data).forEach(key => {
            const field = settingsForm.elements[key];
            if (!field) return;

            const value = data[key];

            if (field instanceof NodeList || field.length > 1) {
                Array.from(field).forEach(f => {
                    if (f.type === "checkbox") {
                        f.checked = (value === true || value === "true" || value === "1");
                    } else if (f.value === String(value)) {
                        f.checked = true;
                    }
                });
            } else if (field.type === "checkbox") {
                field.checked = (value === true || value === "true" || value === "1");
            } else {
                field.value = value;
            }
        });
    }

    // --- 5. FORM KAYDET VE SIFIRLA ---
    if (settingsForm) {
        settingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const settingsData = {};
            const formData = new FormData(settingsForm);

            formData.forEach((value, key) => {
                settingsData[key] = value;
            });

            const checkboxes = settingsForm.querySelectorAll("input[type='checkbox']");
            checkboxes.forEach(cb => {
                settingsData[cb.name] = cb.checked ? "true" : "false";
            });

            try {
                // 1. Genel Ayarları Kaydet
                const generalRes = await AyarlarEndpoint.request(`${API_BASE}/Settings`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(settingsData)
                });

                // 2. Şifre alanı doldurulduysa Şifre Güncelleme Endpoint'ine İlet
                const newPass = settingsData["newPassword"];
                if (newPass && newPass.trim() !== "") {
                    const currentPass = prompt("Şifrenizi değiştirmek için lütfen mevcut şifrenizi girin:");
                    if (currentPass) {
                        const passRes = await AyarlarEndpoint.request(`${API_BASE}/settings/password`, {
                            method: 'PUT',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                                currentPassword: currentPass,
                                newPassword: newPass,
                                newPasswordRepeat: newPass
                            })
                        });
                        const passData = await passRes.json();
                        if (!passRes.ok) {
                            showToast(passData.error || passData.message || "Şifre güncellenemedi.", true);
                            return;
                        }
                    }
                }

                // 3. Bildirim Ayarlarını Güncelle
                await AyarlarEndpoint.request(`${API_BASE}/settings/notifications`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        emailNotifications: settingsData["emailNotif"] === "true",
                        webNotifications: settingsData["webNotif"] === "true",
                        criticalNotifications: settingsData["criticalNotif"] === "true",
                        notificationSound: settingsData["notifSound"] || "classic",
                        securityNotifications: true,
                        systemNotifications: true
                    })
                });

                // 4. Güvenlik Tercihlerini Güncelle
                await AyarlarEndpoint.request(`${API_BASE}/settings/security`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        passwordPolicy: settingsData["passwordPolicy"] || "high",
                        emailVerificationEnabled: true
                    })
                });

                localStorage.setItem("homeos_settings", JSON.stringify(settingsData));
                showToast("Ayarlar modüler servisler üzerinden başarıyla veritabanına kaydedildi!");
            } catch (err) {
                console.error("[SETTINGS SAVE ERROR]", err);
                localStorage.setItem("homeos_settings", JSON.stringify(settingsData));
                showToast("Sunucu hatası: Ayarlar yerel önbelleğe kaydedildi.", true);
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener("click", async () => {
            if (confirm("Tüm ayarları fabrika değerlerine sıfırlamak istediğinize emin misiniz?")) {
                try {
                    const response = await AyarlarEndpoint.request(`${API_BASE}/Settings/reset`, {
                        method: 'POST',
                        headers: getAuthHeaders()
                    });

                    if (response.ok) {
                        const result = await response.json();
                        showToast(result.message || "Ayarlar başarıyla sıfırlandı.");
                        await loadAllSettings();
                    } else {
                        settingsForm.reset();
                        showToast("Form varsayılan değerlere döndürüldü.", true);
                    }
                } catch (err) {
                    settingsForm.reset();
                    showToast("Form sıfırlandı.", true);
                }
            }
        });
    }

    // --- 6. EK AKSİYONLAR (YEDEK, GERİ YÜKLE, PING) ---
    if (btnBackup) {
        btnBackup.addEventListener("click", async () => {
            try {
                btnBackup.disabled = true;
                const res = await AyarlarEndpoint.request(`${API_BASE}/Settings/backup`, { method: 'POST', headers: getAuthHeaders() });
                const data = await res.json();
                showToast(data.message || "Manuel yedek alma başarılı.");
            } catch (ex) {
                showToast("Yedek alma servisine erişilemedi.", true);
            } finally {
                btnBackup.disabled = false;
            }
        });
    }

    if (btnRestore) {
        btnRestore.addEventListener("click", async () => {
            if (confirm("Sistemi son alınan veritabanı yedeğine geri yüklemek istediğinize emin misiniz?")) {
                try {
                    btnRestore.disabled = true;
                    const res = await AyarlarEndpoint.request(`${API_BASE}/Settings/restore`, { method: 'POST', headers: getAuthHeaders() });
                    const data = await res.json();
                    showToast(data.message || "Sistem geri yüklendi.");
                } catch (ex) {
                    showToast("Geri yükleme servisine erişilemedi.", true);
                } finally {
                    btnRestore.disabled = false;
                }
            }
        });
    }

    if (btnPing) {
        btnPing.addEventListener("click", async () => {
            try {
                btnPing.disabled = true;
                const res = await AyarlarEndpoint.request(`${API_BASE}/Settings/ping`, { headers: getAuthHeaders() });
                const data = await res.json();
                showToast(data.message || "Ping başarılı! API aktif.");
            } catch (ex) {
                showToast("Ping testi başarısız! API sunucusuna ulaşılamadı.", true);
            } finally {
                btnPing.disabled = false;
            }
        });
    }

    // --- 7. SİSTEM İZLEME CANLI VERİ ---
    async function fetchMonitoringData() {
        try {
            const res = await AyarlarEndpoint.request(`${API_BASE}/Settings/monitoring`, { headers: getAuthHeaders() });
            if (res.ok) {
                const resData = await res.json();
                const data = resData.data || resData;

                const monitorItems = document.querySelectorAll("#section-izleme .monitor-item");
                if (monitorItems.length >= 3) {
                    monitorItems[0].querySelector(".progress").style.width = `${data.cpu}%`;
                    monitorItems[0].querySelector(".percent").textContent = `${data.cpu}%`;

                    monitorItems[1].querySelector(".progress").style.width = `${data.ram}%`;
                    monitorItems[1].querySelector(".percent").textContent = `${data.ram}%`;

                    monitorItems[2].querySelector(".progress").style.width = `${data.disk}%`;
                    monitorItems[2].querySelector(".percent").textContent = `${data.disk}%`;
                }
            }
        } catch (ex) { }
    }

    if (btnBack) {
        btnBack.addEventListener("click", () => {
            window.history.back();
        });
    }

    // Yükle
    loadAllSettings();
});