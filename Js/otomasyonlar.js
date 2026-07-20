/* =====================================================
   otomasyonlar.js
   HomeOS Otomasyon Sistemi
   JWT destekli API entegrasyonu
   ===================================================== */

const API_BASE = getApiBaseUrl();

let allAutomations = [];


// =====================================================
// API BASE URL
// =====================================================

function getApiBaseUrl() {

    const queryApiBase =
        new URLSearchParams(
            window.location.search
        ).get('apiBase');

    if (queryApiBase) {

        localStorage.setItem(
            'homeos_api_base_url',
            queryApiBase
        );

        return queryApiBase.replace(
            /\/$/,
            ''
        );
    }

    const configuredApiBase =
        window.HOMEOS_API_BASE_URL ||
        localStorage.getItem(
            'homeos_api_base_url'
        );

    if (configuredApiBase) {

        return configuredApiBase.replace(
            /\/$/,
            ''
        );
    }

    const liveServerPorts = [
        '5500',
        '5501',
        '5502'
    ];

    const isLiveServer =
        [
            'localhost',
            '127.0.0.1'
        ].includes(
            window.location.hostname
        )
        &&
        liveServerPorts.includes(
            window.location.port
        );

    if (
        window.location.protocol === 'file:'
        ||
        isLiveServer
    ) {
        return 'https://localhost:7201/api';
    }

    return `${window.location.origin}/api`;
}


// =====================================================
// JWT TOKEN
// =====================================================

function getAuthToken() {

    return (
        localStorage.getItem('accessToken')
        ||
        localStorage.getItem('token')
        ||
        localStorage.getItem('jwt')
        ||
        sessionStorage.getItem('accessToken')
        ||
        sessionStorage.getItem('token')
        ||
        null
    );
}


// =====================================================
// CENTRAL API REQUEST
// =====================================================

async function apiFetch(
    url,
    options = {}
) {

    const token =
        getAuthToken();

    const headers = {
        ...(options.headers || {})
    };

    if (
        !headers['Content-Type']
        &&
        options.body
    ) {
        headers['Content-Type'] =
            'application/json';
    }

    if (token) {

        headers['Authorization'] =
            `Bearer ${token}`;
    }

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    if (
        response.status === 401
    ) {

        alert(
            'Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.'
        );

        throw new Error(
            'UNAUTHORIZED'
        );
    }


    if (
        response.status === 403
    ) {

        alert(
            'Bu işlem için yetkiniz bulunmuyor.'
        );

        throw new Error(
            'FORBIDDEN'
        );
    }


    return response;
}


// =====================================================
// INIT
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        startLoader();

        fetchAutomations();

        bindEvents();
    }
);


// =====================================================
// FETCH AUTOMATIONS
// =====================================================

async function fetchAutomations() {

    const container =
        document.getElementById(
            'automationList'
        )
        ||
        document.querySelector(
            '.automation-grid'
        )
        ||
        document.querySelector(
            '[data-automation-list]'
        );

    try {

        const res =
            await apiFetch(
                `${API_BASE}/Automations`
            );


        if (!res.ok) {

            throw new Error(
                `HTTP ${res.status}`
            );
        }


        allAutomations =
            await res.json();


        renderAutomations(
            allAutomations,
            container
        );


        updateStats(
            allAutomations
        );

    }
    catch (err) {

        if (
            err.message ===
            'UNAUTHORIZED'
            ||
            err.message ===
            'FORBIDDEN'
        ) {
            return;
        }


        console.error(
            '[Automations] Fetch hatası:',
            err
        );


        if (container) {

            container.innerHTML = `
                <div style="text-align:center;padding:60px;color:var(--text-secondary)">
                    <i class="fas fa-exclamation-triangle"
                       style="font-size:48px;opacity:0.2;display:block;margin-bottom:16px">
                    </i>

                    <p>
                        Otomasyon verileri yüklenemedi.
                    </p>
                </div>
            `;
        }
    }
}


// =====================================================
// CREATE
// =====================================================

async function createAutomation(dto) {

    try {

        const res =
            await apiFetch(
                `${API_BASE}/Automations`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(dto)
                }
            );


        const data =
            await res.json();


        if (res.ok) {

            alert(
                data.message ||
                'Otomasyon başarıyla eklendi!'
            );


            await fetchAutomations();

            return true;
        }


        alert(
            'Hata: ' +
            (
                data.message ||
                'Otomasyon oluşturulamadı.'
            )
        );


        return false;

    }
    catch (e) {

        if (
            e.message ===
            'UNAUTHORIZED'
            ||
            e.message ===
            'FORBIDDEN'
        ) {
            return false;
        }


        console.error(
            '[Automations] Create error:',
            e
        );


        alert(
            'Bağlantı hatası: ' +
            e.message
        );


        return false;
    }
}


// =====================================================
// TOGGLE
// =====================================================

async function toggleAutomation(id) {

    try {

        const res =
            await apiFetch(
                `${API_BASE}/Automations/${id}/toggle`,
                {
                    method: 'PUT'
                }
            );


        if (!res.ok) {

            const data =
                await res.json();

            throw new Error(
                data.message ||
                `HTTP ${res.status}`
            );
        }


        await fetchAutomations();

    }
    catch (e) {

        if (
            e.message ===
            'UNAUTHORIZED'
            ||
            e.message ===
            'FORBIDDEN'
        ) {
            return;
        }

        console.error(e);

        alert(
            'Otomasyon durumu değiştirilemedi.'
        );
    }
}


// =====================================================
// RUN
// =====================================================

async function runAutomation(id) {

    try {

        const res =
            await apiFetch(
                `${API_BASE}/Automations/${id}/run`,
                {
                    method: 'PUT'
                }
            );


        const data =
            await res.json();


        if (!res.ok) {

            throw new Error(
                data.message ||
                `HTTP ${res.status}`
            );
        }


        alert(
            data.message ||
            'Otomasyon çalıştırıldı!'
        );


        await fetchAutomations();

    }
    catch (e) {

        if (
            e.message ===
            'UNAUTHORIZED'
            ||
            e.message ===
            'FORBIDDEN'
        ) {
            return;
        }


        console.error(e);


        alert(
            'Otomasyon çalıştırılamadı.'
        );
    }
}


// =====================================================
// DELETE
// =====================================================

async function deleteAutomation(id) {

    try {

        const res =
            await apiFetch(
                `${API_BASE}/Automations/${id}`,
                {
                    method: 'DELETE'
                }
            );


        const data =
            await res.json();


        if (!res.ok) {

            throw new Error(
                data.message ||
                `HTTP ${res.status}`
            );
        }


        alert(
            data.message ||
            'Otomasyon silindi.'
        );


        await fetchAutomations();

    }
    catch (e) {

        if (
            e.message ===
            'UNAUTHORIZED'
            ||
            e.message ===
            'FORBIDDEN'
        ) {
            return;
        }


        console.error(e);


        alert(
            'Otomasyon silinemedi.'
        );
    }
}


// =====================================================
// EVENTS
// =====================================================

function bindEvents() {

    const backButton =
        document.getElementById(
            'backButton'
        );


    if (backButton) {

        backButton.addEventListener(
            'click',
            () => {

                window.location.href =
                    '../index.html';
            }
        );
    }


    const automationForm =
        document.getElementById(
            'automationForm'
        );


    const autoNameInput =
        document.getElementById(
            'autoName'
        );


    if (
        automationForm
        &&
        autoNameInput
    ) {

        automationForm.addEventListener(
            'submit',
            async e => {

                e.preventDefault();


                const name =
                    autoNameInput.value.trim();


                if (!name) {

                    alert(
                        'Otomasyon adı zorunludur.'
                    );

                    return;
                }


                const trigger =
                    document
                        .getElementById(
                            'autoTrigger'
                        )
                        ?.value
                        || '';


                const action =
                    document
                        .getElementById(
                            'autoAction'
                        )
                        ?.value
                        || '';


                const desc =
                    document
                        .getElementById(
                            'autoDesc'
                        )
                        ?.value
                        || '';


                const success =
                    await createAutomation(
                        {
                            name,
                            description:
                                desc,
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
                            'automationModal'
                        );

                    }
                    else {

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
            'automationModal'
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
        'statTotal',
        automations.length
    );


    setText(
        'statActive',
        automations.filter(
            a => a.isActive
        ).length
    );


    setText(
        'statInactive',
        automations.filter(
            a => !a.isActive
        ).length
    );
}


// =====================================================
// LOADER
// =====================================================

function startLoader() {

    const overlay =
        document.getElementById(
            'loader-overlay'
        );

    const bar =
        document.getElementById(
            'loader-bar'
        );

    const pct =
        document.getElementById(
            'loader-percentage'
        );

    const txt =
        document.getElementById(
            'loader-text'
        );


    if (!overlay) {
        return;
    }


    const steps = [

        {
            at: 25,
            msg:
                'Otomasyon modülleri yükleniyor...'
        },

        {
            at: 55,
            msg:
                'Tetikleyiciler ve koşullar okunuyor...'
        },

        {
            at: 80,
            msg:
                'Zamanlanmış görevler senkronize ediliyor...'
        },

        {
            at: 100,
            msg:
                'Otomasyon sistemi hazır.'
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
                        progress + '%';
                }


                if (pct) {

                    pct.textContent =
                        progress + '%';
                }


                const step =
                    steps.find(
                        s =>
                            progress <= s.at
                    );


                if (
                    step
                    &&
                    txt
                ) {

                    txt.textContent =
                        step.msg;
                }


                if (
                    progress >= 100
                ) {

                    setTimeout(
                        () => {

                            overlay.classList.add(
                                'fade-out'
                            );


                            overlay.addEventListener(
                                'transitionend',
                                () =>
                                    overlay.remove(),
                                {
                                    once:
                                        true
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
            <div style="text-align:center;padding:60px;color:var(--text-secondary)">
                <i class="fas fa-bolt"
                   style="font-size:48px;opacity:0.2;display:block;margin-bottom:16px">
                </i>

                <p>
                    Henüz otomasyon tanımlanmamış.
                </p>

                <button
                    onclick="openAddModal()"
                    style="margin-top:16px;padding:10px 24px;background:var(--accent-green);color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:700">

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
                a =>
                    buildCard(a)
            )
            .join('');


    container
        .querySelectorAll(
            '.toggle-btn'
        )
        .forEach(
            btn => {

                btn.addEventListener(
                    'click',
                    () =>
                        toggleAutomation(
                            parseInt(
                                btn.dataset.id
                            )
                        )
                );
            }
        );


    container
        .querySelectorAll(
            '.run-btn'
        )
        .forEach(
            btn => {

                btn.addEventListener(
                    'click',
                    () =>
                        runAutomation(
                            parseInt(
                                btn.dataset.id
                            )
                        )
                );
            }
        );


    container
        .querySelectorAll(
            '.delete-auto-btn'
        )
        .forEach(
            btn => {

                btn.addEventListener(
                    'click',
                    () => {

                        if (
                            confirm(
                                'Bu otomasyonu silmek istiyor musunuz?'
                            )
                        ) {

                            deleteAutomation(
                                parseInt(
                                    btn.dataset.id
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

function buildCard(a) {

    const statusBadge =
        a.isActive

            ? '<span style="background:rgba(0,255,136,0.12);color:var(--accent-green);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">AKTİF</span>'

            : '<span style="background:rgba(255,68,68,0.12);color:#ff4444;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">PASİF</span>';


    const lastRun =
        a.lastRun
            ? new Date(
                a.lastRun
            ).toLocaleString(
                'tr-TR'
            )
            : 'Hiç çalışmadı';


    return `
        <div
            class="automation-card"
            data-id="${a.id}"
            style="
                background:var(--bg-panel);
                border:1px solid ${
                    a.isActive
                        ? 'var(--accent-green)'
                        : 'var(--border-line)'
                };
                border-radius:14px;
                padding:20px;
                display:flex;
                flex-direction:column;
                gap:12px;
                transition:all 0.3s
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:10px
                    "
                >

                    <div
                        style="
                            width:40px;
                            height:40px;
                            border-radius:10px;
                            background:rgba(0,255,136,0.1);
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            color:var(--accent-green)
                        "
                    >

                        <i class="fas fa-bolt"></i>

                    </div>


                    <div>

                        <div
                            style="
                                font-weight:700;
                                font-size:15px
                            "
                        >
                            ${escHtml(a.name)}
                        </div>


                        <div
                            style="
                                font-size:12px;
                                color:var(--text-secondary)
                            "
                        >
                            ${escHtml(
                                a.description || ''
                            )}
                        </div>

                    </div>

                </div>


                ${statusBadge}

            </div>


            ${
                a.triggerCondition
                    ? `
                        <div
                            style="
                                background:var(--bg-inner);
                                border-radius:8px;
                                padding:10px;
                                font-size:12px
                            "
                        >
                            <span
                                style="
                                    color:var(--text-secondary)
                                "
                            >
                                Tetikleyici:
                            </span>

                            ${escHtml(
                                a.triggerCondition
                            )}
                        </div>
                    `
                    : ''
            }


            ${
                a.actionDescription
                    ? `
                        <div
                            style="
                                background:var(--bg-inner);
                                border-radius:8px;
                                padding:10px;
                                font-size:12px
                            "
                        >
                            <span
                                style="
                                    color:var(--text-secondary)
                                "
                            >
                                Eylem:
                            </span>

                            ${escHtml(
                                a.actionDescription
                            )}
                        </div>
                    `
                    : ''
            }


            <div
                style="
                    font-size:11px;
                    color:var(--text-secondary)
                "
            >

                <i class="fas fa-clock"></i>

                Son çalışma:
                ${lastRun}

            </div>


            <div
                style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap
                "
            >

                <button
                    class="toggle-btn"
                    data-id="${a.id}"
                >
                    <i class="fas ${
                        a.isActive
                            ? 'fa-pause'
                            : 'fa-play'
                    }"></i>

                    ${
                        a.isActive
                            ? 'Durdur'
                            : 'Etkinleştir'
                    }
                </button>


                <button
                    class="run-btn"
                    data-id="${a.id}"
                >
                    <i class="fas fa-play-circle"></i>
                    Çalıştır
                </button>


                <button
                    class="delete-auto-btn"
                    data-id="${a.id}"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </div>

        </div>
    `;
}


// =====================================================
// UTILS
// =====================================================

function setText(
    id,
    val
) {

    const el =
        document.getElementById(
            id
        );

    if (el) {

        el.textContent =
            val;
    }
}


function escHtml(
    str
) {

    return String(
        str
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        );
}