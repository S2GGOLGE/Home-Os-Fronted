let allAutomations = [];

const API_BASE = getApiBaseUrl();


// =====================================================
// API BASE URL
// =====================================================

function getApiBaseUrl() {

    const queryApiBase =
        new URLSearchParams(window.location.search).get("apiBase");

    if (queryApiBase) {
        const cleanUrl = queryApiBase.replace(/\/$/, "");

        localStorage.setItem(
            "homeos_api_base_url",
            cleanUrl
        );

        return cleanUrl;
    }

    const configuredApiBase =
        window.HOMEOS_API_BASE_URL ||
        localStorage.getItem("homeos_api_base_url");

    if (configuredApiBase) {
        return configuredApiBase.replace(/\/$/, "");
    }

    const liveServerPorts = [
        "5500",
        "5501",
        "5502"
    ];

    const isLiveServer =
        (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
        ) &&
        liveServerPorts.includes(window.location.port);

    if (
        window.location.protocol === "file:" ||
        isLiveServer
    ) {
        return "https://localhost:7201/api";
    }

    return `${window.location.origin}/api`;
}


// =====================================================
// JWT TOKEN
// =====================================================

function getAuthToken() {

    const tokenKeys = [
        "accessToken",
        "token",
        "jwt",
        "access_token"
    ];

    for (const key of tokenKeys) {

        const localToken =
            localStorage.getItem(key);

        if (localToken) {
            return localToken;
        }

        const sessionToken =
            sessionStorage.getItem(key);

        if (sessionToken) {
            return sessionToken;
        }
    }

    return null;
}


// =====================================================
// CENTRAL API REQUEST
// =====================================================

async function apiFetch(
    url,
    options = {}
) {

    const token = getAuthToken();

    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    if (
        options.body &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] =
            "application/json";
    }

    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    } else {

        console.warn(
            "[HomeOS] JWT token bulunamadı."
        );
    }

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );

    if (response.status === 401) {

        console.error(
            "[HomeOS] 401 Unauthorized:",
            url
        );

        throw new Error(
            "UNAUTHORIZED"
        );
    }

    if (response.status === 403) {

        console.error(
            "[HomeOS] 403 Forbidden:",
            url
        );

        throw new Error(
            "FORBIDDEN"
        );
    }

    return response;
}


// =====================================================
// AUTH ERROR
// =====================================================

function handleAuthError(error) {

    if (
        error.message === "UNAUTHORIZED"
    ) {

        alert(
            "Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın."
        );

        return true;
    }

    if (
        error.message === "FORBIDDEN"
    ) {

        alert(
            "Bu işlem için yetkiniz bulunmuyor."
        );

        return true;
    }

    return false;
}


// =====================================================
// INIT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startLoader();

        bindEvents();

        fetchAutomations();

    }
);


// =====================================================
// FETCH AUTOMATIONS
// =====================================================

async function fetchAutomations() {

    const container =
        document.getElementById(
            "automationList"
        ) ||
        document.querySelector(
            ".automation-grid"
        ) ||
        document.querySelector(
            "[data-automation-list]"
        );

    try {

        const response =
            await apiFetch(
                `${API_BASE}/Automations`
            );

        if (!response.ok) {

            let message =
                `HTTP ${response.status}`;

            try {

                const errorData =
                    await response.json();

                message =
                    errorData.message ||
                    message;

            } catch {
                // JSON olmayan cevap
            }

            throw new Error(
                message
            );
        }

        const data =
            await response.json();

        allAutomations =
            Array.isArray(data)
                ? data
                : [];

        renderAutomations(
            allAutomations,
            container
        );

        updateStats(
            allAutomations
        );

    }
    catch (error) {

        if (
            handleAuthError(error)
        ) {
            return;
        }

        console.error(
            "[Automations] Fetch hatası:",
            error
        );

        if (container) {

            container.innerHTML = `
                <div style="
                    text-align:center;
                    padding:60px;
                    color:var(--text-secondary);
                ">
                    <i
                        class="fas fa-exclamation-triangle"
                        style="
                            font-size:48px;
                            opacity:0.2;
                            display:block;
                            margin-bottom:16px;
                        "
                    ></i>

                    <p>
                        Otomasyon verileri yüklenemedi.
                    </p>

                    <small>
                        ${escHtml(error.message)}
                    </small>
                </div>
            `;
        }
    }
}


// =====================================================
// CREATE AUTOMATION
// =====================================================

async function createAutomation(dto) {

    try {

        const response =
            await apiFetch(
                `${API_BASE}/Automations`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(dto)
                }
            );

        let data = {};

        try {

            data =
                await response.json();

        } catch {
            data = {};
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                `HTTP ${response.status}`
            );
        }

        alert(
            data.message ||
            "Otomasyon başarıyla oluşturuldu."
        );

        await fetchAutomations();

        return true;

    }
    catch (error) {

        if (
            handleAuthError(error)
        ) {
            return false;
        }

        console.error(
            "[Automations] Create hatası:",
            error
        );

        alert(
            "Otomasyon oluşturulamadı: " +
            error.message
        );

        return false;
    }
}


// =====================================================
// TOGGLE AUTOMATION
// =====================================================

async function toggleAutomation(id) {

    try {

        const response =
            await apiFetch(
                `${API_BASE}/Automations/${id}/toggle`,
                {
                    method: "PUT"
                }
            );

        let data = {};

        try {

            data =
                await response.json();

        } catch {
            data = {};
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                `HTTP ${response.status}`
            );
        }

        await fetchAutomations();

    }
    catch (error) {

        if (
            handleAuthError(error)
        ) {
            return;
        }

        console.error(
            "[Automations] Toggle hatası:",
            error
        );

        alert(
            "Otomasyon durumu değiştirilemedi."
        );
    }
}


// =====================================================
// RUN AUTOMATION
// =====================================================

async function runAutomation(id) {

    try {

        const response =
            await apiFetch(
                `${API_BASE}/Automations/${id}/run`,
                {
                    method: "PUT"
                }
            );

        let data = {};

        try {

            data =
                await response.json();

        } catch {
            data = {};
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                `HTTP ${response.status}`
            );
        }

        alert(
            data.message ||
            "Otomasyon çalıştırıldı."
        );

        await fetchAutomations();

    }
    catch (error) {

        if (
            handleAuthError(error)
        ) {
            return;
        }

        console.error(
            "[Automations] Run hatası:",
            error
        );

        alert(
            "Otomasyon çalıştırılamadı."
        );
    }
}


// =====================================================
// DELETE AUTOMATION
// =====================================================

async function deleteAutomation(id) {

    try {

        const response =
            await apiFetch(
                `${API_BASE}/Automations/${id}`,
                {
                    method: "DELETE"
                }
            );

        let data = {};

        try {

            data =
                await response.json();

        } catch {
            data = {};
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                `HTTP ${response.status}`
            );
        }

        alert(
            data.message ||
            "Otomasyon silindi."
        );

        await fetchAutomations();

    }
    catch (error) {

        if (
            handleAuthError(error)
        ) {
            return;
        }

        console.error(
            "[Automations] Delete hatası:",
            error
        );

        alert(
            "Otomasyon silinemedi."
        );
    }
}


// =====================================================
// EVENTS
// =====================================================

function bindEvents() {

    const backButton =
        document.getElementById(
            "backButton"
        );

    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../index.html";

            }
        );
    }

    const automationForm =
        document.getElementById(
            "automationForm"
        );

    const autoNameInput =
        document.getElementById(
            "autoName"
        );

    if (
        automationForm &&
        autoNameInput
    ) {

        automationForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const name =
                    autoNameInput.value.trim();

                if (!name) {

                    alert(
                        "Otomasyon adı zorunludur."
                    );

                    return;
                }

                const trigger =
                    document.getElementById(
                        "autoTrigger"
                    )?.value ||
                    "";

                const action =
                    document.getElementById(
                        "autoAction"
                    )?.value ||
                    "";

                const description =
                    document.getElementById(
                        "autoDesc"
                    )?.value ||
                    "";

                const success =
                    await createAutomation(
                        {
                            name:
                                name,

                            description:
                                description,

                            triggerCondition:
                                trigger,

                            actionDescription:
                                action,

                            isActive:
                                true
                        }
                    );

                if (
                    success
                ) {

                    if (
                        window.HomeOSModal
                    ) {

                        window.HomeOSModal.close(
                            "automationModal"
                        );

                    } else {

                        automationForm.reset();

                    }
                }
            }
        );
    }
}


// =====================================================
// ADD MODAL
// =====================================================

function openAddModal() {

    if (
        window.HomeOSModal
    ) {

        window.HomeOSModal.open(
            "automationModal"
        );

    }
}


// =====================================================
// STATS
// =====================================================

function updateStats(
    automations
) {

    setText(
        "statTotal",
        automations.length
    );

    setText(
        "statActive",
        automations.filter(
            automation =>
                automation.isActive
        ).length
    );

    setText(
        "statInactive",
        automations.filter(
            automation =>
                !automation.isActive
        ).length
    );
}


// =====================================================
// RENDER
// =====================================================

function renderAutomations(
    automations,
    container
) {

    if (!container) {
        return;
    }

    if (
        automations.length === 0
    ) {

        container.innerHTML = `
            <div style="
                text-align:center;
                padding:60px;
                color:var(--text-secondary);
            ">

                <i
                    class="fas fa-bolt"
                    style="
                        font-size:48px;
                        opacity:0.2;
                        display:block;
                        margin-bottom:16px;
                    "
                ></i>

                <p>
                    Henüz otomasyon tanımlanmamış.
                </p>

                <button
                    onclick="openAddModal()"
                    style="
                        margin-top:16px;
                        padding:10px 24px;
                        background:var(--accent-green);
                        color:#000;
                        border:none;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:700;
                    "
                >
                    <i class="fas fa-plus"></i>
                    İlk Otomasyonu Ekle
                </button>

            </div>
        `;

        return;
    }

    container.innerHTML =
        automations
            .map(
                automation =>
                    buildCard(
                        automation
                    )
            )
            .join("");

    container
        .querySelectorAll(
            ".toggle-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        toggleAutomation(
                            Number(
                                button.dataset.id
                            )
                        )
                );
            }
        );

    container
        .querySelectorAll(
            ".run-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        runAutomation(
                            Number(
                                button.dataset.id
                            )
                        )
                );
            }
        );

    container
        .querySelectorAll(
            ".delete-auto-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const confirmed =
                            confirm(
                                "Bu otomasyonu silmek istiyor musunuz?"
                            );

                        if (
                            confirmed
                        ) {

                            deleteAutomation(
                                Number(
                                    button.dataset.id
                                )
                            );
                        }
                    }
                );
            }
        );
}


// =====================================================
// CARD
// =====================================================

function buildCard(
    automation
) {

    const statusBadge =
        automation.isActive

            ? `
                <span style="
                    background:rgba(0,255,136,0.12);
                    color:var(--accent-green);
                    padding:3px 10px;
                    border-radius:20px;
                    font-size:11px;
                    font-weight:700;
                ">
                    AKTİF
                </span>
            `

            : `
                <span style="
                    background:rgba(255,68,68,0.12);
                    color:#ff4444;
                    padding:3px 10px;
                    border-radius:20px;
                    font-size:11px;
                    font-weight:700;
                ">
                    PASİF
                </span>
            `;

    const lastRun =
        automation.lastRun
            ? new Date(
                automation.lastRun
            ).toLocaleString(
                "tr-TR"
            )
            : "Hiç çalışmadı";

    return `
        <div
            class="automation-card"
            data-id="${automation.id}"
            style="
                background:var(--bg-panel);
                border:1px solid ${
                    automation.isActive
                        ? "var(--accent-green)"
                        : "var(--border-line)"
                };
                border-radius:14px;
                padding:20px;
                display:flex;
                flex-direction:column;
                gap:12px;
                transition:all 0.3s;
            "
        >

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">

                    <div style="
                        width:40px;
                        height:40px;
                        border-radius:10px;
                        background:rgba(0,255,136,0.1);
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        color:var(--accent-green);
                    ">
                        <i class="fas fa-bolt"></i>
                    </div>

                    <div>

                        <div style="
                            font-weight:700;
                            font-size:15px;
                        ">
                            ${escHtml(
                                automation.name
                            )}
                        </div>

                        <div style="
                            font-size:12px;
                            color:var(--text-secondary);
                        ">
                            ${escHtml(
                                automation.description ||
                                ""
                            )}
                        </div>

                    </div>

                </div>

                ${statusBadge}

            </div>

            ${
                automation.triggerCondition
                    ? `
                        <div style="
                            background:var(--bg-inner);
                            border-radius:8px;
                            padding:10px;
                            font-size:12px;
                        ">
                            <span style="
                                color:var(--text-secondary);
                            ">
                                Tetikleyici:
                            </span>

                            ${escHtml(
                                automation.triggerCondition
                            )}
                        </div>
                    `
                    : ""
            }

            ${
                automation.actionDescription
                    ? `
                        <div style="
                            background:var(--bg-inner);
                            border-radius:8px;
                            padding:10px;
                            font-size:12px;
                        ">
                            <span style="
                                color:var(--text-secondary);
                            ">
                                Eylem:
                            </span>

                            ${escHtml(
                                automation.actionDescription
                            )}
                        </div>
                    `
                    : ""
            }

            <div style="
                font-size:11px;
                color:var(--text-secondary);
            ">

                <i class="fas fa-clock"></i>

                Son çalışma:
                ${lastRun}

            </div>

            <div style="
                display:flex;
                gap:8px;
                flex-wrap:wrap;
            ">

                <button
                    class="toggle-btn"
                    data-id="${automation.id}"
                >
                    <i class="fas ${
                        automation.isActive
                            ? "fa-pause"
                            : "fa-play"
                    }"></i>

                    ${
                        automation.isActive
                            ? "Durdur"
                            : "Etkinleştir"
                    }
                </button>

                <button
                    class="run-btn"
                    data-id="${automation.id}"
                >
                    <i class="fas fa-play-circle"></i>
                    Çalıştır
                </button>

                <button
                    class="delete-auto-btn"
                    data-id="${automation.id}"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </div>

        </div>
    `;
}


// =====================================================
// LOADER
// =====================================================

function startLoader() {

    const overlay =
        document.getElementById(
            "loader-overlay"
        );

    const bar =
        document.getElementById(
            "loader-bar"
        );

    const percentage =
        document.getElementById(
            "loader-percentage"
        );

    const text =
        document.getElementById(
            "loader-text"
        );

    if (!overlay) {
        return;
    }

    const steps = [
        {
            at: 25,
            msg:
                "Otomasyon modülleri yükleniyor..."
        },
        {
            at: 55,
            msg:
                "Tetikleyiciler ve koşullar okunuyor..."
        },
        {
            at: 80,
            msg:
                "Zamanlanmış görevler senkronize ediliyor..."
        },
        {
            at: 100,
            msg:
                "Otomasyon sistemi hazır."
        }
    ];

    let progress = 0;

    const timer =
        setInterval(
            () => {

                progress +=
                    Math.floor(
                        Math.random() * 5
                    ) + 3;

                if (
                    progress >= 100
                ) {

                    progress = 100;

                    clearInterval(
                        timer
                    );
                }

                if (bar) {

                    bar.style.width =
                        `${progress}%`;
                }

                if (percentage) {

                    percentage.textContent =
                        `${progress}%`;
                }

                const step =
                    steps.find(
                        item =>
                            progress <=
                            item.at
                    );

                if (
                    step &&
                    text
                ) {

                    text.textContent =
                        step.msg;
                }

                if (
                    progress >= 100
                ) {

                    setTimeout(
                        () => {

                            overlay.classList.add(
                                "fade-out"
                            );

                            overlay.addEventListener(
                                "transitionend",
                                () =>
                                    overlay.remove(),
                                {
                                    once: true
                                }
                            );

                        },
                        300
                    );
                }

            },
            30
        );
}


// =====================================================
// UTILS
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );

    if (element) {

        element.textContent =
            value;
    }
}


function escHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}