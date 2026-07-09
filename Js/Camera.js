/**
 * Home Asistan - Kamera Sistemleri Yönetim Scripti
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Home Asistan: Kamera Kontrol Arayüzü Başlatıldı.');

    const API_BASE = getApiBaseUrl();

    // DOM Elementlerini Önbelleğe Al
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    const loaderPercentage = document.getElementById('loader-percentage');

    const cameraGrid = document.getElementById('camera-grid');
    const emptyState = document.getElementById('empty-state');
    
    const headerAddBtn = document.getElementById('header-add-btn');
    const emptyAddBtn = document.getElementById('empty-add-btn');
    
    const cameraModal = document.getElementById('camera-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const cameraForm = document.getElementById('camera-form');

    // Dinamik Yükleme Adımları ve Gerçek Zamanlı Sistem Mesajları
    const loadingStates = [
        { limit: 25, text: "Ağ geçitleri taranıyor..." },
        { limit: 55, text: "Video akış portları doğrulanıyor..." },
        { limit: 80, text: "Güvenli tünel (RTSP) şifreleniyor..." },
        { limit: 95, text: "Matris eşleşmesi tamamlanıyor..." },
        { limit: 100, text: "Kamera odası aktif!" }
    ];

    let progress = 0;

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

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    /**
     * Modern Toast Bildirim Sistemi
     */
    const showToast = (message, type = 'info') => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${escapeHtml(message)}</span>
            <button class="toast-close-btn" title="Kapat">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close-btn');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('toast-fade-out');
            toast.addEventListener('transitionend', () => toast.remove());
        });

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('toast-fade-out');
                toast.addEventListener('transitionend', () => toast.remove());
            }
        }, 4000);
    };

    /**
     * Akıllı Yükleme Barı ve Yüzde Sayacı Yönetimi
     */
    const runSystemLoading = () => {
        const loadInterval = setInterval(() => {
            const increment = Math.floor(Math.random() * 5) + 2;
            progress += increment;

            if (progress >= 100) {
                progress = 100;
                clearInterval(loadInterval);
                terminateLoader();
            }

            if (loaderBar) loaderBar.style.width = `${progress}%`;
            if (loaderPercentage) loaderPercentage.textContent = `${progress}%`;

            const activeState = loadingStates.find(state => progress <= state.limit);
            if (activeState && loaderText) {
                loaderText.textContent = activeState.text;
            }
        }, 20);
    };

    /**
     * Yükleme Ekranını Kapatan ve Bellekten Temizleyen Kapanış Fonksiyonu
     */
    const terminateLoader = () => {
        setTimeout(() => {
            if (loaderOverlay) {
                loaderOverlay.classList.add('fade-out');
                
                loaderOverlay.addEventListener('transitionend', () => {
                    loaderOverlay.remove();
                    initializeSystem();
                });
            } else {
                initializeSystem();
            }
        }, 400);
    };

    /**
     * Kamera Verilerini Çeken ve Arayüzü Güncelleyen Metot
     */
    const loadCameras = async () => {
        try {
            const res = await fetch(`${API_BASE}/cameras`);
            if (!res.ok) throw new Error('Kameralar alınamadı.');
            const cameras = await res.json();

            if (cameras && cameras.length > 0) {
                emptyState.style.display = 'none';
                cameraGrid.style.display = 'grid';
                headerAddBtn.style.display = 'inline-flex';
                
                cameraGrid.innerHTML = cameras.map(camera => `
                    <div class="camera-card">
                        <div class="camera-view">
                            ${camera.status === 'online' ? '<div class="live-badge">CANLI</div>' : ''}
                            <i class="fas ${camera.status === 'online' ? 'fa-video' : 'fa-video-slash'}" style="${camera.status === 'online' ? '' : 'color: #444;'}"></i>
                        </div>
                        <div class="camera-info">
                            <span class="camera-name" title="${escapeHtml(camera.name)}">${escapeHtml(camera.name)}</span>
                            <span class="camera-status ${camera.status === 'online' ? '' : 'offline'}">
                                ${camera.status === 'online' ? 'Aktif' : 'Pasif / Bağlantı Yok'}
                            </span>
                        </div>
                    </div>
                `).join('');
            } else {
                cameraGrid.style.display = 'none';
                headerAddBtn.style.display = 'none';
                emptyState.style.display = 'flex';
            }
        } catch (err) {
            console.error('Kamera yükleme hatası:', err);
            cameraGrid.style.display = 'none';
            headerAddBtn.style.display = 'none';
            emptyState.style.display = 'flex';
        }
    };

    /**
     * Modal Yönetim İşlevleri
     */
    const openModal = () => {
        if (cameraModal) cameraModal.classList.add('active');
    };

    const closeModal = () => {
        if (cameraModal) {
            cameraModal.classList.remove('active');
            cameraForm.reset();
        }
    };

    /**
     * Olay Dinleyicileri (Event Listeners) Tanımlama
     */
    const setupEventListeners = () => {
        // Modal Açma Butonları
        headerAddBtn?.addEventListener('click', openModal);
        emptyAddBtn?.addEventListener('click', openModal);

        // Modal Kapatma Butonları
        closeModalBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);

        // Dışarı tıklayınca kapatma
        cameraModal?.addEventListener('click', (e) => {
            if (e.target === cameraModal) {
                closeModal();
            }
        });

        // Form Gönderme
        cameraForm?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('camera-name-input').value.trim();
            const url = document.getElementById('camera-url-input').value.trim();
            const status = document.getElementById('camera-status-select').value;

            try {
                const res = await fetch(`${API_BASE}/cameras`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, url, status })
                });

                if (!res.ok) throw new Error('Kamera eklenirken bir sunucu hatası oluştu.');
                
                closeModal();
                showToast('Yeni kamera başarıyla eklendi.', 'success');
                await loadCameras();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    };

    const initializeSystem = () => {
        setupEventListeners();
        loadCameras();
    };

    // İlerleme çubuğunu çalıştır
    runSystemLoading();
});