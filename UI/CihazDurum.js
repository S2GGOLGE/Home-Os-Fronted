// ============================================================
// app.js — Cihaz Yönetim Paneli
// ============================================================
const API_BASE = getApiBaseUrl();
const API_LIST_URL = `${API_BASE}/Listing`;
const API_UPDATE_URL = `${API_BASE}/devicestatusupdate`;

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

// ------------------------------------------------------------
// Yardımcı: hem PascalCase hem camelCase field'ları destekle
// C# System.Text.Json camelCase döner, Newtonsoft PascalCase döner
// ------------------------------------------------------------
function alan(obj, ...keys) {
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return undefined;
}

// Filtre çipleriyle eşleşen kategori (light, camera, sensor, plug, climate)
function cihazTipiniBelirle(name, type) {
    const t = String(type || "").toLowerCase().trim();
    const n = String(name || "").toLowerCase();

    const bilinen = ["light", "camera", "sensor", "plug", "climate"];
    if (bilinen.includes(t)) return t;

    if (/kamera|camera|cctv/.test(n) || /kamera|camera/.test(t)) return "camera";
    if (/lamba|ışık|isik|aydinlatma|aydınlatma|light/.test(n) || /ışık|isik|light|aydınlatma/.test(t)) return "light";
    if (/priz|plug|röle|role|switch/.test(n) || /priz|plug/.test(t)) return "plug";
    if (/klima|climate|termostat|ısıtıcı|isitici/.test(n) || /klima|climate/.test(t)) return "climate";
    if (/sensör|sensor/.test(n) || /sensör|sensor/.test(t)) return "sensor";

    return "other";
}

// ------------------------------------------------------------
// Sayfa yüklenince başlat
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    cihazlariGetir();
});

// ------------------------------------------------------------
// Cihazları API'den çek ve ekrana bas
// ------------------------------------------------------------
async function cihazlariGetir() {
    try {
        const response = await CihazlarEndpoint.request(API_LIST_URL);

        if (!response.ok) {
            throw new Error(`Sunucu hatası: ${response.status}`);
        }

        const devices = await response.json();

        // DEBUG: API'den gelen ilk cihazı logla — alan adlarını görmek için
        if (devices.length > 0) {
            console.log("[API Listing - İlk Cihaz Ham Veri]:", devices[0]);
        }

        kartlariOlustur(devices);
        istatistikleriGuncelle(devices);

    } catch (error) {
        console.error("[Cihaz Yükleme Hatası]", error);
        hataMesajiGoster("Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin.");
    }
}

// ------------------------------------------------------------
// Cihaz kartlarını oluştur
// ------------------------------------------------------------
function kartlariOlustur(devices) {
    const devicesGrid = document.querySelector(".devices-grid");

    if (!devicesGrid) {
        console.warn(".devices-grid elementi bulunamadı.");
        return;
    }

    devicesGrid.innerHTML = "";

    if (devices.length === 0) {
        devicesGrid.innerHTML = `<p class="bos-mesaj">Kayıtlı cihaz bulunamadı.</p>`;
        return;
    }

    devices.forEach(device => {
        // FIX: alan() hem "Status" hem "status" hem "device_Status" dener
        const id = alan(device, "Id", "id");
        const name = alan(device, "Name", "name", "DeviceName", "deviceName") || "İsimsiz Cihaz";
        const type = alan(device, "Type", "type") || "Cihaz";
        const filterType = cihazTipiniBelirle(name, type);
        const status = alan(device, "Status", "status", "Device_Status", "device_Status");
        const isOnline = status === true;

        const durumText = isOnline ? "Online" : "Offline";
        const durumClass = isOnline ? "online" : "offline";
        const checked = isOnline ? "checked" : "";
        const icon = getIcon(filterType);

        devicesGrid.innerHTML += `
            <div class="device-card ${isOnline ? "active" : ""}" data-id="${id}" data-name="${name}" data-type="${filterType}">
                <div class="card-header">
                    <div class="icon-wrap">
                        <i class="${icon}"></i>
                    </div>
                    <span class="badge ${durumClass}">${durumText}</span>
                </div>

                <div class="card-body">
                    <h3>${name}</h3>
                    <p>${type}</p>
                </div>

                <div class="card-footer">
                    <div class="actions">
                        <button class="action-btn btn-yenile" data-id="${id}" data-name="${name}" title="Yenile">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="action-btn btn-ayarlar" data-id="${id}" data-name="${name}" data-type="${filterType}" data-status="${isOnline}" title="Ayarlar">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>

                    <label class="switch">
                        <input type="checkbox" ${checked}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `;
    });

    // Kartlar basıldıktan sonra olay dinleyicilerini bağla
    switchOlaylariniBagla();
    kartButonlariBagla();

    // Aktif filtre/arama varsa uygula
    if (typeof window.HomeOS?.applyDeviceFilters === "function") {
        window.HomeOS.applyDeviceFilters();
    }
}

// ------------------------------------------------------------
// Yenile ve Ayarlar kart butonlarını bağla
// ------------------------------------------------------------
function kartButonlariBagla() {
    // ── YENİLE butonu ──────────────────────────────────────
    document.querySelectorAll(".btn-yenile").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const icon = btn.querySelector("i");
            const card = btn.closest(".device-card");
            const deviceId = btn.dataset.id;
            const deviceName = btn.dataset.name;

            if (icon) { icon.classList.add("fa-spin"); }

            try {
                const res = await CihazlarEndpoint.request(`${API_LIST_URL}`);
                if (res.ok) {
                    const devices = await res.json();
                    const cihaz = devices.find(d => String(alan(d, "Id", "id")) === String(deviceId));
                    if (cihaz && card) {
                        const isOnline = alan(cihaz, "Status", "status", "Device_Status", "device_Status") === true;
                        const badge = card.querySelector(".badge");
                        if (badge) {
                            badge.textContent = isOnline ? "Online" : "Offline";
                            badge.className = "badge " + (isOnline ? "online" : "offline");
                        }
                        const sw = card.querySelector(".switch input");
                        if (sw) sw.checked = isOnline;
                        card.classList.toggle("active", isOnline);
                    }
                    hataMesajiGosterBasari(`"${deviceName}" cihazı başarıyla yenilendi.`);
                } else {
                    hataMesajiGoster("Cihaz durumu alınamadı. Sunucu hatası.");
                }
            } catch (err) {
                hataMesajiGoster("Bağlantı hatası: " + err.message);
            } finally {
                setTimeout(() => { if (icon) icon.classList.remove("fa-spin"); }, 600);
            }
        });
    });

    // ── AYARLAR butonu ─────────────────────────────────────
    document.querySelectorAll(".btn-ayarlar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id      = btn.dataset.id;
            const name    = btn.dataset.name;
            const type    = btn.dataset.type;
            const isOn    = btn.dataset.status === "true";

            // Modal alanlarını doldur
            const setEl = (sel, val) => { const el = document.getElementById(sel); if (el) el.value = val; };
            const setTxt = (sel, val) => { const el = document.getElementById(sel); if (el) el.textContent = val; };
            const setInner = (sel, val) => { const el = document.getElementById(sel); if (el) el.innerHTML = val; };

            setEl("settings-device-id", id);
            setEl("settings-name-input", name);
            setEl("settings-type-input", type);
            setTxt("settings-device-name", name);
            setTxt("settings-device-type", type);
            setTxt("settings-info-id", "#" + id);

            const badge = document.getElementById("settings-device-badge");
            if (badge) {
                badge.textContent = isOn ? "Online" : "Offline";
                badge.className   = "badge " + (isOn ? "online" : "offline");
            }

            const statusInfo = document.getElementById("settings-info-status");
            if (statusInfo) {
                statusInfo.textContent = isOn ? "Çevrimiçi" : "Çevrimdışı";
                statusInfo.style.color = isOn ? "var(--accent-green)" : "#ff4444";
            }

            // İkon güncelle
            const iconMap = { light:"fa-lightbulb", camera:"fa-video", plug:"fa-plug", sensor:"fa-microchip", climate:"fa-snowflake" };
            setInner("settings-device-icon", `<i class="fas ${iconMap[type] || "fa-laptop"}"></i>`);

            // Modalı aç
            if (window.HomeOSModal) window.HomeOSModal.open("device-settings-modal");
        });
    });

    // ── AYARLAR FORM KAYDET ────────────────────────────────
    const settingsForm = document.getElementById("device-settings-form");
    if (settingsForm && !settingsForm.dataset.bound) {
        settingsForm.dataset.bound = "1";
        settingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id      = document.getElementById("settings-device-id")?.value;
            const name    = document.getElementById("settings-name-input")?.value.trim();
            const type    = document.getElementById("settings-type-input")?.value;

            if (!id || !name) return;

            try {
                const res = await CihazlarEndpoint.request(`${API_BASE}/DeviceRegistration/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ Id: parseInt(id), DeviceName: name, DeviceVersion: type })
                });

                if (res.ok) {
                    if (window.HomeOSModal) window.HomeOSModal.close("device-settings-modal");
                    hataMesajiGosterBasari(`"${name}" cihazı güncellendi.`);
                    await cihazlariGetir();
                } else {
                    const err = await res.text();
                    hataMesajiGoster("Güncelleme başarısız: " + err);
                }
            } catch (err) {
                hataMesajiGoster("Bağlantı hatası: " + err.message);
            }
        });
    }
}

// ------------------------------------------------------------
// Switch Değişimlerini Yakala ve Backend'e Bağla (Model Uyumlu)
// ------------------------------------------------------------
function switchOlaylariniBagla() {
    const switches = document.querySelectorAll(".device-card .switch input[type='checkbox']");

    switches.forEach(checkbox => {
        checkbox.addEventListener("change", async (event) => {
            const input = event.target;
            const card = input.closest(".device-card");

            // FIX: Id ve Name'i DOM attribute'undan okuyoruz — DOM text'e güvenmiyoruz
            const deviceId = parseInt(card.getAttribute("data-id"), 10);
            const deviceName = card.getAttribute("data-name");
            const targetStatus = input.checked;

            // Erken kontrol: NaN veya boş isim varsa fetch'e girme
            if (isNaN(deviceId) || !deviceName) {
                console.error("[Payload Hatası] Id veya Name geçersiz:", { deviceId, deviceName });
                hataMesajiGoster("Cihaz bilgisi okunamadı. Sayfayı yenileyip tekrar deneyin.");
                input.checked = !input.checked; // rollback
                return;
            }

            try {
                const payload = {
                    Id: deviceId,
                    DeviceName: deviceName,
                    DeviceVersion: "",
                    Device_Status: targetStatus
                };
                console.log("[Gönderilen Payload]:", payload);

                const response = await CihazlarEndpoint.request(API_UPDATE_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    let errorMsg = "Güncelleme başarısız.";
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    } catch (_) { /* response body JSON değilse sessizce geç */ }
                    console.error("[Backend Hata Detayı] Status:", response.status, "| Mesaj:", errorMsg);
                    throw new Error(`${response.status} — ${errorMsg}`);
                }

                const result = await response.json();
                console.log("[Backend Başarılı]:", result.message);

                // Arayüzü (DOM) anlık görsel olarak güncelle
                const badge = card.querySelector(".badge");
                if (targetStatus === true) {
                    card.classList.add("active");
                    badge.textContent = "Online";
                    badge.className = "badge online";
                } else {
                    card.classList.remove("active");
                    badge.textContent = "Offline";
                    badge.className = "badge offline";
                }

                // Üst sayaçları yenile
                cihazlariYenidenHesapla();

            } catch (error) {
                console.error("[Durum Güncelleme Hatası]", error);
                hataMesajiGoster(`Cihaz durumu değiştirilemedi: ${error.message}`);

                // Rollback: Hata olursa switch'i eski konumuna çek
                input.checked = !input.checked;
            }
        });
    });
}

// ------------------------------------------------------------
// İstatistikleri Yeniden Hesapla
// ------------------------------------------------------------
function cihazlariYenidenHesapla() {
    const cards = document.querySelectorAll(".device-card");
    const mockDevices = Array.from(cards).map(card => ({
        Status: card.querySelector(".switch input").checked
    }));
    istatistikleriGuncelle(mockDevices);
}

// ------------------------------------------------------------
// Cihaz tipine göre ikon döndür
// ------------------------------------------------------------
function getIcon(type) {
    const ikonlar = {
        light: "fas fa-lightbulb",
        camera: "fas fa-video",
        plug: "fas fa-plug",
        sensor: "fas fa-microchip",
        climate: "fas fa-snowflake",
    };

    return ikonlar[type?.toLowerCase()] ?? "fas fa-laptop";
}

// ------------------------------------------------------------
// Üst istatistik kartlarını güncelle
// ------------------------------------------------------------
function istatistikleriGuncelle(devices) {
    const toplam = devices.length;
    const online = devices.filter(d => alan(d, "Status", "status") === true).length;
    const offline = toplam - online;

    const statCards = document.querySelectorAll(".stat-card .num");

    if (statCards.length < 3) {
        console.warn("Yeterli .stat-card elementi bulunamadı.");
        return;
    }

    statCards[0].textContent = toplam;
    statCards[1].textContent = online;
    statCards[2].textContent = offline;
}

// ------------------------------------------------------------
// Hata toast bildirimi göster
// ------------------------------------------------------------
function hataMesajiGoster(mesaj) {
    if (document.getElementById("hata-banner")) return;

    if (!document.getElementById("hata-style")) {
        const style = document.createElement("style");
        style.id = "hata-style";
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(40px); }
                to   { opacity: 1; transform: translateX(0);    }
            }
            #hata-banner {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 10px;
                background: #ff4d4f;
                color: #fff;
                padding: 14px 18px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                font-size: 14px;
                max-width: 380px;
                animation: slideIn 0.3s ease;
            }
            #hata-banner button {
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                margin-left: auto;
                font-size: 16px;
                opacity: 0.8;
                padding: 0 2px;
                line-height: 1;
            }
            #hata-banner button:hover { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    const banner = document.createElement("div");
    banner.id = "hata-banner";
    banner.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${mesaj}</span>
        <button onclick="this.parentElement.remove()" title="Kapat">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(banner);
    setTimeout(() => banner?.remove(), 5000);
}

// ------------------------------------------------------------
// Başarı (yeşil) toast bildirimi göster
// ------------------------------------------------------------
function hataMesajiGosterBasari(mesaj) {
    const prev = document.getElementById("basari-banner");
    if (prev) prev.remove();

    const banner = document.createElement("div");
    banner.id = "basari-banner";
    banner.style.cssText = `
        position:fixed; top:20px; right:20px; z-index:9999;
        display:flex; align-items:center; gap:10px;
        background:#1a6e3a; border:1px solid #00ff88;
        color:#fff; padding:14px 18px; border-radius:10px;
        box-shadow:0 4px 20px rgba(0,255,136,0.25); font-size:14px;
        max-width:380px; animation: slideIn 0.3s ease;
    `;
    banner.innerHTML = `
        <i class="fas fa-check-circle" style="color:#00ff88;"></i>
        <span>${mesaj}</span>
        <button onclick="this.parentElement.remove()" title="Kapat"
                style="background:none;border:none;color:#fff;cursor:pointer;margin-left:auto;font-size:16px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner?.remove(), 4000);
}

// ------------------------------------------------------------
// Uyarılar Modalını Doldur ve Aç
// ------------------------------------------------------------
function uyarilariGoster() {
    const cards = document.querySelectorAll(".device-card");
    let offlineList = [];
    let onlineCount = 0;

    cards.forEach(card => {
        const badge = card.querySelector(".badge");
        const isOffline = badge && badge.classList.contains("offline");
        const name = card.querySelector("h3")?.textContent || "Cihaz";
        const type = card.dataset.type || "cihaz";
        const id   = card.dataset.id || "";

        if (isOffline) {
            offlineList.push({ name, type, id });
        } else {
            onlineCount++;
        }
    });

    // Sayıları doldur
    const offlineCountEl = document.getElementById("alert-offline-count");
    const onlineCountEl  = document.getElementById("alert-online-count");
    const warningCountEl = document.getElementById("alert-warning-count");
    if (offlineCountEl) offlineCountEl.textContent = offlineList.length;
    if (onlineCountEl)  onlineCountEl.textContent  = onlineCount;
    if (warningCountEl) warningCountEl.textContent  = offlineList.length > 0 ? offlineList.length : 0;

    // Liste alanını doldur
    const alertsList = document.getElementById("alerts-list");
    if (!alertsList) return;

    if (offlineList.length === 0) {
        alertsList.innerHTML = `
            <div style="text-align:center; padding:30px;">
                <i class="fas fa-check-circle" style="font-size:40px; color:#00ff88; margin-bottom:12px;"></i>
                <p style="color:#00ff88; font-weight:700; margin:0;">Tüm cihazlar çevrimiçi!</p>
                <p style="color:var(--text-secondary); font-size:13px; margin-top:6px;">Hiçbir uyarı bulunmamaktadır.</p>
            </div>
        `;
    } else {
        const iconMap = { light:"fa-lightbulb", camera:"fa-video", plug:"fa-plug", sensor:"fa-microchip", climate:"fa-snowflake" };
        alertsList.innerHTML = offlineList.map(d => `
            <div style="display:flex; align-items:center; gap:12px; background:rgba(255,68,68,0.07);
                        border:1px solid rgba(255,68,68,0.25); border-radius:10px; padding:12px 14px;">
                <div style="width:36px; height:36px; border-radius:9px; background:rgba(255,68,68,0.15);
                            display:flex; align-items:center; justify-content:center; color:#ff6666; font-size:16px; flex-shrink:0;">
                    <i class="fas ${iconMap[d.type] || 'fa-laptop'}"></i>
                </div>
                <div>
                    <div style="font-weight:700; font-size:14px;">${d.name}</div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">ID: #${d.id} &bull; Tür: ${d.type}</div>
                </div>
                <span class="badge offline" style="margin-left:auto;">Çevrimdışı</span>
            </div>
        `).join("");
    }

    // Modalı aç
    if (window.HomeOSModal) window.HomeOSModal.open("alerts-modal");
}

// Global erişim için dışa aktar
window.uyarilariGoster = uyarilariGoster;
